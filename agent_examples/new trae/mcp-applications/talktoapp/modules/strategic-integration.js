/**
 * Strategic Integration Module
 * Coordinates all strategic enhancement modules and provides unified access
 */

class StrategicIntegration {
    constructor() {
        this.modules = new Map();
        this.initialized = false;
        this.navigationPanel = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Strategic Integration System...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeModules());
        } else {
            this.initializeModules();
        }
    }

    async initializeModules() {
        try {
            // Initialize all strategic modules
            await this.initializePerformanceMonitor();
            await this.initializeAdvancedChat();
            await this.initializeTemplateLibrary();
            await this.initializePWAEnhancement();
            await this.initializeUserAuth();
            await this.initializeAdvancedVoice();
            await this.initializeExportSharing();
            await this.initializeTestingSuite();
            await this.initializeDeploymentPipeline();
            await this.initializeAnalyticsFeedback();
            
            // Create navigation panel
            this.createNavigationPanel();
            
            // Setup integration events
            this.setupIntegrationEvents();
            
            this.initialized = true;
            console.log('✅ Strategic Integration System initialized successfully!');
            
            // Dispatch initialization complete event
            document.dispatchEvent(new CustomEvent('strategic-integration-ready', {
                detail: { modules: Array.from(this.modules.keys()) }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize Strategic Integration System:', error);
        }
    }

    async initializePerformanceMonitor() {
        if (typeof PerformanceMonitor !== 'undefined') {
            this.modules.set('performance', new PerformanceMonitor());
            console.log('✅ Performance Monitor initialized');
        }
    }

    async initializeAdvancedChat() {
        if (typeof AdvancedChat !== 'undefined') {
            this.modules.set('chat', new AdvancedChat());
            console.log('✅ Advanced Chat initialized');
        }
    }

    async initializeTemplateLibrary() {
        if (typeof TemplateLibrary !== 'undefined') {
            this.modules.set('templates', new TemplateLibrary());
            console.log('✅ Template Library initialized');
        }
    }

    async initializePWAEnhancement() {
        if (typeof PWAEnhancement !== 'undefined') {
            this.modules.set('pwa', new PWAEnhancement());
            console.log('✅ PWA Enhancement initialized');
        }
    }

    async initializeUserAuth() {
        if (typeof UserAuthentication !== 'undefined') {
            this.modules.set('auth', new UserAuthentication());
            console.log('✅ User Authentication initialized');
        }
    }

    async initializeAdvancedVoice() {
        if (typeof AdvancedVoice !== 'undefined') {
            this.modules.set('voice', new AdvancedVoice());
            console.log('✅ Advanced Voice initialized');
        }
    }

    async initializeExportSharing() {
        if (typeof ExportSharing !== 'undefined') {
            this.modules.set('export', new ExportSharing());
            console.log('✅ Export & Sharing initialized');
        }
    }

    async initializeTestingSuite() {
        if (typeof TestingSuite !== 'undefined') {
            this.modules.set('testing', new TestingSuite());
            console.log('✅ Testing Suite initialized');
        }
    }

    async initializeDeploymentPipeline() {
        if (typeof DeploymentPipeline !== 'undefined') {
            this.modules.set('deployment', new DeploymentPipeline());
            console.log('✅ Deployment Pipeline initialized');
        }
    }

    async initializeAnalyticsFeedback() {
        if (typeof AnalyticsFeedback !== 'undefined') {
            this.modules.set('analytics', new AnalyticsFeedback());
            console.log('✅ Analytics & Feedback initialized');
        }
    }

    createNavigationPanel() {
        this.navigationPanel = document.createElement('div');
        this.navigationPanel.id = 'strategic-navigation';
        this.navigationPanel.className = 'strategic-navigation';
        this.navigationPanel.innerHTML = this.getNavigationHTML();

        const style = document.createElement('style');
        style.textContent = this.getNavigationStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.navigationPanel);

        // Add event listeners
        this.setupNavigationEvents();
    }

    getNavigationHTML() {
        return `
            <div class="nav-toggle" onclick="strategicIntegration.toggleNavigation()">
                <span class="nav-icon">⚡</span>
                <span class="nav-text">Strategic Tools</span>
            </div>
            
            <div class="nav-panel" id="strategic-nav-panel">
                <div class="nav-header">
                    <h3>Strategic Enhancement Tools</h3>
                    <button class="close-btn" onclick="strategicIntegration.closeNavigation()">×</button>
                </div>
                
                <div class="nav-content">
                    <div class="nav-section">
                        <h4>Performance & Analytics</h4>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="strategicIntegration.openModule('performance')" data-module="performance">
                                <span class="btn-icon">📊</span>
                                <span class="btn-text">Performance Monitor</span>
                                <span class="btn-status" id="performance-status">●</span>
                            </button>
                            
                            <button class="nav-btn" onclick="strategicIntegration.openModule('analytics')" data-module="analytics">
                                <span class="btn-icon">📈</span>
                                <span class="btn-text">Analytics Dashboard</span>
                                <span class="btn-status" id="analytics-status">●</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nav-section">
                        <h4>AI & Communication</h4>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="strategicIntegration.openModule('chat')" data-module="chat">
                                <span class="btn-icon">🤖</span>
                                <span class="btn-text">Advanced Chat</span>
                                <span class="btn-status" id="chat-status">●</span>
                            </button>
                            
                            <button class="nav-btn" onclick="strategicIntegration.openModule('voice')" data-module="voice">
                                <span class="btn-icon">🎤</span>
                                <span class="btn-text">Voice Features</span>
                                <span class="btn-status" id="voice-status">●</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nav-section">
                        <h4>Development Tools</h4>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="strategicIntegration.openModule('templates')" data-module="templates">
                                <span class="btn-icon">📚</span>
                                <span class="btn-text">Template Library</span>
                                <span class="btn-status" id="templates-status">●</span>
                            </button>
                            
                            <button class="nav-btn" onclick="strategicIntegration.openModule('testing')" data-module="testing">
                                <span class="btn-icon">🧪</span>
                                <span class="btn-text">Testing Suite</span>
                                <span class="btn-status" id="testing-status">●</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nav-section">
                        <h4>Deployment & Sharing</h4>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="strategicIntegration.openModule('export')" data-module="export">
                                <span class="btn-icon">📤</span>
                                <span class="btn-text">Export & Share</span>
                                <span class="btn-status" id="export-status">●</span>
                            </button>
                            
                            <button class="nav-btn" onclick="strategicIntegration.openModule('deployment')" data-module="deployment">
                                <span class="btn-icon">🚀</span>
                                <span class="btn-text">Deployment Pipeline</span>
                                <span class="btn-status" id="deployment-status">●</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="nav-section">
                        <h4>User Experience</h4>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="strategicIntegration.openModule('pwa')" data-module="pwa">
                                <span class="btn-icon">📱</span>
                                <span class="btn-text">PWA Features</span>
                                <span class="btn-status" id="pwa-status">●</span>
                            </button>
                            
                            <button class="nav-btn" onclick="strategicIntegration.openModule('auth')" data-module="auth">
                                <span class="btn-icon">👤</span>
                                <span class="btn-text">User Authentication</span>
                                <span class="btn-status" id="auth-status">●</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="nav-footer">
                    <div class="system-status">
                        <span class="status-label">System Status:</span>
                        <span class="status-indicator active" id="system-status">All Systems Operational</span>
                    </div>
                    
                    <div class="quick-actions">
                        <button class="quick-btn" onclick="strategicIntegration.runSystemCheck()">
                            <span class="btn-icon">🔍</span>
                            System Check
                        </button>
                        
                        <button class="quick-btn" onclick="strategicIntegration.exportSystemReport()">
                            <span class="btn-icon">📋</span>
                            Export Report
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getNavigationStyles() {
        return `
            .strategic-navigation {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 9998;
                font-family: 'Inter', sans-serif;
            }

            .nav-toggle {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .nav-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            }

            .nav-icon {
                font-size: 1.2rem;
                animation: pulse 2s infinite;
            }

            .nav-text {
                font-weight: 600;
                font-size: 0.9rem;
            }

            .nav-panel {
                position: absolute;
                top: 60px;
                left: 0;
                width: 400px;
                max-height: 80vh;
                background: rgba(26, 26, 26, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                display: none;
                overflow-y: auto;
                animation: slideInLeft 0.3s ease;
            }

            .nav-panel.active {
                display: block;
            }

            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }

            .nav-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            }

            .nav-header h3 {
                margin: 0;
                color: white;
                font-size: 1.1rem;
                font-weight: 600;
            }

            .close-btn {
                background: none;
                border: none;
                color: #ccc;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .nav-content {
                padding: 20px;
            }

            .nav-section {
                margin-bottom: 25px;
            }

            .nav-section h4 {
                margin: 0 0 12px 0;
                color: #ccc;
                font-size: 0.9rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .nav-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nav-btn {
                background: rgba(45, 45, 45, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px 15px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
                color: white;
                text-align: left;
                position: relative;
                overflow: hidden;
            }

            .nav-btn:hover {
                background: rgba(102, 126, 234, 0.2);
                border-color: rgba(102, 126, 234, 0.5);
                transform: translateX(5px);
            }

            .nav-btn:active {
                transform: translateX(5px) scale(0.98);
            }

            .btn-icon {
                font-size: 1.1rem;
                min-width: 20px;
            }

            .btn-text {
                flex: 1;
                font-weight: 500;
                font-size: 0.9rem;
            }

            .btn-status {
                font-size: 0.8rem;
                color: #4ade80;
                animation: pulse 2s infinite;
            }

            .nav-footer {
                padding: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(0, 0, 0, 0.2);
            }

            .system-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 15px;
            }

            .status-label {
                color: #ccc;
                font-size: 0.8rem;
            }

            .status-indicator {
                color: #4ade80;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .status-indicator.active {
                animation: pulse 2s infinite;
            }

            .quick-actions {
                display: flex;
                gap: 10px;
            }

            .quick-btn {
                flex: 1;
                background: rgba(102, 126, 234, 0.2);
                border: 1px solid rgba(102, 126, 234, 0.3);
                border-radius: 6px;
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.3s ease;
                color: white;
                font-size: 0.8rem;
            }

            .quick-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                border-color: rgba(102, 126, 234, 0.5);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 768px) {
                .strategic-navigation {
                    top: 10px;
                    left: 10px;
                }

                .nav-panel {
                    width: calc(100vw - 40px);
                    max-width: 350px;
                }

                .nav-toggle {
                    padding: 10px 16px;
                }

                .nav-text {
                    display: none;
                }
            }
        `;
    }

    setupNavigationEvents() {
        // Update module status indicators
        this.updateModuleStatus();
        
        // Set up periodic status updates
        setInterval(() => {
            this.updateModuleStatus();
        }, 5000);
    }

    setupIntegrationEvents() {
        // Listen for module events and coordinate between them
        document.addEventListener('app-generated', (e) => {
            // Notify relevant modules about app generation
            this.notifyModules('app-generated', e.detail);
        });

        document.addEventListener('user-action', (e) => {
            // Track user actions across modules
            this.notifyModules('user-action', e.detail);
        });

        document.addEventListener('performance-alert', (e) => {
            // Handle performance alerts
            this.handlePerformanceAlert(e.detail);
        });
    }

    toggleNavigation() {
        const panel = document.getElementById('strategic-nav-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }

    closeNavigation() {
        const panel = document.getElementById('strategic-nav-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    openModule(moduleName) {
        const module = this.modules.get(moduleName);
        if (!module) {
            console.warn(`Module ${moduleName} not found`);
            return;
        }

        // Call the appropriate method to show the module's UI
        switch (moduleName) {
            case 'performance':
                if (module.showDashboard) module.showDashboard();
                break;
            case 'analytics':
                if (module.showAnalyticsDashboard) module.showAnalyticsDashboard();
                break;
            case 'chat':
                if (module.showChatInterface) module.showChatInterface();
                break;
            case 'voice':
                if (module.showVoiceControls) module.showVoiceControls();
                break;
            case 'templates':
                if (module.showTemplateLibrary) module.showTemplateLibrary();
                break;
            case 'testing':
                if (module.showTestingSuite) module.showTestingSuite();
                break;
            case 'export':
                if (module.showExportInterface) module.showExportInterface();
                break;
            case 'deployment':
                if (module.showDeploymentPipeline) module.showDeploymentPipeline();
                break;
            case 'pwa':
                if (module.showPWASettings) module.showPWASettings();
                break;
            case 'auth':
                if (module.showAuthInterface) module.showAuthInterface();
                break;
            default:
                console.log(`Opening ${moduleName} module...`);
        }

        // Close navigation panel
        this.closeNavigation();
    }

    updateModuleStatus() {
        this.modules.forEach((module, name) => {
            const statusElement = document.getElementById(`${name}-status`);
            if (statusElement) {
                const isActive = module && typeof module === 'object';
                statusElement.style.color = isActive ? '#4ade80' : '#ef4444';
                statusElement.textContent = isActive ? '●' : '●';
            }
        });
    }

    notifyModules(eventType, data) {
        this.modules.forEach((module, name) => {
            if (module && typeof module.handleEvent === 'function') {
                module.handleEvent(eventType, data);
            }
        });
    }

    handlePerformanceAlert(alertData) {
        console.warn('Performance Alert:', alertData);
        
        // Show notification
        this.showNotification('Performance Alert', alertData.message, 'warning');
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `strategic-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .strategic-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(26, 26, 26, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 15px;
                max-width: 300px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }

            .strategic-notification.warning {
                border-color: rgba(251, 191, 36, 0.5);
            }

            .strategic-notification.error {
                border-color: rgba(239, 68, 68, 0.5);
            }

            .strategic-notification.success {
                border-color: rgba(74, 222, 128, 0.5);
            }

            .notification-content h4 {
                margin: 0 0 5px 0;
                color: white;
                font-size: 0.9rem;
            }

            .notification-content p {
                margin: 0;
                color: #ccc;
                font-size: 0.8rem;
            }

            .notification-close {
                position: absolute;
                top: 5px;
                right: 10px;
                background: none;
                border: none;
                color: #ccc;
                cursor: pointer;
                font-size: 1.2rem;
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;

        if (!document.querySelector('style[data-strategic-notifications]')) {
            style.setAttribute('data-strategic-notifications', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    runSystemCheck() {
        console.log('🔍 Running system check...');
        
        let allModulesHealthy = true;
        const results = [];

        this.modules.forEach((module, name) => {
            const isHealthy = module && typeof module === 'object';
            results.push({ name, healthy: isHealthy });
            if (!isHealthy) allModulesHealthy = false;
        });

        const status = allModulesHealthy ? 'All systems operational' : 'Some modules need attention';
        const type = allModulesHealthy ? 'success' : 'warning';

        this.showNotification('System Check Complete', status, type);
        
        console.log('System Check Results:', results);
        return results;
    }

    exportSystemReport() {
        console.log('📋 Exporting system report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            modules: {},
            systemStatus: 'operational',
            performance: {},
            analytics: {}
        };

        // Collect data from each module
        this.modules.forEach((module, name) => {
            report.modules[name] = {
                initialized: !!module,
                status: module ? 'active' : 'inactive'
            };

            // Collect module-specific data if available
            if (module && typeof module.getReportData === 'function') {
                report.modules[name].data = module.getReportData();
            }
        });

        // Export as JSON file
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talktoapp-system-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('System Report', 'Report exported successfully', 'success');
    }

    getModule(name) {
        return this.modules.get(name);
    }

    isInitialized() {
        return this.initialized;
    }

    getModuleStatus() {
        const status = {};
        this.modules.forEach((module, name) => {
            status[name] = !!module;
        });
        return status;
    }
}

// Initialize Strategic Integration System
const strategicIntegration = new StrategicIntegration();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StrategicIntegration;
}