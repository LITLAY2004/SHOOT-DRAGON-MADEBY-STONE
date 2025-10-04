const { ValidationError } = require('./errors');

function createExportQueueWorker(deps = {}) {
    const { jobService } = deps;

    if (!jobService || typeof jobService.processQueuedJob !== 'function') {
        throw new Error('jobService with processQueuedJob is required');
    }

    async function handle(message = {}) {
        const { jobId, tenantId, filters, actorId } = message;
        if (!jobId) {
            throw new ValidationError('jobId is required');
        }
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!filters) {
            throw new ValidationError('filters are required');
        }
        return jobService.processQueuedJob({ jobId, tenantId, filters, actorId: actorId || null });
    }

    return {
        handle
    };
}

module.exports = {
    createExportQueueWorker
};
