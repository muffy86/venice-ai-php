/**
 * API Orchestrator - Core Engine
 * World-Class MCP Management System
 * 
 * Features:
 * - Intelligent API lifecycle management
 * - Automated error recovery
 * - Dynamic load balancing
 * - Real-time health monitoring
 * - Advanced caching strategies
 */

class APIOrchestrator {
    constructor() {
        this.apis = new Map();
        this.routes = new Map();
        this.cache = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            activeConnections: 0,
            cacheHitRate: 0
        };
        this.config = {
            maxRetries: 3,
            timeout: 30000,
            cacheTimeout: 300000, // 5 minutes
            healthCheckInterval: 30000, // 30 seconds
            maxConcurrentRequests: 100,
            rateLimitWindow: 60000, // 1 minute
            autoRecovery: true,
            loadBalancing: 'round-robin'
        };
        this.eventListeners = new Map();
        this.requestQueue = [];
        this.processing = false;
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 API Orchestrator initializing...');
        
        // Initialize MCP connections
        await this.initializeMCPConnections();
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        // Initialize performance monitoring
        this.startPerformanceMonitoring();
        
        // Setup automatic discovery
        this.setupAutoDiscovery();
        
        // Start request processing
        this.startRequestProcessing();
        
        console.log('✅ API Orchestrator initialized successfully');
        this.emit('initialized', { timestamp: Date.now() });
    }

    async initializeMCPConnections() {
        const mcpServers = [
            {
                name: 'filesystem',
                command: 'npx -y @modelcontextprotocol/server-filesystem',
                args: ['C:\\Users\\aiech\\OneDrive\\Documents'],
                capabilities: ['file-operations', 'directory-listing', 'search'],
                priority: 'high'
            },
            {
                name: 'memory',
                command: 'npx -y @modelcontextprotocol/server-memory',
                args: [],
                capabilities: ['knowledge-graph', 'entity-management', 'relations'],
                priority: 'high'
            },
            {
                name: 'puppeteer',
                command: 'npx -y @modelcontextprotocol/server-puppeteer',
                args: [],
                capabilities: ['browser-automation', 'screenshot', 'web-interaction'],
                priority: 'medium'
            },
            {
                name: 'brave-search',
                command: 'npx -y @modelcontextprotocol/server-brave-search',
                args: [],
                capabilities: ['web-search', 'local-search', 'real-time-data'],
                priority: 'medium'
            },
            {
                name: 'sequential-thinking',
                command: 'npx -y @modelcontextprotocol/server-sequential-thinking',
                args: [],
                capabilities: ['problem-solving', 'analysis', 'reasoning'],
                priority: 'low'
            }
        ];

        for (const server of mcpServers) {
            try {
                await this.registerAPI(server);
                console.log(`✅ MCP Server ${server.name} registered successfully`);
            } catch (error) {
                console.error(`❌ Failed to register MCP Server ${server.name}:`, error);
                this.emit('api-error', { api: server.name, error: error.message });
            }
        }
    }

    async registerAPI(apiConfig) {
        const api = {
            ...apiConfig,
            id: this.generateId(),
            status: 'initializing',
            health: 'unknown',
            lastHealthCheck: null,
            responseTime: 0,
            requestCount: 0,
            errorCount: 0,
            retryCount: 0,
            lastError: null,
            createdAt: Date.now(),
            lastActive: Date.now()
        };

        this.apis.set(api.id, api);
        
        try {
            // Test API connectivity
            await this.testAPIConnection(api.id);
            api.status = 'active';
            api.health = 'healthy';
            
            this.emit('api-registered', { api: api.name, id: api.id });
            return api.id;
        } catch (error) {
            api.status = 'error';
            api.health = 'unhealthy';
            api.lastError = error.message;
            throw error;
        }
    }

    async testAPIConnection(apiId) {
        const api = this.apis.get(apiId);
        if (!api) throw new Error(`API ${apiId} not found`);

        const startTime = Date.now();
        
        try {
            // Simulate API health check
            // In real implementation, this would ping the actual MCP server
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            
            api.responseTime = Date.now() - startTime;
            api.lastHealthCheck = Date.now();
            api.health = 'healthy';
            
            return true;
        } catch (error) {
            api.health = 'unhealthy';
            api.lastError = error.message;
            throw error;
        }
    }

    async executeRequest(apiId, method, params = {}, options = {}) {
        const request = {
            id: this.generateId(),
            apiId,
            method,
            params,
            options: {
                ...this.config,
                ...options
            },
            createdAt: Date.now(),
            status: 'pending'
        };

        this.requestQueue.push(request);
        this.metrics.totalRequests++;
        
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
        });
    }

    async processRequest(request) {
        const api = this.apis.get(request.apiId);
        if (!api) {
            request.reject(new Error(`API ${request.apiId} not found`));
            return;
        }

        const startTime = Date.now();
        request.status = 'processing';
        
        try {
            // Check rate limiting
            if (!this.checkRateLimit(request.apiId)) {
                throw new Error('Rate limit exceeded');
            }

            // Check cache
            const cacheKey = this.generateCacheKey(request);
            const cachedResult = this.getFromCache(cacheKey);
            
            if (cachedResult) {
                request.status = 'completed';
                request.fromCache = true;
                request.resolve(cachedResult);
                this.metrics.successfulRequests++;
                return;
            }

            // Execute the actual request
            const result = await this.executeAPICall(api, request.method, request.params);
            
            // Cache the result
            this.setCache(cacheKey, result);
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            api.responseTime = responseTime;
            api.requestCount++;
            api.lastActive = Date.now();
            
            request.status = 'completed';
            request.responseTime = responseTime;
            request.resolve(result);
            
            this.metrics.successfulRequests++;
            this.updateAverageResponseTime(responseTime);
            
        } catch (error) {
            // Handle retry logic
            if (request.options.maxRetries > 0 && api.retryCount < request.options.maxRetries) {
                api.retryCount++;
                request.options.maxRetries--;
                
                // Exponential backoff
                const delay = Math.pow(2, api.retryCount) * 1000;
                setTimeout(() => {
                    this.requestQueue.unshift(request); // Priority retry
                }, delay);
                
                this.emit('request-retry', { 
                    requestId: request.id, 
                    apiId: request.apiId, 
                    attempt: api.retryCount 
                });
                return;
            }

            // Max retries exceeded or non-retryable error
            api.errorCount++;
            api.lastError = error.message;
            request.status = 'failed';
            request.error = error.message;
            request.reject(error);
            
            this.metrics.failedRequests++;
            this.emit('request-failed', { 
                requestId: request.id, 
                apiId: request.apiId, 
                error: error.message 
            });

            // Auto-recovery attempt
            if (this.config.autoRecovery && api.errorCount > 3) {
                this.attemptAutoRecovery(request.apiId);
            }
        }
    }

    async executeAPICall(api, method, params) {
        // Simulate MCP tool execution
        // In real implementation, this would use the actual MCP protocol
        
        switch (api.name) {
            case 'filesystem':
                return this.executeFilesystemOperation(method, params);
            case 'memory':
                return this.executeMemoryOperation(method, params);
            case 'puppeteer':
                return this.executePuppeteerOperation(method, params);
            case 'brave-search':
                return this.executeBraveSearchOperation(method, params);
            case 'sequential-thinking':
                return this.executeThinkingOperation(method, params);
            default:
                throw new Error(`Unknown API: ${api.name}`);
        }
    }

    async executeFilesystemOperation(method, params) {
        // Simulate filesystem operations
        const operations = {
            'read_file': () => ({ content: 'File content...', size: 1024 }),
            'write_file': () => ({ success: true, path: params.path }),
            'list_directory': () => ({ files: ['file1.txt', 'file2.js'], count: 2 }),
            'search_files': () => ({ matches: [{ file: 'test.js', line: 10 }] })
        };
        
        const operation = operations[method];
        if (!operation) throw new Error(`Unknown filesystem operation: ${method}`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        return operation();
    }

    async executeMemoryOperation(method, params) {
        // Simulate memory/knowledge graph operations
        const operations = {
            'create_entities': () => ({ created: params.entities?.length || 1 }),
            'search_nodes': () => ({ nodes: [{ name: 'Entity1', type: 'concept' }] }),
            'read_graph': () => ({ entities: 10, relations: 15 }),
            'add_observations': () => ({ added: params.observations?.length || 1 })
        };
        
        const operation = operations[method];
        if (!operation) throw new Error(`Unknown memory operation: ${method}`);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
        
        return operation();
    }

    async executePuppeteerOperation(method, params) {
        // Simulate browser automation operations
        const operations = {
            'navigate': () => ({ url: params.url, status: 'success' }),
            'screenshot': () => ({ image: 'base64-encoded-image', size: { width: 1920, height: 1080 } }),
            'click': () => ({ element: params.selector, clicked: true }),
            'evaluate': () => ({ result: 'Script executed successfully' })
        };
        
        const operation = operations[method];
        if (!operation) throw new Error(`Unknown puppeteer operation: ${method}`);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
        
        return operation();
    }

    async executeBraveSearchOperation(method, params) {
        // Simulate web search operations
        const operations = {
            'web_search': () => ({ 
                results: Array.from({ length: 10 }, (_, i) => ({
                    title: `Result ${i + 1}`,
                    url: `https://example${i + 1}.com`,
                    snippet: 'Search result snippet...'
                })),
                count: 10
            }),
            'local_search': () => ({ 
                businesses: [
                    { name: 'Local Business', address: '123 Main St', rating: 4.5 }
                ]
            })
        };
        
        const operation = operations[method];
        if (!operation) throw new Error(`Unknown search operation: ${method}`);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));
        
        return operation();
    }

    async executeThinkingOperation(method, params) {
        // Simulate sequential thinking operations
        return {
            thought: params.thought || 'Generated thought',
            nextThoughtNeeded: false,
            thoughtNumber: params.thoughtNumber || 1,
            totalThoughts: params.totalThoughts || 1
        };
    }

    startRequestProcessing() {
        if (this.processing) return;
        
        this.processing = true;
        
        const processNext = async () => {
            if (this.requestQueue.length === 0) {
                setTimeout(processNext, 10);
                return;
            }

            const request = this.requestQueue.shift();
            if (request) {
                await this.processRequest(request);
            }
            
            // Continue processing
            setImmediate(processNext);
        };
        
        processNext();
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    async performHealthChecks() {
        const healthCheckPromises = Array.from(this.apis.keys()).map(async (apiId) => {
            try {
                await this.testAPIConnection(apiId);
                this.emit('health-check-success', { apiId });
            } catch (error) {
                this.emit('health-check-failed', { apiId, error: error.message });
            }
        });

        await Promise.allSettled(healthCheckPromises);
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
    }

    updatePerformanceMetrics() {
        // Calculate cache hit rate
        const totalCacheAccess = this.metrics.totalRequests;
        const cacheHits = Array.from(this.requestQueue).filter(r => r.fromCache).length;
        this.metrics.cacheHitRate = totalCacheAccess > 0 ? (cacheHits / totalCacheAccess) * 100 : 0;

        // Update active connections
        this.metrics.activeConnections = Array.from(this.apis.values())
            .filter(api => api.status === 'active' && api.health === 'healthy').length;

        this.emit('metrics-updated', this.metrics);
    }

    // Caching methods
    generateCacheKey(request) {
        return `${request.apiId}:${request.method}:${JSON.stringify(request.params)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Rate limiting
    checkRateLimit(apiId) {
        // Simple rate limiting implementation
        const api = this.apis.get(apiId);
        if (!api) return false;

        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        // Count requests in the current window
        const recentRequests = this.requestQueue.filter(r => 
            r.apiId === apiId && r.createdAt > windowStart
        ).length;

        return recentRequests < this.config.maxConcurrentRequests;
    }

    // Auto-recovery
    async attemptAutoRecovery(apiId) {
        const api = this.apis.get(apiId);
        if (!api) return;

        console.log(`🔄 Attempting auto-recovery for API ${api.name}`);
        this.emit('auto-recovery-started', { apiId, apiName: api.name });

        try {
            // Reset error count
            api.errorCount = 0;
            api.retryCount = 0;
            
            // Test connection
            await this.testAPIConnection(apiId);
            
            api.status = 'active';
            console.log(`✅ Auto-recovery successful for API ${api.name}`);
            this.emit('auto-recovery-success', { apiId, apiName: api.name });
            
        } catch (error) {
            api.status = 'error';
            console.error(`❌ Auto-recovery failed for API ${api.name}:`, error);
            this.emit('auto-recovery-failed', { apiId, apiName: api.name, error: error.message });
        }
    }

    // Utility methods
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    updateAverageResponseTime(responseTime) {
        const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    }

    // Event system
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Public API methods
    getAPIStatus() {
        return Array.from(this.apis.values()).map(api => ({
            id: api.id,
            name: api.name,
            status: api.status,
            health: api.health,
            responseTime: api.responseTime,
            requestCount: api.requestCount,
            errorCount: api.errorCount,
            lastActive: api.lastActive
        }));
    }

    getMetrics() {
        return { ...this.metrics };
    }

    async refreshAPI(apiId) {
        try {
            await this.testAPIConnection(apiId);
            this.emit('api-refreshed', { apiId });
            return true;
        } catch (error) {
            this.emit('api-refresh-failed', { apiId, error: error.message });
            return false;
        }
    }

    async restartFailedAPIs() {
        const failedAPIs = Array.from(this.apis.entries())
            .filter(([_, api]) => api.status === 'error' || api.health === 'unhealthy')
            .map(([id, _]) => id);

        const results = await Promise.allSettled(
            failedAPIs.map(id => this.attemptAutoRecovery(id))
        );

        return {
            attempted: failedAPIs.length,
            successful: results.filter(r => r.status === 'fulfilled').length
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIOrchestrator;
} else {
    window.APIOrchestrator = APIOrchestrator;
}

// Global instance
let orchestratorInstance = null;

function getOrchestrator() {
    if (!orchestratorInstance) {
        orchestratorInstance = new APIOrchestrator();
    }
    return orchestratorInstance;
}

// Initialize performance monitoring
function startPerformanceMonitoring() {
    const orchestrator = getOrchestrator();
    
    orchestrator.on('metrics-updated', (metrics) => {
        updateDashboardMetrics(metrics);
    });
    
    orchestrator.on('api-error', (data) => {
        console.error(`API Error: ${data.api} - ${data.error}`);
        updateAPIList();
    });
    
    orchestrator.on('auto-recovery-success', (data) => {
        console.log(`Auto-recovery successful: ${data.apiName}`);
        updateAPIList();
    });
}

function updateDashboardMetrics(metrics) {
    // Update UI elements with new metrics
    const elements = {
        'totalRequests': `${(metrics.totalRequests / 1000).toFixed(1)}K`,
        'avgResponse': `${Math.round(metrics.averageResponseTime)}ms`,
        'activeApis': metrics.activeConnections,
        'uptime': `${(metrics.successfulRequests / Math.max(metrics.totalRequests, 1) * 100).toFixed(1)}%`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function loadAPIStatus() {
    const orchestrator = getOrchestrator();
    const apiList = document.getElementById('apiList');
    
    if (!apiList) return;
    
    const apis = orchestrator.getAPIStatus();
    apiList.innerHTML = '';
    
    apis.forEach(api => {
        const div = document.createElement('div');
        div.className = `api-item ${api.health === 'healthy' ? 'healthy' : api.health === 'unknown' ? 'warning' : 'error'}`;
        
        div.innerHTML = `
            <span>${api.name} (${api.requestCount} requests)</span>
            <span class="status-indicator status-${api.health === 'healthy' ? 'healthy' : api.health === 'unknown' ? 'warning' : 'error'}"></span>
        `;
        
        apiList.appendChild(div);
    });
}

function refreshAPIs() {
    const orchestrator = getOrchestrator();
    const apis = orchestrator.getAPIStatus();
    
    Promise.all(apis.map(api => orchestrator.refreshAPI(api.id)))
        .then(() => {
            showNotification('All APIs refreshed successfully!', 'success');
            loadAPIStatus();
        })
        .catch(error => {
            showNotification('Some APIs failed to refresh', 'error');
            loadAPIStatus();
        });
}

function restartFailedAPIs() {
    const orchestrator = getOrchestrator();
    
    orchestrator.restartFailedAPIs()
        .then(result => {
            showNotification(
                `Restart attempted: ${result.successful}/${result.attempted} successful`, 
                result.successful > 0 ? 'success' : 'warning'
            );
            loadAPIStatus();
        });
}
