const path = require('path');
const {
    InMemoryQueueClient
} = require('../../src/services/export');

let sharedQueue = null;

async function queueClientFactory() {
    const backend = process.env.QUEUE_BACKEND || 'memory';

    if (backend === 'memory') {
        if (!sharedQueue) {
            sharedQueue = global.__EXPORT_QUEUE_CLIENT__ || new InMemoryQueueClient();
            global.__EXPORT_QUEUE_CLIENT__ = sharedQueue;
        }
        return sharedQueue;
    }

    const factoryPath = process.env.QUEUE_CLIENT_DRIVER;
    if (!factoryPath) {
        throw new Error('QUEUE_CLIENT_DRIVER env var required for non-memory backend');
    }
    const resolved = path.isAbsolute(factoryPath)
        ? factoryPath
        : path.join(process.cwd(), factoryPath);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const factory = require(resolved);
    const client = await factory();
    if (!client || typeof client.enqueue !== 'function' || typeof client.subscribe !== 'function') {
        throw new Error('Queue client factory must return an object with enqueue and subscribe functions');
    }
    return client;
}

module.exports = queueClientFactory;
