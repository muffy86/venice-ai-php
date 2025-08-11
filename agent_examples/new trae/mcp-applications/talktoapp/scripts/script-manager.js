// Advanced Script Manager for TalkToApp
class ScriptManager {
    constructor() {
        this.scripts = new Map();
        this.categories = {
            development: 'Development & Build',
            performance: 'Performance Analysis',
            security: 'Security & Scanning',
            deployment: 'Deployment & CI/CD',
            maintenance: 'Maintenance & Optimization',
            testing: 'Testing & QA',
            monitoring: 'Monitoring & Analytics'
        };
        this.isInitialized = false;
        this.ui = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('🚀 Initializing Advanced Script Manager...');
        
        // Load advanced development scripts
        if (window.AdvancedDevelopmentScripts) {
            this.advancedScripts = new AdvancedDevelopmentScripts();
            this.registerScripts();
        }

        this.createUI();
        this.isInitialized = true;
        
        console.log('✅ Script Manager initialized successfully');
    }

    registerScripts() {
        // Development Scripts
        this.scripts.set('build-pipeline', {
            name: 'Modern Build Pipeline',
            category: 'development',
            description: 'Complete build pipeline with optimization',
            script: () => this.advancedScripts.generateModernBuildPipeline(),
            icon: '🔧'
        });

        this.scripts.set('hmr-setup', {
            name: 'Hot Module Replacement',
            category: 'development',
            description: 'Setup HMR for faster development',
            script: () => this.advancedScripts.generateHMRSetup(),
            icon: '🔥'
        });

        this.scripts.set('component-generator', {
            name: 'Component Generator',
            category: 'development',
            description: 'Generate components for various frameworks',
            script: () => this.advancedScripts.generateComponentGenerator(),
            icon: '🧩'
        });

        this.scripts.set('api-client-generator', {
            name: 'API Client Generator',
            category: 'development',
            description: 'Generate API clients from OpenAPI specs',
            script: () => this.advancedScripts.generateAPIClientGenerator(),
            icon: '🌐'
        });

        // Performance Scripts
        this.scripts.set('performance-report', {
            name: 'Performance Reporter',
            category: 'performance',
            description: 'Generate detailed performance reports',
            script: () => this.advancedScripts.generatePerformanceReport(),
            icon: '📊'
        });

        // Security Scripts
        this.scripts.set('security-scanner', {
            name: 'Security Scanner',
            category: 'security',
            description: 'Comprehensive security vulnerability scanner',
            script: () => this.advancedScripts.generateSecurityScanner(),
            icon: '🛡️'
        });

        // Testing Scripts
        this.scripts.set('test-generator', {
            name: 'Automated Test Generator',
            category: 'testing',
            description: 'Generate comprehensive test suites',
            script: () => this.advancedScripts.generateAutomatedTestGenerator(),
            icon: '🧪'
        });

        // Deployment Scripts
        this.scripts.set('deployment-automation', {
            name: 'Deployment Automation',
            category: 'deployment',
            description: 'Complete deployment automation suite',
            script: () => this.advancedScripts.generateDeploymentScripts(),
            icon: '🚀'
        });

        this.scripts.set('cicd-pipeline', {
            name: 'CI/CD Pipeline Generator',
            category: 'deployment',
            description: 'Generate CI/CD pipelines for various platforms',
            script: () => this.advancedScripts.generateCICDPipelineGenerator(),
            icon: '⚙️'
        });

        // Maintenance Scripts
        this.scripts.set('maintenance-suite', {
            name: 'Maintenance Suite',
            category: 'maintenance',
            description: 'Automated maintenance and optimization',
            script: () => this.advancedScripts.generateMaintenanceScripts(),
            icon: '🧹'
        });

        this.scripts.set('dependency-updater', {
            name: 'Smart Dependency Updater',
            category: 'maintenance',
            description: 'Intelligent dependency management',
            script: () => this.advancedScripts.generateSmartDependencyUpdater(),
            icon: '📦'
        });

        this.scripts.set('code-analyzer', {
            name: 'Code Quality Analyzer',
            category: 'maintenance',
            description: 'Comprehensive code quality analysis',
            script: () => this.advancedScripts.generateCodeQualityAnalyzer(),
            icon: '🔍'
        });

        console.log(`📝 Registered ${this.scripts.size} advanced scripts`);
    }

    createUI() {
        // Create script manager UI
        this.ui = document.createElement('div');
        this.ui.id = 'script-manager';
        this.ui.innerHTML = `
            <div class="script-manager-container">
                <div class="script-manager-header">
                    <h3>🚀 Advanced Script Manager</h3>
                    <div class="script-manager-controls">
                        <button id="toggle-script-manager" class="btn-icon">📋</button>
                        <button id="refresh-scripts" class="btn-icon">🔄</button>
                        <button id="export-scripts" class="btn-icon">💾</button>
                    </div>
                </div>
                <div class="script-manager-content">
                    <div class="script-categories">
                        ${this.renderCategories()}
                    </div>
                    <div class="script-output">
                        <div class="output-header">
                            <h4>Script Output</h4>
                            <button id="clear-output" class="btn-small">Clear</button>
                        </div>
                        <div id="script-output-content" class="output-content">
                            <p>Select a script to view its output...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Add event listeners
        this.addEventListeners();

        // Append to body
        document.body.appendChild(this.ui);
    }

    renderCategories() {
        let html = '';
        
        Object.entries(this.categories).forEach(([key, name]) => {
            const categoryScripts = Array.from(this.scripts.entries())
                .filter(([id, script]) => script.category === key);
            
            if (categoryScripts.length > 0) {
                html += `
                    <div class="script-category">
                        <h4 class="category-title">${name}</h4>
                        <div class="script-list">
                            ${categoryScripts.map(([id, script]) => `
                                <div class="script-item" data-script-id="${id}">
                                    <div class="script-icon">${script.icon}</div>
                                    <div class="script-info">
                                        <div class="script-name">${script.name}</div>
                                        <div class="script-description">${script.description}</div>
                                    </div>
                                    <div class="script-actions">
                                        <button class="btn-run" data-action="run">Run</button>
                                        <button class="btn-view" data-action="view">View</button>
                                        <button class="btn-copy" data-action="copy">Copy</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }

    addStyles() {
        const styles = `
            <style>
                #script-manager {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 800px;
                    max-height: 80vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    z-index: 10000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                    overflow: hidden;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                }

                #script-manager.active {
                    transform: translateX(0);
                }

                .script-manager-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .script-manager-header {
                    padding: 20px;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .script-manager-header h3 {
                    margin: 0;
                    font-size: 1.5em;
                    font-weight: 600;
                }

                .script-manager-controls {
                    display: flex;
                    gap: 10px;
                }

                .btn-icon {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1.2em;
                }

                .btn-icon:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.05);
                }

                .script-manager-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                .script-categories {
                    width: 50%;
                    padding: 20px;
                    overflow-y: auto;
                    border-right: 1px solid rgba(255,255,255,0.2);
                }

                .script-category {
                    margin-bottom: 25px;
                }

                .category-title {
                    margin: 0 0 15px 0;
                    font-size: 1.1em;
                    font-weight: 600;
                    color: #ffd700;
                    border-bottom: 2px solid #ffd700;
                    padding-bottom: 5px;
                }

                .script-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .script-item {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .script-item:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }

                .script-icon {
                    font-size: 2em;
                    min-width: 40px;
                    text-align: center;
                }

                .script-info {
                    flex: 1;
                }

                .script-name {
                    font-weight: 600;
                    margin-bottom: 5px;
                }

                .script-description {
                    font-size: 0.9em;
                    opacity: 0.8;
                }

                .script-actions {
                    display: flex;
                    gap: 5px;
                }

                .btn-run, .btn-view, .btn-copy, .btn-small {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 5px;
                    padding: 5px 10px;
                    color: white;
                    cursor: pointer;
                    font-size: 0.8em;
                    transition: all 0.3s ease;
                }

                .btn-run:hover {
                    background: #4CAF50;
                }

                .btn-view:hover {
                    background: #2196F3;
                }

                .btn-copy:hover {
                    background: #FF9800;
                }

                .btn-small:hover {
                    background: rgba(255,255,255,0.3);
                }

                .script-output {
                    width: 50%;
                    display: flex;
                    flex-direction: column;
                }

                .output-header {
                    padding: 20px 20px 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .output-header h4 {
                    margin: 0;
                    font-size: 1.1em;
                }

                .output-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: rgba(0,0,0,0.2);
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                    line-height: 1.4;
                }

                .output-content pre {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    margin: 0;
                }

                /* Scrollbar styles */
                .script-categories::-webkit-scrollbar,
                .output-content::-webkit-scrollbar {
                    width: 8px;
                }

                .script-categories::-webkit-scrollbar-track,
                .output-content::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }

                .script-categories::-webkit-scrollbar-thumb,
                .output-content::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 4px;
                }

                .script-categories::-webkit-scrollbar-thumb:hover,
                .output-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.5);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    addEventListeners() {
        // Toggle script manager
        document.getElementById('toggle-script-manager').addEventListener('click', () => {
            this.ui.classList.toggle('active');
        });

        // Refresh scripts
        document.getElementById('refresh-scripts').addEventListener('click', () => {
            this.refreshScripts();
        });

        // Export scripts
        document.getElementById('export-scripts').addEventListener('click', () => {
            this.exportScripts();
        });

        // Clear output
        document.getElementById('clear-output').addEventListener('click', () => {
            document.getElementById('script-output-content').innerHTML = 
                '<p>Select a script to view its output...</p>';
        });

        // Script actions
        this.ui.addEventListener('click', (e) => {
            const scriptItem = e.target.closest('.script-item');
            const action = e.target.dataset.action;
            
            if (scriptItem && action) {
                const scriptId = scriptItem.dataset.scriptId;
                this.handleScriptAction(scriptId, action);
            }
        });
    }

    handleScriptAction(scriptId, action) {
        const script = this.scripts.get(scriptId);
        if (!script) return;

        const outputElement = document.getElementById('script-output-content');

        switch (action) {
            case 'run':
                this.runScript(script, outputElement);
                break;
            case 'view':
                this.viewScript(script, outputElement);
                break;
            case 'copy':
                this.copyScript(script);
                break;
        }
    }

    runScript(script, outputElement) {
        outputElement.innerHTML = `
            <div style="color: #4CAF50; margin-bottom: 10px;">
                🚀 Running: ${script.name}
            </div>
            <div style="color: #FFA500;">
                Executing script... Please check console for detailed output.
            </div>
        `;

        try {
            // Execute the script
            const scriptCode = script.script();
            eval(scriptCode);
            
            outputElement.innerHTML += `
                <div style="color: #4CAF50; margin-top: 10px;">
                    ✅ Script executed successfully!
                </div>
            `;
        } catch (error) {
            outputElement.innerHTML += `
                <div style="color: #F44336; margin-top: 10px;">
                    ❌ Error: ${error.message}
                </div>
            `;
        }
    }

    viewScript(script, outputElement) {
        const scriptCode = script.script();
        outputElement.innerHTML = `
            <div style="color: #2196F3; margin-bottom: 10px;">
                👁️ Viewing: ${script.name}
            </div>
            <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; overflow-x: auto;">
${scriptCode}
            </pre>
        `;
    }

    async copyScript(script) {
        try {
            const scriptCode = script.script();
            await navigator.clipboard.writeText(scriptCode);
            
            // Show temporary notification
            this.showNotification(`📋 Copied "${script.name}" to clipboard!`, 'success');
        } catch (error) {
            this.showNotification(`❌ Failed to copy script: ${error.message}`, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 20000;
            font-weight: 600;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    refreshScripts() {
        console.log('🔄 Refreshing scripts...');
        
        // Re-register scripts
        this.scripts.clear();
        this.registerScripts();
        
        // Update UI
        const categoriesElement = this.ui.querySelector('.script-categories');
        categoriesElement.innerHTML = this.renderCategories();
        
        this.showNotification('🔄 Scripts refreshed successfully!', 'success');
    }

    exportScripts() {
        const scriptsData = {
            timestamp: new Date().toISOString(),
            scripts: Array.from(this.scripts.entries()).map(([id, script]) => ({
                id,
                name: script.name,
                category: script.category,
                description: script.description,
                code: script.script()
            }))
        };

        const blob = new Blob([JSON.stringify(scriptsData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talktoapp-scripts-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('💾 Scripts exported successfully!', 'success');
    }

    // Public API methods
    getScript(id) {
        return this.scripts.get(id);
    }

    getAllScripts() {
        return Array.from(this.scripts.entries());
    }

    getScriptsByCategory(category) {
        return Array.from(this.scripts.entries())
            .filter(([id, script]) => script.category === category);
    }

    addCustomScript(id, scriptConfig) {
        this.scripts.set(id, scriptConfig);
        this.refreshScripts();
    }

    removeScript(id) {
        this.scripts.delete(id);
        this.refreshScripts();
    }
}

// Add animation styles
const animationStyles = `
    <style>
        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
            to {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
        }
    </style>
`;
document.head.insertAdjacentHTML('beforeend', animationStyles);

// Initialize Script Manager
window.ScriptManager = ScriptManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scriptManager = new ScriptManager();
        window.scriptManager.initialize();
    });
} else {
    window.scriptManager = new ScriptManager();
    window.scriptManager.initialize();
}

console.log('🚀 Advanced Script Manager loaded successfully!');