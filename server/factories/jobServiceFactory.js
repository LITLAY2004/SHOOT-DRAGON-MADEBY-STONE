const fs = require('fs/promises');
const path = require('path');
const {
    ExportJobService,
    ArtifactStorage,
    InMemoryQueueClient
} = require('../../src/services/export');

const jobs = new Map();
const auditLog = [];

function createJobRepository() {
    return {
        async create(data) {
            const key = `${data.tenantId}:${data.jobId}`;
            jobs.set(key, { ...data });
            return data;
        },
        async update(jobId, tenantId, patch) {
            const key = `${tenantId}:${jobId}`;
            const existing = jobs.get(key) || { jobId, tenantId };
            const updated = { ...existing, ...patch };
            jobs.set(key, updated);
            return updated;
        },
        async findById(tenantId, jobId) {
            const key = `${tenantId}:${jobId}`;
            return jobs.get(key) || null;
        }
    };
}

function createAuditLogRepository() {
    return {
        async record(entry) {
            auditLog.push({ ...entry, recordedAt: new Date().toISOString() });
            return entry;
        },
        getAll() {
            return auditLog.slice();
        }
    };
}

async function loadDataset(datasetPath) {
    try {
        const raw = await fs.readFile(datasetPath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

function createAnalyticsRepository(dataset) {
    async function filterSessions({ tenantId, rangeStart, rangeEnd, gameMode, minCompletedWave }) {
        return dataset.filter((session) => {
            if (tenantId && session.tenantId !== tenantId) {
                return false;
            }
            if (gameMode && session.gameMode !== gameMode) {
                return false;
            }
            if (typeof minCompletedWave === 'number' && session.waveReached < minCompletedWave) {
                return false;
            }
            const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : null;
            if (rangeStart && startedAt && startedAt < new Date(rangeStart).getTime()) {
                return false;
            }
            const endedAt = session.endedAt ? new Date(session.endedAt).getTime() : null;
            if (rangeEnd && endedAt && endedAt > new Date(rangeEnd).getTime()) {
                return false;
            }
            return true;
        });
    }

    return {
        async estimateSessionCount(filters) {
            const results = await filterSessions(filters);
            return { count: results.length };
        },
        async fetchSessions(filters) {
            return filterSessions(filters);
        }
    };
}

async function resolveQueueClient() {
    const factoryPath = process.env.JOB_SERVICE_QUEUE_FACTORY;
    if (!factoryPath) {
        if (!global.__EXPORT_QUEUE_CLIENT__) {
            global.__EXPORT_QUEUE_CLIENT__ = new InMemoryQueueClient();
        }
        return global.__EXPORT_QUEUE_CLIENT__;
    }
    const resolved = path.isAbsolute(factoryPath)
        ? factoryPath
        : path.join(process.cwd(), factoryPath);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const factory = require(resolved);
    const client = await factory();
    if (!client || typeof client.enqueue !== 'function') {
        throw new Error('JOB_SERVICE_QUEUE_FACTORY must resolve to a queue client with enqueue method');
    }
    return client;
}

async function jobServiceFactory() {
    const datasetPath = process.env.ANALYTICS_DATASET
        ? path.resolve(process.env.ANALYTICS_DATASET)
        : path.join(process.cwd(), 'data', 'sample-sessions.json');

    const dataset = await loadDataset(datasetPath);
    const analyticsRepository = createAnalyticsRepository(dataset);
    const artifactStorage = new ArtifactStorage({
        baseDir: process.env.EXPORT_ARTIFACT_DIR
            ? path.resolve(process.env.EXPORT_ARTIFACT_DIR)
            : path.join(process.cwd(), 'tmp', 'export-artifacts'),
        signedUrlBase: process.env.EXPORT_SIGNED_URL_BASE || 'https://storage.local/exports'
    });

    const jobRepository = createJobRepository();
    const auditLogRepository = createAuditLogRepository();
    const queueClient = await resolveQueueClient();

    const jobService = new ExportJobService({
        analyticsRepository,
        artifactStorage,
        auditLogRepository,
        jobRepository,
        queueClient,
        webhookDispatcher: null,
        scheduler: null
    });

    return jobService;
}

module.exports = jobServiceFactory;
