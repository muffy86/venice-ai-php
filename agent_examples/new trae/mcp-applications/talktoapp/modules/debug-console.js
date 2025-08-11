/**
 * Debug Console - Real-time debugging and monitoring
 */

class DebugConsole {
    constructor() {
        this.logs = [];
        this.filters = { info: true, warn: true, error: true, debug: true };
        this.isVisible = false;
        this.init();
    }

    init() {
        this.interceptConsole();
        this.createDebugInterface();
        this.startMonitoring();
    }

    interceptConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            this.addLog('info', args.join(' '));
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.addLog('warn', args.join(' '));
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.addLog('error', args.join(' '));
            originalError.apply(console, args);
        };

        // Catch unhandled errors
        window.addEventListener('error', (e) => {
            this.addLog('error', `${e.filename}:${e.lineno} - ${e.message}`);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.addLog('error', `Unhandled Promise: ${e.reason}`);
        });
    }

    createDebugInterface() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-console';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <span>🐛 Debug Console</span>
                <div class="debug-controls">
                    <button id="clear-logs">Clear</button>
                    <button id="export-logs">Export</button>
                    <button id="toggle-debug">×</button>
                </div>
            </div>
            <div class="debug-filters">
                <label><input type="checkbox" id="filter-info" checked> Info</label>
                <label><input type="checkbox" id="filter-warn" checked> Warn</label>
                <label><input type="checkbox" id="filter-error" checked> Error</label>
                <label><input type="checkbox" id="filter-debug" checked> Debug</label>
            </div>
            <div class="debug-content" id="debug-logs"></div>
            <div class="debug-input">
                <input type="text" id="debug-command" placeholder="Enter command...">
                <button id="execute-command">Run</button>
            </div>
        `;
        
        debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 450px;
            width: 500px;
            height: 400px;
            background: rgba(0, 0, 0, 0.95);
            color: #00ff00;
            border: 1px solid #333;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 25000;
            display: none;
            flex-direction: column;
        `;
        
        document.body.appendChild(debugPanel);
        this.setupDebugEvents();
    }

    setupDebugEvents() {
        document.getElementById('clear-logs').onclick = () => this.clearLogs();
        document.getElementById('export-logs').onclick = () => this.exportLogs();
        document.getElementById('toggle-debug').onclick = () => this.toggle();
        document.getElementById('execute-command').onclick = () => this.executeCommand();
        
        document.getElementById('debug-command').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.executeCommand();
        });

        // Filter checkboxes
        ['info', 'warn', 'error', 'debug'].forEach(type => {
            document.getElementById(`filter-${type}`).onchange = (e) => {
                this.filters[type] = e.target.checked;
                this.refreshLogs();
            };
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggle();
            }
        });
    }

    addLog(type, message) {
        const log = {
            type,
            message,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random()
        };
        
        this.logs.push(log);
        
        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        if (this.isVisible) {
            this.displayLog(log);
        }
    }

    displayLog(log) {
        if (!this.filters[log.type]) return;
        
        const logsContainer = document.getElementById('debug-logs');
        const logElement = document.createElement('div');
        logElement.className = `debug-log ${log.type}`;
        logElement.innerHTML = `
            <span class="log-time">[${log.timestamp}]</span>
            <span class="log-type">[${log.type.toUpperCase()}]</span>
            <span class="log-message">${log.message}</span>
        `;
        
        logsContainer.appendChild(logElement);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    refreshLogs() {
        const logsContainer = document.getElementById('debug-logs');
        logsContainer.innerHTML = '';
        
        this.logs.forEach(log => this.displayLog(log));
    }

    executeCommand() {
        const input = document.getElementById('debug-command');
        const command = input.value.trim();
        
        if (!command) return;
        
        this.addLog('debug', `> ${command}`);
        
        try {
            const result = this.processCommand(command);
            this.addLog('info', `< ${JSON.stringify(result)}`);
        } catch (error) {
            this.addLog('error', `< ${error.message}`);
        }
        
        input.value = '';
    }

    processCommand(command) {
        // Built-in commands
        if (command === 'help') {
            return 'Commands: help, status, modules, test, clear, memory, performance, suggestions';
        }
        
        if (command === 'status') {
            return this.getSystemStatus();
        }
        
        if (command === 'modules') {
            return this.getModuleStatus();
        }
        
        if (command === 'test') {
            window.systemTester?.runQuickTest();
            return 'Running system tests...';
        }
        
        if (command === 'clear') {
            this.clearLogs();
            return 'Logs cleared';
        }
        
        if (command === 'memory') {
            return this.getMemoryInfo();
        }
        
        if (command === 'performance') {
            return this.getPerformanceInfo();
        }
        
        if (command === 'suggestions') {
            return window.aiSuggestions?.getSuggestionStats() || 'AI Suggestions not available';
        }
        
        // Try to evaluate as JavaScript
        return eval(command);
    }

    getSystemStatus() {
        return {
            timestamp: new Date().toISOString(),
            modules: Object.keys(window).filter(key => 
                typeof window[key] === 'object' && 
                window[key]?.constructor?.name?.includes('Engine') ||
                window[key]?.constructor?.name?.includes('Manager') ||
                window[key]?.constructor?.name?.includes('Core')
            ).length,
            errors: this.logs.filter(log => log.type === 'error').length,
            warnings: this.logs.filter(log => log.type === 'warn').length,
            uptime: performance.now()
        };
    }

    getModuleStatus() {
        const modules = [
            'behavioralEngine', 'automationCore', 'contextualIntelligence',
            'smartNotifications', 'adaptiveUI', 'aiOrchestration',
            'neuralAutomation', 'enterpriseHub', 'quantumAI',
            'edgeComputing', 'blockchainLedger', 'metaverseInterface',
            'aiSuggestions', 'systemTester'
        ];
        
        return modules.map(module => ({
            name: module,
            loaded: window[module] !== undefined,
            type: window[module]?.constructor?.name || 'Unknown'
        }));
    }

    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
            };
        }
        return 'Memory info not available';
    }

    getPerformanceInfo() {
        return {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart + 'ms',
            domElements: document.querySelectorAll('*').length,
            eventListeners: this.countEventListeners(),
            fps: this.getFPS()
        };
    }

    countEventListeners() {
        let count = 0;
        document.querySelectorAll('*').forEach(el => {
            const events = ['onclick', 'onchange', 'onkeydown', 'onmouseover'];
            events.forEach(event => {
                if (el[event]) count++;
            });
        });
        return count;
    }

    getFPS() {
        // Simplified FPS calculation
        let fps = 0;
        let lastTime = performance.now();
        
        const calculateFPS = () => {
            const currentTime = performance.now();
            fps = Math.round(1000 / (currentTime - lastTime));
            lastTime = currentTime;
        };
        
        calculateFPS();
        return fps;
    }

    startMonitoring() {
        // Monitor system health every 5 seconds
        setInterval(() => {
            this.checkSystemHealth();
        }, 5000);
    }

    checkSystemHealth() {
        // Check for memory leaks
        if (performance.memory && performance.memory.usedJSHeapSize > 100 * 1048576) {
            this.addLog('warn', 'High memory usage detected: ' + 
                Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
        }
        
        // Check for too many DOM elements
        const elements = document.querySelectorAll('*').length;
        if (elements > 5000) {
            this.addLog('warn', `High DOM element count: ${elements}`);
        }
        
        // Check for errors in the last minute
        const recentErrors = this.logs.filter(log => 
            log.type === 'error' && 
            Date.now() - new Date(log.timestamp).getTime() < 60000
        );
        
        if (recentErrors.length > 5) {
            this.addLog('warn', `${recentErrors.length} errors in the last minute`);
        }
    }

    clearLogs() {
        this.logs = [];
        document.getElementById('debug-logs').innerHTML = '';
    }

    exportLogs() {
        const data = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            system: this.getSystemStatus(),
            modules: this.getModuleStatus()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    toggle() {
        const panel = document.getElementById('debug-console');
        this.isVisible = !this.isVisible;
        panel.style.display = this.isVisible ? 'flex' : 'none';
        
        if (this.isVisible) {
            this.refreshLogs();
        }
    }

    // Public API
    debug(message) {
        this.addLog('debug', message);
    }

    info(message) {
        this.addLog('info', message);
    }

    warn(message) {
        this.addLog('warn', message);
    }

    error(message) {
        this.addLog('error', message);
    }
}

// Add debug console styles
const debugStyles = `
<style>
.debug-header {
    background: #1a1a1a;
    padding: 8px 12px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #00ff00;
    font-weight: bold;
}

.debug-controls button {
    background: #333;
    color: #00ff00;
    border: 1px solid #555;
    padding: 4px 8px;
    margin-left: 4px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
}

.debug-controls button:hover {
    background: #555;
}

.debug-filters {
    background: #2a2a2a;
    padding: 6px 12px;
    border-bottom: 1px solid #333;
    display: flex;
    gap: 15px;
}

.debug-filters label {
    color: #ccc;
    font-size: 11px;
    cursor: pointer;
}

.debug-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background: #000;
}

.debug-log {
    margin: 2px 0;
    font-size: 11px;
    line-height: 1.4;
}

.debug-log.info { color: #00ff00; }
.debug-log.warn { color: #ffaa00; }
.debug-log.error { color: #ff4444; }
.debug-log.debug { color: #00aaff; }

.log-time { color: #666; }
.log-type { 
    color: #fff; 
    font-weight: bold;
    margin: 0 5px;
}

.debug-input {
    background: #1a1a1a;
    padding: 8px;
    border-top: 1px solid #333;
    display: flex;
    gap: 8px;
}

.debug-input input {
    flex: 1;
    background: #000;
    color: #00ff00;
    border: 1px solid #333;
    padding: 4px 8px;
    border-radius: 3px;
    font-family: inherit;
    font-size: 11px;
}

.debug-input button {
    background: #333;
    color: #00ff00;
    border: 1px solid #555;
    padding: 4px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
}

.debug-input button:hover {
    background: #555;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', debugStyles);

// Initialize and expose globally
window.DebugConsole = DebugConsole;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.debugConsole = new DebugConsole();
    });
} else {
    window.debugConsole = new DebugConsole();
}

console.log('🐛 Debug Console loaded! Press Ctrl+Shift+D to open or use window.debugConsole methods');