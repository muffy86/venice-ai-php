/**
 * Enhanced Error Handling System
 * Provides comprehensive error management, logging, and recovery mechanisms
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorCallbacks = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Handle network errors
        this.setupNetworkErrorHandling();
    }

    setupNetworkErrorHandling() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.logError({
                        type: 'Network Error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        timestamp: new Date().toISOString()
                    });
                }
                return response;
            } catch (error) {
                this.logError({
                    type: 'Network Error',
                    message: error.message,
                    url: args[0],
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        };
    }

    logError(error) {
        // Add to error log
        this.errorLog.push(error);
        
        // Maintain log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Console logging with styling
        console.group(`🚨 ${error.type}`);
        console.error('Message:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
        if (error.url) console.error('URL:', error.url);
        console.error('Time:', error.timestamp);
        console.groupEnd();

        // Trigger error callbacks
        this.triggerErrorCallbacks(error);

        // Store in localStorage for persistence
        this.persistError(error);
    }

    triggerErrorCallbacks(error) {
        for (const [type, callback] of this.errorCallbacks) {
            if (error.type.includes(type) || type === 'all') {
                try {
                    callback(error);
                } catch (callbackError) {
                    console.error('Error in error callback:', callbackError);
                }
            }
        }
    }

    persistError(error) {
        try {
            const persistedErrors = JSON.parse(localStorage.getItem('ai_agent_errors') || '[]');
            persistedErrors.push(error);
            
            // Keep only last 100 errors
            if (persistedErrors.length > 100) {
                persistedErrors.splice(0, persistedErrors.length - 100);
            }
            
            localStorage.setItem('ai_agent_errors', JSON.stringify(persistedErrors));
        } catch (e) {
            console.warn('Failed to persist error:', e);
        }
    }

    onError(type, callback) {
        this.errorCallbacks.set(type, callback);
    }

    async retryOperation(operation, context = '') {
        const key = context || operation.toString();
        const attempts = this.retryAttempts.get(key) || 0;

        if (attempts >= this.maxRetries) {
            throw new Error(`Max retry attempts (${this.maxRetries}) exceeded for: ${context}`);
        }

        try {
            const result = await operation();
            this.retryAttempts.delete(key); // Reset on success
            return result;
        } catch (error) {
            this.retryAttempts.set(key, attempts + 1);
            
            // Exponential backoff
            const delay = Math.pow(2, attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            this.logError({
                type: 'Retry Attempt',
                message: `Retry ${attempts + 1}/${this.maxRetries} for: ${context}`,
                originalError: error.message,
                timestamp: new Date().toISOString()
            });

            return this.retryOperation(operation, context);
        }
    }

    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(-10),
            lastHour: 0
        };

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        this.errorLog.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // Count recent errors
            if (new Date(error.timestamp) > oneHourAgo) {
                stats.lastHour++;
            }
        });

        return stats;
    }

    clearErrors() {
        this.errorLog = [];
        localStorage.removeItem('ai_agent_errors');
    }

    exportErrors() {
        const data = {
            errors: this.errorLog,
            stats: this.getErrorStats(),
            exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-agent-errors-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.setupPerformanceObservers();
    }

    setupPerformanceObservers() {
        // Performance Observer for navigation timing
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(entry.entryType, entry);
                }
            });
            
            observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
            this.observers.push(observer);
        }

        // Memory usage monitoring
        this.startMemoryMonitoring();
    }

    startMemoryMonitoring() {
        setInterval(() => {
            if ('memory' in performance) {
                this.recordMetric('memory', {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }
        }, 30000); // Every 30 seconds
    }

    recordMetric(type, data) {
        if (!this.metrics.has(type)) {
            this.metrics.set(type, []);
        }
        
        const metrics = this.metrics.get(type);
        metrics.push(data);
        
        // Keep only last 100 entries per type
        if (metrics.length > 100) {
            metrics.shift();
        }
    }

    measureFunction(name, fn) {
        return async (...args) => {
            const start = performance.now();
            try {
                const result = await fn(...args);
                const duration = performance.now() - start;
                
                this.recordMetric('function-timing', {
                    name,
                    duration,
                    timestamp: Date.now(),
                    success: true
                });
                
                return result;
            } catch (error) {
                const duration = performance.now() - start;
                
                this.recordMetric('function-timing', {
                    name,
                    duration,
                    timestamp: Date.now(),
                    success: false,
                    error: error.message
                });
                
                throw error;
            }
        };
    }

    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: {}
        };

        for (const [type, data] of this.metrics) {
            if (type === 'function-timing') {
                const timings = data.reduce((acc, entry) => {
                    if (!acc[entry.name]) {
                        acc[entry.name] = { calls: 0, totalTime: 0, errors: 0 };
                    }
                    acc[entry.name].calls++;
                    acc[entry.name].totalTime += entry.duration;
                    if (!entry.success) acc[entry.name].errors++;
                    return acc;
                }, {});

                Object.keys(timings).forEach(name => {
                    timings[name].averageTime = timings[name].totalTime / timings[name].calls;
                });

                report.metrics[type] = timings;
            } else {
                report.metrics[type] = data.slice(-10); // Last 10 entries
            }
        }

        return report;
    }
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.PerformanceMonitor = PerformanceMonitor;