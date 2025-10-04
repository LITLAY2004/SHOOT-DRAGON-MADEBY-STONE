const { createExportQueueWorker } = require('./ExportQueueWorker');

function createExportWorkerRuntime(deps = {}) {
    const {
        queueClient,
        jobService,
        logger = console
    } = deps;

    if (!queueClient || typeof queueClient.subscribe !== 'function') {
        throw new Error('queueClient with subscribe is required');
    }
    if (!jobService || typeof jobService.processQueuedJob !== 'function') {
        throw new Error('jobService with processQueuedJob is required');
    }

    const worker = createExportQueueWorker({ jobService });

    async function handleMessage(message) {
        try {
            await worker.handle(message);
        } catch (error) {
            logger.error('Export worker failed to process message', {
                jobId: message && message.jobId,
                tenantId: message && message.tenantId,
                error: error.message
            });
        }
    }

    async function start() {
        queueClient.subscribe((message) => handleMessage(message));
    }

    return {
        start
    };
}

module.exports = {
    createExportWorkerRuntime
};
