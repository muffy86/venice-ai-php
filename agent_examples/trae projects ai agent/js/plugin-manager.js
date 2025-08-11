/**
 * Plugin Management System for AI Agent System
 * Provides dynamic plugin loading, lifecycle management, and API access
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.apiRegistry = new Map();
        this.dependencies = new Map();
        this.loadOrder = [];
        this.isInitialized = false;
        
        this.eventBus = new EventBus();
        this.sandboxManager = new SandboxManager();
        this.permissionManager = new PermissionManager();
        
        this.setupCoreHooks();
        this.setupCoreAPI();
    }

    async init() {
        try {
            await this.sandboxManager.init();
            await this.loadCorePlugins();
            await this.loadUserPlugins();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('PluginManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PluginManager:', error);
            throw error;
        }
    }

    // Plugin Loading and Management
    async loadPlugin(pluginData, options = {}) {
        try {
            console.log(`Loading plugin: ${pluginData.id}`, { options, permissions: pluginData.permissions });
            
            const plugin = await this.createPlugin(pluginData, options);
            
            console.log(`Created plugin: ${plugin.id}`, { core: plugin.core, permissions: plugin.permissions });
            
            // Check dependencies
            if (!await this.checkDependencies(plugin)) {
                throw new Error(`Dependencies not met for plugin ${plugin.id}`);
            }

            // Check permissions
            if (!this.permissionManager.checkPermissions(plugin)) {
                throw new Error(`Insufficient permissions for plugin ${plugin.id}`);
            }

            // Register plugin BEFORE initializing sandbox
            this.plugins.set(plugin.id, plugin);
            console.log(`Registered plugin: ${plugin.id}`, this.plugins.has(plugin.id));

            // Initialize plugin in sandbox
            await this.sandboxManager.initializePlugin(plugin);
            
            this.updateLoadOrder();
            
            // Call lifecycle hooks
            await this.callHook('plugin:loaded', plugin);
            
            this.emit('pluginLoaded', { plugin });
            console.log(`Plugin loaded: ${plugin.id}`);
            
            return plugin;
        } catch (error) {
            console.error(`Failed to load plugin:`, error);
            throw error;
        }
    }

    async unloadPlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin not found: ${pluginId}`);
            }

            // Check if other plugins depend on this one
            const dependents = this.getDependents(pluginId);
            if (dependents.length > 0) {
                throw new Error(`Cannot unload plugin ${pluginId}: required by ${dependents.join(', ')}`);
            }

            // Call lifecycle hooks
            await this.callHook('plugin:beforeUnload', plugin);
            
            // Cleanup plugin
            await this.sandboxManager.cleanupPlugin(plugin);
            
            // Remove from registry
            this.plugins.delete(pluginId);
            this.updateLoadOrder();
            
            // Call lifecycle hooks
            await this.callHook('plugin:unloaded', plugin);
            
            this.emit('pluginUnloaded', { pluginId });
            console.log(`Plugin unloaded: ${pluginId}`);
            
            return true;
        } catch (error) {
            console.error(`Failed to unload plugin ${pluginId}:`, error);
            throw error;
        }
    }

    async reloadPlugin(pluginId) {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin not found: ${pluginId}`);
            }

            const pluginData = plugin.originalData;
            await this.unloadPlugin(pluginId);
            return await this.loadPlugin(pluginData);
        } catch (error) {
            console.error(`Failed to reload plugin ${pluginId}:`, error);
            throw error;
        }
    }

    async createPlugin(pluginData, options = {}) {
        const plugin = {
            id: pluginData.id || this.generatePluginId(),
            name: pluginData.name || 'Unnamed Plugin',
            version: pluginData.version || '1.0.0',
            description: pluginData.description || '',
            author: pluginData.author || 'Unknown',
            
            // Plugin code and configuration
            code: pluginData.code || '',
            manifest: pluginData.manifest || {},
            config: { ...pluginData.config, ...options.config },
            
            // Dependencies and permissions
            dependencies: pluginData.dependencies || [],
            permissions: pluginData.permissions || [],
            
            // Core plugin flag
            core: options.core || false,
            
            // Runtime state
            status: 'loading',
            instance: null,
            sandbox: null,
            loadTime: Date.now(),
            
            // Original data for reloading
            originalData: pluginData,
            
            // Plugin API
            api: new PluginAPI(this, pluginData.id)
        };

        return plugin;
    }

    // Hook System
    registerHook(name, callback, priority = 10) {
        if (!this.hooks.has(name)) {
            this.hooks.set(name, []);
        }
        
        this.hooks.get(name).push({ callback, priority });
        this.hooks.get(name).sort((a, b) => a.priority - b.priority);
    }

    unregisterHook(name, callback) {
        if (this.hooks.has(name)) {
            const hooks = this.hooks.get(name);
            const index = hooks.findIndex(hook => hook.callback === callback);
            if (index > -1) {
                hooks.splice(index, 1);
            }
        }
    }

    async callHook(name, ...args) {
        if (!this.hooks.has(name)) {
            return [];
        }

        const results = [];
        const hooks = this.hooks.get(name);
        
        for (const hook of hooks) {
            try {
                const result = await hook.callback(...args);
                results.push(result);
            } catch (error) {
                console.error(`Hook ${name} failed:`, error);
                results.push({ error });
            }
        }
        
        return results;
    }

    // Alias for callHook for backward compatibility
    async triggerHook(name, ...args) {
        return await this.callHook(name, ...args);
    }

    // API Registry
    registerAPI(name, api) {
        this.apiRegistry.set(name, api);
        this.emit('apiRegistered', { name, api });
    }

    unregisterAPI(name) {
        this.apiRegistry.delete(name);
        this.emit('apiUnregistered', { name });
    }

    getAPI(name) {
        return this.apiRegistry.get(name);
    }

    // Dependency Management
    async checkDependencies(plugin) {
        for (const dep of plugin.dependencies) {
            if (typeof dep === 'string') {
                // Simple plugin dependency
                if (!this.plugins.has(dep)) {
                    return false;
                }
            } else if (typeof dep === 'object') {
                // Complex dependency with version requirements
                const depPlugin = this.plugins.get(dep.id);
                if (!depPlugin) {
                    return false;
                }
                
                if (dep.version && !this.checkVersion(depPlugin.version, dep.version)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    getDependents(pluginId) {
        const dependents = [];
        
        for (const [id, plugin] of this.plugins) {
            if (plugin.dependencies.includes(pluginId)) {
                dependents.push(id);
            }
        }
        
        return dependents;
    }

    updateLoadOrder() {
        // Topological sort based on dependencies
        const visited = new Set();
        const temp = new Set();
        const order = [];
        
        const visit = (pluginId) => {
            if (temp.has(pluginId)) {
                throw new Error(`Circular dependency detected: ${pluginId}`);
            }
            
            if (!visited.has(pluginId)) {
                temp.add(pluginId);
                
                const plugin = this.plugins.get(pluginId);
                if (plugin) {
                    for (const dep of plugin.dependencies) {
                        const depId = typeof dep === 'string' ? dep : dep.id;
                        visit(depId);
                    }
                }
                
                temp.delete(pluginId);
                visited.add(pluginId);
                order.push(pluginId);
            }
        };
        
        for (const pluginId of this.plugins.keys()) {
            visit(pluginId);
        }
        
        this.loadOrder = order;
    }

    // Core Plugin Loading
    async loadCorePlugins() {
        const corePlugins = [
            {
                id: 'core.ui',
                name: 'UI Extensions',
                code: this.getCoreUIPlugin(),
                permissions: ['ui.modify', 'ui.addMenuItem', 'ui.showNotification', 'ui.addTab', 'dom.access']
            },
            {
                id: 'core.agent',
                name: 'Agent Extensions',
                code: this.getCoreAgentPlugin(),
                permissions: ['agent.create', 'agent.modify']
            },
            {
                id: 'core.data',
                name: 'Data Extensions',
                code: this.getCoreDataPlugin(),
                permissions: ['data.read', 'data.write']
            }
        ];

        for (const pluginData of corePlugins) {
            try {
                await this.loadPlugin(pluginData, { core: true });
            } catch (error) {
                console.error(`Failed to load core plugin ${pluginData.id}:`, error);
            }
        }
    }

    async loadUserPlugins() {
        try {
            const savedPlugins = localStorage.getItem('userPlugins');
            if (savedPlugins) {
                const plugins = JSON.parse(savedPlugins);
                
                for (const pluginData of plugins) {
                    try {
                        await this.loadPlugin(pluginData);
                    } catch (error) {
                        console.error(`Failed to load user plugin ${pluginData.id}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load user plugins:', error);
        }
    }

    // Plugin Management
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }

    getAllPlugins() {
        return Array.from(this.plugins.values());
    }

    getPluginsByStatus(status) {
        return this.getAllPlugins().filter(plugin => plugin.status === status);
    }

    async enablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin && plugin.status === 'disabled') {
            plugin.status = 'enabled';
            await this.callHook('plugin:enabled', plugin);
            this.emit('pluginEnabled', { pluginId });
        }
    }

    async disablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin && plugin.status === 'enabled') {
            plugin.status = 'disabled';
            await this.callHook('plugin:disabled', plugin);
            this.emit('pluginDisabled', { pluginId });
        }
    }

    // Core Hooks Setup
    setupCoreHooks() {
        // UI hooks
        this.registerHook('ui:beforeRender', async (component) => {
            console.log('UI component rendering:', component);
        });

        this.registerHook('ui:afterRender', async (component) => {
            console.log('UI component rendered:', component);
        });

        // Agent hooks
        this.registerHook('agent:beforeSpawn', async (agentData) => {
            console.log('Agent spawning:', agentData);
        });

        this.registerHook('agent:afterSpawn', async (agent) => {
            console.log('Agent spawned:', agent);
        });

        // Data hooks
        this.registerHook('data:beforeSave', async (key, data) => {
            console.log('Data saving:', key);
        });

        this.registerHook('data:afterSave', async (key, data) => {
            console.log('Data saved:', key);
        });
    }

    // Core API Setup
    setupCoreAPI() {
        // UI API
        this.registerAPI('ui', {
            addMenuItem: (item) => {
                if (window.uiManager) {
                    window.uiManager.addMenuItem(item);
                }
            },
            showNotification: (message, type) => {
                if (window.uiManager) {
                    window.uiManager.showNotification(message, type);
                }
            },
            addTab: (tab) => {
                if (window.uiManager) {
                    window.uiManager.addTab(tab);
                }
            }
        });

        // Agent API
        this.registerAPI('agent', {
            spawn: (agentData) => {
                if (window.agentManager) {
                    return window.agentManager.spawnAgent(agentData);
                }
            },
            getAll: () => {
                if (window.agentManager) {
                    return window.agentManager.getAllAgents();
                }
                return [];
            },
            remove: (agentId) => {
                if (window.agentManager) {
                    return window.agentManager.removeAgent(agentId);
                }
            }
        });

        // Data API
        this.registerAPI('data', {
            save: async (key, data, options) => {
                if (window.dataManager) {
                    return await window.dataManager.save(key, data, options);
                }
            },
            load: async (key, options) => {
                if (window.dataManager) {
                    return await window.dataManager.load(key, options);
                }
            },
            delete: async (key, options) => {
                if (window.dataManager) {
                    return await window.dataManager.delete(key, options);
                }
            }
        });
    }

    // Core Plugin Code
    getCoreUIPlugin() {
        return `
            // Core UI Plugin
            class CoreUIPlugin {
                constructor(api) {
                    this.api = api;
                }
                
                init() {
                    console.log('Core UI Plugin initialized');
                    
                    // Add plugin management UI
                    this.api.ui.addMenuItem({
                        id: 'plugins',
                        label: 'Plugins',
                        action: () => this.showPluginManager()
                    });
                }
                
                showPluginManager() {
                    // Implementation for plugin manager UI
                    this.api.ui.showNotification('Plugin Manager opened', 'info');
                }
            }
            
            return new CoreUIPlugin(api);
        `;
    }

    getCoreAgentPlugin() {
        return `
            // Core Agent Plugin
            class CoreAgentPlugin {
                constructor(api) {
                    this.api = api;
                }
                
                init() {
                    console.log('Core Agent Plugin initialized');
                    
                    // Add agent templates
                    this.addAgentTemplates();
                }
                
                addAgentTemplates() {
                    // Add common agent templates
                    const templates = [
                        {
                            id: 'researcher',
                            name: 'Research Agent',
                            description: 'Specialized in research tasks',
                            capabilities: ['research', 'analysis', 'reporting']
                        },
                        {
                            id: 'coder',
                            name: 'Coding Agent',
                            description: 'Specialized in coding tasks',
                            capabilities: ['coding', 'debugging', 'testing']
                        }
                    ];
                    
                    // Register templates (implementation depends on agent system)
                }
            }
            
            return new CoreAgentPlugin(api);
        `;
    }

    getCoreDataPlugin() {
        return `
            // Core Data Plugin
            class CoreDataPlugin {
                constructor(api) {
                    this.api = api;
                }
                
                init() {
                    console.log('Core Data Plugin initialized');
                    
                    // Add data validation rules
                    this.setupValidation();
                }
                
                setupValidation() {
                    // Add common validation rules
                    console.log('Data validation rules setup');
                }
            }
            
            return new CoreDataPlugin(api);
        `;
    }

    // Utility Methods
    generatePluginId() {
        return `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    checkVersion(current, required) {
        // Simple version checking - could be enhanced with semver
        return current >= required;
    }

    // Event System
    on(event, callback) {
        this.eventBus.on(event, callback);
    }

    off(event, callback) {
        this.eventBus.off(event, callback);
    }

    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    // Statistics and Monitoring
    getStats() {
        return {
            totalPlugins: this.plugins.size,
            enabledPlugins: this.getPluginsByStatus('enabled').length,
            disabledPlugins: this.getPluginsByStatus('disabled').length,
            loadOrder: this.loadOrder,
            hooks: Array.from(this.hooks.keys()),
            apis: Array.from(this.apiRegistry.keys())
        };
    }

    // Cleanup
    async cleanup() {
        try {
            // Unload all plugins
            for (const pluginId of Array.from(this.plugins.keys())) {
                await this.unloadPlugin(pluginId);
            }

            // Cleanup managers
            await this.sandboxManager.cleanup();
            this.eventBus.cleanup();

            this.isInitialized = false;
            console.log('PluginManager cleanup completed');
        } catch (error) {
            console.error('Failed to cleanup PluginManager:', error);
            throw error;
        }
    }
}

// Plugin API - provides safe access to system functionality
class PluginAPI {
    constructor(pluginManager, pluginId) {
        this.pluginManager = pluginManager;
        this.pluginId = pluginId;
        
        // Create API proxies
        this.ui = this.createAPIProxy('ui');
        this.agent = this.createAPIProxy('agent');
        this.data = this.createAPIProxy('data');
        this.hooks = this.createHooksProxy();
    }

    createAPIProxy(apiName) {
        const api = this.pluginManager.getAPI(apiName);
        if (!api) {
            return {};
        }

        // Create proxy to check permissions
        return new Proxy(api, {
            get: (target, prop) => {
                const permission = `${apiName}.${prop}`;
                if (!this.checkPermission(permission)) {
                    throw new Error(`Permission denied: ${permission}`);
                }
                return target[prop];
            }
        });
    }

    createHooksProxy() {
        return {
            register: (name, callback, priority) => {
                this.pluginManager.registerHook(name, callback, priority);
            },
            unregister: (name, callback) => {
                this.pluginManager.unregisterHook(name, callback);
            },
            call: (name, ...args) => {
                return this.pluginManager.callHook(name, ...args);
            }
        };
    }

    checkPermission(permission) {
        const plugin = this.pluginManager.getPlugin(this.pluginId);
        
        // Allow core plugins to bypass permission checks
        if (plugin && plugin.core) {
            return true;
        }
        
        // Debug logging
        if (!plugin) {
            console.warn(`Plugin ${this.pluginId} not found for permission check`);
            return false;
        }
        
        if (!plugin.permissions) {
            console.warn(`Plugin ${this.pluginId} has no permissions defined`);
            return false;
        }
        
        const hasPermission = plugin.permissions.includes(permission);
        if (!hasPermission) {
            console.warn(`Plugin ${this.pluginId} missing permission: ${permission}. Has: ${plugin.permissions.join(', ')}`);
        }
        
        return hasPermission;
    }
}

// Event Bus for plugin communication
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${event}:`, error);
                }
            });
        }
    }

    cleanup() {
        this.listeners.clear();
    }
}

// Sandbox Manager - provides isolated execution environment
class SandboxManager {
    constructor() {
        this.sandboxes = new Map();
    }

    async init() {
        console.log('SandboxManager initialized');
    }

    async initializePlugin(plugin) {
        try {
            // Create sandbox environment
            const sandbox = this.createSandbox(plugin);
            
            // Execute plugin code in sandbox
            const instance = sandbox.execute(plugin.code);
            
            // Initialize plugin instance
            if (instance && typeof instance.init === 'function') {
                await instance.init();
            }

            plugin.sandbox = sandbox;
            plugin.instance = instance;
            plugin.status = 'enabled';
            
            this.sandboxes.set(plugin.id, sandbox);
        } catch (error) {
            plugin.status = 'error';
            throw error;
        }
    }

    createSandbox(plugin) {
        return {
            execute: (code) => {
                try {
                    // Create safe execution context
                    const context = {
                        api: plugin.api,
                        console: {
                            log: (...args) => console.log(`[${plugin.id}]`, ...args),
                            error: (...args) => console.error(`[${plugin.id}]`, ...args),
                            warn: (...args) => console.warn(`[${plugin.id}]`, ...args)
                        }
                    };

                    // Execute code with limited context
                    const func = new Function('api', 'console', code);
                    return func(context.api, context.console);
                } catch (error) {
                    console.error(`Sandbox execution error for ${plugin.id}:`, error);
                    throw error;
                }
            }
        };
    }

    async cleanupPlugin(plugin) {
        if (plugin.instance && typeof plugin.instance.cleanup === 'function') {
            await plugin.instance.cleanup();
        }
        
        this.sandboxes.delete(plugin.id);
    }

    async cleanup() {
        this.sandboxes.clear();
    }
}

// Permission Manager - handles plugin permissions
class PermissionManager {
    constructor() {
        this.permissions = new Set([
            'ui.modify', 'ui.read', 'ui.addMenuItem', 'ui.showNotification', 'ui.addTab',
            'dom.access', 'dom.modify',
            'agent.create', 'agent.modify', 'agent.read',
            'data.read', 'data.write', 'data.delete',
            'network.request', 'network.websocket',
            'storage.read', 'storage.write',
            'system.info', 'system.modify'
        ]);
    }

    checkPermissions(plugin) {
        for (const permission of plugin.permissions) {
            if (!this.permissions.has(permission)) {
                console.warn(`Unknown permission: ${permission}`);
                return false;
            }
        }
        return true;
    }

    hasPermission(pluginId, permission) {
        // Implementation for runtime permission checking
        return true; // Simplified for now
    }
}

// Export to global scope
window.PluginManager = PluginManager;
window.PluginAPI = PluginAPI;