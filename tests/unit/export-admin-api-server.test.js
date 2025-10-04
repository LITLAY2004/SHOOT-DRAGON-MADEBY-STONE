const { createAdminApiHandler } = require('../../src/services/export');

function createMockResponse() {
    return {
        statusCode: null,
        headers: {},
        body: '',
        writeHead(status, headers = {}) {
            this.statusCode = status;
            this.headers = headers;
        },
        end(body = '') {
            this.body = body;
        }
    };
}

describe('AdminApiHandler', () => {
    it('returns current user payload', async () => {
        const handler = createAdminApiHandler({
            userProvider: async () => ({ id: 'user-1', roles: ['EXPORT_AUDITOR'] }),
            auditLogProvider: async () => []
        });
        const res = createMockResponse();
        await handler({ method: 'GET', url: '/api/admin/current-user' }, res);
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ id: 'user-1', roles: ['EXPORT_AUDITOR'] });
    });

    it('returns audit log entries', async () => {
        const handler = createAdminApiHandler({
            auditLogProvider: async () => [{ jobId: 'exp_1' }],
            userProvider: async () => ({ id: 'user-1', roles: ['EXPORT_AUDITOR'] })
        });
        const res = createMockResponse();
        await handler({ method: 'GET', url: '/api/admin/export-audit-log' }, res);
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body)).toEqual({ entries: [{ jobId: 'exp_1' }] });
    });

    it('enforces bearer token when provided', async () => {
        process.env.ADMIN_API_TOKEN = 'super-secret';
        const handler = createAdminApiHandler({
            auditLogProvider: async () => [],
            userProvider: async () => ({ id: 'user-1', roles: [] })
        });

        try {
            const resUnauthorized = createMockResponse();
            await handler({ method: 'GET', url: '/api/admin/export-audit-log', headers: {} }, resUnauthorized);
            expect(resUnauthorized.statusCode).toBe(401);

            const resAuthorized = createMockResponse();
            await handler({
                method: 'GET',
                url: '/api/admin/export-audit-log',
                headers: { authorization: 'Bearer super-secret' }
            }, resAuthorized);
            expect(resAuthorized.statusCode).toBe(200);
        } finally {
            delete process.env.ADMIN_API_TOKEN;
        }
    });
});
