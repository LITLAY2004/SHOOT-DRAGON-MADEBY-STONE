const {
    createExportWorkerRuntime,
    InMemoryQueueClient
} = require('../../src/services/export');

describe('ExportWorkerRuntime', () => {
    it('invokes jobService.processQueuedJob for each message', async () => {
        const queue = new InMemoryQueueClient();
        const jobService = {
            processQueuedJob: jest.fn().mockResolvedValue({ status: 'ready' })
        };
        const runtime = createExportWorkerRuntime({ queueClient: queue, jobService, logger: { error: jest.fn() } });
        await runtime.start();

        await queue.enqueue({ jobId: 'exp_1', tenantId: 'tenant-1', filters: { format: 'csv', delivery: { type: 'immediate', webhookUrl: null, schedule: null } } });

        expect(jobService.processQueuedJob).toHaveBeenCalledWith({
            jobId: 'exp_1',
            tenantId: 'tenant-1',
            filters: { format: 'csv', delivery: { type: 'immediate', webhookUrl: null, schedule: null } },
            actorId: null
        });
    });

    it('logs errors when processing fails', async () => {
        const queue = new InMemoryQueueClient();
        const error = new Error('boom');
        const jobService = {
            processQueuedJob: jest.fn().mockRejectedValue(error)
        };
        const logger = { error: jest.fn() };
        const runtime = createExportWorkerRuntime({ queueClient: queue, jobService, logger });
        await runtime.start();

        await queue.enqueue({ jobId: 'exp_fail', tenantId: 'tenant-1', filters: { format: 'csv', delivery: { type: 'immediate', webhookUrl: null, schedule: null } } });

        expect(logger.error).toHaveBeenCalled();
    });
});
