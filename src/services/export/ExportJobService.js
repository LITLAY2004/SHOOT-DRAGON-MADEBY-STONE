const crypto = require('crypto');
const { ValidationError } = require('./errors');

const DEFAULT_SYNC_LIMIT = 10_000;
const DEFAULT_SYNC_DURATION_MS = 5_000;

class ExportJobService {
    constructor(deps = {}) {
        const {
            analyticsRepository,
            artifactStorage,
            auditLogRepository,
            jobRepository,
            queueClient,
            webhookDispatcher = null,
            scheduler = null,
            clock = () => new Date(),
            thresholds = {}
        } = deps;

        if (!analyticsRepository || typeof analyticsRepository.fetchSessions !== 'function') {
            throw new Error('analyticsRepository with fetchSessions is required');
        }
        if (typeof analyticsRepository.estimateSessionCount !== 'function') {
            throw new Error('analyticsRepository with estimateSessionCount is required');
        }
        if (!artifactStorage || typeof artifactStorage.storeArtifact !== 'function') {
            throw new Error('artifactStorage with storeArtifact is required');
        }
        if (!auditLogRepository || typeof auditLogRepository.record !== 'function') {
            throw new Error('auditLogRepository with record is required');
        }
        if (!jobRepository || typeof jobRepository.create !== 'function' || typeof jobRepository.update !== 'function' || typeof jobRepository.findById !== 'function') {
            throw new Error('jobRepository with create, update, findById is required');
        }
        if (!queueClient || typeof queueClient.enqueue !== 'function') {
            throw new Error('queueClient with enqueue is required');
        }

        this.analyticsRepository = analyticsRepository;
        this.artifactStorage = artifactStorage;
        this.auditLogRepository = auditLogRepository;
        this.jobRepository = jobRepository;
        this.queueClient = queueClient;
        this.webhookDispatcher = webhookDispatcher;
        this.scheduler = scheduler;
        this.clock = clock;
        this.syncLimit = thresholds.syncRecordLimit || DEFAULT_SYNC_LIMIT;
        this.syncDurationMs = thresholds.syncDurationMs || DEFAULT_SYNC_DURATION_MS;
    }

    buildJobId() {
        const nowIso = this.clock().toISOString();
        const entropy = crypto.randomBytes(4).toString('hex');
        return `exp_${nowIso.replace(/[-:.TZ]/g, '')}_${entropy}`;
    }

    shouldRunSynchronously({ estimatedCount, estimatedDurationMs }) {
        if (typeof estimatedCount === 'number' && estimatedCount > this.syncLimit) {
            return false;
        }
        if (typeof estimatedDurationMs === 'number' && estimatedDurationMs > this.syncDurationMs) {
            return false;
        }
        return true;
    }

    async createExportJob({ tenantId, filters, authContext }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!filters) {
            throw new ValidationError('filters are required');
        }

        const estimation = await this.analyticsRepository.estimateSessionCount({ tenantId, ...filters });
        const jobId = this.buildJobId();
        const estimatedCount = typeof estimation === 'object'
            ? (typeof estimation.count === 'number'
                ? estimation.count
                : typeof estimation.estimatedCount === 'number'
                    ? estimation.estimatedCount
                    : null)
            : (typeof estimation === 'number' ? estimation : null);
        const estimatedDurationMs = typeof estimation === 'object' && typeof estimation.estimatedDurationMs === 'number'
            ? estimation.estimatedDurationMs
            : null;

        if (this.shouldRunSynchronously({ estimatedCount, estimatedDurationMs })) {
            return this.processSynchronousJob({ tenantId, filters, authContext, jobId, estimatedCount });
        }

        return this.enqueueAsyncJob({ tenantId, filters, authContext, jobId, estimation: { estimatedCount, estimatedDurationMs } });
    }

    async processSynchronousJob({ tenantId, filters, authContext, jobId, estimatedCount }) {
        const sessions = await this.analyticsRepository.fetchSessions({
            tenantId,
            rangeStart: filters.rangeStart,
            rangeEnd: filters.rangeEnd,
            gameMode: filters.gameMode,
            minCompletedWave: filters.minCompletedWave
        });

        const normalizedSessions = this.normalizeSessions(sessions);
        const artifact = await this.artifactStorage.storeArtifact({
            tenantId,
            jobId,
            format: filters.format,
            records: normalizedSessions,
            filters,
            actorId: authContext.actorId
        });

        const timestamps = this.resolveTimestamps(artifact);

        await this.jobRepository.create({
            jobId,
            tenantId,
            status: 'completed',
            format: filters.format,
            deliveryType: filters.delivery.type,
            deliveryTarget: filters.delivery.webhookUrl || null,
            deliverySchedule: filters.delivery.schedule || null,
            deliveryStatus: filters.delivery.type === 'webhook' ? 'pending' : 'not_applicable',
            recordCount: normalizedSessions.length,
            downloadUrl: artifact.downloadUrl,
            artifactPath: artifact.artifactPath || null,
            etaSeconds: 0,
            estimatedCount: estimatedCount ?? normalizedSessions.length,
            createdAt: timestamps.createdAt,
            completedAt: timestamps.completedAt
        });

        await this.auditLogRepository.record({
            jobId,
            tenantId,
            actorId: authContext.actorId,
            status: 'completed',
            statusDetail: 'synchronous_export_ready',
            filters,
            recordCount: normalizedSessions.length,
            createdAt: timestamps.createdAt,
            completedAt: timestamps.completedAt
        });

        await this.handleDelivery({
            tenantId,
            jobId,
            delivery: filters.delivery,
            downloadUrl: artifact.downloadUrl,
            recordCount: normalizedSessions.length,
            filters
        });

        return {
            status: 'ready',
            jobId,
            downloadUrl: artifact.downloadUrl,
            recordCount: normalizedSessions.length
        };
    }

    resolveTimestamps(artifact = {}) {
        const nowIso = this.clock().toISOString();
        return {
            createdAt: artifact.createdAt || nowIso,
            completedAt: artifact.completedAt || nowIso
        };
    }

    async enqueueAsyncJob({ tenantId, filters, authContext, jobId, estimation }) {
        const nowIso = this.clock().toISOString();
        const etaSeconds = this.estimateEtaSeconds(estimation);

        const estimatedCount = typeof estimation === 'object'
            ? (typeof estimation.estimatedCount === 'number'
                ? estimation.estimatedCount
                : typeof estimation.count === 'number'
                    ? estimation.count
                    : null)
            : (typeof estimation === 'number' ? estimation : null);

        await this.jobRepository.create({
            jobId,
            tenantId,
            status: 'queued',
            format: filters.format,
            deliveryType: filters.delivery.type,
            deliveryTarget: filters.delivery.webhookUrl || null,
            deliverySchedule: filters.delivery.schedule || null,
            deliveryStatus: filters.delivery.type === 'webhook' ? 'pending' : 'not_applicable',
            recordCount: 0,
            downloadUrl: null,
            artifactPath: null,
            etaSeconds,
            estimatedCount,
            createdAt: nowIso,
            updatedAt: nowIso
        });

        await this.auditLogRepository.record({
            jobId,
            tenantId,
            actorId: authContext.actorId,
            status: 'queued',
            statusDetail: 'async_export_enqueued',
            filters,
            recordCount: 0,
            createdAt: nowIso
        });

        await this.queueClient.enqueue({
            jobId,
            tenantId,
            filters,
            actorId: authContext.actorId,
            enqueuedAt: nowIso
        });

        return {
            status: 'queued',
            jobId,
            etaSeconds
        };
    }

    normalizeSessions(rawSessions) {
        if (!Array.isArray(rawSessions)) {
            return [];
        }
        return rawSessions.map((session) => ({
            sessionId: session.sessionId,
            playerId: session.playerId,
            tenantId: session.tenantId,
            mode: session.mode || session.gameMode,
            waveReached: session.waveReached,
            durationSeconds: session.durationSeconds,
            totalScore: session.totalScore,
            resourcesCollected: session.resourcesCollected,
            dominantElementUsed: session.dominantElementUsed || session.dominantElement,
            skillsUsage: session.skillsUsage || [],
            defeatCause: session.defeatCause || null,
            startedAt: session.startedAt,
            endedAt: session.endedAt
        }));
    }

    estimateEtaSeconds(estimation = {}) {
        const estimatedCount = typeof estimation === 'number'
            ? estimation
            : typeof estimation.estimatedCount === 'number'
                ? estimation.estimatedCount
                : typeof estimation.count === 'number'
                    ? estimation.count
                    : this.syncLimit + 1;
        const batches = Math.max(1, Math.ceil(estimatedCount / this.syncLimit));
        return Math.min(300, batches * 30);
    }

    async getJobStatus({ tenantId, jobId }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!jobId) {
            throw new ValidationError('jobId is required');
        }

        const job = await this.jobRepository.findById(tenantId, jobId);
        if (!job) {
            return null;
        }

        return {
            jobId: job.jobId,
            status: job.status,
            format: job.format,
            deliveryType: job.deliveryType,
            recordCount: job.recordCount || 0,
            downloadUrl: job.downloadUrl || null,
            etaSeconds: typeof job.etaSeconds === 'number' ? job.etaSeconds : null,
            updatedAt: job.updatedAt || job.completedAt || job.createdAt || this.clock().toISOString()
        };
    }

    async markJobCompleted({ jobId, tenantId, downloadUrl, recordCount, artifactPath, completedAt, delivery = null, filters = null }) {
        const timestamps = {
            completedAt: completedAt || this.clock().toISOString(),
            updatedAt: completedAt || this.clock().toISOString()
        };

        await this.jobRepository.update(jobId, tenantId, {
            status: 'ready',
            downloadUrl,
            recordCount,
            artifactPath,
            ...timestamps
        });

        await this.auditLogRepository.record({
            jobId,
            tenantId,
            status: 'ready',
            statusDetail: 'async_export_ready',
            recordCount,
            completedAt: timestamps.completedAt
        });

        await this.handleDelivery({
            tenantId,
            jobId,
            delivery,
            downloadUrl,
            recordCount,
            filters
        });
    }

    async processQueuedJob({ jobId, tenantId, filters, actorId }) {
        if (!jobId) {
            throw new ValidationError('jobId is required');
        }
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!filters) {
            throw new ValidationError('filters are required');
        }

        const processingAt = this.clock().toISOString();
        await this.jobRepository.update(jobId, tenantId, {
            status: 'processing',
            updatedAt: processingAt
        });

        await this.auditLogRepository.record({
            jobId,
            tenantId,
            status: 'processing',
            statusDetail: 'async_export_processing',
            createdAt: processingAt
        });

        try {
            const sessions = await this.analyticsRepository.fetchSessions({
                tenantId,
                rangeStart: filters.rangeStart,
                rangeEnd: filters.rangeEnd,
                gameMode: filters.gameMode,
                minCompletedWave: filters.minCompletedWave
            });

            const normalizedSessions = this.normalizeSessions(sessions);
            const artifact = await this.artifactStorage.storeArtifact({
                tenantId,
                jobId,
                format: filters.format,
                records: normalizedSessions,
                filters,
                actorId
            });

            await this.markJobCompleted({
                jobId,
                tenantId,
                downloadUrl: artifact.downloadUrl,
                recordCount: normalizedSessions.length,
                artifactPath: artifact.artifactPath || null,
                completedAt: artifact.completedAt,
                delivery: filters.delivery,
                filters
            });

            return {
                status: 'ready',
                jobId,
                downloadUrl: artifact.downloadUrl,
                recordCount: normalizedSessions.length
            };
        } catch (error) {
            const failureAt = this.clock().toISOString();
            await this.jobRepository.update(jobId, tenantId, {
                status: 'failed',
                failureReason: error.message,
                updatedAt: failureAt
            });

            await this.auditLogRepository.record({
                jobId,
                tenantId,
                status: 'failed',
                statusDetail: 'async_export_failed',
                error: error.message,
                createdAt: failureAt
            });

            throw error;
        }
    }

    async handleDelivery({ tenantId, jobId, delivery, downloadUrl, recordCount, filters }) {
        if (!delivery || delivery.type !== 'webhook') {
            return;
        }
        if (!delivery.webhookUrl) {
            throw new ValidationError('webhookUrl is required for webhook delivery');
        }

        const payload = {
            jobId,
            tenantId,
            downloadUrl,
            recordCount,
            filters,
            generatedAt: this.clock().toISOString()
        };

        if (delivery.schedule) {
            if (!this.scheduler || typeof this.scheduler.schedule !== 'function') {
                throw new Error('scheduler with schedule function is required for recurring webhook delivery');
            }
            await this.scheduler.schedule({
                tenantId,
                jobId,
                cron: delivery.schedule,
                webhookUrl: delivery.webhookUrl,
                payload
            });
            await this.auditLogRepository.record({
                jobId,
                tenantId,
                status: 'scheduled',
                statusDetail: 'webhook_scheduled',
                deliveryTarget: delivery.webhookUrl,
                createdAt: payload.generatedAt
            });
            return;
        }

        if (!this.webhookDispatcher || typeof this.webhookDispatcher.dispatch !== 'function') {
            throw new Error('webhookDispatcher is required for webhook delivery');
        }

        const result = await this.webhookDispatcher.dispatch({
            tenantId,
            jobId,
            url: delivery.webhookUrl,
            payload
        });

        await this.jobRepository.update(jobId, tenantId, {
            deliveryStatus: result.success ? 'delivered' : 'failed',
            deliveryAttempts: result.attempts,
            deliveryLastAttemptAt: result.lastAttemptAt
        });

        await this.auditLogRepository.record({
            jobId,
            tenantId,
            status: result.success ? 'delivered' : 'delivery_failed',
            statusDetail: result.success ? 'webhook_delivered' : 'webhook_failed',
            deliveryTarget: delivery.webhookUrl,
            attempts: result.attempts,
            createdAt: result.lastAttemptAt
        });

        if (!result.success && result.error) {
            await this.auditLogRepository.record({
                jobId,
                tenantId,
                status: 'delivery_failed',
                statusDetail: 'webhook_failure_detail',
                deliveryTarget: delivery.webhookUrl,
                createdAt: result.lastAttemptAt,
                metadata: {
                    message: result.error.message
                }
            });
        }
    }
}

module.exports = {
    ExportJobService,
    DEFAULT_SYNC_LIMIT,
    DEFAULT_SYNC_DURATION_MS
};
