const {
    createExportQueueWorker,
    ValidationError
} = require('../../src/services/export');

describe('ExportQueueWorker', () => {
    it('delegates to jobService.processQueuedJob', async () => {
        const jobService = {
            processQueuedJob: jest.fn().mockResolvedValue({ status: 'ready' })
        };
        const worker = createExportQueueWorker({ jobService });

        const message = {
            jobId: 'exp_queued',
            tenantId: 'tenant-123',
            filters: { format: 'csv', delivery: { type: 'immediate', webhookUrl: null, schedule: null } },
            actorId: 'admin-9'
        };

        const result = await worker.handle(message);
        expect(result).toEqual({ status: 'ready' });
        expect(jobService.processQueuedJob).toHaveBeenCalledWith(message);
    });

    it('throws validation error for missing identifiers', async () => {
        const worker = createExportQueueWorker({ jobService: { processQueuedJob: jest.fn() } });
        await expect(worker.handle({ tenantId: 'tenant-123', filters: {} })).rejects.toThrow(ValidationError);
    });
});
