/**
 * Advanced Data Management System
 * Provides data persistence, synchronization, and backup capabilities
 */

class DataManager {
    constructor() {
        this.stores = new Map();
        this.syncQueue = [];
        this.backupInterval = 5 * 60 * 1000; // 5 minutes
        this.maxBackups = 10;
        this.initialized = false;
        this.eventListeners = new Map();
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.setupStores();
            this.startBackupScheduler();
            this.initialized = true;
            console.log('✅ DataManager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize DataManager:', error);
            throw error;
        }
    }

    setupStores() {
        // Define data stores
        const storeConfigs = [
            { name: 'agents', persistent: true, encrypted: false },
            { name: 'tasks', persistent: true, encrypted: false },
            { name: 'settings', persistent: true, encrypted: true },
            { name: 'analytics', persistent: true, encrypted: false },
            { name: 'cache', persistent: false, encrypted: false },
            { name: 'sessions', persistent: true, encrypted: true }
        ];

        storeConfigs.forEach(config => {
            this.createStore(config.name, config);
        });
    }

    createStore(name, options = {}) {
        const store = new DataStore(name, options);
        this.stores.set(name, store);
        return store;
    }

    getStore(name) {
        return this.stores.get(name);
    }

    async syncData() {
        // Process sync queue
        while (this.syncQueue.length > 0) {
            const operation = this.syncQueue.shift();
            try {
                await this.processSyncOperation(operation);
            } catch (error) {
                console.error('Sync operation failed:', error);
                // Re-queue failed operations
                this.syncQueue.push(operation);
            }
        }
    }

    async processSyncOperation(operation) {
        // Placeholder for cloud sync implementation
        console.log('Processing sync operation:', operation);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { success: true, operation };
    }

    queueSync(operation) {
        this.syncQueue.push({
            ...operation,
            timestamp: Date.now(),
            id: this.generateId()
        });
    }

    async createBackup() {
        try {
            const backup = {
                timestamp: Date.now(),
                version: '1.0.0',
                data: {}
            };

            // Collect data from all persistent stores
            for (const [name, store] of this.stores) {
                if (store.options.persistent) {
                    backup.data[name] = await store.exportData();
                }
            }

            // Save backup
            const backupKey = `backup_${backup.timestamp}`;
            localStorage.setItem(backupKey, JSON.stringify(backup));

            // Manage backup count
            this.cleanupOldBackups();

            console.log('Backup created:', backupKey);
            return backupKey;
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw error;
        }
    }

    cleanupOldBackups() {
        try {
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith('backup_'))
                .sort((a, b) => {
                    const timestampA = parseInt(a.split('_')[1]);
                    const timestampB = parseInt(b.split('_')[1]);
                    return timestampB - timestampA; // Newest first
                });

            // Remove old backups
            if (backupKeys.length > this.maxBackups) {
                const toRemove = backupKeys.slice(this.maxBackups);
                toRemove.forEach(key => localStorage.removeItem(key));
                console.log(`Removed ${toRemove.length} old backups`);
            }
        } catch (error) {
            console.error('Backup cleanup failed:', error);
        }
    }

    async restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }

            const backup = JSON.parse(backupData);
            
            // Restore data to stores
            for (const [storeName, storeData] of Object.entries(backup.data)) {
                const store = this.stores.get(storeName);
                if (store) {
                    await store.importData(storeData);
                }
            }

            console.log('Backup restored:', backupKey);
            return true;
        } catch (error) {
            console.error('Backup restoration failed:', error);
            throw error;
        }
    }

    getBackups() {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('backup_'))
            .map(key => {
                const timestamp = parseInt(key.split('_')[1]);
                return {
                    key,
                    timestamp,
                    date: new Date(timestamp).toLocaleString(),
                    size: localStorage.getItem(key).length
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        return backupKeys;
    }

    startBackupScheduler() {
        setInterval(() => {
            this.createBackup().catch(error => {
                console.error('Scheduled backup failed:', error);
            });
        }, this.backupInterval);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Event handling methods
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

class DataStore {
    constructor(name, options = {}) {
        this.name = name;
        this.options = {
            persistent: true,
            encrypted: false,
            maxSize: 1000,
            ...options
        };
        this.data = new Map();
        this.listeners = new Set();
        this.loadData();
    }

    async set(key, value) {
        const oldValue = this.data.get(key);
        this.data.set(key, value);
        
        // Trigger change event
        this.notifyListeners('set', { key, value, oldValue });
        
        // Save if persistent
        if (this.options.persistent) {
            await this.saveData();
        }

        return true;
    }

    get(key, defaultValue = null) {
        return this.data.get(key) || defaultValue;
    }

    has(key) {
        return this.data.has(key);
    }

    async delete(key) {
        const value = this.data.get(key);
        const deleted = this.data.delete(key);
        
        if (deleted) {
            this.notifyListeners('delete', { key, value });
            
            if (this.options.persistent) {
                await this.saveData();
            }
        }
        
        return deleted;
    }

    async clear() {
        const oldData = new Map(this.data);
        this.data.clear();
        
        this.notifyListeners('clear', { oldData });
        
        if (this.options.persistent) {
            await this.saveData();
        }
    }

    keys() {
        return Array.from(this.data.keys());
    }

    values() {
        return Array.from(this.data.values());
    }

    entries() {
        return Array.from(this.data.entries());
    }

    size() {
        return this.data.size;
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(operation, data) {
        this.listeners.forEach(callback => {
            try {
                callback({ operation, store: this.name, ...data });
            } catch (error) {
                console.error('Store listener error:', error);
            }
        });
    }

    async saveData() {
        try {
            const serialized = JSON.stringify(Array.from(this.data.entries()));
            const data = this.options.encrypted ? this.encrypt(serialized) : serialized;
            
            localStorage.setItem(`store_${this.name}`, data);
        } catch (error) {
            console.error(`Failed to save store ${this.name}:`, error);
        }
    }

    loadData() {
        try {
            const stored = localStorage.getItem(`store_${this.name}`);
            if (stored) {
                const data = this.options.encrypted ? this.decrypt(stored) : stored;
                const entries = JSON.parse(data);
                this.data = new Map(entries);
            }
        } catch (error) {
            console.error(`Failed to load store ${this.name}:`, error);
            this.data = new Map();
        }
    }

    async exportData() {
        return {
            name: this.name,
            options: this.options,
            data: Array.from(this.data.entries()),
            timestamp: Date.now()
        };
    }

    async importData(exportedData) {
        if (exportedData.name !== this.name) {
            throw new Error('Store name mismatch');
        }
        
        this.data = new Map(exportedData.data);
        
        if (this.options.persistent) {
            await this.saveData();
        }
        
        this.notifyListeners('import', { data: exportedData });
    }

    encrypt(data) {
        // Simple encryption - in production, use proper encryption
        return btoa(data);
    }

    decrypt(data) {
        // Simple decryption - in production, use proper decryption
        return atob(data);
    }
}

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttlMap = new Map();
        this.maxSize = 100;
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
        this.cleanupInterval = 60 * 1000; // 1 minute
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            this.startCleanup();
            this.initialized = true;
            console.log('✅ CacheManager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize CacheManager:', error);
            throw error;
        }
    }

    set(key, value, ttl = this.defaultTTL) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.delete(firstKey);
        }

        this.cache.set(key, value);
        this.ttlMap.set(key, Date.now() + ttl);
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const ttl = this.ttlMap.get(key);
        if (ttl && Date.now() > ttl) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
    }

    clear() {
        this.cache.clear();
        this.ttlMap.clear();
    }

    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, ttl] of this.ttlMap) {
                if (now > ttl) {
                    this.delete(key);
                }
            }
        }, this.cleanupInterval);
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export for global use
window.DataManager = DataManager;
window.DataStore = DataStore;
window.CacheManager = CacheManager;