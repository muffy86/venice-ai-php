// Main Application Initialization
class AIAgentWorkforce {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.components = {
            agentManager: null,
            uiManager: null,
            visionProcessor: null,
            researchEngine: null,
            automationEngine: null
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing AI Agent Workforce System v' + this.version);
            
            // Initialize enhanced systems first
            await this.initializeEnhancedSystems();
            
            // Check browser compatibility
            this.checkCompatibility();
            
            // Initialize configuration
            await this.initializeConfig();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup global event handlers
            this.setupGlobalHandlers();
            
            // Start the system
            await this.startSystem();
            
            this.initialized = true;
            console.log('✅ AI Agent Workforce System initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
            // Trigger initialization complete hook
            if (this.components.pluginManager) {
                await this.components.pluginManager.triggerHook('app:ready');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize AI Agent Workforce System:', error);
            this.showErrorMessage('System initialization failed: ' + error.message);
        }
    }

    async initializeEnhancedSystems() {
        console.log('🔧 Initializing enhanced systems...');
        
        try {
            // Initialize error handling first
            this.components.errorHandler = new ErrorHandler();
            this.components.performanceMonitor = new PerformanceMonitor();
            
            // Initialize analytics
            this.components.analytics = new AnalyticsManager();
            this.components.analytics.loadPersistedAnalytics();
            
            // Initialize notifications
            this.components.notifications = new NotificationManager();
            window.notificationManager = this.components.notifications;
            
            // Initialize data management
            this.components.dataManager = new DataManager();
            await this.components.dataManager.init();
            window.dataManager = this.components.dataManager;
            
            // Initialize cache
            this.components.cache = new CacheManager();
            await this.components.cache.init();
            window.cacheManager = this.components.cache;
            
            // Initialize plugin system
            this.components.pluginManager = new PluginManager();
            await this.components.pluginManager.init();
            window.pluginManager = this.components.pluginManager;
            
            // Initialize theme manager
            this.components.themeManager = new ThemeManager();
            
            // Setup error handling callbacks
            this.components.errorHandler.onError('all', (error) => {
                this.components.analytics.trackEvent('error', error);
                this.components.notifications.show(
                    `System Error: ${error.message}`,
                    'error',
                    { duration: 10000 }
                );
            });
            
            // Setup data manager event listeners
            this.components.dataManager.on('dataSaved', (data) => {
                this.components.analytics.trackEvent('data:saved', { key: data.key });
            });
            
            this.components.dataManager.on('error', (error) => {
                this.components.errorHandler.handleError(error.error, 'DataManager');
            });
            
            // Setup plugin manager event listeners
            this.components.pluginManager.on('pluginLoaded', (data) => {
                this.components.analytics.trackEvent('plugin:loaded', { pluginId: data.plugin.id });
                this.components.notifications.show(
                    `Plugin loaded: ${data.plugin.name}`,
                    'success'
                );
            });
            
            this.components.pluginManager.on('pluginUnloaded', (data) => {
                this.components.analytics.trackEvent('plugin:unloaded', { pluginId: data.pluginId });
                this.components.notifications.show(
                    `Plugin unloaded`,
                    'info'
                );
            });
            
            console.log('✅ Enhanced systems initialized');
        } catch (error) {
            console.error('❌ Enhanced systems initialization failed:', error);
            throw error;
        }
    }

    checkCompatibility() {
        const requirements = {
            'Web Workers': typeof Worker !== 'undefined',
            'Local Storage': typeof Storage !== 'undefined',
            'Fetch API': typeof fetch !== 'undefined',
            'WebRTC': typeof RTCPeerConnection !== 'undefined',
            'Canvas': typeof HTMLCanvasElement !== 'undefined',
            'Audio Context': typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'
        };

        const missing = Object.entries(requirements)
            .filter(([name, supported]) => !supported)
            .map(([name]) => name);

        if (missing.length > 0) {
            console.warn('⚠️ Missing browser features:', missing.join(', '));
            this.showNotification(`Some features may not work properly. Missing: ${missing.join(', ')}`, 'warning');
        }
    }

    async initializeConfig() {
        // Validate configuration
        if (!CONFIG.validate()) {
            throw new Error('Invalid configuration detected');
        }

        // Initialize environment-specific settings
        if (CONFIG.environment.isDevelopment) {
            console.log('🔧 Running in development mode');
            CONFIG.system.debug = true;
        }

        // Check API keys
        this.validateApiKeys();
    }

    validateApiKeys() {
        const requiredKeys = [];
        
        if (!CONFIG.apis.openRouter.apiKey) {
            requiredKeys.push('OpenRouter API Key');
        }
        
        if (CONFIG.voice.useElevenLabs && !CONFIG.apis.elevenLabs.apiKey) {
            requiredKeys.push('ElevenLabs API Key');
        }

        if (requiredKeys.length > 0) {
            console.warn('⚠️ Missing API keys:', requiredKeys.join(', '));
            this.showApiKeySetupDialog(requiredKeys);
        }
    }

    async initializeComponents() {
        console.log('🔧 Initializing components...');
        
        try {
            // Initialize UI Manager with performance monitoring
            this.components.uiManager = new UIManager();
            // Initialize UI Manager after DOM is ready
            await this.components.uiManager.init();
            
            // Initialize Agent Manager with analytics
            this.components.agentManager = new AgentManager();
            this.components.agentManager.onAgentCreated = (agent) => {
                this.components.analytics.trackEvent('agent:created', { agentId: agent.id, type: agent.type });
                this.components.pluginManager.triggerHook('agent:created', { agent });
            };
            
            // Initialize specialized engines with error handling
            this.components.visionProcessor = await this.components.errorHandler.retryOperation(
                () => new VisionProcessor(),
                'VisionProcessor initialization'
            );
            
            this.components.researchEngine = new ResearchEngine();
            this.components.automationEngine = new AutomationEngine();
            
            // Create global instances for backward compatibility
            window.agentManager = this.components.agentManager;
            window.uiManager = this.components.uiManager;
            window.visionProcessor = this.components.visionProcessor;
            window.researchEngine = this.components.researchEngine;
            window.automationEngine = this.components.automationEngine;
            
            // Setup component event listeners
            this.setupComponentEventListeners();
            
            // Start automation scheduler
            if (this.components.automationEngine && this.components.automationEngine.startScheduler) {
                this.components.automationEngine.startScheduler();
            }
            
            console.log('✅ All components initialized');
            
        } catch (error) {
            console.error('❌ Component initialization failed:', error);
            throw error;
        }
    }

    setupComponentEventListeners() {
        // Agent Manager events
        if (this.components.agentManager) {
            this.components.agentManager.on('taskCompleted', (data) => {
                this.components.analytics.trackEvent('task:completed', data);
                this.components.pluginManager.triggerHook('task:completed', data);
            });
            
            this.components.agentManager.on('taskFailed', (data) => {
                this.components.analytics.trackEvent('task:failed', data);
                this.components.pluginManager.triggerHook('task:failed', data);
            });
        }
        
        // UI Manager events
        if (this.components.uiManager) {
            this.components.uiManager.on('settingsChanged', (settings) => {
                this.components.analytics.trackEvent('settings:changed', { settings });
                this.components.pluginManager.triggerHook('settings:changed', { settings });
            });
        }
    }

    setupGlobalHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Page visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Before unload handler
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    async startSystem() {
        console.log('🎯 Starting AI Agent Workforce System...');
        
        try {
            // Validate API keys with enhanced error handling
            await this.validateAPIKeys();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Load and apply saved settings
            await this.loadSystemSettings();
            
            // Initialize default plugins
            await this.loadDefaultPlugins();
            
            // Initialize default agents if configured
            if (CONFIG.system.autoSpawnAgents) {
                this.spawnDefaultAgents();
            }
            
            // Load saved state
            this.loadSystemState();
            
            // Show welcome message with analytics
            this.showWelcomeMessage();
            
            // Track system startup
            this.components.analytics.trackEvent('system:started', {
                timestamp: Date.now(),
                version: this.version || '1.0.0'
            });
            
            console.log('✅ System started successfully');
            
        } catch (error) {
            console.error('❌ System startup failed:', error);
            this.handleStartupError(error);
        }
    }

    async validateAPIKeys() {
        const requiredKeys = [];
        
        if (!CONFIG.apis.openRouter.apiKey) {
            requiredKeys.push('OpenRouter API Key');
        }
        
        if (CONFIG.voice.useElevenLabs && !CONFIG.apis.elevenLabs.apiKey) {
            requiredKeys.push('ElevenLabs API Key');
        }

        if (requiredKeys.length > 0) {
            console.warn('⚠️ Missing API keys:', requiredKeys.join(', '));
            this.showApiKeySetupDialog(requiredKeys);
        }
    }

    async loadSystemSettings() {
        try {
            const settingsStore = this.components.dataManager.getStore('settings');
            const savedSettings = settingsStore.get('systemSettings');
            
            if (savedSettings) {
                // Apply saved settings
                Object.assign(CONFIG, savedSettings);
                console.log('✅ System settings loaded');
            }
        } catch (error) {
            console.warn('Failed to load system settings:', error);
        }
    }

    async loadDefaultPlugins() {
        try {
            // Load built-in plugins
            const defaultPlugins = [
                {
                    name: 'SystemMonitor',
                    version: '1.0.0',
                    description: 'Monitors system performance and health',
                    hooks: {
                        'app:ready': () => console.log('System monitor plugin loaded'),
                        'health:check': (data) => {
                            if (data.status === 'critical') {
                                console.warn('Critical system health detected:', data);
                            }
                        }
                    }
                },
                {
                    name: 'AutoBackup',
                    version: '1.0.0',
                    description: 'Automatically backs up system data',
                    hooks: {
                        'app:ready': () => {
                            // Schedule automatic backups
                            setInterval(() => {
                                this.components.dataManager.createBackup();
                            }, 30 * 60 * 1000); // Every 30 minutes
                        }
                    }
                }
            ];
            
            for (const pluginConfig of defaultPlugins) {
                await this.components.pluginManager.loadPlugin(pluginConfig);
            }
            
            console.log('✅ Default plugins loaded');
        } catch (error) {
            console.warn('Failed to load default plugins:', error);
        }
    }

    handleStartupError(error) {
        this.components.notifications.show(
            `System startup failed: ${error.message}`,
            'error',
            { persistent: true }
        );
        
        // Try to recover
        setTimeout(() => {
            console.log('Attempting system recovery...');
            this.init();
        }, 5000);
    }

    async spawnDefaultAgents() {
        const defaultAgents = [
            { name: 'General Assistant', type: 'general', autonomyLevel: 'supervised' },
            { name: 'Code Expert', type: 'coding', autonomyLevel: 'supervised' },
            { name: 'Research Specialist', type: 'research', autonomyLevel: 'supervised' }
        ];

        for (const agentConfig of defaultAgents) {
            try {
                await this.components.agentManager.createAgent(agentConfig);
                console.log(`✅ Spawned default agent: ${agentConfig.name}`);
            } catch (error) {
                console.warn(`⚠️ Failed to spawn default agent ${agentConfig.name}:`, error);
            }
        }
    }

    startHealthMonitoring() {
        // Enhanced health check with detailed metrics
        this.healthCheckInterval = setInterval(() => {
            const health = this.performHealthCheck();
            
            if (health.status === 'critical') {
                this.components.notifications.show(
                    'System health critical - some components may not be functioning properly',
                    'error',
                    { persistent: true }
                );
            } else if (health.status === 'warning') {
                this.components.notifications.show(
                    'System performance degraded',
                    'warning'
                );
            }
            
            // Track health metrics
            this.components.analytics.trackEvent('health:check', health);
            
        }, CONFIG.system.healthCheckInterval || 30000);
    }

    performHealthCheck() {
        const health = {
            timestamp: Date.now(),
            status: 'healthy',
            agents: {
                total: this.components.agentManager.getAllAgents().length,
                active: this.components.agentManager.getActiveAgents().length,
                errors: 0
            },
            system: {
                memory: this.getMemoryUsage(),
                performance: this.getPerformanceMetrics(),
                errors: this.getErrorCount()
            },
            components: {},
            metrics: {}
        };

        // Check component health
        Object.entries(this.components).forEach(([name, component]) => {
            try {
                if (component && typeof component.getHealth === 'function') {
                    health.components[name] = component.getHealth();
                } else {
                    health.components[name] = { status: 'unknown' };
                }
            } catch (error) {
                health.components[name] = { status: 'error', error: error.message };
                health.status = 'warning';
            }
        });

        // Check memory usage
        if ('memory' in performance) {
            const memory = performance.memory;
            health.metrics.memory = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };
            
            if (health.metrics.memory.percentage > 90) {
                health.status = 'critical';
            } else if (health.metrics.memory.percentage > 75) {
                health.status = 'warning';
            }
        }

        // Check error rate
        const errorStats = this.components.errorHandler.getErrorStats();
        health.metrics.errors = errorStats;
        
        if (errorStats.lastHour > 10) {
            health.status = 'warning';
        }
        if (errorStats.lastHour > 25) {
            health.status = 'critical';
        }

        // Check for issues
        if (health.system.memory > CONFIG.system.maxMemoryUsage) {
            console.warn('⚠️ High memory usage detected');
            this.handleHighMemoryUsage();
        }

        if (health.system.errors > CONFIG.system.maxErrorCount) {
            console.warn('⚠️ High error rate detected');
            this.handleHighErrorRate();
        }

        // Update health display
        this.updateHealthDisplay(health);
        
        return health;
    }

    startPerformanceMonitoring() {
        if ('performance' in window && 'observe' in window.performance) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > CONFIG.system.performanceThreshold) {
                        console.warn(`⚠️ Slow operation detected: ${entry.name} (${entry.duration}ms)`);
                    }
                }
            });

            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
        
        // Monitor memory usage
        setInterval(() => {
            if ('memory' in performance) {
                const memory = performance.memory;
                const usage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                };
                
                if (usage.percentage > 80) {
                    this.components.notifications.show(
                        'High memory usage detected',
                        'warning'
                    );
                }
                
                this.components.analytics.trackEvent('performance:memory', usage);
            }
        }, 60000); // Every minute
    }

    handleGlobalError(error) {
        // Log error
        console.error('System error:', error);
        
        // Show user notification
        this.showNotification('A system error occurred. Please check the console for details.', 'error');
        
        // Attempt recovery if possible
        this.attemptErrorRecovery(error);
    }

    attemptErrorRecovery(error) {
        // Basic error recovery strategies
        if (error.message.includes('API')) {
            console.log('🔄 Attempting API error recovery...');
            // Could implement API retry logic here
        }
        
        if (error.message.includes('memory')) {
            console.log('🔄 Attempting memory cleanup...');
            this.performMemoryCleanup();
        }
    }

    performMemoryCleanup() {
        // Clear caches
        this.components.researchEngine.clearCache();
        
        // Limit conversation histories
        this.components.agentManager.getAllAgents().forEach(agent => {
            if (agent.conversationHistory.length > CONFIG.ui.maxChatHistory / 2) {
                agent.conversationHistory = agent.conversationHistory.slice(-CONFIG.ui.maxChatHistory / 2);
            }
        });
        
        console.log('🧹 Memory cleanup completed');
    }

    handlePageHidden() {
        console.log('📱 Page hidden - reducing activity');
        // Reduce background activity when page is hidden
        this.components.automationEngine.stopScheduler();
    }

    handlePageVisible() {
        console.log('📱 Page visible - resuming activity');
        // Resume full activity when page becomes visible
        this.components.automationEngine.startScheduler();
    }

    handleBeforeUnload(event) {
        // Save system state
        this.saveSystemState();
        
        // Clean up resources
        this.cleanup();
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K: Focus chat input
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const chatInput = document.getElementById('chat-input');
            if (chatInput) chatInput.focus();
        }
        
        // Ctrl/Cmd + Shift + N: Spawn new agent
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
            event.preventDefault();
            this.components.uiManager.showSpawnModal();
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal[style*="flex"]');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }

    saveSystemState() {
        if (!CONFIG.storage.persistState) return;
        
        const state = {
            version: this.version,
            timestamp: Date.now(),
            agents: this.components.agentManager.getAllAgents().map(agent => agent.serialize()),
            workflows: Array.from(this.components.automationEngine.workflows.entries()),
            settings: {
                currentWorkspace: this.components.uiManager.currentWorkspace,
                voiceEnabled: this.components.uiManager.isVoiceEnabled
            }
        };

        try {
            localStorage.setItem(CONFIG.storage.prefix + 'systemState', JSON.stringify(state));
            console.log('💾 System state saved');
        } catch (error) {
            console.warn('⚠️ Failed to save system state:', error);
        }
    }

    loadSystemState() {
        if (!CONFIG.storage.persistState) return;
        
        try {
            const stored = localStorage.getItem(CONFIG.storage.prefix + 'systemState');
            if (stored) {
                const state = JSON.parse(stored);
                
                // Check version compatibility
                if (state.version !== this.version) {
                    console.warn('⚠️ State version mismatch, skipping restore');
                    return;
                }
                
                // Restore workflows
                if (state.workflows) {
                    state.workflows.forEach(([id, workflow]) => {
                        this.components.automationEngine.workflows.set(id, workflow);
                    });
                }
                
                // Restore UI settings
                if (state.settings) {
                    if (state.settings.currentWorkspace) {
                        this.components.uiManager.loadWorkspace(state.settings.currentWorkspace);
                    }
                    this.components.uiManager.isVoiceEnabled = state.settings.voiceEnabled || false;
                }
                
                console.log('📂 System state restored');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load system state:', error);
        }
    }

    cleanup() {
        // Stop all intervals and clean up resources
        this.components.automationEngine.stopScheduler();
        this.components.visionProcessor.stopVideoStream();
        
        // Save final state
        this.saveSystemState();
        
        console.log('🧹 System cleanup completed');
    }

    async shutdown() {
        console.log('🔄 Shutting down AI Agent Workforce System...');
        
        try {
            // Stop health monitoring
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }
            
            // Stop automation scheduler
            if (this.components.automationEngine && this.components.automationEngine.stopScheduler) {
                this.components.automationEngine.stopScheduler();
            }
            
            // Create final backup
            await this.components.dataManager.createBackup();
            
            // Cleanup components
            Object.values(this.components).forEach(component => {
                if (component && typeof component.cleanup === 'function') {
                    component.cleanup();
                }
            });
            
            // Track shutdown
            this.components.analytics.trackEvent('system:shutdown', {
                timestamp: Date.now()
            });
            
            console.log('✅ System shutdown complete');
            
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }

    // Utility methods
    getMemoryUsage() {
        if ('memory' in performance) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
        }
        return 0;
    }

    getPerformanceMetrics() {
        if ('timing' in performance) {
            const timing = performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart
            };
        }
        return {};
    }

    getErrorCount() {
        // This would track errors over time
        return 0;
    }

    handleHighMemoryUsage() {
        this.performMemoryCleanup();
        this.showNotification('High memory usage detected. Performing cleanup.', 'warning');
    }

    handleHighErrorRate() {
        this.showNotification('High error rate detected. System may be unstable.', 'error');
    }

    updateHealthDisplay(health) {
        // Update health indicators in the UI
        const healthIndicator = document.getElementById('system-health');
        if (healthIndicator) {
            const status = this.calculateHealthStatus(health);
            healthIndicator.className = `health-indicator ${status}`;
            healthIndicator.title = `System Health: ${status.toUpperCase()}`;
        }
    }

    calculateHealthStatus(health) {
        if (health.system.errors > 5) return 'critical';
        if (health.system.memory > 500) return 'warning';
        if (health.agents.active === 0) return 'idle';
        return 'healthy';
    }

    showWelcomeMessage() {
        const welcomeMessage = `
🤖 Welcome to AI Agent Workforce System v${this.version}

Your intelligent multi-agent system is ready! Here's what you can do:

• Chat naturally and tasks will be assigned to appropriate agents
• Use /spawn to create specialized agents
• Use /help to see all available commands
• Explore different workspaces for coding, research, vision, and automation

${this.components.agentManager.getAllAgents().length} agents are currently active and ready to assist you.
        `.trim();

        this.components.uiManager.addMessageToChat('system', welcomeMessage);
    }

    showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'system-error';
        errorElement.innerHTML = `
            <h3>⚠️ System Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Reload System</button>
        `;
        document.body.appendChild(errorElement);
    }

    showNotification(message, type = 'info') {
        if (this.components.uiManager) {
            this.components.uiManager.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    showApiKeySetupDialog(missingKeys) {
        const dialog = document.createElement('div');
        dialog.className = 'api-key-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>🔑 API Keys Required</h3>
                <p>The following API keys are missing:</p>
                <ul>
                    ${missingKeys.map(key => `<li>${key}</li>`).join('')}
                </ul>
                <p>Please configure these in the settings to enable full functionality.</p>
                <button onclick="this.parentElement.parentElement.remove()">Continue Anyway</button>
                <button onclick="window.open('https://openrouter.ai', '_blank')">Get OpenRouter Key</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Public API methods
    getSystemInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            agents: this.components.agentManager.metrics,
            health: this.calculateHealthStatus({}),
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }

    async executeCommand(command) {
        return await this.components.uiManager.processCommand(command);
    }

    async createAgent(config) {
        return await this.components.agentManager.createAgent(config);
    }

    async assignTask(task) {
        return await this.components.agentManager.assignTask(task);
    }
}

// Initialize the system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiWorkforce = new AIAgentWorkforce();
});

// Export for external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAgentWorkforce;
}