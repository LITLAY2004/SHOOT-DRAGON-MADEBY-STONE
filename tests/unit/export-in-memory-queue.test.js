const { InMemoryQueueClient } = require('../../src/services/export');

describe('InMemoryQueueClient', () => {
    it('delivers enqueued messages to subscribers in order', async () => {
        const queue = new InMemoryQueueClient();
        const received = [];
        queue.subscribe(async (message) => {
            received.push(message);
        });

        await queue.enqueue({ id: 1 });
        await queue.enqueue({ id: 2 });

        expect(received).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('supports unsubscribe', async () => {
        const queue = new InMemoryQueueClient();
        const received = [];
        const unsubscribe = queue.subscribe(async (message) => {
            received.push(message);
        });

        unsubscribe();
        await queue.enqueue({ id: 1 });

        expect(received).toHaveLength(0);
    });
});
