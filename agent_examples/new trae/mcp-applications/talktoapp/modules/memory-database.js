/**
 * Memory Database System for TalkToApp
 * Provides persistent storage, advanced querying, and data relationships
 * for the Advanced Memory System.
 */

class MemoryDatabase {
    constructor() {
        this.dbName = 'TalkToAppMemoryDB';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
        
        this.stores = {
            memories: 'memories',
            relationships: 'relationships',
            metadata: 'metadata',
            analytics: 'analytics',
            backups: 'backups'
        };

        this.queryEngine = new MemoryQueryEngine();
        this.relationshipEngine = new MemoryRelationshipEngine();
        this.analyticsEngine = new MemoryAnalyticsEngine();
        this.backupEngine = new MemoryBackupEngine();

        this.initializeDatabase();
    }

    /**
     * Initialize IndexedDB database
     */
    async initializeDatabase() {
        try {
            this.db = await this.openDatabase();
            this.isInitialized = true;
            console.log('💾 Memory Database initialized');
            
            // Start background processes
            this.startBackgroundProcesses();
        } catch (error) {
            console.error('❌ Memory Database initialization failed:', error);
        }
    }

    /**
     * Open IndexedDB database
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create memories store
                if (!db.objectStoreNames.contains(this.stores.memories)) {
                    const memoriesStore = db.createObjectStore(this.stores.memories, { keyPath: 'id' });
                    memoriesStore.createIndex('type', 'type', { unique: false });
                    memoriesStore.createIndex('importance', 'importance', { unique: false });
                    memoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    memoriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    memoriesStore.createIndex('hash', 'metadata.hash', { unique: false });
                }

                // Create relationships store
                if (!db.objectStoreNames.contains(this.stores.relationships)) {
                    const relationshipsStore = db.createObjectStore(this.stores.relationships, { keyPath: 'id' });
                    relationshipsStore.createIndex('fromMemory', 'fromMemory', { unique: false });
                    relationshipsStore.createIndex('toMemory', 'toMemory', { unique: false });
                    relationshipsStore.createIndex('type', 'type', { unique: false });
                    relationshipsStore.createIndex('strength', 'strength', { unique: false });
                }

                // Create metadata store
                if (!db.objectStoreNames.contains(this.stores.metadata)) {
                    const metadataStore = db.createObjectStore(this.stores.metadata, { keyPath: 'key' });
                }

                // Create analytics store
                if (!db.objectStoreNames.contains(this.stores.analytics)) {
                    const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'id' });
                    analyticsStore.createIndex('date', 'date', { unique: false });
                    analyticsStore.createIndex('type', 'type', { unique: false });
                }

                // Create backups store
                if (!db.objectStoreNames.contains(this.stores.backups)) {
                    const backupsStore = db.createObjectStore(this.stores.backups, { keyPath: 'id' });
                    backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    backupsStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    /**
     * Store memory in database
     */
    async storeMemory(memory) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const transaction = this.db.transaction([this.stores.memories], 'readwrite');
            const store = transaction.objectStore(this.stores.memories);
            
            await this.promisifyRequest(store.put(memory));
            
            // Update analytics
            await this.analyticsEngine.recordMemoryCreation(memory);
            
            // Create automatic relationships
            await this.relationshipEngine.createAutomaticRelationships(memory);
            
            return memory.id;
        } catch (error) {
            console.error('❌ Failed to store memory:', error);
            throw error;
        }
    }

    /**
     * Retrieve memory by ID
     */
    async getMemory(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const transaction = this.db.transaction([this.stores.memories], 'readonly');
            const store = transaction.objectStore(this.stores.memories);
            
            const memory = await this.promisifyRequest(store.get(id));
            
            if (memory) {
                // Update access statistics
                await this.updateAccessStatistics(memory);
            }
            
            return memory;
        } catch (error) {
            console.error('❌ Failed to retrieve memory:', error);
            return null;
        }
    }

    /**
     * Query memories with advanced filters
     */
    async queryMemories(query) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return await this.queryEngine.executeQuery(this.db, query);
    }

    /**
     * Update existing memory
     */
    async updateMemory(id, updates) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const existingMemory = await this.getMemory(id);
            if (!existingMemory) {
                throw new Error('Memory not found');
            }

            const updatedMemory = {
                ...existingMemory,
                ...updates,
                metadata: {
                    ...existingMemory.metadata,
                    ...updates.metadata,
                    lastModified: new Date(),
                    version: (existingMemory.metadata.version || 1) + 1
                }
            };

            await this.storeMemory(updatedMemory);
            
            // Record update in analytics
            await this.analyticsEngine.recordMemoryUpdate(updatedMemory, existingMemory);
            
            return updatedMemory;
        } catch (error) {
            console.error('❌ Failed to update memory:', error);
            throw error;
        }
    }

    /**
     * Delete memory
     */
    async deleteMemory(id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const transaction = this.db.transaction([this.stores.memories, this.stores.relationships], 'readwrite');
            const memoriesStore = transaction.objectStore(this.stores.memories);
            const relationshipsStore = transaction.objectStore(this.stores.relationships);
            
            // Delete memory
            await this.promisifyRequest(memoriesStore.delete(id));
            
            // Delete related relationships
            await this.deleteRelationships(id, relationshipsStore);
            
            // Record deletion in analytics
            await this.analyticsEngine.recordMemoryDeletion(id);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to delete memory:', error);
            return false;
        }
    }

    /**
     * Create relationship between memories
     */
    async createRelationship(fromMemoryId, toMemoryId, type, strength = 1.0, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const relationship = {
                id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fromMemory: fromMemoryId,
                toMemory: toMemoryId,
                type,
                strength,
                metadata,
                created: new Date(),
                lastAccessed: new Date(),
                accessCount: 0
            };

            const transaction = this.db.transaction([this.stores.relationships], 'readwrite');
            const store = transaction.objectStore(this.stores.relationships);
            
            await this.promisifyRequest(store.put(relationship));
            
            return relationship.id;
        } catch (error) {
            console.error('❌ Failed to create relationship:', error);
            throw error;
        }
    }

    /**
     * Get relationships for a memory
     */
    async getRelationships(memoryId, direction = 'both') {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const transaction = this.db.transaction([this.stores.relationships], 'readonly');
            const store = transaction.objectStore(this.stores.relationships);
            
            const relationships = [];

            if (direction === 'both' || direction === 'outgoing') {
                const fromIndex = store.index('fromMemory');
                const fromCursor = await this.promisifyRequest(fromIndex.openCursor(memoryId));
                await this.collectCursorResults(fromCursor, relationships);
            }

            if (direction === 'both' || direction === 'incoming') {
                const toIndex = store.index('toMemory');
                const toCursor = await this.promisifyRequest(toIndex.openCursor(memoryId));
                await this.collectCursorResults(toCursor, relationships);
            }

            return relationships;
        } catch (error) {
            console.error('❌ Failed to get relationships:', error);
            return [];
        }
    }

    /**
     * Get memory statistics
     */
    async getStatistics() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const stats = {
                totalMemories: 0,
                totalRelationships: 0,
                memoryTypes: {},
                importanceDistribution: {},
                storageSize: 0,
                oldestMemory: null,
                newestMemory: null,
                averageImportance: 0,
                compressionRatio: 0
            };

            // Count memories and analyze
            const memoriesTransaction = this.db.transaction([this.stores.memories], 'readonly');
            const memoriesStore = memoriesTransaction.objectStore(this.stores.memories);
            const memoriesCursor = memoriesStore.openCursor();

            let totalImportance = 0;
            let oldestDate = new Date();
            let newestDate = new Date(0);

            await this.promisifyRequest(memoriesCursor).then(cursor => {
                return new Promise((resolve) => {
                    const processMemory = (cursor) => {
                        if (cursor) {
                            const memory = cursor.value;
                            stats.totalMemories++;
                            
                            // Type distribution
                            stats.memoryTypes[memory.type] = (stats.memoryTypes[memory.type] || 0) + 1;
                            
                            // Importance distribution
                            const importanceRange = Math.floor(memory.importance / 2) * 2;
                            const rangeKey = `${importanceRange}-${importanceRange + 1}`;
                            stats.importanceDistribution[rangeKey] = (stats.importanceDistribution[rangeKey] || 0) + 1;
                            
                            totalImportance += memory.importance;
                            
                            // Date tracking
                            const memoryDate = new Date(memory.timestamp);
                            if (memoryDate < oldestDate) {
                                oldestDate = memoryDate;
                                stats.oldestMemory = memory.id;
                            }
                            if (memoryDate > newestDate) {
                                newestDate = memoryDate;
                                stats.newestMemory = memory.id;
                            }
                            
                            // Storage size estimation
                            stats.storageSize += JSON.stringify(memory).length;
                            
                            cursor.continue();
                        } else {
                            resolve();
                        }
                    };
                    
                    if (cursor) {
                        processMemory(cursor);
                    } else {
                        resolve();
                    }
                });
            });

            // Calculate averages
            if (stats.totalMemories > 0) {
                stats.averageImportance = totalImportance / stats.totalMemories;
            }

            // Count relationships
            const relationshipsTransaction = this.db.transaction([this.stores.relationships], 'readonly');
            const relationshipsStore = relationshipsTransaction.objectStore(this.stores.relationships);
            stats.totalRelationships = await this.promisifyRequest(relationshipsStore.count());

            return stats;
        } catch (error) {
            console.error('❌ Failed to get statistics:', error);
            return null;
        }
    }

    /**
     * Export memories to JSON
     */
    async exportMemories(options = {}) {
        const { includeRelationships = true, includeMetadata = true, format = 'json' } = options;

        try {
            const exportData = {
                version: '1.0',
                timestamp: new Date(),
                memories: [],
                relationships: [],
                metadata: {}
            };

            // Export memories
            const memoriesTransaction = this.db.transaction([this.stores.memories], 'readonly');
            const memoriesStore = memoriesTransaction.objectStore(this.stores.memories);
            const memoriesCursor = memoriesStore.openCursor();

            await this.promisifyRequest(memoriesCursor).then(cursor => {
                return new Promise((resolve) => {
                    const processMemory = (cursor) => {
                        if (cursor) {
                            exportData.memories.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve();
                        }
                    };
                    
                    if (cursor) {
                        processMemory(cursor);
                    } else {
                        resolve();
                    }
                });
            });

            // Export relationships if requested
            if (includeRelationships) {
                const relationshipsTransaction = this.db.transaction([this.stores.relationships], 'readonly');
                const relationshipsStore = relationshipsTransaction.objectStore(this.stores.relationships);
                const relationshipsCursor = relationshipsStore.openCursor();

                await this.promisifyRequest(relationshipsCursor).then(cursor => {
                    return new Promise((resolve) => {
                        const processRelationship = (cursor) => {
                            if (cursor) {
                                exportData.relationships.push(cursor.value);
                                cursor.continue();
                            } else {
                                resolve();
                            }
                        };
                        
                        if (cursor) {
                            processRelationship(cursor);
                        } else {
                            resolve();
                        }
                    });
                });
            }

            // Export metadata if requested
            if (includeMetadata) {
                exportData.metadata = await this.getStatistics();
            }

            return exportData;
        } catch (error) {
            console.error('❌ Failed to export memories:', error);
            throw error;
        }
    }

    /**
     * Import memories from JSON
     */
    async importMemories(importData, options = {}) {
        const { overwrite = false, mergeStrategy = 'skip' } = options;

        try {
            let imported = 0;
            let skipped = 0;
            let errors = 0;

            for (const memory of importData.memories) {
                try {
                    const existing = await this.getMemory(memory.id);
                    
                    if (existing && !overwrite) {
                        if (mergeStrategy === 'skip') {
                            skipped++;
                            continue;
                        } else if (mergeStrategy === 'merge') {
                            // Merge with existing memory
                            const merged = this.mergeMemories(existing, memory);
                            await this.storeMemory(merged);
                            imported++;
                        }
                    } else {
                        await this.storeMemory(memory);
                        imported++;
                    }
                } catch (error) {
                    console.error('❌ Failed to import memory:', memory.id, error);
                    errors++;
                }
            }

            // Import relationships if present
            if (importData.relationships) {
                for (const relationship of importData.relationships) {
                    try {
                        const transaction = this.db.transaction([this.stores.relationships], 'readwrite');
                        const store = transaction.objectStore(this.stores.relationships);
                        await this.promisifyRequest(store.put(relationship));
                    } catch (error) {
                        console.error('❌ Failed to import relationship:', relationship.id, error);
                    }
                }
            }

            return { imported, skipped, errors };
        } catch (error) {
            console.error('❌ Failed to import memories:', error);
            throw error;
        }
    }

    /**
     * Create backup of memory database
     */
    async createBackup(name = null) {
        try {
            const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
            const exportData = await this.exportMemories({ includeRelationships: true, includeMetadata: true });
            
            const backup = {
                id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: backupName,
                timestamp: new Date(),
                type: 'full',
                data: exportData,
                size: JSON.stringify(exportData).length,
                checksum: await this.calculateChecksum(exportData)
            };

            const transaction = this.db.transaction([this.stores.backups], 'readwrite');
            const store = transaction.objectStore(this.stores.backups);
            await this.promisifyRequest(store.put(backup));

            return backup.id;
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId, options = {}) {
        try {
            const transaction = this.db.transaction([this.stores.backups], 'readonly');
            const store = transaction.objectStore(this.stores.backups);
            const backup = await this.promisifyRequest(store.get(backupId));

            if (!backup) {
                throw new Error('Backup not found');
            }

            // Verify backup integrity
            const checksum = await this.calculateChecksum(backup.data);
            if (checksum !== backup.checksum) {
                throw new Error('Backup integrity check failed');
            }

            // Import backup data
            const result = await this.importMemories(backup.data, options);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to restore from backup:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async collectCursorResults(cursor, results) {
        return new Promise((resolve) => {
            const processCursor = (cursor) => {
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            if (cursor) {
                processCursor(cursor);
            } else {
                resolve();
            }
        });
    }

    async updateAccessStatistics(memory) {
        memory.accessCount = (memory.accessCount || 0) + 1;
        memory.lastAccessed = new Date();
        await this.storeMemory(memory);
    }

    async deleteRelationships(memoryId, store) {
        // Delete relationships where this memory is involved
        const fromIndex = store.index('fromMemory');
        const toIndex = store.index('toMemory');
        
        // Delete outgoing relationships
        const fromCursor = fromIndex.openCursor(memoryId);
        await this.promisifyRequest(fromCursor).then(cursor => {
            return new Promise((resolve) => {
                const deleteRelationship = (cursor) => {
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                
                if (cursor) {
                    deleteRelationship(cursor);
                } else {
                    resolve();
                }
            });
        });

        // Delete incoming relationships
        const toCursor = toIndex.openCursor(memoryId);
        await this.promisifyRequest(toCursor).then(cursor => {
            return new Promise((resolve) => {
                const deleteRelationship = (cursor) => {
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                
                if (cursor) {
                    deleteRelationship(cursor);
                } else {
                    resolve();
                }
            });
        });
    }

    mergeMemories(existing, incoming) {
        return {
            ...existing,
            ...incoming,
            metadata: {
                ...existing.metadata,
                ...incoming.metadata,
                mergedAt: new Date(),
                version: (existing.metadata.version || 1) + 1
            }
        };
    }

    async calculateChecksum(data) {
        const text = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    startBackgroundProcesses() {
        // Start periodic maintenance
        setInterval(() => {
            this.performMaintenance();
        }, 10 * 60 * 1000); // Every 10 minutes

        // Start periodic backup
        setInterval(() => {
            this.createBackup();
        }, 60 * 60 * 1000); // Every hour
    }

    async performMaintenance() {
        try {
            // Clean up old analytics data
            await this.analyticsEngine.cleanup();
            
            // Optimize relationships
            await this.relationshipEngine.optimize();
            
            // Update statistics
            await this.updateDatabaseStatistics();
            
            console.log('🔧 Memory database maintenance completed');
        } catch (error) {
            console.error('❌ Memory database maintenance failed:', error);
        }
    }

    async updateDatabaseStatistics() {
        const stats = await this.getStatistics();
        const transaction = this.db.transaction([this.stores.metadata], 'readwrite');
        const store = transaction.objectStore(this.stores.metadata);
        
        await this.promisifyRequest(store.put({
            key: 'database_statistics',
            value: stats,
            lastUpdated: new Date()
        }));
    }
}

/**
 * Memory Query Engine
 */
class MemoryQueryEngine {
    async executeQuery(db, query) {
        const {
            text = '',
            type = null,
            tags = [],
            importance = null,
            dateRange = null,
            limit = 50,
            offset = 0,
            sortBy = 'relevance',
            sortOrder = 'desc'
        } = query;

        const results = [];
        const transaction = db.transaction(['memories'], 'readonly');
        const store = transaction.objectStore(this.stores.memories);

        // Use appropriate index based on query
        let index = store;
        let keyRange = null;

        if (type) {
            index = store.index('type');
            keyRange = IDBKeyRange.only(type);
        } else if (importance !== null) {
            index = store.index('importance');
            keyRange = IDBKeyRange.lowerBound(importance);
        } else if (dateRange) {
            index = store.index('timestamp');
            keyRange = IDBKeyRange.bound(dateRange.start, dateRange.end);
        }

        const cursor = index.openCursor(keyRange);
        
        await this.promisifyRequest(cursor).then(cursor => {
            return new Promise((resolve) => {
                const processResult = (cursor) => {
                    if (cursor && results.length < limit + offset) {
                        const memory = cursor.value;
                        
                        if (this.matchesQuery(memory, query)) {
                            results.push(memory);
                        }
                        
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                
                if (cursor) {
                    processResult(cursor);
                } else {
                    resolve();
                }
            });
        });

        // Sort results
        this.sortResults(results, sortBy, sortOrder);

        // Apply pagination
        return results.slice(offset, offset + limit);
    }

    matchesQuery(memory, query) {
        const { text, tags, importance, dateRange } = query;

        // Text search
        if (text) {
            const searchText = JSON.stringify(memory.data).toLowerCase();
            if (!searchText.includes(text.toLowerCase())) {
                return false;
            }
        }

        // Tags filter
        if (tags.length > 0) {
            const hasAllTags = tags.every(tag => memory.tags.includes(tag));
            if (!hasAllTags) {
                return false;
            }
        }

        // Importance filter
        if (importance !== null && memory.importance < importance) {
            return false;
        }

        // Date range filter
        if (dateRange) {
            const memoryDate = new Date(memory.timestamp);
            if (memoryDate < dateRange.start || memoryDate > dateRange.end) {
                return false;
            }
        }

        return true;
    }

    sortResults(results, sortBy, sortOrder) {
        results.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'timestamp':
                    comparison = new Date(a.timestamp) - new Date(b.timestamp);
                    break;
                case 'importance':
                    comparison = a.importance - b.importance;
                    break;
                case 'accessCount':
                    comparison = (a.accessCount || 0) - (b.accessCount || 0);
                    break;
                case 'relevance':
                default:
                    comparison = (a.importance || 0) - (b.importance || 0);
                    break;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

/**
 * Memory Relationship Engine
 */
class MemoryRelationshipEngine {
    async createAutomaticRelationships(memory) {
        // Implementation for creating automatic relationships
        // based on content similarity, tags, context, etc.
    }

    async optimize() {
        // Implementation for optimizing relationships
        // Remove weak relationships, strengthen strong ones, etc.
    }
}

/**
 * Memory Analytics Engine
 */
class MemoryAnalyticsEngine {
    async recordMemoryCreation(memory) {
        // Record analytics for memory creation
    }

    async recordMemoryUpdate(updated, original) {
        // Record analytics for memory updates
    }

    async recordMemoryDeletion(memoryId) {
        // Record analytics for memory deletion
    }

    async cleanup() {
        // Clean up old analytics data
    }
}

/**
 * Memory Backup Engine
 */
class MemoryBackupEngine {
    async createIncrementalBackup() {
        // Create incremental backup
    }

    async scheduleBackups() {
        // Schedule automatic backups
    }
}

// Export for use in other modules
window.MemoryDatabase = MemoryDatabase;