class InMemoryQueueClient {
    constructor() {
        this.subscribers = new Set();
        this.queue = [];
        this.processing = false;
    }

    async enqueue(message) {
        this.queue.push(message);
        await this.flush();
        return true;
    }

    subscribe(handler) {
        if (typeof handler !== 'function') {
            throw new Error('handler must be a function');
        }
        this.subscribers.add(handler);
        this.flush();
        return () => {
            this.subscribers.delete(handler);
        };
    }

    async flush() {
        if (this.processing) {
            return;
        }
        this.processing = true;
        try {
            while (this.queue.length && this.subscribers.size) {
                const message = this.queue.shift();
                for (const handler of Array.from(this.subscribers)) {
                    await handler(message);
                }
            }
        } finally {
            this.processing = false;
        }
    }
}

module.exports = {
    InMemoryQueueClient
};
