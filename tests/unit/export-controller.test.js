const {
    createTenantExportController,
    ValidationError,
    AuthorizationError
} = require('../../src/services/export');

describe('TenantExportController', () => {
    function buildController(overrides = {}) {
        const jobService = {
            createExportJob: jest.fn().mockResolvedValue({
                status: 'ready',
                jobId: 'exp_mock',
                downloadUrl: 'https://example.com/tenant-123/exp_mock.csv',
                recordCount: 1
            }),
            getJobStatus: jest.fn().mockResolvedValue({
                jobId: 'exp_mock',
                status: 'ready',
                format: 'csv',
                deliveryType: 'immediate',
                recordCount: 1,
                downloadUrl: 'https://example.com/tenant-123/exp_mock.csv',
                etaSeconds: 0,
                updatedAt: '2024-03-02T00:00:00Z'
            })
        };
        const tokenValidator = {
            validate: jest.fn().mockImplementation(async (token) => {
                if (token === 'valid-token') {
                    return { actorId: 'admin-9', tenantId: 'tenant-123' };
                }
                return null;
            })
        };
        const defaultDeps = {
            jobService,
            tokenValidator
        };

        return {
            controller: createTenantExportController({ ...defaultDeps, ...overrides }),
            deps: { ...defaultDeps, ...overrides }
        };
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns ready status with download URL for valid synchronous export', async () => {
        const { controller, deps } = buildController();

        const payload = {
            rangeStart: '2024-03-01T00:00:00Z',
            rangeEnd: '2024-03-01T23:59:59Z',
            gameMode: 'ENDLESS',
            minCompletedWave: 5,
            format: 'csv'
        };

        const result = await controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload
        });

        expect(result.status).toBe('ready');
        expect(result.jobId).toBe('exp_mock');
        expect(deps.jobService.createExportJob).toHaveBeenCalledWith({
            tenantId: 'tenant-123',
            filters: {
                ...payload,
                gameMode: 'ENDLESS',
                minCompletedWave: 5,
                rangeStart: '2024-03-01T00:00:00.000Z',
                rangeEnd: '2024-03-01T23:59:59.000Z',
                delivery: { type: 'immediate', webhookUrl: null, schedule: null }
            },
            authContext: { actorId: 'admin-9', tenantId: 'tenant-123' }
        });
    });

    it('throws validation error for invalid date range', async () => {
        const { controller } = buildController();

        await expect(controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload: {
                rangeStart: '2024-03-02T00:00:00Z',
                rangeEnd: '2024-03-01T00:00:00Z'
            }
        })).rejects.toThrow(ValidationError);
    });

    it('throws authorization error when token tenant mismatches', async () => {
        const tokenValidator = {
            validate: jest.fn().mockResolvedValue({ actorId: 'admin', tenantId: 'tenant-other' })
        };
        const { controller } = buildController({ tokenValidator });

        await expect(controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload: {
                rangeStart: '2024-03-01T00:00:00Z',
                rangeEnd: '2024-03-01T23:59:59Z'
            }
        })).rejects.toThrow(AuthorizationError);
    });

    it('throws validation error for unsupported format', async () => {
        const { controller, deps } = buildController();

        await expect(controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload: {
                rangeStart: '2024-03-01T00:00:00Z',
                rangeEnd: '2024-03-01T23:59:59Z',
                format: 'xml'
            }
        })).rejects.toThrow(ValidationError);
        expect(deps.jobService.createExportJob).not.toHaveBeenCalled();
    });

    it('throws validation error when webhook delivery missing url', async () => {
        const { controller } = buildController();

        await expect(controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload: {
                rangeStart: '2024-03-01T00:00:00Z',
                rangeEnd: '2024-03-01T23:59:59Z',
                delivery: { type: 'webhook' }
            }
        })).rejects.toThrow(ValidationError);
    });

    it('throws validation error when webhook schedule invalid', async () => {
        const { controller } = buildController();

        await expect(controller.createExport({
            tenantId: 'tenant-123',
            token: 'valid-token',
            payload: {
                rangeStart: '2024-03-01T00:00:00Z',
                rangeEnd: '2024-03-01T23:59:59Z',
                delivery: {
                    type: 'webhook',
                    webhookUrl: 'https://ops.example.com/hook',
                    schedule: 'invalid cron'
                }
            }
        })).rejects.toThrow(ValidationError);
    });

    it('returns job status for authorized tenant', async () => {
        const { controller, deps } = buildController();

        const status = await controller.getExportStatus({
            tenantId: 'tenant-123',
            token: 'valid-token',
            jobId: 'exp_mock'
        });

        expect(status.status).toBe('ready');
        expect(deps.jobService.getJobStatus).toHaveBeenCalledWith({ tenantId: 'tenant-123', jobId: 'exp_mock' });
    });

    it('throws validation error when job not found', async () => {
        const jobService = {
            createExportJob: jest.fn(),
            getJobStatus: jest.fn().mockResolvedValue(null)
        };
        const tokenValidator = {
            validate: jest.fn().mockResolvedValue({ actorId: 'admin-9', tenantId: 'tenant-123' })
        };
        const controller = createTenantExportController({ jobService, tokenValidator });

        await expect(controller.getExportStatus({
            tenantId: 'tenant-123',
            token: 'valid-token',
            jobId: 'missing'
        })).rejects.toThrow(ValidationError);
    });
});
