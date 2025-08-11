/**
 * Performance Monitor - Real-time system performance tracking
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: { current: 0, peak: 0, history: [] },
            cpu: { current: 0, history: [] },
            fps: { current: 0, history: [] },
            network: { requests: 0, errors: 0 },
            dom: { elements: 0, listeners: 0 }
        };
        this.isMonitoring = false;
        this.init();
    }

    init() {
        this.createPerformancePanel();
        this.startMonitoring();
        this.interceptNetworkRequests();
    }

    createPerformancePanel() {
        const panel = document.createElement('div');
        panel.id = 'performance-monitor';
        panel.innerHTML = `
            <div class="perf-header">
                <span>⚡ Performance</span>
                <button id="toggle-perf">×</button>
            </div>
            <div class="perf-metrics">
                <div class="metric">
                    <span class="metric-label">Memory:</span>
                    <span class="metric-value" id="memory-usage">0 MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU:</span>
                    <span class="metric-value" id="cpu-usage">0%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">FPS:</span>
                    <span class="metric-value" id="fps-counter">60</span>
                </div>
                <div class="metric">
                    <span class="metric-label">DOM:</span>
                    <span class="metric-value" id="dom-count">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Network:</span>
                    <span class="metric-value" id="network-status">0 req</span>
                </div>
            </div>
        `;
        
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 200px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            border: 1px solid #333;
            border-radius: 8px;
            font-family: monospace;
            font-size: 11px;
            z-index: 25000;
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('toggle-perf').onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };
    }

    startMonitoring() {
        this.isMonitoring = true;
        
        // Update metrics every second
        setInterval(() => {
            if (this.isMonitoring) {
                this.updateMetrics();
                this.updateDisplay();
            }
        }, 1000);
        
        // FPS monitoring
        this.startFPSMonitoring();
    }

    updateMetrics() {
        // Memory usage
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            this.metrics.memory.current = memoryMB;
            this.metrics.memory.peak = Math.max(this.metrics.memory.peak, memoryMB);
            this.metrics.memory.history.push(memoryMB);
            if (this.metrics.memory.history.length > 60) {
                this.metrics.memory.history.shift();
            }
        }
        
        // CPU usage (simplified estimation)
        const cpuUsage = this.estimateCPUUsage();
        this.metrics.cpu.current = cpuUsage;
        this.metrics.cpu.history.push(cpuUsage);
        if (this.metrics.cpu.history.length > 60) {
            this.metrics.cpu.history.shift();
        }
        
        // DOM elements
        this.metrics.dom.elements = document.querySelectorAll('*').length;
        this.metrics.dom.listeners = this.countEventListeners();
    }

    estimateCPUUsage() {
        const start = performance.now();
        let iterations = 0;
        
        // Run a small computation for 1ms
        while (performance.now() - start < 1) {
            iterations++;
        }
        
        // Normalize to percentage (rough estimation)
        const baselineIterations = 100000;
        return Math.min(Math.round((baselineIterations / iterations) * 10), 100);
    }

    startFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.metrics.fps.current = frameCount;
                this.metrics.fps.history.push(frameCount);
                if (this.metrics.fps.history.length > 60) {
                    this.metrics.fps.history.shift();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    countEventListeners() {
        let count = 0;
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const events = ['onclick', 'onchange', 'onkeydown', 'onmouseover', 'onload'];
            events.forEach(event => {
                if (el[event]) count++;
            });
        });
        return count;
    }

    interceptNetworkRequests() {
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest;
        
        // Intercept fetch requests
        window.fetch = (...args) => {
            this.metrics.network.requests++;
            return originalFetch.apply(this, args)
                .catch(error => {
                    this.metrics.network.errors++;
                    throw error;
                });
        };
        
        // Intercept XMLHttpRequest
        const self = this;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            
            xhr.send = function(...args) {
                self.metrics.network.requests++;
                
                xhr.addEventListener('error', () => {
                    self.metrics.network.errors++;
                });
                
                return originalSend.apply(this, args);
            };
            
            return xhr;
        };
    }

    updateDisplay() {
        const memoryEl = document.getElementById('memory-usage');
        const cpuEl = document.getElementById('cpu-usage');
        const fpsEl = document.getElementById('fps-counter');
        const domEl = document.getElementById('dom-count');
        const networkEl = document.getElementById('network-status');
        
        if (memoryEl) {
            memoryEl.textContent = `${this.metrics.memory.current} MB`;
            memoryEl.style.color = this.metrics.memory.current > 100 ? '#ff4444' : '#00ff00';
        }
        
        if (cpuEl) {
            cpuEl.textContent = `${this.metrics.cpu.current}%`;
            cpuEl.style.color = this.metrics.cpu.current > 80 ? '#ff4444' : '#00ff00';
        }
        
        if (fpsEl) {
            fpsEl.textContent = this.metrics.fps.current.toString();
            fpsEl.style.color = this.metrics.fps.current < 30 ? '#ff4444' : '#00ff00';
        }
        
        if (domEl) {
            domEl.textContent = this.metrics.dom.elements.toString();
            domEl.style.color = this.metrics.dom.elements > 5000 ? '#ff4444' : '#00ff00';
        }
        
        if (networkEl) {
            networkEl.textContent = `${this.metrics.network.requests} req`;
            networkEl.style.color = this.metrics.network.errors > 0 ? '#ff4444' : '#00ff00';
        }
    }

    // Performance alerts
    checkPerformanceAlerts() {
        const alerts = [];
        
        if (this.metrics.memory.current > 200) {
            alerts.push('High memory usage detected');
        }
        
        if (this.metrics.cpu.current > 90) {
            alerts.push('High CPU usage detected');
        }
        
        if (this.metrics.fps.current < 20) {
            alerts.push('Low FPS detected');
        }
        
        if (this.metrics.dom.elements > 10000) {
            alerts.push('Too many DOM elements');
        }
        
        return alerts;
    }

    // Public API
    getMetrics() {
        return this.metrics;
    }

    startProfiling() {
        console.log('🔍 Starting performance profiling...');
        this.profilingStart = performance.now();
        this.profilingData = {
            memory: [],
            cpu: [],
            fps: []
        };
    }

    stopProfiling() {
        if (!this.profilingStart) return null;
        
        const duration = performance.now() - this.profilingStart;
        const report = {
            duration,
            averageMemory: this.metrics.memory.history.reduce((a, b) => a + b, 0) / this.metrics.memory.history.length,
            averageCPU: this.metrics.cpu.history.reduce((a, b) => a + b, 0) / this.metrics.cpu.history.length,
            averageFPS: this.metrics.fps.history.reduce((a, b) => a + b, 0) / this.metrics.fps.history.length,
            peakMemory: this.metrics.memory.peak,
            alerts: this.checkPerformanceAlerts()
        };
        
        console.log('📊 Performance Report:', report);
        return report;
    }
}

// Add performance monitor styles
const perfStyles = `
<style>
.perf-header {
    background: #1a1a1a;
    padding: 6px 10px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}

.perf-header button {
    background: #333;
    color: #00ff00;
    border: none;
    width: 20px;
    height: 20px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
}

.perf-metrics {
    padding: 8px 10px;
}

.metric {
    display: flex;
    justify-content: space-between;
    margin: 3px 0;
}

.metric-label {
    color: #ccc;
}

.metric-value {
    color: #00ff00;
    font-weight: bold;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', perfStyles);

// Initialize and expose globally
window.PerformanceMonitor = PerformanceMonitor;
window.performanceMonitor = new PerformanceMonitor();

console.log('⚡ Performance Monitor loaded! Check bottom-right corner for real-time metrics');