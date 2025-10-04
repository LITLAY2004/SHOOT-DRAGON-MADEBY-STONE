const { ValidationError, AuthorizationError } = require('./errors');

const SUPPORTED_FORMATS = ['csv', 'json'];
const DELIVERY_IMMEDIATE = 'immediate';
const DELIVERY_WEBHOOK = 'webhook';
const SUPPORTED_DELIVERY_TYPES = [DELIVERY_IMMEDIATE, DELIVERY_WEBHOOK];
const ALLOWED_GAME_MODES = ['CAMPAIGN', 'ENDLESS', 'SURVIVAL'];

/**
 * Create controller for handling tenant export requests.
 * @param {Object} deps dependency injection container
 * @param {Object} deps.jobService export job orchestration service
 * @param {Object} deps.tokenValidator token validator with async validate(token)
 */
function createTenantExportController(deps) {
    if (!deps || typeof deps !== 'object') {
        throw new Error('createTenantExportController requires dependency map');
    }

    const {
        tokenValidator,
        jobService
    } = deps;

    if (!tokenValidator || typeof tokenValidator.validate !== 'function') {
        throw new Error('tokenValidator with validate is required');
    }
    if (!jobService || typeof jobService.createExportJob !== 'function' || typeof jobService.getJobStatus !== 'function') {
        throw new Error('jobService with createExportJob and getJobStatus is required');
    }

    async function validateAuth({ tenantId, token }) {
        const authContext = await tokenValidator.validate(token);
        if (!authContext || authContext.tenantId !== tenantId) {
            throw new AuthorizationError('Tenant token does not match requested tenant');
        }
        return authContext;
    }

    function isValidCron(expression) {
        return typeof expression === 'string' && /^([^\s]+\s){4}[^\s]+$/.test(expression.trim());
    }

    function normalizePayload(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new ValidationError('Payload must be an object');
        }

        const errors = {};
        const {
            rangeStart,
            rangeEnd,
            gameMode = null,
            minCompletedWave = 0,
            format = 'csv',
            delivery = { type: DELIVERY_IMMEDIATE }
        } = payload;

        if (!rangeStart) {
            errors.rangeStart = 'rangeStart is required';
        }
        if (!rangeEnd) {
            errors.rangeEnd = 'rangeEnd is required';
        }

        const startDate = rangeStart ? new Date(rangeStart) : null;
        const endDate = rangeEnd ? new Date(rangeEnd) : null;

        if (startDate && isNaN(startDate.getTime())) {
            errors.rangeStart = 'rangeStart must be ISO 8601 datetime';
        }
        if (endDate && isNaN(endDate.getTime())) {
            errors.rangeEnd = 'rangeEnd must be ISO 8601 datetime';
        }
        if (!errors.rangeStart && !errors.rangeEnd && startDate > endDate) {
            errors.rangeEnd = 'rangeEnd must be after rangeStart';
        }

        if (gameMode && ALLOWED_GAME_MODES.indexOf(gameMode) === -1) {
            errors.gameMode = `gameMode must be one of ${ALLOWED_GAME_MODES.join(', ')}`;
        }

        const parsedWave = Number(minCompletedWave);
        if (!Number.isInteger(parsedWave) || parsedWave < 0) {
            errors.minCompletedWave = 'minCompletedWave must be a non-negative integer';
        }

        if (SUPPORTED_FORMATS.indexOf(format) === -1) {
            errors.format = `format must be one of ${SUPPORTED_FORMATS.join(', ')}`;
        }

        const deliveryConfig = delivery || { type: DELIVERY_IMMEDIATE };
        const deliveryType = (deliveryConfig.type || DELIVERY_IMMEDIATE).toLowerCase();
        if (SUPPORTED_DELIVERY_TYPES.indexOf(deliveryType) === -1) {
            errors.delivery = `delivery.type must be one of ${SUPPORTED_DELIVERY_TYPES.join(', ')}`;
        }

        let deliveryWebhookUrl = null;
        let deliverySchedule = null;

        if (deliveryType === DELIVERY_WEBHOOK) {
            deliveryWebhookUrl = deliveryConfig.webhookUrl || null;
            if (!deliveryWebhookUrl) {
                errors.delivery = 'delivery.webhookUrl is required when delivery.type=webhook';
            } else {
                try {
                    const parsed = new URL(deliveryWebhookUrl);
                    if (!['http:', 'https:'].includes(parsed.protocol)) {
                        errors.delivery = 'delivery.webhookUrl must use http or https';
                    }
                } catch (err) {
                    errors.delivery = 'delivery.webhookUrl must be a valid URL';
                }
            }

            if (deliveryConfig.schedule) {
                if (!isValidCron(deliveryConfig.schedule)) {
                    errors.deliverySchedule = 'delivery.schedule must be a valid 5-field CRON expression';
                } else {
                    deliverySchedule = deliveryConfig.schedule.trim();
                }
            }
        }

        if (Object.keys(errors).length) {
            throw new ValidationError('Invalid export payload', errors);
        }

        return {
            rangeStart: startDate.toISOString(),
            rangeEnd: endDate.toISOString(),
            gameMode,
            minCompletedWave: parsedWave,
            format,
            delivery: {
                type: deliveryType,
                webhookUrl: deliveryWebhookUrl,
                schedule: deliverySchedule
            }
        };
    }

    async function createExport({ tenantId, token, payload }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!token) {
            throw new AuthorizationError('Authorization token is required');
        }

        const authContext = await validateAuth({ tenantId, token });
        const normalized = normalizePayload(payload);

        const result = await jobService.createExportJob({
            tenantId,
            filters: normalized,
            authContext
        });

        return result;
    }

    async function getExportStatus({ tenantId, token, jobId }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }
        if (!token) {
            throw new AuthorizationError('Authorization token is required');
        }
        if (!jobId) {
            throw new ValidationError('jobId is required');
        }

        await validateAuth({ tenantId, token });

        const status = await jobService.getJobStatus({ tenantId, jobId });
        if (!status) {
            throw new ValidationError('Export job not found', { jobId: 'not_found' });
        }

        return status;
    }

    return {
        createExport,
        getExportStatus
    };
}

module.exports = {
    createTenantExportController
};
