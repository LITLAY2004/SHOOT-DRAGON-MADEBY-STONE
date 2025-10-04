const http = require('http');
const fs = require('fs/promises');
const path = require('path');

function createTokenValidator(token) {
    if (!token) {
        return null;
    }
    return (req) => {
        const header = req.headers && (req.headers.authorization || req.headers.Authorization);
        if (!header || !header.startsWith('Bearer ')) {
            return false;
        }
        const provided = header.slice('Bearer '.length).trim();
        return provided === token;
    };
}

function createAdminApiHandler(options = {}) {
    const {
        auditLogProvider,
        userProvider,
        logger = console,
        datasetPath = path.join(process.cwd(), 'docs', 'admin', 'export-audit-log-sample.json'),
        authValidator = null
    } = options;

    async function defaultAuditLogProvider() {
        const raw = await fs.readFile(datasetPath, 'utf8');
        return JSON.parse(raw);
    }

    async function defaultUserProvider() {
        return {
            id: 'admin-operator',
            name: 'Admin Operator',
            roles: ['EXPORT_AUDITOR', 'ADMIN']
        };
    }

    const resolveAuditLog = auditLogProvider || defaultAuditLogProvider;
    const resolveUser = userProvider || defaultUserProvider;
    const authorize = authValidator || createTokenValidator(process.env.ADMIN_API_TOKEN);

    function writeJson(res, statusCode, payload) {
        const body = JSON.stringify(payload, null, 2);
        res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        });
        res.end(body);
    }

    function notFound(res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not_found' }));
    }

    async function handler(req, res) {
        if (req.method !== 'GET') {
            res.writeHead(405, { 'Allow': 'GET' });
            return res.end();
        }

        if (authorize) {
            try {
                const allowed = await authorize(req, res);
                if (!allowed) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'unauthorized' }));
                    return;
                }
            } catch (error) {
                logger.error('Admin API auth error', { error: error.message });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'auth_failed' }));
                return;
            }
        }

        try {
            if (req.url === '/api/admin/current-user') {
                const user = await resolveUser();
                return writeJson(res, 200, user);
            }

            if (req.url && req.url.startsWith('/api/admin/export-audit-log')) {
                const entries = await resolveAuditLog();
                return writeJson(res, 200, { entries });
            }
        } catch (error) {
            logger.error('Admin API error', { statusCode: 500, error: error.message });
            return writeJson(res, 500, { error: error.message });
        }

        return notFound(res);
    }

    return handler;
}

function createAdminApiServer(options = {}) {
    const { port = 0 } = options;
    const handler = createAdminApiHandler(options);
    let server;

    function start() {
        return new Promise((resolve, reject) => {
            server = http.createServer(handler);
            server.on('error', reject);
            server.listen(port, () => {
                server.off('error', reject);
                resolve(server.address().port);
            });
        });
    }

    function stop() {
        return new Promise((resolve) => {
            if (!server) {
                return resolve();
            }
            server.close(() => resolve());
        });
    }

    return {
        start,
        stop,
        handler
    };
}

module.exports = {
    createAdminApiServer,
    createAdminApiHandler
};
