#!/usr/bin/env node
/**
 * Export Worker Runtime Bootstrap
 *
 * Usage examples:
 *   QUEUE_CLIENT_FACTORY=./path/to/queueFactory.js JOB_SERVICE_FACTORY=./path/to/jobServiceFactory.js node scripts/export-worker-runtime.js
 *   (falls back to in-memory queue when QUEUE_CLIENT_FACTORY is omitted; JOB_SERVICE_FACTORY required)
 */

const path = require('path');
const { createExportWorkerRuntime } = require('../src/services/export');

function loadFactory(envKey, fallbackFactory) {
    const factoryPath = process.env[envKey];
    if (!factoryPath) {
        if (fallbackFactory) {
            return fallbackFactory;
        }
        throw new Error(`${envKey} environment variable is required`);
    }
    const resolved = path.isAbsolute(factoryPath)
        ? factoryPath
        : path.join(process.cwd(), factoryPath);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(resolved);
}

async function defaultJobServiceFactory() {
    // eslint-disable-next-line global-require
    const factory = require('../server/factories/jobServiceFactory');
    return factory();
}

async function defaultQueueClientFactory() {
    if (process.env.QUEUE_BACKEND && process.env.QUEUE_BACKEND !== 'memory') {
        throw new Error('QUEUE_CLIENT_FACTORY must be provided for non-memory backend.');
    }
    // eslint-disable-next-line global-require
    const factory = require('../server/factories/queueClientFactory');
    return factory();
}

async function main() {
    const jobServiceFactory = loadFactory('JOB_SERVICE_FACTORY', defaultJobServiceFactory);
    const queueClientFactory = loadFactory('QUEUE_CLIENT_FACTORY', defaultQueueClientFactory);

    const jobService = await jobServiceFactory();
    const queueClient = await queueClientFactory();

    const runtime = createExportWorkerRuntime({ queueClient, jobService });
    await runtime.start();

    // eslint-disable-next-line no-console
    console.log('Export worker runtime started. Listening for queue messages...');
}

main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start export worker runtime:', error);
    process.exitCode = 1;
});
