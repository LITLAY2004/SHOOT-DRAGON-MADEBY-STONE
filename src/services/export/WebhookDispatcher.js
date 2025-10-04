const crypto = require('crypto');
const { ValidationError } = require('./errors');

class WebhookDispatcher {
    constructor(options = {}) {
        const {
            httpClient,
            auditLogRepository,
            secretProvider = () => 'export-default-secret',
            clock = () => new Date(),
            sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
            maxAttempts = 3,
            backoffMs = 750
        } = options;

        if (typeof httpClient !== 'function') {
            throw new Error('httpClient function is required');
        }
        if (!auditLogRepository || typeof auditLogRepository.record !== 'function') {
            throw new Error('auditLogRepository with record is required');
        }

        this.httpClient = httpClient;
        this.auditLogRepository = auditLogRepository;
        this.secretProvider = secretProvider;
        this.clock = clock;
        this.sleep = sleep;
        this.maxAttempts = maxAttempts;
        this.backoffMs = backoffMs;
    }

    async dispatch({ tenantId, jobId, url, payload }) {
        if (!tenantId) {
            throw new ValidationError('tenantId is required for webhook delivery');
        }
        if (!jobId) {
            throw new ValidationError('jobId is required for webhook delivery');
        }
        if (!url) {
            throw new ValidationError('webhook url is required');
        }

        const body = JSON.stringify(payload || {});
        const secret = await this.resolveSecret(tenantId);
        let attempts = 0;
        let lastAttemptAt = null;
        let lastError = null;

        while (attempts < this.maxAttempts) {
            attempts += 1;
            const attemptTime = this.clock().toISOString();
            const signature = this.sign(secret, attemptTime, body);

            try {
                const response = await this.httpClient(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Export-Signature': signature,
                        'X-Export-Timestamp': attemptTime,
                        'X-Export-Tenant': tenantId,
                        'X-Export-Job': jobId
                    },
                    body
                });

                if (response && response.ok) {
                    await this.auditLogRepository.record({
                        jobId,
                        tenantId,
                        status: 'delivered',
                        statusDetail: 'webhook_delivered',
                        deliveryTarget: url,
                        attempts,
                        createdAt: attemptTime
                    });
                    return {
                        success: true,
                        attempts,
                        lastAttemptAt: attemptTime
                    };
                }

                lastError = new Error(`Webhook responded with status ${response ? response.status : 'unknown'}`);
            } catch (error) {
                lastError = error;
            }

            lastAttemptAt = this.clock().toISOString();
            if (attempts < this.maxAttempts) {
                await this.sleep(this.backoffMs * Math.pow(2, attempts - 1));
            }
        }

        const failureTime = this.clock().toISOString();
        await this.auditLogRepository.record({
            jobId,
            tenantId,
            status: 'delivery_failed',
            statusDetail: 'webhook_failed',
            deliveryTarget: url,
            attempts,
            error: lastError ? lastError.message : 'Unknown webhook error',
            createdAt: failureTime
        });

        return {
            success: false,
            attempts,
            lastAttemptAt: failureTime,
            error: lastError
        };
    }

    sign(secret, timestamp, body) {
        return crypto.createHmac('sha256', secret)
            .update(`${timestamp}:${body}`)
            .digest('hex');
    }

    async resolveSecret(tenantId) {
        if (typeof this.secretProvider === 'function') {
            return this.secretProvider(tenantId);
        }
        if (this.secretProvider && typeof this.secretProvider.getSecret === 'function') {
            return this.secretProvider.getSecret(tenantId);
        }
        return 'export-default-secret';
    }
}

module.exports = {
    WebhookDispatcher
};
