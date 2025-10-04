#!/usr/bin/env node
const path = require('path');
const { createAdminApiServer } = require('../src/services/export');

(async function start() {
    const server = createAdminApiServer({
        port: process.env.PORT ? Number(process.env.PORT) : 8081,
        datasetPath: process.env.AUDIT_DATASET
            ? path.resolve(process.env.AUDIT_DATASET)
            : path.join(process.cwd(), 'docs', 'admin', 'export-audit-log-sample.json')
    });

    const port = await server.start();
    // eslint-disable-next-line no-console
    console.log(`Admin API server listening on http://localhost:${port}`);
})();
