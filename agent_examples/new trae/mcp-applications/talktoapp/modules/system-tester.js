/**
 * System Tester - Comprehensive testing and debugging
 */

class SystemTester {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        this.performance = {};
        this.init();
    }

    init() {
        this.createTestInterface();
        this.runStartupTests();
    }

    createTestInterface() {
        const testPanel = document.createElement('div');
        testPanel.id = 'system-test-panel';
        testPanel.innerHTML = `
            <div class="test-header">
                <h3>🧪 System Tester</h3>
                <button id="run-all-tests">Run All Tests</button>
                <button id="toggle-test-panel">×</button>
            </div>
            <div class="test-content">
                <div class="test-section">
                    <h4>Module Tests</h4>
                    <div id="module-tests"></div>
                </div>
                <div class="test-section">
                    <h4>Feature Tests</h4>
                    <div id="feature-tests"></div>
                </div>
                <div class="test-section">
                    <h4>Performance</h4>
                    <div id="performance-tests"></div>
                </div>
                <div class="test-section">
                    <h4>Errors & Warnings</h4>
                    <div id="error-log"></div>
                </div>
            </div>
        `;
        testPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border-radius: 10px;
            border: 1px solid #333;
            z-index: 20000;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
            display: none;
        `;
        document.body.appendChild(testPanel);
        this.setupTestEvents();
    }

    setupTestEvents() {
        document.getElementById('run-all-tests').onclick = () => this.runAllTests();
        document.getElementById('toggle-test-panel').onclick = () => this.togglePanel();
        
        // Add keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        const panel = document.getElementById('system-test-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    async runAllTests() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        
        this.log('🚀 Starting comprehensive system tests...');
        
        await this.testModules();
        await this.testFeatures();
        await this.testPerformance();
        await this.testIntegrations();
        
        this.displayResults();
        this.log('✅ All tests completed!');
    }

    async testModules() {
        this.log('📦 Testing modules...');
        
        const modules = [
            'behavioralEngine',
            'automationCore', 
            'contextualIntelligence',
            'smartNotifications',
            'adaptiveUI',
            'aiOrchestration',
            'neuralAutomation',
            'enterpriseHub',
            'quantumAI',
            'edgeComputing',
            'blockchainLedger',
            'metaverseInterface',
            'aiSuggestions'
        ];

        for (const module of modules) {
            try {
                const exists = window[module] !== undefined;
                const initialized = window[module]?.constructor?.name !== undefined;
                
                this.addTest(`Module: ${module}`, exists && initialized, 
                    exists ? (initialized ? 'Initialized' : 'Not initialized') : 'Not found');
                
                if (exists && initialized) {
                    await this.testModuleMethods(module, window[module]);
                }
            } catch (error) {
                this.addError(`Module ${module}`, error.message);
            }
        }
    }

    async testModuleMethods(moduleName, moduleInstance) {
        const commonMethods = ['init', 'getStatus', 'start', 'stop', 'reset'];
        
        for (const method of commonMethods) {
            if (typeof moduleInstance[method] === 'function') {
                try {
                    if (method === 'getStatus') {
                        const status = moduleInstance[method]();
                        this.addTest(`${moduleName}.${method}()`, true, `Status: ${JSON.stringify(status).slice(0, 50)}...`);
                    } else {
                        this.addTest(`${moduleName}.${method}()`, true, 'Method exists');
                    }
                } catch (error) {
                    this.addError(`${moduleName}.${method}()`, error.message);
                }
            }
        }
    }

    async testFeatures() {
        this.log('🎯 Testing features...');
        
        // Test AI Suggestions
        await this.testAISuggestions();
        
        // Test Dashboard
        await this.testDashboard();
        
        // Test Notifications
        await this.testNotifications();
        
        // Test Automation
        await this.testAutomation();
        
        // Test UI Adaptation
        await this.testUIAdaptation();
    }

    async testAISuggestions() {
        try {
            if (window.aiSuggestions) {
                const stats = window.aiSuggestions.getSuggestionStats();
                this.addTest('AI Suggestions Stats', stats !== undefined, `Categories: ${stats.categories?.length || 0}`);
                
                // Test suggestion generation
                const suggestions = await window.aiSuggestions.generatePersonalizedSuggestions();
                this.addTest('Suggestion Generation', Array.isArray(suggestions), `Generated: ${suggestions?.length || 0} suggestions`);
                
                // Test categories
                const categories = window.aiSuggestions.categories;
                this.addTest('Suggestion Categories', categories.length >= 13, `Categories: ${categories.length}`);
                
                // Test banner display
                const banner = document.getElementById('main-banner');
                this.addTest('Suggestion Banner', banner !== null, banner ? 'Banner exists' : 'Banner missing');
            } else {
                this.addError('AI Suggestions', 'Module not found');
            }
        } catch (error) {
            this.addError('AI Suggestions Test', error.message);
        }
    }

    async testDashboard() {
        try {
            if (window.dashboard) {
                const status = window.dashboard.isVisible;
                this.addTest('Dashboard Status', typeof status === 'boolean', `Visible: ${status}`);
                
                // Test dashboard toggle
                const toggleBtn = document.getElementById('dashboard-toggle');
                this.addTest('Dashboard Toggle', toggleBtn !== null, toggleBtn ? 'Toggle exists' : 'Toggle missing');
                
                // Test dashboard container
                const container = document.getElementById('intelligent-dashboard');
                this.addTest('Dashboard Container', container !== null, container ? 'Container exists' : 'Container missing');
            } else {
                this.addError('Dashboard', 'Module not found');
            }
        } catch (error) {
            this.addError('Dashboard Test', error.message);
        }
    }

    async testNotifications() {
        try {
            if (window.smartNotifications) {
                // Test notification container
                const container = document.getElementById('notification-container');
                this.addTest('Notification Container', container !== null, container ? 'Container exists' : 'Container missing');
                
                // Test notification display
                window.smartNotifications.show({
                    title: 'Test Notification',
                    message: 'System test notification',
                    type: 'info',
                    duration: 1000
                });
                this.addTest('Notification Display', true, 'Test notification sent');
                
                // Test settings
                const settings = window.smartNotifications.getSettings();
                this.addTest('Notification Settings', settings !== undefined, `Enabled: ${settings.enabled}`);
            } else {
                this.addError('Smart Notifications', 'Module not found');
            }
        } catch (error) {
            this.addError('Notifications Test', error.message);
        }
    }

    async testAutomation() {
        try {
            if (window.automationCore) {
                const automations = window.automationCore.getAutomations();
                this.addTest('Automation Core', Array.isArray(automations), `Automations: ${automations.length}`);
                
                const stats = window.automationCore.getAutomationStats();
                this.addTest('Automation Stats', stats !== undefined, `Active: ${stats.active}, Total: ${stats.total}`);
            } else {
                this.addError('Automation Core', 'Module not found');
            }
            
            if (window.behavioralEngine) {
                const insights = window.behavioralEngine.getInsights();
                this.addTest('Behavioral Engine', insights !== undefined, `Sessions: ${insights.totalSessions || 0}`);
            } else {
                this.addError('Behavioral Engine', 'Module not found');
            }
        } catch (error) {
            this.addError('Automation Test', error.message);
        }
    }

    async testUIAdaptation() {
        try {
            if (window.adaptiveUI) {
                const adaptations = window.adaptiveUI.getCurrentAdaptations();
                this.addTest('Adaptive UI', Array.isArray(adaptations), `Adaptations: ${adaptations.length}`);
                
                const settings = window.adaptiveUI.getAdaptationSettings();
                this.addTest('UI Settings', settings !== undefined, `Performance mode: ${settings.performanceMode}`);
            } else {
                this.addError('Adaptive UI', 'Module not found');
            }
        } catch (error) {
            this.addError('UI Adaptation Test', error.message);
        }
    }

    async testPerformance() {
        this.log('⚡ Testing performance...');
        
        const start = performance.now();
        
        // Memory usage
        if (performance.memory) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
            this.performance.memory = memory;
            this.addTest('Memory Usage', memory.used < memory.limit * 0.8, `${memory.used}MB / ${memory.limit}MB`);
        }
        
        // DOM elements
        const elements = document.querySelectorAll('*').length;
        this.addTest('DOM Elements', elements < 5000, `${elements} elements`);
        
        // Event listeners
        const listeners = this.countEventListeners();
        this.addTest('Event Listeners', listeners < 100, `${listeners} listeners`);
        
        // Module load time
        const loadTime = performance.now() - start;
        this.performance.testTime = loadTime;
        this.addTest('Test Performance', loadTime < 1000, `${loadTime.toFixed(2)}ms`);
    }

    async testIntegrations() {
        this.log('🔗 Testing integrations...');
        
        // Test localStorage
        try {
            localStorage.setItem('test', 'value');
            const value = localStorage.getItem('test');
            localStorage.removeItem('test');
            this.addTest('LocalStorage', value === 'value', 'Read/write successful');
        } catch (error) {
            this.addError('LocalStorage', error.message);
        }
        
        // Test Web APIs
        this.addTest('Notifications API', 'Notification' in window, 'API available');
        this.addTest('Speech API', 'speechSynthesis' in window, 'API available');
        this.addTest('Geolocation API', 'geolocation' in navigator, 'API available');
        
        // Test network connectivity
        this.addTest('Network Status', navigator.onLine, navigator.onLine ? 'Online' : 'Offline');
    }

    countEventListeners() {
        // Simplified event listener count
        let count = 0;
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.onclick || el.onchange || el.onkeydown) count++;
        });
        return count;
    }

    addTest(name, passed, details = '') {
        this.testResults.push({
            name,
            passed,
            details,
            timestamp: Date.now()
        });
    }

    addError(context, message) {
        this.errors.push({
            context,
            message,
            timestamp: Date.now()
        });
    }

    log(message) {
        console.log(`[SystemTester] ${message}`);
    }

    displayResults() {
        const moduleTests = document.getElementById('module-tests');
        const featureTests = document.getElementById('feature-tests');
        const performanceTests = document.getElementById('performance-tests');
        const errorLog = document.getElementById('error-log');
        
        // Clear previous results
        [moduleTests, featureTests, performanceTests, errorLog].forEach(el => {
            if (el) el.innerHTML = '';
        });
        
        // Display test results
        this.testResults.forEach(test => {
            const div = document.createElement('div');
            div.className = `test-result ${test.passed ? 'pass' : 'fail'}`;
            div.innerHTML = `
                <span class="test-status">${test.passed ? '✅' : '❌'}</span>
                <span class="test-name">${test.name}</span>
                <span class="test-details">${test.details}</span>
            `;
            
            if (test.name.includes('Module:')) {
                moduleTests?.appendChild(div);
            } else if (test.name.includes('Memory') || test.name.includes('Performance') || test.name.includes('DOM')) {
                performanceTests?.appendChild(div);
            } else {
                featureTests?.appendChild(div);
            }
        });
        
        // Display errors
        this.errors.forEach(error => {
            const div = document.createElement('div');
            div.className = 'error-item';
            div.innerHTML = `
                <span class="error-context">${error.context}:</span>
                <span class="error-message">${error.message}</span>
            `;
            errorLog?.appendChild(div);
        });
        
        // Add summary
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        summary.innerHTML = `
            <h4>Summary: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)</h4>
            <p>Errors: ${this.errors.length}</p>
            <p>Performance: ${this.performance.testTime?.toFixed(2)}ms</p>
        `;
        document.getElementById('performance-tests')?.appendChild(summary);
    }

    runStartupTests() {
        // Quick startup validation
        setTimeout(() => {
            const criticalModules = ['aiSuggestions', 'smartNotifications'];
            let startupIssues = 0;
            
            criticalModules.forEach(module => {
                if (!window[module]) {
                    console.error(`❌ Critical module ${module} failed to load`);
                    startupIssues++;
                }
            });
            
            if (startupIssues === 0) {
                console.log('✅ All critical modules loaded successfully');
            } else {
                console.warn(`⚠️ ${startupIssues} critical modules failed to load`);
            }
        }, 2000);
    }

    // Public API
    runQuickTest() {
        this.togglePanel();
        setTimeout(() => this.runAllTests(), 100);
    }

    getTestReport() {
        return {
            results: this.testResults,
            errors: this.errors,
            performance: this.performance,
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(t => t.passed).length,
                failed: this.testResults.filter(t => !t.passed).length,
                errors: this.errors.length
            }
        };
    }
}

// Add test panel styles
const testStyles = `
<style>
.test-header {
    padding: 10px;
    background: #333;
    border-bottom: 1px solid #555;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.test-header h3 {
    margin: 0;
    color: #4CAF50;
}

.test-header button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
}

.test-header button:hover {
    background: #45a049;
}

.test-content {
    padding: 10px;
    max-height: 500px;
    overflow-y: auto;
}

.test-section {
    margin-bottom: 15px;
}

.test-section h4 {
    color: #FFF;
    margin: 0 0 5px 0;
    font-size: 13px;
}

.test-result {
    display: flex;
    align-items: center;
    padding: 3px 0;
    font-size: 11px;
}

.test-result.pass {
    color: #4CAF50;
}

.test-result.fail {
    color: #f44336;
}

.test-status {
    width: 20px;
}

.test-name {
    flex: 1;
    font-weight: bold;
}

.test-details {
    color: #ccc;
    font-size: 10px;
}

.error-item {
    color: #f44336;
    font-size: 11px;
    margin: 2px 0;
}

.error-context {
    font-weight: bold;
}

.test-summary {
    background: #222;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
}

.test-summary h4 {
    color: #4CAF50;
    margin: 0 0 5px 0;
}

.test-summary p {
    margin: 2px 0;
    color: #ccc;
    font-size: 11px;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', testStyles);

// Initialize and expose globally
window.SystemTester = SystemTester;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.systemTester = new SystemTester();
    });
} else {
    window.systemTester = new SystemTester();
}

// Add global test shortcut
console.log('🧪 System Tester loaded! Press Ctrl+Shift+T to open test panel or run window.systemTester.runQuickTest()');