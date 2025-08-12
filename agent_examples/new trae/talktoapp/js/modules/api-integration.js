/**
 * API Integration Module
 * Handles external API calls, authentication, and data management
 */

class APIIntegration {
  constructor() {
    this.apiKeys = new Map();
    this.endpoints = new Map();
    this.requestQueue = [];
    this.rateLimits = new Map();
    this.cache = new Map();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2
    };
    
    // Default API configurations
    this.defaultAPIs = {
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        rateLimit: { requests: 60, window: 60000 }, // 60 requests per minute
        headers: {
          'Content-Type': 'application/json'
        }
      },
      anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        rateLimit: { requests: 50, window: 60000 },
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      },
      google: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        rateLimit: { requests: 60, window: 60000 },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    };

    this.requestHistory = [];
    this.maxHistorySize = 1000;
    this.cacheTimeout = 300000; // 5 minutes
  }

  async init() {
    console.log('🔌 Initializing API Integration...');
    
    try {
      // Load saved API keys
      await this.loadAPIKeys();
      
      // Initialize endpoints
      this.initializeEndpoints();
      
      // Setup request monitoring
      this.setupRequestMonitoring();
      
      // Start cache cleanup
      this.startCacheCleanup();
      
      console.log('✅ API Integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize API Integration:', error);
      throw error;
    }
  }

  // API Key Management

  async loadAPIKeys() {
    try {
      const saved = localStorage.getItem('talktoapp_api_keys');
      if (saved) {
        const keys = JSON.parse(saved);
        Object.entries(keys).forEach(([provider, key]) => {
          this.setAPIKey(provider, key);
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  async saveAPIKeys() {
    try {
      const keys = {};
      this.apiKeys.forEach((key, provider) => {
        keys[provider] = key;
      });
      localStorage.setItem('talktoapp_api_keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  setAPIKey(provider, key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid API key provided');
    }
    
    this.apiKeys.set(provider, key);
    this.saveAPIKeys();
    
    console.log(`✅ API key set for ${provider}`);
  }

  getAPIKey(provider) {
    return this.apiKeys.get(provider);
  }

  removeAPIKey(provider) {
    this.apiKeys.delete(provider);
    this.saveAPIKeys();
    console.log(`🗑️ API key removed for ${provider}`);
  }

  hasAPIKey(provider) {
    return this.apiKeys.has(provider) && this.apiKeys.get(provider).length > 0;
  }

  // Endpoint Management

  initializeEndpoints() {
    Object.entries(this.defaultAPIs).forEach(([provider, config]) => {
      this.endpoints.set(provider, config);
    });
  }

  addEndpoint(name, config) {
    this.endpoints.set(name, {
      baseUrl: config.baseUrl,
      rateLimit: config.rateLimit || { requests: 60, window: 60000 },
      headers: config.headers || { 'Content-Type': 'application/json' },
      timeout: config.timeout || 30000
    });
  }

  getEndpoint(name) {
    return this.endpoints.get(name);
  }

  // Rate Limiting

  checkRateLimit(provider) {
    const limit = this.rateLimits.get(provider);
    if (!limit) return true;

    const now = Date.now();
    const windowStart = now - limit.window;
    
    // Clean old requests
    limit.requests = limit.requests.filter(time => time > windowStart);
    
    return limit.requests.length < limit.maxRequests;
  }

  updateRateLimit(provider, config) {
    if (!this.rateLimits.has(provider)) {
      this.rateLimits.set(provider, {
        requests: [],
        maxRequests: config.requests,
        window: config.window
      });
    }
    
    const limit = this.rateLimits.get(provider);
    limit.requests.push(Date.now());
  }

  // Request Methods

  async makeRequest(provider, endpoint, options = {}) {
    const config = this.endpoints.get(provider);
    if (!config) {
      throw new Error(`Unknown API provider: ${provider}`);
    }

    const apiKey = this.getAPIKey(provider);
    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}`);
    }

    // Check rate limit
    if (!this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }

    // Build request
    const url = `${config.baseUrl}${endpoint}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...config.headers,
        ...this.getAuthHeaders(provider, apiKey),
        ...options.headers
      },
      ...options
    };

    if (options.body && requestOptions.method !== 'GET') {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    // Check cache for GET requests
    const cacheKey = this.getCacheKey(url, requestOptions);
    if (requestOptions.method === 'GET' && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit for ${provider}${endpoint}`);
        return cached.data;
      }
    }

    // Make request with retry logic
    const response = await this.requestWithRetry(url, requestOptions, provider);
    
    // Update rate limit
    this.updateRateLimit(provider, config.rateLimit);
    
    // Cache GET responses
    if (requestOptions.method === 'GET' && response.ok) {
      const data = await response.clone().json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    // Log request
    this.logRequest(provider, endpoint, requestOptions, response);

    if (!response.ok) {
      const error = await this.parseErrorResponse(response);
      throw new Error(`API request failed: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  async requestWithRetry(url, options, provider, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
      
    } catch (error) {
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.log(`🔄 Retrying request to ${provider} in ${delay}ms (attempt ${attempt + 1})`);
        await this.sleep(delay);
        return this.requestWithRetry(url, options, provider, attempt + 1);
      }
      
      throw error;
    }
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx status codes
    return error.name === 'AbortError' || 
           error.name === 'TypeError' ||
           (error.status >= 500 && error.status < 600);
  }

  getAuthHeaders(provider, apiKey) {
    switch (provider) {
      case 'openai':
        return { 'Authorization': `Bearer ${apiKey}` };
      case 'anthropic':
        return { 'x-api-key': apiKey };
      case 'google':
        return { 'Authorization': `Bearer ${apiKey}` };
      default:
        return { 'Authorization': `Bearer ${apiKey}` };
    }
  }

  // Specific API Methods

  async sendChatMessage(provider, messages, options = {}) {
    const endpoints = {
      openai: '/chat/completions',
      anthropic: '/messages',
      google: '/models/gemini-pro:generateContent'
    };

    const endpoint = endpoints[provider];
    if (!endpoint) {
      throw new Error(`Chat not supported for provider: ${provider}`);
    }

    const payload = this.buildChatPayload(provider, messages, options);
    
    return await this.makeRequest(provider, endpoint, {
      method: 'POST',
      body: payload
    });
  }

  buildChatPayload(provider, messages, options) {
    switch (provider) {
      case 'openai':
        return {
          model: options.model || 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          stream: options.stream || false
        };
        
      case 'anthropic':
        return {
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 1000,
          messages: messages,
          temperature: options.temperature || 0.7
        };
        
      case 'google':
        return {
          contents: messages.map(msg => ({
            parts: [{ text: msg.content }],
            role: msg.role === 'assistant' ? 'model' : 'user'
          })),
          generationConfig: {
            maxOutputTokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
          }
        };
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async generateEmbeddings(provider, texts, options = {}) {
    const endpoints = {
      openai: '/embeddings',
      google: '/models/embedding-001:embedContent'
    };

    const endpoint = endpoints[provider];
    if (!endpoint) {
      throw new Error(`Embeddings not supported for provider: ${provider}`);
    }

    const payload = this.buildEmbeddingPayload(provider, texts, options);
    
    return await this.makeRequest(provider, endpoint, {
      method: 'POST',
      body: payload
    });
  }

  buildEmbeddingPayload(provider, texts, options) {
    switch (provider) {
      case 'openai':
        return {
          model: options.model || 'text-embedding-ada-002',
          input: Array.isArray(texts) ? texts : [texts]
        };
        
      case 'google':
        return {
          model: 'models/embedding-001',
          content: {
            parts: Array.isArray(texts) 
              ? texts.map(text => ({ text }))
              : [{ text: texts }]
          }
        };
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Streaming Support

  async streamChatMessage(provider, messages, options = {}, onChunk) {
    if (provider !== 'openai') {
      throw new Error('Streaming only supported for OpenAI currently');
    }

    const payload = this.buildChatPayload(provider, messages, { ...options, stream: true });
    const config = this.endpoints.get(provider);
    const apiKey = this.getAPIKey(provider);
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        ...config.headers,
        ...this.getAuthHeaders(provider, apiKey)
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Streaming request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
            } catch (error) {
              console.warn('Failed to parse streaming chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Cache Management

  getCacheKey(url, options) {
    const key = `${url}_${JSON.stringify(options.body || '')}_${JSON.stringify(options.headers || {})}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  // Request Monitoring

  setupRequestMonitoring() {
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      byProvider: new Map()
    };
  }

  logRequest(provider, endpoint, options, response) {
    const logEntry = {
      timestamp: Date.now(),
      provider,
      endpoint,
      method: options.method,
      status: response.status,
      success: response.ok
    };

    this.requestHistory.push(logEntry);
    
    // Limit history size
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }

    // Update stats
    this.requestStats.total++;
    if (response.ok) {
      this.requestStats.successful++;
    } else {
      this.requestStats.failed++;
    }

    if (!this.requestStats.byProvider.has(provider)) {
      this.requestStats.byProvider.set(provider, { total: 0, successful: 0, failed: 0 });
    }
    
    const providerStats = this.requestStats.byProvider.get(provider);
    providerStats.total++;
    if (response.ok) {
      providerStats.successful++;
    } else {
      providerStats.failed++;
    }
  }

  getRequestStats() {
    return {
      ...this.requestStats,
      byProvider: Object.fromEntries(this.requestStats.byProvider)
    };
  }

  getRequestHistory(limit = 100) {
    return this.requestHistory.slice(-limit);
  }

  // Error Handling

  async parseErrorResponse(response) {
    try {
      const error = await response.json();
      return error;
    } catch {
      return { message: response.statusText };
    }
  }

  // Utility Methods

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health Check

  async healthCheck(provider) {
    try {
      const config = this.endpoints.get(provider);
      if (!config) {
        return { status: 'error', message: 'Provider not configured' };
      }

      if (!this.hasAPIKey(provider)) {
        return { status: 'error', message: 'No API key configured' };
      }

      // Simple health check endpoint
      const healthEndpoints = {
        openai: '/models',
        anthropic: '/messages',
        google: '/models'
      };

      const endpoint = healthEndpoints[provider];
      if (!endpoint) {
        return { status: 'unknown', message: 'Health check not available' };
      }

      const startTime = Date.now();
      await this.makeRequest(provider, endpoint, { method: 'GET' });
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        message: 'API is responding normally'
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error.name
      };
    }
  }

  async healthCheckAll() {
    const results = {};
    const providers = Array.from(this.endpoints.keys());
    
    await Promise.all(
      providers.map(async (provider) => {
        results[provider] = await this.healthCheck(provider);
      })
    );
    
    return results;
  }

  // Configuration Export/Import

  exportConfiguration() {
    return {
      endpoints: Object.fromEntries(this.endpoints),
      rateLimits: Object.fromEntries(this.rateLimits),
      retryConfig: this.retryConfig,
      cacheTimeout: this.cacheTimeout
    };
  }

  importConfiguration(config) {
    if (config.endpoints) {
      this.endpoints = new Map(Object.entries(config.endpoints));
    }
    
    if (config.rateLimits) {
      this.rateLimits = new Map(Object.entries(config.rateLimits));
    }
    
    if (config.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
    }
    
    if (config.cacheTimeout) {
      this.cacheTimeout = config.cacheTimeout;
    }
  }

  // Public API Methods

  getAvailableProviders() {
    return Array.from(this.endpoints.keys());
  }

  getConfiguredProviders() {
    return Array.from(this.apiKeys.keys());
  }

  isProviderReady(provider) {
    return this.endpoints.has(provider) && this.hasAPIKey(provider);
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys()).map(key => ({
        key,
        age: Date.now() - this.cache.get(key).timestamp
      }))
    };
  }

  getRateLimitStatus(provider) {
    const limit = this.rateLimits.get(provider);
    if (!limit) return null;

    const now = Date.now();
    const windowStart = now - limit.window;
    const recentRequests = limit.requests.filter(time => time > windowStart);

    return {
      current: recentRequests.length,
      max: limit.maxRequests,
      window: limit.window,
      resetTime: recentRequests.length > 0 ? recentRequests[0] + limit.window : now
    };
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.APIIntegration = APIIntegration;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIIntegration;
}