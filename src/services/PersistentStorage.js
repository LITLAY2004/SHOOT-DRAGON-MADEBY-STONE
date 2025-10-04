class PersistentStorage {
    static memoryStore = {};

    static read(key, defaultValue = null) {
        if (!key) {
            return defaultValue;
        }

        if (Object.prototype.hasOwnProperty.call(PersistentStorage.memoryStore, key)) {
            return PersistentStorage.memoryStore[key];
        }

        const isTestEnvironment = typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID;
        const canUseLocalStorage = typeof localStorage !== 'undefined' && !isTestEnvironment;

        try {
            if (canUseLocalStorage) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    PersistentStorage.memoryStore[key] = parsed;
                    return parsed;
                }
            }
        } catch (error) {
            console.warn('PersistentStorage.read localStorage失败:', error);
        }

        PersistentStorage.memoryStore[key] = defaultValue;
        return defaultValue;
    }

    static write(key, value) {
        if (!key) {
            return false;
        }

        const isTestEnvironment = typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID;
        const canUseLocalStorage = typeof localStorage !== 'undefined' && !isTestEnvironment;

        try {
            if (canUseLocalStorage) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.warn('PersistentStorage.write localStorage失败:', error);
        }

        PersistentStorage.memoryStore[key] = value;
        return true;
    }
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = PersistentStorage;
}
if (typeof globalThis !== 'undefined') {
    globalThis.PersistentStorage = PersistentStorage;
}
