/**
 * MCP Pipeline Manager - Manages multiple MCP pipelines with API key integration
 * Provides centralized management for various AI and service APIs
 */

class MCPPipelineManager {
    constructor() {
        this.pipelines = new Map();
        this.apiKeyManager = new APIKeyManager();
        this.requestQueue = [];
        this.rateLimits = new Map();
        this.analytics = new MCPAnalytics();
        this.isInitialized = false;
        this.startTime = Date.now();
        
        this.init();
    }

    async init() {
        await this.apiKeyManager.init();
        this.setupPipelines();
        this.startRequestProcessor();
        this.createUI();
        
        this.isInitialized = true;
        console.log('🔗 MCP Pipeline Manager initialized');
    }

    setupPipelines() {
        // OpenAI Pipeline
        this.registerPipeline('openai', {
            name: 'OpenAI GPT',
            baseUrl: 'https://api.openai.com/v1',
            endpoints: {
                chat: '/chat/completions',
                embeddings: '/embeddings',
                images: '/images/generations'
            },
            rateLimit: { requests: 60, window: 60000 }, // 60 requests per minute
            requiresAuth: true,
            authType: 'bearer'
        });

        // Anthropic Claude Pipeline
        this.registerPipeline('anthropic', {
            name: 'Anthropic Claude',
            baseUrl: 'https://api.anthropic.com/v1',
            endpoints: {
                messages: '/messages',
                complete: '/complete'
            },
            rateLimit: { requests: 50, window: 60000 },
            requiresAuth: true,
            authType: 'header',
            authHeader: 'x-api-key'
        });

        // Google AI Pipeline
        this.registerPipeline('google', {
            name: 'Google AI',
            baseUrl: 'https://generativelanguage.googleapis.com/v1',
            endpoints: {
                generateContent: '/models/gemini-pro:generateContent',
                embedContent: '/models/embedding-001:embedContent'
            },
            rateLimit: { requests: 60, window: 60000 },
            requiresAuth: true,
            authType: 'query',
            authParam: 'key'
        });

        // GitHub API Pipeline
        this.registerPipeline('github', {
            name: 'GitHub API',
            baseUrl: 'https://api.github.com',
            endpoints: {
                repos: '/user/repos',
                search: '/search/repositories',
                issues: '/repos/{owner}/{repo}/issues',
                commits: '/repos/{owner}/{repo}/commits'
            },
            rateLimit: { requests: 5000, window: 3600000 }, // 5000 per hour
            requiresAuth: true,
            authType: 'bearer'
        });

        // Weather API Pipeline
        this.registerPipeline('weather', {
            name: 'OpenWeatherMap',
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            endpoints: {
                current: '/weather',
                forecast: '/forecast',
                onecall: '/onecall'
            },
            rateLimit: { requests: 1000, window: 86400000 }, // 1000 per day
            requiresAuth: true,
            authType: 'query',
            authParam: 'appid'
        });

        // News API Pipeline
        this.registerPipeline('news', {
            name: 'NewsAPI',
            baseUrl: 'https://newsapi.org/v2',
            endpoints: {
                topHeadlines: '/top-headlines',
                everything: '/everything',
                sources: '/sources'
            },
            rateLimit: { requests: 1000, window: 86400000 },
            requiresAuth: true,
            authType: 'header',
            authHeader: 'X-API-Key'
        });

        // Database Connectors
        this.registerPipeline('supabase', {
            name: 'Supabase',
            baseUrl: '', // Will be set per project
            endpoints: {
                rest: '/rest/v1',
                auth: '/auth/v1',
                storage: '/storage/v1'
            },
            rateLimit: { requests: 100, window: 60000 },
            requiresAuth: true,
            authType: 'bearer'
        });

        // Social Media APIs
        this.registerPipeline('twitter', {
            name: 'Twitter API v2',
            baseUrl: 'https://api.twitter.com/2',
            endpoints: {
                tweets: '/tweets',
                users: '/users',
                search: '/tweets/search/recent'
            },
            rateLimit: { requests: 300, window: 900000 }, // 300 per 15 minutes
            requiresAuth: true,
            authType: 'bearer'
        });

        console.log(`📡 Registered ${this.pipelines.size} MCP pipelines`);
    }

    registerPipeline(id, config) {
        this.pipelines.set(id, {
            ...config,
            id: id,
            isActive: false,
            lastUsed: null,
            requestCount: 0,
            errorCount: 0,
            avgResponseTime: 0
        });

        // Initialize rate limiting
        this.rateLimits.set(id, {
            requests: [],
            blocked: false,
            resetTime: null
        });
    }

    async activatePipeline(pipelineId, apiKey, additionalConfig = {}) {
        const pipeline = this.pipelines.get(pipelineId);
        if (!pipeline) {
            throw new Error(`Pipeline ${pipelineId} not found`);
        }

        // Store API key securely
        await this.apiKeyManager.storeKey(pipelineId, apiKey, additionalConfig);

        // Mark pipeline as active
        pipeline.isActive = true;
        pipeline.config = { ...pipeline.config, ...additionalConfig };

        console.log(`✅ Activated pipeline: ${pipeline.name}`);
        this.updateUI();
    }

    async deactivatePipeline(pipelineId) {
        const pipeline = this.pipelines.get(pipelineId);
        if (pipeline) {
            pipeline.isActive = false;
            await this.apiKeyManager.removeKey(pipelineId);
            console.log(`❌ Deactivated pipeline: ${pipeline.name}`);
            this.updateUI();
        }
    }

    async makeRequest(pipelineId, endpoint, options = {}) {
        const pipeline = this.pipelines.get(pipelineId);
        if (!pipeline || !pipeline.isActive) {
            throw new Error(`Pipeline ${pipelineId} is not active`);
        }

        // Check rate limits
        if (this.isRateLimited(pipelineId)) {
            throw new Error(`Rate limit exceeded for ${pipelineId}`);
        }

        // Queue the request
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                pipelineId,
                endpoint,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            });
        });
    }

    async processRequest(request) {
        const { pipelineId, endpoint, options } = request;
        const pipeline = this.pipelines.get(pipelineId);
        const startTime = Date.now();

        try {
            // Get API key
            const apiKey = await this.apiKeyManager.getKey(pipelineId);
            if (!apiKey) {
                throw new Error(`No API key found for ${pipelineId}`);
            }

            // Build request URL
            const url = this.buildRequestUrl(pipeline, endpoint, options);

            // Build request headers
            const headers = this.buildRequestHeaders(pipeline, apiKey, options);

            // Make the request
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            // Update rate limiting
            this.updateRateLimit(pipelineId);

            // Update analytics
            const responseTime = Date.now() - startTime;
            this.updatePipelineStats(pipelineId, responseTime, response.ok);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Log successful request
            this.analytics.logRequest(pipelineId, endpoint, responseTime, true);
            
            return data;

        } catch (error) {
            // Update error stats
            this.updatePipelineStats(pipelineId, Date.now() - startTime, false);
            
            // Log failed request
            this.analytics.logRequest(pipelineId, endpoint, Date.now() - startTime, false, error.message);
            
            throw error;
        }
    }

    buildRequestUrl(pipeline, endpoint, options) {
        let url = pipeline.baseUrl + endpoint;

        // Replace path parameters
        if (options.pathParams) {
            for (const [key, value] of Object.entries(options.pathParams)) {
                url = url.replace(`{${key}}`, encodeURIComponent(value));
            }
        }

        // Add query parameters
        if (options.queryParams || pipeline.authType === 'query') {
            const params = new URLSearchParams();
            
            if (options.queryParams) {
                for (const [key, value] of Object.entries(options.queryParams)) {
                    params.append(key, value);
                }
            }

            url += '?' + params.toString();
        }

        return url;
    }

    async buildRequestHeaders(pipeline, apiKey, options) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'TalkToApp-MCP/1.0',
            ...options.headers
        };

        // Add authentication
        if (pipeline.requiresAuth) {
            switch (pipeline.authType) {
                case 'bearer':
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    break;
                case 'header':
                    headers[pipeline.authHeader] = apiKey;
                    break;
                case 'query':
                    // Query auth is handled in buildRequestUrl
                    break;
            }
        }

        return headers;
    }

    isRateLimited(pipelineId) {
        const rateLimit = this.rateLimits.get(pipelineId);
        const pipeline = this.pipelines.get(pipelineId);
        
        if (!rateLimit || !pipeline.rateLimit) return false;

        const now = Date.now();
        const windowStart = now - pipeline.rateLimit.window;

        // Clean old requests
        rateLimit.requests = rateLimit.requests.filter(time => time > windowStart);

        // Check if limit exceeded
        return rateLimit.requests.length >= pipeline.rateLimit.requests;
    }

    updateRateLimit(pipelineId) {
        const rateLimit = this.rateLimits.get(pipelineId);
        if (rateLimit) {
            rateLimit.requests.push(Date.now());
        }
    }

    updatePipelineStats(pipelineId, responseTime, success) {
        const pipeline = this.pipelines.get(pipelineId);
        if (pipeline) {
            pipeline.requestCount++;
            pipeline.lastUsed = Date.now();
            
            if (!success) {
                pipeline.errorCount++;
            }

            // Update average response time
            pipeline.avgResponseTime = pipeline.avgResponseTime === 0 
                ? responseTime 
                : (pipeline.avgResponseTime + responseTime) / 2;
        }
    }

    startRequestProcessor() {
        setInterval(() => {
            if (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                this.processRequest(request)
                    .then(result => request.resolve(result))
                    .catch(error => request.reject(error));
            }
        }, 100); // Process requests every 100ms
    }

    // High-level API methods
    async chatCompletion(provider, messages, options = {}) {
        const pipelineMap = {
            'openai': { endpoint: '/chat/completions', body: { messages, ...options } },
            'anthropic': { endpoint: '/messages', body: { messages, ...options } },
            'google': { endpoint: '/models/gemini-pro:generateContent', body: { contents: messages, ...options } }
        };

        const config = pipelineMap[provider];
        if (!config) {
            throw new Error(`Chat completion not supported for ${provider}`);
        }

        return await this.makeRequest(provider, config.endpoint, {
            method: 'POST',
            body: config.body
        });
    }

    async generateEmbeddings(provider, text, options = {}) {
        const pipelineMap = {
            'openai': { endpoint: '/embeddings', body: { input: text, model: 'text-embedding-ada-002', ...options } },
            'google': { endpoint: '/models/embedding-001:embedContent', body: { content: { parts: [{ text }] }, ...options } }
        };

        const config = pipelineMap[provider];
        if (!config) {
            throw new Error(`Embeddings not supported for ${provider}`);
        }

        return await this.makeRequest(provider, config.endpoint, {
            method: 'POST',
            body: config.body
        });
    }

    async searchRepositories(query, options = {}) {
        return await this.makeRequest('github', '/search/repositories', {
            queryParams: { q: query, ...options }
        });
    }

    async getCurrentWeather(location, options = {}) {
        return await this.makeRequest('weather', '/weather', {
            queryParams: { q: location, units: 'metric', ...options }
        });
    }

    async getTopNews(category = 'general', options = {}) {
        return await this.makeRequest('news', '/top-headlines', {
            queryParams: { category, country: 'us', ...options }
        });
    }

    async searchTweets(query, options = {}) {
        return await this.makeRequest('twitter', '/tweets/search/recent', {
            queryParams: { query, ...options }
        });
    }

    // UI Methods
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'mcp-pipeline-panel';
        panel.className = 'mcp-pipeline-panel';
        panel.innerHTML = `
            <div class="mcp-header">
                <h3>🔗 MCP Pipelines</h3>
                <button id="add-pipeline-btn">Add Pipeline</button>
            </div>
            <div class="mcp-content">
                <div class="pipeline-list" id="pipeline-list"></div>
                <div class="pipeline-analytics" id="pipeline-analytics">
                    <h4>📊 Analytics</h4>
                    <div id="analytics-content"></div>
                </div>
                <div class="pipeline-tester" id="pipeline-tester">
                    <h4>🧪 API Tester</h4>
                    <select id="test-pipeline">
                        <option value="">Select Pipeline</option>
                    </select>
                    <input type="text" id="test-endpoint" placeholder="Endpoint">
                    <textarea id="test-body" placeholder="Request body (JSON)"></textarea>
                    <button id="test-request-btn">Test Request</button>
                    <div id="test-results"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.setupUIEventListeners();
        this.updateUI();
    }

    setupUIEventListeners() {
        document.getElementById('add-pipeline-btn')?.addEventListener('click', () => {
            this.showAddPipelineDialog();
        });

        document.getElementById('test-request-btn')?.addEventListener('click', async () => {
            await this.testPipelineRequest();
        });
    }

    updateUI() {
        this.updatePipelineList();
        this.updateAnalytics();
        this.updateTesterOptions();
    }

    updatePipelineList() {
        const listContainer = document.getElementById('pipeline-list');
        if (!listContainer) return;

        listContainer.innerHTML = Array.from(this.pipelines.values()).map(pipeline => `
            <div class="pipeline-item ${pipeline.isActive ? 'active' : 'inactive'}">
                <div class="pipeline-info">
                    <h4>${pipeline.name}</h4>
                    <span class="pipeline-status">${pipeline.isActive ? '🟢 Active' : '🔴 Inactive'}</span>
                </div>
                <div class="pipeline-stats">
                    <span>Requests: ${pipeline.requestCount}</span>
                    <span>Errors: ${pipeline.errorCount}</span>
                    <span>Avg Response: ${Math.round(pipeline.avgResponseTime)}ms</span>
                </div>
                <div class="pipeline-actions">
                    ${pipeline.isActive 
                        ? `<button onclick="window.mcpPipelineManager.deactivatePipeline('${pipeline.id}')">Deactivate</button>`
                        : `<button onclick="window.mcpPipelineManager.showActivateDialog('${pipeline.id}')">Activate</button>`
                    }
                </div>
            </div>
        `).join('');
    }

    updateAnalytics() {
        const analyticsContainer = document.getElementById('analytics-content');
        if (!analyticsContainer) return;

        const totalRequests = Array.from(this.pipelines.values()).reduce((sum, p) => sum + p.requestCount, 0);
        const totalErrors = Array.from(this.pipelines.values()).reduce((sum, p) => sum + p.errorCount, 0);
        const activePipelines = Array.from(this.pipelines.values()).filter(p => p.isActive).length;

        analyticsContainer.innerHTML = `
            <div class="analytics-stats">
                <div class="stat">
                    <span class="stat-label">Active Pipelines:</span>
                    <span class="stat-value">${activePipelines}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Total Requests:</span>
                    <span class="stat-value">${totalRequests}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Error Rate:</span>
                    <span class="stat-value">${totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) : 0}%</span>
                </div>
            </div>
        `;
    }

    updateTesterOptions() {
        const select = document.getElementById('test-pipeline');
        if (!select) return;

        const activePipelines = Array.from(this.pipelines.values()).filter(p => p.isActive);
        select.innerHTML = '<option value="">Select Pipeline</option>' + 
            activePipelines.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    showActivateDialog(pipelineId) {
        const pipeline = this.pipelines.get(pipelineId);
        const apiKey = prompt(`Enter API key for ${pipeline.name}:`);
        
        if (apiKey) {
            this.activatePipeline(pipelineId, apiKey);
        }
    }

    showAddPipelineDialog() {
        // This would open a more sophisticated dialog in a real implementation
        alert('Custom pipeline addition coming soon!');
    }

    async testPipelineRequest() {
        const pipelineId = document.getElementById('test-pipeline').value;
        const endpoint = document.getElementById('test-endpoint').value;
        const bodyText = document.getElementById('test-body').value;
        const resultsContainer = document.getElementById('test-results');

        if (!pipelineId || !endpoint) {
            resultsContainer.innerHTML = '<div class="error">Please select pipeline and endpoint</div>';
            return;
        }

        try {
            const options = {
                method: bodyText ? 'POST' : 'GET'
            };

            if (bodyText) {
                options.body = JSON.parse(bodyText);
            }

            const result = await this.makeRequest(pipelineId, endpoint, options);
            resultsContainer.innerHTML = `<pre class="success">${JSON.stringify(result, null, 2)}</pre>`;
        } catch (error) {
            resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    // Public API
    getActivePipelines() {
        return Array.from(this.pipelines.values()).filter(p => p.isActive);
    }

    getPipelineStats(pipelineId) {
        return this.pipelines.get(pipelineId);
    }

    async testConnection(pipelineId) {
        const pipeline = this.pipelines.get(pipelineId);
        if (!pipeline || !pipeline.isActive) {
            return { success: false, error: 'Pipeline not active' };
        }

        try {
            // Use a simple endpoint to test connection
            const testEndpoint = Object.values(pipeline.endpoints)[0];
            await this.makeRequest(pipelineId, testEndpoint, { method: 'GET' });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getStats() {
        const activePipelines = this.getActivePipelines().length;
        const configuredKeys = this.apiKeyManager ? this.apiKeyManager.listKeys().length : 0;
        const analytics = this.analytics ? this.analytics.getAnalytics() : { totalRequests: 0 };
        
        return {
            activePipelines,
            configuredKeys,
            requestsToday: analytics.totalRequests,
            totalPipelines: this.pipelines.size,
            uptime: Date.now() - this.startTime
        };
    }
}

// API Key Manager
class APIKeyManager {
    constructor() {
        this.keys = new Map();
        this.encryptionKey = null;
    }

    async init() {
        await this.generateEncryptionKey();
        await this.loadStoredKeys();
        console.log('🔐 API Key Manager initialized');
    }

    async generateEncryptionKey() {
        // In a real implementation, this would use proper encryption
        this.encryptionKey = 'talktoapp_encryption_key_' + Date.now();
    }

    async storeKey(pipelineId, apiKey, metadata = {}) {
        const encryptedKey = this.encrypt(apiKey);
        const keyData = {
            encrypted: encryptedKey,
            metadata: metadata,
            created: Date.now(),
            lastUsed: null
        };

        this.keys.set(pipelineId, keyData);
        await this.persistKeys();
    }

    async getKey(pipelineId) {
        const keyData = this.keys.get(pipelineId);
        if (!keyData) return null;

        keyData.lastUsed = Date.now();
        return this.decrypt(keyData.encrypted);
    }

    async removeKey(pipelineId) {
        this.keys.delete(pipelineId);
        await this.persistKeys();
    }

    encrypt(text) {
        // Simple encryption - in production, use proper encryption
        return btoa(text + this.encryptionKey);
    }

    decrypt(encryptedText) {
        // Simple decryption - in production, use proper decryption
        const decoded = atob(encryptedText);
        return decoded.replace(this.encryptionKey, '');
    }

    async persistKeys() {
        const keysData = {};
        for (const [pipelineId, keyData] of this.keys) {
            keysData[pipelineId] = keyData;
        }
        localStorage.setItem('mcp_api_keys', JSON.stringify(keysData));
    }

    async loadStoredKeys() {
        const stored = localStorage.getItem('mcp_api_keys');
        if (stored) {
            const keysData = JSON.parse(stored);
            for (const [pipelineId, keyData] of Object.entries(keysData)) {
                this.keys.set(pipelineId, keyData);
            }
        }
    }

    listKeys() {
        return Array.from(this.keys.keys());
    }

    getKeyMetadata(pipelineId) {
        const keyData = this.keys.get(pipelineId);
        return keyData ? keyData.metadata : null;
    }
}

// MCP Analytics
class MCPAnalytics {
    constructor() {
        this.requests = [];
        this.maxHistory = 1000;
    }

    logRequest(pipelineId, endpoint, responseTime, success, error = null) {
        this.requests.push({
            pipelineId,
            endpoint,
            responseTime,
            success,
            error,
            timestamp: Date.now()
        });

        // Keep only recent requests
        if (this.requests.length > this.maxHistory) {
            this.requests = this.requests.slice(-this.maxHistory);
        }
    }

    getAnalytics(pipelineId = null, timeRange = 3600000) { // 1 hour default
        const cutoff = Date.now() - timeRange;
        let filteredRequests = this.requests.filter(r => r.timestamp > cutoff);

        if (pipelineId) {
            filteredRequests = filteredRequests.filter(r => r.pipelineId === pipelineId);
        }

        const totalRequests = filteredRequests.length;
        const successfulRequests = filteredRequests.filter(r => r.success).length;
        const avgResponseTime = totalRequests > 0 
            ? filteredRequests.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests 
            : 0;

        return {
            totalRequests,
            successfulRequests,
            errorRate: totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0,
            avgResponseTime,
            requestsPerMinute: totalRequests / (timeRange / 60000)
        };
    }

    getTopErrors(limit = 5) {
        const errors = this.requests
            .filter(r => !r.success && r.error)
            .reduce((acc, r) => {
                acc[r.error] = (acc[r.error] || 0) + 1;
                return acc;
            }, {});

        return Object.entries(errors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }
}

// Initialize MCP Pipeline Manager
if (typeof window !== 'undefined') {
    window.MCPPipelineManager = MCPPipelineManager;
    window.APIKeyManager = APIKeyManager;
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.mcpPipelineManager = new MCPPipelineManager();
    });
}