/**
 * OpenRouter API Manager
 * Handles integration with OpenRouter for multiple AI models
 */

class OpenRouterManager {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.models = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimits = new Map();
        this.modelCapabilities = new Map();
        this.fallbackModels = new Map();
        this.cache = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            modelUsage: new Map()
        };
    }

    async initialize() {
        try {
            // Load API key from environment or storage
            this.apiKey = await this.loadApiKey();

            if (!this.apiKey) {
                console.warn('⚠️ OpenRouter API key not found. Some features may be limited.');
                return false;
            }

            // Initialize available models
            await this.loadAvailableModels();

            // Setup model capabilities
            this.setupModelCapabilities();

            // Setup fallback chain
            this.setupFallbackChain();

            console.log('🔗 OpenRouter API Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize OpenRouter API Manager:', error);
            return false;
        }
    }

    async loadApiKey() {
        // Try multiple sources for API key
        const sources = [
            () => localStorage.getItem('openrouter_api_key'),
            () => process?.env?.OPENROUTER_API_KEY,
            () => window.OPENROUTER_API_KEY,
            () => this.promptUserForApiKey()
        ];

        for (const source of sources) {
            try {
                const key = await source();
                if (key && key.trim()) {
                    return key.trim();
                }
            } catch (error) {
                console.warn('Failed to load API key from source:', error);
            }
        }

        return null;
    }

    async promptUserForApiKey() {
        return new Promise((resolve) => {
            const modal = this.createApiKeyModal();
            document.body.appendChild(modal);

            const input = modal.querySelector('#api-key-input');
            const submitBtn = modal.querySelector('#submit-key');
            const skipBtn = modal.querySelector('#skip-key');

            submitBtn.addEventListener('click', () => {
                const key = input.value.trim();
                if (key) {
                    localStorage.setItem('openrouter_api_key', key);
                    document.body.removeChild(modal);
                    resolve(key);
                } else {
                    alert('Please enter a valid API key');
                }
            });

            skipBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    createApiKeyModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                text-align: center;
            ">
                <h3 style="margin-bottom: 20px;">🔑 OpenRouter API Key Required</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    To enable advanced AI features, please enter your OpenRouter API key.
                    You can get one at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a>
                </p>
                <input type="password" id="api-key-input" placeholder="Enter your API key..." style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 16px;
                ">
                <div>
                    <button id="submit-key" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Save & Continue</button>
                    <button id="skip-key" style="
                        background: #ccc;
                        color: #666;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Skip for Now</button>
                </div>
            </div>
        `;

        return modal;
    }

    async loadAvailableModels() {
        const defaultModels = [
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                provider: 'openai',
                capabilities: ['text', 'reasoning', 'coding'],
                maxTokens: 128000,
                cost: 'high'
            },
            {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                capabilities: ['text', 'reasoning', 'analysis'],
                maxTokens: 200000,
                cost: 'high'
            },
            {
                id: 'claude-3-sonnet',
                name: 'Claude 3 Sonnet',
                provider: 'anthropic',
                capabilities: ['text', 'reasoning', 'coding'],
                maxTokens: 200000,
                cost: 'medium'
            },
            {
                id: 'gpt-4-vision',
                name: 'GPT-4 Vision',
                provider: 'openai',
                capabilities: ['text', 'vision', 'multimodal'],
                maxTokens: 128000,
                cost: 'high'
            },
            {
                id: 'mistral-large',
                name: 'Mistral Large',
                provider: 'mistral',
                capabilities: ['text', 'reasoning', 'multilingual'],
                maxTokens: 32000,
                cost: 'medium'
            },
            {
                id: 'llama-3-70b',
                name: 'Llama 3 70B',
                provider: 'meta',
                capabilities: ['text', 'reasoning', 'coding'],
                maxTokens: 8000,
                cost: 'low'
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                capabilities: ['text', 'conversation'],
                maxTokens: 16000,
                cost: 'low'
            }
        ];

        defaultModels.forEach(model => {
            this.models.set(model.id, model);
            this.metrics.modelUsage.set(model.id, 0);
        });

        // Try to fetch latest models from API if key is available
        if (this.apiKey) {
            try {
                await this.fetchAvailableModels();
            } catch (error) {
                console.warn('Failed to fetch latest models, using defaults:', error);
            }
        }
    }

    async fetchAvailableModels() {
        const response = await fetch(`${this.baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Update models with latest information
            data.data?.forEach(model => {
                if (this.models.has(model.id)) {
                    this.models.set(model.id, { ...this.models.get(model.id), ...model });
                }
            });
        }
    }

    setupModelCapabilities() {
        // Define specialized capabilities for each model type
        this.modelCapabilities.set('reasoning', ['gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet']);
        this.modelCapabilities.set('coding', ['gpt-4-turbo', 'claude-3-sonnet', 'llama-3-70b']);
        this.modelCapabilities.set('vision', ['gpt-4-vision']);
        this.modelCapabilities.set('analysis', ['claude-3-opus', 'claude-3-sonnet']);
        this.modelCapabilities.set('conversation', ['gpt-3.5-turbo', 'claude-3-sonnet']);
        this.modelCapabilities.set('multilingual', ['mistral-large']);
    }

    setupFallbackChain() {
        // Setup fallback models for each primary model
        this.fallbackModels.set('gpt-4-turbo', ['claude-3-opus', 'claude-3-sonnet']);
        this.fallbackModels.set('claude-3-opus', ['gpt-4-turbo', 'claude-3-sonnet']);
        this.fallbackModels.set('claude-3-sonnet', ['gpt-3.5-turbo', 'llama-3-70b']);
        this.fallbackModels.set('gpt-4-vision', ['gpt-4-turbo']);
        this.fallbackModels.set('mistral-large', ['claude-3-sonnet']);
        this.fallbackModels.set('llama-3-70b', ['gpt-3.5-turbo']);
        this.fallbackModels.set('gpt-3.5-turbo', ['llama-3-70b']);
    }

    async generateResponse(prompt, options = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;

        try {
            // Select best model for the task
            const modelId = this.selectBestModel(options);

            // Check cache first
            const cacheKey = this.createCacheKey(prompt, modelId, options);
            if (this.cache.has(cacheKey) && !options.skipCache) {
                return this.cache.get(cacheKey);
            }

            // Check rate limits
            if (this.isRateLimited(modelId)) {
                throw new Error(`Rate limited for model ${modelId}`);
            }

            // Prepare request
            const requestData = this.prepareRequest(prompt, modelId, options);

            // Make API call with retry logic
            const response = await this.makeRequestWithRetry(requestData, modelId);

            // Cache successful response
            if (response && !options.skipCache) {
                this.cache.set(cacheKey, response);
                // Clean cache if it gets too large
                if (this.cache.size > 1000) {
                    this.cleanCache();
                }
            }

            // Update metrics
            this.updateMetrics(modelId, startTime, true);

            return response;

        } catch (error) {
            this.metrics.failedRequests++;
            console.error('❌ OpenRouter API error:', error);

            // Try fallback models
            if (!options.noFallback && !options.fallbackAttempt) {
                return this.tryFallback(prompt, options, error);
            }

            throw error;
        }
    }

    selectBestModel(options) {
        const {
            capability = 'reasoning',
            priority = 'balanced', // 'speed', 'quality', 'cost', 'balanced'
            model = null
        } = options;

        // If specific model is requested
        if (model && this.models.has(model)) {
            return model;
        }

        // Get models with required capability
        const capableModels = this.modelCapabilities.get(capability) || ['gpt-3.5-turbo'];

        // Filter available models
        const availableModels = capableModels.filter(modelId =>
            this.models.has(modelId) && !this.isRateLimited(modelId)
        );

        if (availableModels.length === 0) {
            return 'gpt-3.5-turbo'; // Fallback
        }

        // Select based on priority
        switch (priority) {
            case 'speed':
                return this.selectFastestModel(availableModels);
            case 'quality':
                return this.selectHighestQualityModel(availableModels);
            case 'cost':
                return this.selectCheapestModel(availableModels);
            case 'balanced':
            default:
                return this.selectBalancedModel(availableModels);
        }
    }

    selectFastestModel(models) {
        // Prefer smaller, faster models
        const speedOrder = ['gpt-3.5-turbo', 'llama-3-70b', 'claude-3-sonnet', 'mistral-large', 'gpt-4-turbo', 'claude-3-opus'];
        return speedOrder.find(model => models.includes(model)) || models[0];
    }

    selectHighestQualityModel(models) {
        // Prefer highest quality models
        const qualityOrder = ['claude-3-opus', 'gpt-4-turbo', 'claude-3-sonnet', 'mistral-large', 'llama-3-70b', 'gpt-3.5-turbo'];
        return qualityOrder.find(model => models.includes(model)) || models[0];
    }

    selectCheapestModel(models) {
        // Prefer cheapest models
        const costOrder = ['llama-3-70b', 'gpt-3.5-turbo', 'claude-3-sonnet', 'mistral-large', 'gpt-4-turbo', 'claude-3-opus'];
        return costOrder.find(model => models.includes(model)) || models[0];
    }

    selectBalancedModel(models) {
        // Balance quality, speed, and cost
        const balancedOrder = ['claude-3-sonnet', 'gpt-4-turbo', 'mistral-large', 'gpt-3.5-turbo', 'claude-3-opus', 'llama-3-70b'];
        return balancedOrder.find(model => models.includes(model)) || models[0];
    }

    prepareRequest(prompt, modelId, options) {
        const model = this.models.get(modelId);

        const requestData = {
            model: modelId,
            messages: this.formatMessages(prompt, options),
            max_tokens: Math.min(options.maxTokens || 4000, model.maxTokens),
            temperature: options.temperature || 0.7,
            top_p: options.topP || 1,
            stream: options.stream || false
        };

        // Add vision support if available
        if (options.images && model.capabilities.includes('vision')) {
            requestData.messages = this.addImagesToMessages(requestData.messages, options.images);
        }

        return requestData;
    }

    formatMessages(prompt, options) {
        const messages = [];

        // Add system message if provided
        if (options.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt
            });
        }

        // Add conversation history if provided
        if (options.history && Array.isArray(options.history)) {
            messages.push(...options.history);
        }

        // Add current prompt
        if (typeof prompt === 'string') {
            messages.push({
                role: 'user',
                content: prompt
            });
        } else if (Array.isArray(prompt)) {
            messages.push(...prompt);
        }

        return messages;
    }

    addImagesToMessages(messages, images) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            const content = [
                { type: 'text', text: lastMessage.content }
            ];

            images.forEach(image => {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: image.url || image,
                        detail: image.detail || 'auto'
                    }
                });
            });

            lastMessage.content = content;
        }

        return messages;
    }

    async makeRequestWithRetry(requestData, modelId, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'TalkToApp Multi-Modal AI'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`API Error: ${error.error?.message || response.statusText}`);
                }

                const data = await response.json();

                return {
                    text: data.choices[0]?.message?.content || '',
                    model: modelId,
                    usage: data.usage,
                    metadata: {
                        id: data.id,
                        created: data.created,
                        model: data.model
                    }
                };

            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed for model ${modelId}:`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    async tryFallback(prompt, options, originalError) {
        const originalModel = this.selectBestModel(options);
        const fallbackModels = this.fallbackModels.get(originalModel) || ['gpt-3.5-turbo'];

        for (const fallbackModel of fallbackModels) {
            try {
                console.log(`🔄 Trying fallback model: ${fallbackModel}`);
                return await this.generateResponse(prompt, {
                    ...options,
                    model: fallbackModel,
                    fallbackAttempt: true
                });
            } catch (error) {
                console.warn(`Fallback model ${fallbackModel} also failed:`, error.message);
            }
        }

        // If all fallbacks fail, throw original error
        throw originalError;
    }

    isRateLimited(modelId) {
        const rateLimitInfo = this.rateLimits.get(modelId);
        if (!rateLimitInfo) return false;

        const now = Date.now();
        return now < rateLimitInfo.resetTime;
    }

    updateMetrics(modelId, startTime, success) {
        const responseTime = Date.now() - startTime;

        if (success) {
            this.metrics.successfulRequests++;
            this.metrics.averageResponseTime =
                (this.metrics.averageResponseTime + responseTime) / 2;
        }

        // Update model usage
        const currentUsage = this.metrics.modelUsage.get(modelId) || 0;
        this.metrics.modelUsage.set(modelId, currentUsage + 1);
    }

    createCacheKey(prompt, modelId, options) {
        const key = JSON.stringify({
            prompt: typeof prompt === 'string' ? prompt : JSON.stringify(prompt),
            model: modelId,
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 4000
        });

        return btoa(key).substring(0, 64); // Use base64 hash
    }

    cleanCache() {
        // Remove oldest entries
        const entries = Array.from(this.cache.entries());
        const toRemove = entries.slice(0, Math.floor(entries.length / 2));
        toRemove.forEach(([key]) => this.cache.delete(key));
    }

    // Public API methods
    async chat(message, options = {}) {
        return this.generateResponse(message, {
            capability: 'conversation',
            ...options
        });
    }

    async analyze(data, options = {}) {
        return this.generateResponse(data, {
            capability: 'analysis',
            ...options
        });
    }

    async code(prompt, options = {}) {
        return this.generateResponse(prompt, {
            capability: 'coding',
            systemPrompt: 'You are an expert software developer. Provide clean, efficient, and well-documented code.',
            ...options
        });
    }

    async reason(problem, options = {}) {
        return this.generateResponse(problem, {
            capability: 'reasoning',
            systemPrompt: 'Think step by step and provide detailed reasoning for your conclusions.',
            ...options
        });
    }

    async vision(prompt, images, options = {}) {
        return this.generateResponse(prompt, {
            capability: 'vision',
            images,
            ...options
        });
    }

    getModels() {
        return Array.from(this.models.values());
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getAvailableCapabilities() {
        return Array.from(this.modelCapabilities.keys());
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('openrouter_api_key', apiKey);
    }

    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
window.OpenRouterManager = OpenRouterManager;
