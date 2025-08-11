/**
 * Persistence Module
 * Handles data storage, user authentication, and cloud synchronization
 */

class PersistenceManager {
    constructor() {
        this.storageKey = 'talktoapp_data';
        this.userKey = 'talktoapp_user';
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.user = null;
        this.cloudStorage = null;
        this.init();
    }

    async init() {
        // Load user data
        this.loadUser();
        
        // Setup online/offline detection
        this.setupNetworkDetection();
        
        // Initialize cloud storage if user is authenticated
        if (this.user) {
            await this.initCloudStorage();
        }
        
        // Process any pending sync operations
        this.processSyncQueue();
        
        console.log('Persistence Manager initialized');
    }

    // User Management
    loadUser() {
        const userData = localStorage.getItem(this.userKey);
        if (userData) {
            this.user = JSON.parse(userData);
        }
    }

    async authenticateUser(email, password) {
        try {
            // Simulate authentication
            const user = {
                id: this.generateUserId(),
                email: email,
                name: email.split('@')[0],
                avatar: this.generateAvatar(email),
                created: new Date(),
                lastLogin: new Date(),
                preferences: this.getDefaultPreferences(),
                subscription: 'free'
            };

            this.user = user;
            this.saveUser();
            
            // Initialize cloud storage
            await this.initCloudStorage();
            
            return { success: true, user };
        } catch (error) {
            console.error('Authentication failed:', error);
            return { success: false, error: error.message };
        }
    }

    async registerUser(email, password, name) {
        try {
            // Simulate user registration
            const user = {
                id: this.generateUserId(),
                email: email,
                name: name || email.split('@')[0],
                avatar: this.generateAvatar(email),
                created: new Date(),
                lastLogin: new Date(),
                preferences: this.getDefaultPreferences(),
                subscription: 'free',
                verified: false
            };

            this.user = user;
            this.saveUser();
            
            // Send verification email (simulated)
            await this.sendVerificationEmail(email);
            
            return { success: true, user };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.user = null;
        localStorage.removeItem(this.userKey);
        this.cloudStorage = null;
        
        // Clear sensitive data
        this.clearSensitiveData();
    }

    saveUser() {
        if (this.user) {
            localStorage.setItem(this.userKey, JSON.stringify(this.user));
        }
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAvatar(email) {
        // Generate a simple avatar based on email
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8'];
        const colorIndex = email.charCodeAt(0) % colors.length;
        const initial = email.charAt(0).toUpperCase();
        
        return {
            color: colors[colorIndex],
            initial: initial,
            url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="50" fill="${colors[colorIndex]}"/><text x="50" y="65" text-anchor="middle" fill="white" font-size="40" font-weight="bold">${initial}</text></svg>`
        };
    }

    getDefaultPreferences() {
        return {
            theme: 'light',
            language: 'en',
            notifications: true,
            autoSave: true,
            cloudSync: true,
            analytics: false,
            tutorials: true
        };
    }

    async sendVerificationEmail(email) {
        // Simulate sending verification email
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Verification email sent to ${email}`);
                resolve();
            }, 1000);
        });
    }

    clearSensitiveData() {
        // Clear any sensitive cached data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('talktoapp_temp_') || key.startsWith('talktoapp_cache_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // App Data Management
    async saveApp(app) {
        try {
            // Save locally first
            const apps = this.getLocalApps();
            const existingIndex = apps.findIndex(a => a.id === app.id);
            
            if (existingIndex >= 0) {
                apps[existingIndex] = { ...app, updated: new Date() };
            } else {
                apps.push({ ...app, created: new Date() });
            }
            
            this.saveLocalApps(apps);
            
            // Queue for cloud sync if user is authenticated
            if (this.user && this.user.preferences.cloudSync) {
                this.queueForSync('save', app);
            }
            
            return { success: true, app };
        } catch (error) {
            console.error('Failed to save app:', error);
            return { success: false, error: error.message };
        }
    }

    async loadApp(appId) {
        try {
            // Try local storage first
            const apps = this.getLocalApps();
            let app = apps.find(a => a.id === appId);
            
            // If not found locally and user is authenticated, try cloud
            if (!app && this.user && this.cloudStorage) {
                app = await this.loadFromCloud(appId);
                if (app) {
                    // Cache locally
                    apps.push(app);
                    this.saveLocalApps(apps);
                }
            }
            
            return app;
        } catch (error) {
            console.error('Failed to load app:', error);
            return null;
        }
    }

    async deleteApp(appId) {
        try {
            // Delete locally
            let apps = this.getLocalApps();
            apps = apps.filter(a => a.id !== appId);
            this.saveLocalApps(apps);
            
            // Queue for cloud sync
            if (this.user && this.user.preferences.cloudSync) {
                this.queueForSync('delete', { id: appId });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Failed to delete app:', error);
            return { success: false, error: error.message };
        }
    }

    getAllApps() {
        return this.getLocalApps();
    }

    getLocalApps() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveLocalApps(apps) {
        localStorage.setItem(this.storageKey, JSON.stringify(apps));
    }

    // Cloud Storage Management
    async initCloudStorage() {
        if (!this.user) return;
        
        try {
            // Initialize cloud storage connection
            this.cloudStorage = {
                connected: true,
                provider: 'talktoapp-cloud',
                endpoint: 'https://api.talktoapp.com/v1',
                userId: this.user.id
            };
            
            // Sync local data to cloud
            await this.syncToCloud();
            
            console.log('Cloud storage initialized');
        } catch (error) {
            console.error('Failed to initialize cloud storage:', error);
            this.cloudStorage = null;
        }
    }

    async syncToCloud() {
        if (!this.cloudStorage || !this.isOnline) return;
        
        try {
            const localApps = this.getLocalApps();
            const cloudApps = await this.getCloudApps();
            
            // Merge local and cloud data
            const mergedApps = this.mergeAppData(localApps, cloudApps);
            
            // Update both local and cloud
            this.saveLocalApps(mergedApps);
            await this.saveToCloud(mergedApps);
            
            console.log('Data synced to cloud');
        } catch (error) {
            console.error('Cloud sync failed:', error);
        }
    }

    async getCloudApps() {
        // Simulate cloud API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return simulated cloud data
                resolve([]);
            }, 1000);
        });
    }

    async saveToCloud(apps) {
        // Simulate saving to cloud
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Saved ${apps.length} apps to cloud`);
                resolve();
            }, 1500);
        });
    }

    async loadFromCloud(appId) {
        // Simulate loading from cloud
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null); // App not found in cloud
            }, 1000);
        });
    }

    mergeAppData(localApps, cloudApps) {
        const merged = new Map();
        
        // Add local apps
        localApps.forEach(app => {
            merged.set(app.id, app);
        });
        
        // Merge cloud apps (cloud takes precedence if newer)
        cloudApps.forEach(cloudApp => {
            const localApp = merged.get(cloudApp.id);
            if (!localApp || new Date(cloudApp.updated) > new Date(localApp.updated)) {
                merged.set(cloudApp.id, cloudApp);
            }
        });
        
        return Array.from(merged.values());
    }

    // Sync Queue Management
    queueForSync(operation, data) {
        this.syncQueue.push({
            id: Date.now(),
            operation,
            data,
            timestamp: new Date(),
            retries: 0
        });
        
        // Process queue if online
        if (this.isOnline) {
            this.processSyncQueue();
        }
    }

    async processSyncQueue() {
        if (!this.isOnline || !this.cloudStorage || this.syncQueue.length === 0) {
            return;
        }
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await this.processSyncItem(item);
            } catch (error) {
                console.error('Sync item failed:', error);
                
                // Retry logic
                if (item.retries < 3) {
                    item.retries++;
                    this.syncQueue.push(item);
                }
            }
        }
    }

    async processSyncItem(item) {
        switch (item.operation) {
            case 'save':
                await this.syncAppToCloud(item.data);
                break;
            case 'delete':
                await this.deleteFromCloud(item.data.id);
                break;
            default:
                console.warn('Unknown sync operation:', item.operation);
        }
    }

    async syncAppToCloud(app) {
        // Simulate syncing app to cloud
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Synced app ${app.id} to cloud`);
                resolve();
            }, 1000);
        });
    }

    async deleteFromCloud(appId) {
        // Simulate deleting app from cloud
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Deleted app ${appId} from cloud`);
                resolve();
            }, 1000);
        });
    }

    // Network Detection
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost - working offline');
        });
    }

    // Export/Import Functionality
    async exportUserData() {
        try {
            const userData = {
                user: this.user,
                apps: this.getLocalApps(),
                preferences: this.user?.preferences || {},
                exported: new Date(),
                version: '1.0.0'
            };
            
            const dataBlob = new Blob([JSON.stringify(userData, null, 2)], {
                type: 'application/json'
            });
            
            return {
                success: true,
                blob: dataBlob,
                filename: `talktoapp-export-${new Date().toISOString().split('T')[0]}.json`
            };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    async importUserData(file) {
        try {
            const text = await file.text();
            const userData = JSON.parse(text);
            
            // Validate import data
            if (!this.validateImportData(userData)) {
                throw new Error('Invalid import data format');
            }
            
            // Merge with existing data
            const existingApps = this.getLocalApps();
            const importedApps = userData.apps || [];
            
            // Resolve conflicts (imported data takes precedence)
            const mergedApps = this.mergeImportedApps(existingApps, importedApps);
            
            // Save merged data
            this.saveLocalApps(mergedApps);
            
            // Update user preferences if provided
            if (userData.preferences && this.user) {
                this.user.preferences = { ...this.user.preferences, ...userData.preferences };
                this.saveUser();
            }
            
            return {
                success: true,
                imported: {
                    apps: importedApps.length,
                    preferences: userData.preferences ? Object.keys(userData.preferences).length : 0
                }
            };
        } catch (error) {
            console.error('Import failed:', error);
            return { success: false, error: error.message };
        }
    }

    validateImportData(data) {
        return data && 
               typeof data === 'object' && 
               Array.isArray(data.apps) &&
               data.version;
    }

    mergeImportedApps(existing, imported) {
        const merged = new Map();
        
        // Add existing apps
        existing.forEach(app => {
            merged.set(app.id, app);
        });
        
        // Add imported apps (they take precedence)
        imported.forEach(app => {
            // Generate new ID if conflict exists
            if (merged.has(app.id)) {
                app.id = this.generateAppId();
                app.name += ' (Imported)';
            }
            merged.set(app.id, app);
        });
        
        return Array.from(merged.values());
    }

    generateAppId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Analytics and Usage Tracking
    trackEvent(eventName, properties = {}) {
        if (!this.user?.preferences?.analytics) return;
        
        const event = {
            name: eventName,
            properties: {
                ...properties,
                userId: this.user?.id,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };
        
        // Store locally for batch sending
        this.storeAnalyticsEvent(event);
        
        // Send to analytics service (simulated)
        this.sendAnalytics(event);
    }

    storeAnalyticsEvent(event) {
        const events = JSON.parse(localStorage.getItem('talktoapp_analytics') || '[]');
        events.push(event);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('talktoapp_analytics', JSON.stringify(events));
    }

    async sendAnalytics(event) {
        // Simulate sending analytics
        if (this.isOnline) {
            console.log('Analytics event:', event.name, event.properties);
        }
    }

    // Backup and Recovery
    async createBackup() {
        try {
            const backup = {
                user: this.user,
                apps: this.getLocalApps(),
                preferences: this.user?.preferences || {},
                analytics: JSON.parse(localStorage.getItem('talktoapp_analytics') || '[]'),
                created: new Date(),
                version: '1.0.0',
                type: 'full-backup'
            };
            
            // Compress backup data
            const compressedBackup = this.compressData(backup);
            
            return {
                success: true,
                backup: compressedBackup,
                size: JSON.stringify(backup).length
            };
        } catch (error) {
            console.error('Backup creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async restoreFromBackup(backupData) {
        try {
            // Decompress if needed
            const backup = this.decompressData(backupData);
            
            // Validate backup
            if (!this.validateBackup(backup)) {
                throw new Error('Invalid backup data');
            }
            
            // Create restore point
            await this.createRestorePoint();
            
            // Restore data
            if (backup.apps) {
                this.saveLocalApps(backup.apps);
            }
            
            if (backup.user && backup.preferences) {
                this.user = backup.user;
                this.user.preferences = backup.preferences;
                this.saveUser();
            }
            
            return { success: true, restored: new Date() };
        } catch (error) {
            console.error('Restore failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createRestorePoint() {
        const restorePoint = {
            user: this.user,
            apps: this.getLocalApps(),
            created: new Date(),
            type: 'restore-point'
        };
        
        localStorage.setItem('talktoapp_restore_point', JSON.stringify(restorePoint));
    }

    compressData(data) {
        // Simple compression simulation
        return JSON.stringify(data);
    }

    decompressData(data) {
        // Simple decompression simulation
        return typeof data === 'string' ? JSON.parse(data) : data;
    }

    validateBackup(backup) {
        return backup && 
               backup.version && 
               backup.type === 'full-backup' &&
               Array.isArray(backup.apps);
    }

    // Utility Methods
    getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('talktoapp_')) {
                totalSize += localStorage[key].length;
            }
        }
        
        return {
            used: totalSize,
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            available: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
            availableMB: ((5 * 1024 * 1024 - totalSize) / 1024 / 1024).toFixed(2)
        };
    }

    clearAllData() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('talktoapp_'));
        keys.forEach(key => localStorage.removeItem(key));
        
        this.user = null;
        this.cloudStorage = null;
        this.syncQueue = [];
    }

    getSystemInfo() {
        return {
            online: this.isOnline,
            user: this.user ? {
                id: this.user.id,
                email: this.user.email,
                name: this.user.name,
                subscription: this.user.subscription
            } : null,
            cloudStorage: this.cloudStorage ? {
                connected: this.cloudStorage.connected,
                provider: this.cloudStorage.provider
            } : null,
            storage: this.getStorageUsage(),
            syncQueue: this.syncQueue.length,
            version: '1.0.0'
        };
    }
}

// Initialize Persistence Manager
window.persistenceManager = new PersistenceManager();

// Global helper functions
window.saveApp = async (app) => {
    return await window.persistenceManager.saveApp(app);
};

window.loadApp = async (appId) => {
    return await window.persistenceManager.loadApp(appId);
};

window.deleteApp = async (appId) => {
    return await window.persistenceManager.deleteApp(appId);
};

window.getAllApps = () => {
    return window.persistenceManager.getAllApps();
};

window.exportUserData = async () => {
    return await window.persistenceManager.exportUserData();
};

window.importUserData = async (file) => {
    return await window.persistenceManager.importUserData(file);
};

window.trackEvent = (eventName, properties) => {
    window.persistenceManager.trackEvent(eventName, properties);
};