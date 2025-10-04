const crypto = require('crypto');
const {
    ExportJobService,
    DEFAULT_SYNC_LIMIT,
    ValidationError
} = require('../../src/services/export');

describe('ExportJobService', () => {
    const baseFilters = {
        rangeStart: '2024-03-01T00:00:00.000Z',
        rangeEnd: '2024-03-01T23:59:59.000Z',
        gameMode: 'ENDLESS',
        minCompletedWave: 5,
        format: 'csv',
        delivery: { type: 'immediate' }
    };

    const authContext = { actorId: 'admin-9', tenantId: 'tenant-123' };

    function buildDeps(overrides = {}) {
        const analyticsRepository = {
            estimateSessionCount: jest.fn().mockResolvedValue({ count: 5000 }),
            fetchSessions: jest.fn().mockResolvedValue([
                {
                    sessionId: 'sess-1',
                    playerId: 'player-1',
                    tenantId: 'tenant-123',
                    gameMode: 'ENDLESS',
                    waveReached: 18,
                    durationSeconds: 960,
                    totalScore: 12850,
                    resourcesCollected: 4200,
                    dominantElementUsed: 'fire',
                    skillsUsage: [],
                    defeatCause: 'player_death',
                    startedAt: '2024-03-01T10:00:00Z',
                    endedAt: '2024-03-01T10:16:00Z'
                }
            ])
        };
        const artifactStorage = {
            storeArtifact: jest.fn().mockResolvedValue({
                downloadUrl: 'https://example.com/tenant-123/exp_sync.csv',
                artifactPath: 'exports/tenant-123/exp_sync.csv',
                createdAt: '2024-03-02T00:00:00Z',
                completedAt: '2024-03-02T00:00:02Z'
            })
        };
        const auditLogRepository = {
            record: jest.fn().mockResolvedValue(true)
        };
        const jobRepository = {
            create: jest.fn().mockResolvedValue(true),
            update: jest.fn().mockResolvedValue(true),
            findById: jest.fn().mockResolvedValue(null)
        };
        const queueClient = {
            enqueue: jest.fn().mockResolvedValue(true)
        };
        const clock = () => new Date('2024-03-02T00:00:00Z');

        return {
            analyticsRepository,
            artifactStorage,
            auditLogRepository,
            jobRepository,
            queueClient,
            clock,
            webhookDispatcher: overrides.webhookDispatcher || { dispatch: jest.fn().mockResolvedValue({ success: true, attempts: 1, lastAttemptAt: '2024-03-02T00:00:05Z' }) },
            scheduler: overrides.scheduler || { schedule: jest.fn().mockResolvedValue(true) },
            ...overrides
        };
    }

    beforeEach(() => {
        jest.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.from('12345678', 'hex'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('processes synchronous job when estimation within thresholds', async () => {
        const deps = buildDeps();
        const service = new ExportJobService(deps);

        const result = await service.createExportJob({
            tenantId: 'tenant-123',
            filters: baseFilters,
            authContext
        });

        expect(result.status).toBe('ready');
        expect(result.downloadUrl).toBe('https://example.com/tenant-123/exp_sync.csv');
        expect(deps.analyticsRepository.fetchSessions).toHaveBeenCalledWith({
            tenantId: 'tenant-123',
            rangeStart: baseFilters.rangeStart,
            rangeEnd: baseFilters.rangeEnd,
            gameMode: 'ENDLESS',
            minCompletedWave: 5
        });
        expect(deps.jobRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            jobId: expect.stringMatching(/^exp_20240302/),
            status: 'completed',
            recordCount: 1,
            downloadUrl: 'https://example.com/tenant-123/exp_sync.csv'
        }));
        expect(deps.auditLogRepository.record).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
            statusDetail: 'synchronous_export_ready',
            recordCount: 1
        }));
        expect(deps.queueClient.enqueue).not.toHaveBeenCalled();
        expect(deps.webhookDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('queues async job when estimation exceeds sync limit', async () => {
        const deps = buildDeps({
            analyticsRepository: {
                estimateSessionCount: jest.fn().mockResolvedValue({ count: DEFAULT_SYNC_LIMIT + 5 }),
                fetchSessions: jest.fn()
            }
        });
        const service = new ExportJobService(deps);

        const result = await service.createExportJob({
            tenantId: 'tenant-123',
            filters: baseFilters,
            authContext
        });

        expect(result.status).toBe('queued');
        expect(result.etaSeconds).toBeGreaterThan(0);
        expect(deps.analyticsRepository.fetchSessions).not.toHaveBeenCalled();
        expect(deps.queueClient.enqueue).toHaveBeenCalledWith(expect.objectContaining({
            jobId: expect.any(String),
            tenantId: 'tenant-123'
        }));
        expect(deps.jobRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            status: 'queued',
            etaSeconds: result.etaSeconds
        }));
    });

    it('dispatches webhook delivery when delivery type is webhook', async () => {
        const webhookDispatcher = {
            dispatch: jest.fn().mockResolvedValue({
                success: true,
                attempts: 1,
                lastAttemptAt: '2024-03-02T00:00:05Z'
            })
        };
        const deps = buildDeps({ webhookDispatcher });
        const service = new ExportJobService(deps);

        const filters = {
            ...baseFilters,
            delivery: { type: 'webhook', webhookUrl: 'https://ops.example.com/hook', schedule: null }
        };

        const result = await service.createExportJob({
            tenantId: 'tenant-123',
            filters,
            authContext
        });

        expect(result.status).toBe('ready');
        expect(webhookDispatcher.dispatch).toHaveBeenCalledWith({
            tenantId: 'tenant-123',
            jobId: result.jobId,
            url: 'https://ops.example.com/hook',
            payload: expect.objectContaining({
                jobId: result.jobId,
                downloadUrl: 'https://example.com/tenant-123/exp_sync.csv'
            })
        });
        expect(deps.jobRepository.update).toHaveBeenCalledWith(result.jobId, 'tenant-123', expect.objectContaining({
            deliveryStatus: 'delivered',
            deliveryAttempts: 1
        }));
    });

    it('schedules recurring webhook when cron provided', async () => {
        const scheduler = {
            schedule: jest.fn().mockResolvedValue(true)
        };
        const webhookDispatcher = {
            dispatch: jest.fn()
        };
        const artifactStorage = {
            storeArtifact: jest.fn().mockResolvedValue({
                downloadUrl: 'https://example.com/tenant-123/exp_sync.csv',
                artifactPath: 'exports/tenant-123/exp_sync.csv',
                createdAt: '2024-03-02T00:00:00Z',
                completedAt: '2024-03-02T00:00:02Z'
            })
        };
        const deps = buildDeps({ scheduler, webhookDispatcher, artifactStorage });
        const service = new ExportJobService(deps);

        const filters = {
            ...baseFilters,
            delivery: {
                type: 'webhook',
                webhookUrl: 'https://ops.example.com/hook',
                schedule: '0 2 * * *'
            }
        };

        await service.createExportJob({
            tenantId: 'tenant-123',
            filters,
            authContext
        });

        expect(scheduler.schedule).toHaveBeenCalledWith(expect.objectContaining({
            tenantId: 'tenant-123',
            jobId: expect.any(String),
            cron: '0 2 * * *',
            webhookUrl: 'https://ops.example.com/hook'
        }));
        expect(webhookDispatcher.dispatch).not.toHaveBeenCalled();
        expect(deps.auditLogRepository.record).toHaveBeenCalledWith(expect.objectContaining({
            status: 'scheduled',
            statusDetail: 'webhook_scheduled'
        }));
    });

    it('processQueuedJob completes job and triggers delivery', async () => {
        const webhookDispatcher = {
            dispatch: jest.fn().mockResolvedValue({
                success: true,
                attempts: 1,
                lastAttemptAt: '2024-03-02T00:00:05Z'
            })
        };
        const deps = buildDeps({ webhookDispatcher });
        const service = new ExportJobService(deps);
        const markSpy = jest.spyOn(service, 'markJobCompleted');

        const filters = {
            ...baseFilters,
            delivery: { type: 'webhook', webhookUrl: 'https://ops.example.com/hook', schedule: null }
        };

        await service.processQueuedJob({
            jobId: 'exp_async',
            tenantId: 'tenant-123',
            filters,
            actorId: 'admin-9'
        });

        expect(deps.jobRepository.update).toHaveBeenCalledWith('exp_async', 'tenant-123', expect.objectContaining({ status: 'processing' }));
        expect(deps.analyticsRepository.fetchSessions).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-123' }));
        expect(deps.artifactStorage.storeArtifact).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-123', jobId: 'exp_async', format: 'csv' }));
        expect(markSpy).toHaveBeenCalledWith(expect.objectContaining({
            jobId: 'exp_async',
            tenantId: 'tenant-123',
            delivery: filters.delivery,
            filters
        }));
        expect(webhookDispatcher.dispatch).toHaveBeenCalled();

        markSpy.mockRestore();
    });

    it('processQueuedJob marks failure on error', async () => {
        const deps = buildDeps({
            analyticsRepository: {
                estimateSessionCount: jest.fn(),
                fetchSessions: jest.fn().mockRejectedValue(new Error('warehouse offline'))
            }
        });
        const service = new ExportJobService(deps);

        await expect(service.processQueuedJob({
            jobId: 'exp_fail',
            tenantId: 'tenant-123',
            filters: { ...baseFilters, delivery: { type: 'immediate', webhookUrl: null, schedule: null } },
            actorId: 'admin-9'
        })).rejects.toThrow('warehouse offline');

        expect(deps.jobRepository.update).toHaveBeenCalledWith('exp_fail', 'tenant-123', expect.objectContaining({ status: 'failed' }));
        expect(deps.auditLogRepository.record).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failed',
            statusDetail: 'async_export_failed'
        }));
    });

    it('returns null when job not found for status lookup', async () => {
        const deps = buildDeps();
        const service = new ExportJobService(deps);

        const status = await service.getJobStatus({ tenantId: 'tenant-123', jobId: 'exp_missing' });
        expect(status).toBeNull();
    });

    it('returns sanitized job status when found', async () => {
        const deps = buildDeps();
        deps.jobRepository.findById.mockResolvedValue({
            jobId: 'exp_20240302000000_abcd',
            tenantId: 'tenant-123',
            status: 'ready',
            format: 'csv',
            deliveryType: 'immediate',
            recordCount: 12000,
            downloadUrl: 'https://example.com/tenant-123/exp.csv',
            etaSeconds: 0,
            updatedAt: '2024-03-02T00:05:00Z'
        });
        const service = new ExportJobService(deps);

        const status = await service.getJobStatus({ tenantId: 'tenant-123', jobId: 'exp_20240302000000_abcd' });

        expect(status).toEqual({
            jobId: 'exp_20240302000000_abcd',
            status: 'ready',
            format: 'csv',
            deliveryType: 'immediate',
            recordCount: 12000,
            downloadUrl: 'https://example.com/tenant-123/exp.csv',
            etaSeconds: 0,
            updatedAt: '2024-03-02T00:05:00Z'
        });
    });

    it('throws validation error when tenantId missing for creation', async () => {
        const deps = buildDeps();
        const service = new ExportJobService(deps);

        await expect(service.createExportJob({
            tenantId: '',
            filters: baseFilters,
            authContext
        })).rejects.toThrow(ValidationError);
    });
});
