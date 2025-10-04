const crypto = require('crypto');
const {
    WebhookDispatcher,
    ValidationError
} = require('../../src/services/export');

describe('WebhookDispatcher', () => {
    const payload = { message: 'export ready' };

    function buildDispatcher(overrides = {}) {
        const httpClient = overrides.httpClient || jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const auditLogRepository = overrides.auditLogRepository || { record: jest.fn().mockResolvedValue(true) };
        const clock = overrides.clock || (() => new Date('2024-03-02T00:00:00Z'));
        const secretProvider = overrides.secretProvider || (() => 'super-secret');
        const sleep = overrides.sleep || jest.fn().mockResolvedValue();
        const dispatcher = new WebhookDispatcher({
            httpClient,
            auditLogRepository,
            secretProvider,
            clock,
            sleep,
            maxAttempts: overrides.maxAttempts || 3,
            backoffMs: overrides.backoffMs || 10
        });
        return { dispatcher, httpClient, auditLogRepository, sleep, secretProvider, clock };
    }

    it('dispatches payload with signed headers and logs success', async () => {
        const { dispatcher, httpClient, auditLogRepository } = buildDispatcher();

        const result = await dispatcher.dispatch({
            tenantId: 'tenant-123',
            jobId: 'exp_1',
            url: 'https://ops.example.com/hook',
            payload
        });

        expect(result).toEqual({ success: true, attempts: 1, lastAttemptAt: '2024-03-02T00:00:00.000Z' });

        const expectedSignature = crypto
            .createHmac('sha256', 'super-secret')
            .update('2024-03-02T00:00:00.000Z:' + JSON.stringify(payload))
            .digest('hex');

        expect(httpClient).toHaveBeenCalledWith('https://ops.example.com/hook', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'X-Export-Signature': expectedSignature,
                'X-Export-Tenant': 'tenant-123',
                'X-Export-Job': 'exp_1'
            }),
            body: JSON.stringify(payload)
        }));
        expect(auditLogRepository.record).toHaveBeenCalledWith(expect.objectContaining({
            status: 'delivered',
            statusDetail: 'webhook_delivered'
        }));
    });

    it('retries on failure and logs delivery failure', async () => {
        const httpClient = jest.fn().mockResolvedValue({ ok: false, status: 500 });
        const auditLogRepository = { record: jest.fn().mockResolvedValue(true) };
        const sleep = jest.fn().mockResolvedValue();
        const { dispatcher } = buildDispatcher({ httpClient, auditLogRepository, sleep, maxAttempts: 2 });

        const result = await dispatcher.dispatch({
            tenantId: 'tenant-123',
            jobId: 'exp_2',
            url: 'https://ops.example.com/hook',
            payload
        });

        expect(result.success).toBe(false);
        expect(result.attempts).toBe(2);
        expect(sleep).toHaveBeenCalled();
        expect(auditLogRepository.record).toHaveBeenCalledWith(expect.objectContaining({
            status: 'delivery_failed',
            statusDetail: 'webhook_failed'
        }));
    });

    it('validates required parameters', async () => {
        const { dispatcher } = buildDispatcher();
        await expect(dispatcher.dispatch({ tenantId: '', jobId: 'exp', url: 'https://example.com', payload: {} }))
            .rejects.toThrow(ValidationError);
    });
});
