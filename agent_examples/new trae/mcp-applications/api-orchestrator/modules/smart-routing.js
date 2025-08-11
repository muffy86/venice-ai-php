/**
 * Smart Routing Module
 * AI-Powered Request Routing and Optimization System
 *
 * Features:
 * - Intelligent load balancing
 * - Performance-based routing
 * - Predictive caching
 * - Circuit breaker patterns
 * - Adaptive traffic shaping
 */

class SmartRouting {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.routes = new Map();
        this.routingTable = new Map();
        this.loadBalancers = new Map();
        this.circuitBreakers = new Map();
        this.performanceMetrics = new Map();
        this.routingRules = new Map();
        this.config = {
            loadBalancingStrategy: 'adaptive', // round-robin, least-connections, adaptive
            circuitBreakerThreshold: 5, // failures before opening
            circuitBreakerTimeout: 30000, // 30 seconds
            adaptiveWindow: 300000, // 5 minutes for adaptive metrics
            routeOptimizationInterval: 60000, // 1 minute
            cachePredictionThreshold: 0.8,
            healthCheckWeight: 0.3,
            performanceWeight: 0.4,
            availabilityWeight: 0.3
        };
        this.routingHistory = [];
        this.mlModel = new RoutingPredictor();
        this.trafficShaper = new TrafficShaper();

        this.initialize();
    }

    async initialize() {
        console.log('🧠 Smart Routing initializing...');

        // Initialize load balancers for each API
        this.setupLoadBalancers();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Initialize circuit breakers
        this.setupCircuitBreakers();

        // Start route optimization
        this.startRouteOptimization();

        // Setup ML-based prediction
        this.initializeMLPrediction();

        console.log('✅ Smart Routing initialized');
        this.orchestrator.emit('smart-routing-initialized');
    }

    async routeRequest(request) {
        const startTime = Date.now();

        try {
            // Step 1: Select optimal API endpoint
            const selectedAPI = await this.selectOptimalAPI(request);

            // Step 2: Apply circuit breaker logic
            if (!this.isCircuitClosed(selectedAPI.id)) {
                throw new Error(`Circuit breaker open for API ${selectedAPI.name}`);
            }

            // Step 3: Apply traffic shaping
            await this.trafficShaper.shape(selectedAPI.id, request);

            // Step 4: Route the request
            const result = await this.executeRoutedRequest(selectedAPI, request);

            // Step 5: Update metrics and learn
            this.updateRoutingMetrics(selectedAPI.id, request, result, Date.now() - startTime);
            this.mlModel.learn(request, selectedAPI, result, Date.now() - startTime);

            return {
                result,
                routedTo: selectedAPI.name,
                responseTime: Date.now() - startTime,
                fromCache: result.fromCache || false
            };

        } catch (error) {
            this.handleRoutingError(request, error);
            throw error;
        }
    }

    async selectOptimalAPI(request) {
        const availableAPIs = this.getAvailableAPIs(request);

        if (availableAPIs.length === 0) {
            throw new Error('No available APIs for request');
        }

        if (availableAPIs.length === 1) {
            return availableAPIs[0];
        }

        // Use AI prediction for optimal routing
        const predictions = await this.mlModel.predict(request, availableAPIs);
        const scores = this.calculateRoutingScores(availableAPIs, predictions);

        // Select API with highest score
        const optimalAPI = availableAPIs.reduce((best, current, index) => {
            return scores[index] > scores[best.index] ? { api: current, index } : best;
        }, { api: availableAPIs[0], index: 0 }).api;

        this.recordRoutingDecision(request, optimalAPI, scores);

        return optimalAPI;
    }

    calculateRoutingScores(apis, predictions) {
        return apis.map((api, index) => {
            const metrics = this.performanceMetrics.get(api.id) || this.getDefaultMetrics();
            const prediction = predictions[index] || {};

            // Health score (0-1)
            const healthScore = api.health === 'healthy' ? 1 :
                               api.health === 'degraded' ? 0.5 : 0;

            // Performance score (0-1, inverted response time)
            const avgResponseTime = metrics.averageResponseTime || 1000;
            const performanceScore = Math.max(0, 1 - (avgResponseTime / 5000)); // 5s max

            // Availability score (0-1)
            const successRate = metrics.successRate || 0;
            const availabilityScore = successRate / 100;

            // ML prediction score (0-1)
            const predictionScore = prediction.confidence || 0.5;

            // Circuit breaker penalty
            const circuitPenalty = this.isCircuitClosed(api.id) ? 1 : 0;

            // Load balancing factor
            const loadFactor = this.getLoadFactor(api.id);

            // Weighted final score
            const finalScore = (
                healthScore * this.config.healthCheckWeight +
                performanceScore * this.config.performanceWeight +
                availabilityScore * this.config.availabilityWeight +
                predictionScore * 0.2 +
                loadFactor * 0.1
            ) * circuitPenalty;

            return Math.max(0, Math.min(1, finalScore));
        });
    }

    getAvailableAPIs(request) {
        const allAPIs = this.orchestrator.getAPIStatus();

        return allAPIs.filter(api => {
            // Basic availability check
            if (api.status !== 'active') return false;

            // Capability matching
            const requiredCapabilities = this.extractRequiredCapabilities(request);
            if (requiredCapabilities.length > 0) {
                const apiCapabilities = api.capabilities || [];
                const hasRequiredCapabilities = requiredCapabilities.every(cap =>
                    apiCapabilities.includes(cap)
                );
                if (!hasRequiredCapabilities) return false;
            }

            // Circuit breaker check
            if (!this.isCircuitClosed(api.id)) return false;

            return true;
        });
    }

    extractRequiredCapabilities(request) {
        const capabilities = [];

        // Infer capabilities from request method and parameters
        if (request.method?.includes('search')) capabilities.push('search');
        if (request.method?.includes('file')) capabilities.push('file-operations');
        if (request.method?.includes('memory') || request.method?.includes('graph')) capabilities.push('knowledge-graph');
        if (request.method?.includes('browser') || request.method?.includes('navigate')) capabilities.push('browser-automation');

        return capabilities;
    }

    async executeRoutedRequest(api, request) {
        // Delegate to the orchestrator for actual execution
        return await this.orchestrator.executeRequest(api.id, request.method, request.params, request.options);
    }

    // Circuit Breaker Implementation
    setupCircuitBreakers() {
        const apis = this.orchestrator.getAPIStatus();

        apis.forEach(api => {
            this.circuitBreakers.set(api.id, {
                state: 'closed', // closed, open, half-open
                failureCount: 0,
                lastFailureTime: null,
                successCount: 0,
                threshold: this.config.circuitBreakerThreshold,
                timeout: this.config.circuitBreakerTimeout
            });
        });
    }

    isCircuitClosed(apiId) {
        const breaker = this.circuitBreakers.get(apiId);
        if (!breaker) return true;

        const now = Date.now();

        switch (breaker.state) {
            case 'closed':
                return true;

            case 'open':
                if (now - breaker.lastFailureTime > breaker.timeout) {
                    breaker.state = 'half-open';
                    breaker.successCount = 0;
                    return true;
                }
                return false;

            case 'half-open':
                return true;

            default:
                return false;
        }
    }

    updateCircuitBreaker(apiId, success) {
        const breaker = this.circuitBreakers.get(apiId);
        if (!breaker) return;

        if (success) {
            breaker.failureCount = 0;

            if (breaker.state === 'half-open') {
                breaker.successCount++;
                if (breaker.successCount >= 3) { // 3 successful requests to close
                    breaker.state = 'closed';
                    this.orchestrator.emit('circuit-breaker-closed', { apiId });
                }
            }
        } else {
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();

            if (breaker.failureCount >= breaker.threshold) {
                breaker.state = 'open';
                this.orchestrator.emit('circuit-breaker-opened', { apiId });
            }
        }
    }

    // Load Balancing
    setupLoadBalancers() {
        const apis = this.orchestrator.getAPIStatus();

        apis.forEach(api => {
            this.loadBalancers.set(api.id, {
                strategy: this.config.loadBalancingStrategy,
                currentIndex: 0,
                connections: 0,
                requestCount: 0,
                weightedScore: 1.0
            });
        });
    }

    getLoadFactor(apiId) {
        const balancer = this.loadBalancers.get(apiId);
        if (!balancer) return 1.0;

        // Return inverse of current load (higher load = lower factor)
        const maxConnections = 100; // Configure based on API capacity
        return Math.max(0.1, 1 - (balancer.connections / maxConnections));
    }

    updateLoadBalancer(apiId, delta) {
        const balancer = this.loadBalancers.get(apiId);
        if (balancer) {
            balancer.connections += delta;
            balancer.connections = Math.max(0, balancer.connections);

            if (delta > 0) {
                balancer.requestCount++;
            }
        }
    }

    // Performance Monitoring
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
            this.optimizeRoutes();
        }, this.config.routeOptimizationInterval);
    }

    updatePerformanceMetrics() {
        const apis = this.orchestrator.getAPIStatus();

        apis.forEach(api => {
            const existing = this.performanceMetrics.get(api.id) || this.getDefaultMetrics();

            // Update metrics with exponential moving average
            const alpha = 0.1; // Smoothing factor

            existing.averageResponseTime = existing.averageResponseTime * (1 - alpha) +
                                         api.responseTime * alpha;

            existing.requestCount = api.requestCount || 0;
            existing.errorCount = api.errorCount || 0;
            existing.successRate = existing.requestCount > 0 ?
                ((existing.requestCount - existing.errorCount) / existing.requestCount) * 100 : 0;

            existing.lastUpdated = Date.now();

            this.performanceMetrics.set(api.id, existing);
        });
    }

    getDefaultMetrics() {
        return {
            averageResponseTime: 1000,
            requestCount: 0,
            errorCount: 0,
            successRate: 0,
            throughput: 0,
            lastUpdated: Date.now()
        };
    }

    updateRoutingMetrics(apiId, request, result, responseTime) {
        const metrics = this.performanceMetrics.get(apiId) || this.getDefaultMetrics();

        // Update circuit breaker
        this.updateCircuitBreaker(apiId, !result.error);

        // Update load balancer
        this.updateLoadBalancer(apiId, -1); // Request completed

        // Record routing decision
        this.routingHistory.push({
            timestamp: Date.now(),
            apiId,
            requestType: request.method,
            responseTime,
            success: !result.error,
            cacheHit: result.fromCache || false
        });

        // Keep only recent history
        if (this.routingHistory.length > 1000) {
            this.routingHistory = this.routingHistory.slice(-800);
        }
    }

    // Route Optimization
    optimizeRoutes() {
        console.log('🔄 Optimizing routes...');

        const apis = this.orchestrator.getAPIStatus();
        const optimizations = [];

        apis.forEach(api => {
            const metrics = this.performanceMetrics.get(api.id);
            if (!metrics) return;

            // Identify optimization opportunities
            if (metrics.averageResponseTime > 2000) {
                optimizations.push({
                    type: 'slow-response',
                    apiId: api.id,
                    suggestion: 'Consider caching or load balancing'
                });
            }

            if (metrics.successRate < 95) {
                optimizations.push({
                    type: 'low-success-rate',
                    apiId: api.id,
                    suggestion: 'Implement retry logic or circuit breaker'
                });
            }

            if (metrics.requestCount > 1000) {
                optimizations.push({
                    type: 'high-load',
                    apiId: api.id,
                    suggestion: 'Consider horizontal scaling'
                });
            }
        });

        if (optimizations.length > 0) {
            this.orchestrator.emit('route-optimizations', optimizations);
        }
    }

    recordRoutingDecision(request, selectedAPI, scores) {
        // For ML learning and analytics
        const decision = {
            timestamp: Date.now(),
            requestFingerprint: this.createRequestFingerprint(request),
            selectedAPI: selectedAPI.id,
            availableAPIs: scores.length,
            confidence: Math.max(...scores),
            factors: {
                health: selectedAPI.health,
                responseTime: selectedAPI.responseTime,
                loadFactor: this.getLoadFactor(selectedAPI.id)
            }
        };

        this.mlModel.recordDecision(decision);
    }

    createRequestFingerprint(request) {
        // Create a hash-like fingerprint of the request for ML purposes
        const features = [
            request.method || '',
            Object.keys(request.params || {}).sort().join(','),
            request.options?.priority || 'medium'
        ].join('|');

        return btoa(features).substring(0, 16);
    }

    handleRoutingError(request, error) {
        console.error('❌ Routing error:', error);

        this.orchestrator.emit('routing-error', {
            request: this.createRequestFingerprint(request),
            error: error.message,
            timestamp: Date.now()
        });
    }

    // Public API methods
    getRoutingStats() {
        const totalRequests = this.routingHistory.length;
        const successfulRequests = this.routingHistory.filter(r => r.success).length;
        const cacheHits = this.routingHistory.filter(r => r.cacheHit).length;

        const avgResponseTime = totalRequests > 0 ?
            this.routingHistory.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests : 0;

        return {
            totalRequests,
            successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
            cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
            averageResponseTime: Math.round(avgResponseTime),
            activeRoutes: this.routes.size,
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => ({
                apiId: id,
                state: breaker.state,
                failures: breaker.failureCount
            }))
        };
    }

    getPerformanceMetrics() {
        return Array.from(this.performanceMetrics.entries()).map(([apiId, metrics]) => ({
            apiId,
            ...metrics
        }));
    }

    configureRouting(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('⚙️ Routing configuration updated');
        this.orchestrator.emit('routing-config-updated', this.config);
    }
}

// Machine Learning Routing Predictor
class RoutingPredictor {
    constructor() {
        this.trainingData = [];
        this.model = null;
        this.features = ['responseTime', 'successRate', 'loadFactor', 'timeOfDay', 'requestType'];
        this.isTraining = false;
    }

    async predict(request, availableAPIs) {
        if (!this.model || this.trainingData.length < 100) {
            // Fallback to simple heuristics
            return availableAPIs.map(() => ({ confidence: 0.5 }));
        }

        const predictions = [];

        for (const api of availableAPIs) {
            const features = this.extractFeatures(request, api);
            const prediction = await this.predictForAPI(features);
            predictions.push(prediction);
        }

        return predictions;
    }

    extractFeatures(request, api) {
        const timeOfDay = new Date().getHours() / 24; // 0-1
        const requestType = this.encodeRequestType(request.method);

        return {
            responseTime: (api.responseTime || 1000) / 5000, // Normalize to 0-1
            successRate: (api.successRate || 50) / 100, // 0-1
            loadFactor: 1 - ((api.connections || 0) / 100), // Inverse load
            timeOfDay,
            requestType
        };
    }

    encodeRequestType(method) {
        const types = {
            'read': 0.1,
            'write': 0.3,
            'search': 0.5,
            'process': 0.7,
            'analyze': 0.9
        };

        for (const [type, value] of Object.entries(types)) {
            if (method?.toLowerCase().includes(type)) {
                return value;
            }
        }

        return 0.5; // Default
    }

    async predictForAPI(features) {
        // Simple neural network simulation
        // In production, this would use a real ML library

        const weights = {
            responseTime: -0.4, // Lower response time is better
            successRate: 0.5,   // Higher success rate is better
            loadFactor: 0.3,    // Lower load is better
            timeOfDay: 0.1,     // Time-based patterns
            requestType: 0.2    // Request type matching
        };

        let score = 0;
        for (const [feature, value] of Object.entries(features)) {
            score += (weights[feature] || 0) * value;
        }

        // Apply sigmoid activation
        const confidence = 1 / (1 + Math.exp(-score));

        return {
            confidence: Math.max(0.1, Math.min(0.9, confidence)),
            expectedResponseTime: features.responseTime * 5000,
            expectedSuccess: features.successRate
        };
    }

    learn(request, selectedAPI, result, responseTime) {
        const features = this.extractFeatures(request, selectedAPI);
        const outcome = {
            success: !result.error,
            actualResponseTime: responseTime,
            cacheHit: result.fromCache || false
        };

        this.trainingData.push({
            features,
            outcome,
            timestamp: Date.now()
        });

        // Keep training data manageable
        if (this.trainingData.length > 10000) {
            this.trainingData = this.trainingData.slice(-8000);
        }

        // Periodically retrain model
        if (this.trainingData.length % 500 === 0 && !this.isTraining) {
            this.retrainModel();
        }
    }

    async retrainModel() {
        this.isTraining = true;
        console.log('🧠 Retraining routing model...');

        try {
            // Simulate model training
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update model weights based on recent performance
            this.updateModelWeights();

            console.log('✅ Routing model retrained');
        } catch (error) {
            console.error('❌ Model retraining failed:', error);
        } finally {
            this.isTraining = false;
        }
    }

    updateModelWeights() {
        // Analyze recent training data to adjust weights
        const recentData = this.trainingData.slice(-1000);

        // Calculate feature importance based on correlation with success
        const correlations = this.calculateFeatureCorrelations(recentData);

        // Adjust weights (simplified)
        // In production, this would use proper ML algorithms
    }

    calculateFeatureCorrelations(data) {
        // Simplified correlation calculation
        return this.features.reduce((acc, feature) => {
            const values = data.map(d => d.features[feature]);
            const outcomes = data.map(d => d.outcome.success ? 1 : 0);

            acc[feature] = this.pearsonCorrelation(values, outcomes);
            return acc;
        }, {});
    }

    pearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    recordDecision(decision) {
        // Store decision for analytics and model improvement
        // This data helps improve future routing decisions
    }
}

// Traffic Shaping
class TrafficShaper {
    constructor() {
        this.queues = new Map();
        this.config = {
            maxQueueSize: 1000,
            processingRate: 100, // requests per second
            burstSize: 50
        };
    }

    async shape(apiId, request) {
        const queue = this.getQueue(apiId);

        // Check if we need to throttle
        if (this.shouldThrottle(queue)) {
            await this.throttle(queue, request);
        }

        // Add to processing queue
        queue.processed++;
        queue.lastProcessed = Date.now();
    }

    getQueue(apiId) {
        if (!this.queues.has(apiId)) {
            this.queues.set(apiId, {
                processed: 0,
                lastProcessed: Date.now(),
                windowStart: Date.now()
            });
        }
        return this.queues.get(apiId);
    }

    shouldThrottle(queue) {
        const now = Date.now();
        const windowSize = 1000; // 1 second

        // Reset window if needed
        if (now - queue.windowStart > windowSize) {
            queue.processed = 0;
            queue.windowStart = now;
            return false;
        }

        return queue.processed >= this.config.processingRate;
    }

    async throttle(queue, request) {
        const delay = this.calculateDelay(queue, request);
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    calculateDelay(queue, request) {
        // Simple delay calculation
        // More sophisticated algorithms could consider request priority
        const baseDelay = 1000 / this.config.processingRate;
        const overageRatio = queue.processed / this.config.processingRate;

        return baseDelay * overageRatio;
    }
}

// Export and UI integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartRouting;
} else {
    window.SmartRouting = SmartRouting;
}

function initializeSmartRouting() {
    const orchestrator = getOrchestrator();
    const smartRouting = new SmartRouting(orchestrator);

    window.smartRouting = smartRouting;

    // Setup event listeners
    orchestrator.on('circuit-breaker-opened', (data) => {
        console.log(`🔴 Circuit breaker opened for API ${data.apiId}`);
    });

    orchestrator.on('circuit-breaker-closed', (data) => {
        console.log(`🟢 Circuit breaker closed for API ${data.apiId}`);
    });

    console.log('🧠 Smart Routing module initialized');
    return smartRouting;
}

// UI functions
function optimizeRoutes() {
    if (window.smartRouting) {
        showNotification('Optimizing routes...', 'info');
        window.smartRouting.optimizeRoutes();
        setTimeout(() => {
            showNotification('Route optimization completed!', 'success');
        }, 2000);
    }
}

function viewRoutes() {
    if (window.smartRouting) {
        const stats = window.smartRouting.getRoutingStats();
        const metrics = window.smartRouting.getPerformanceMetrics();

        // Display routing information (could open a modal or update UI)
        console.log('Routing Stats:', stats);
        console.log('Performance Metrics:', metrics);

        showNotification(`Active routes: ${stats.activeRoutes}, Success rate: ${stats.successRate.toFixed(1)}%`, 'info');
    }
}

function exportMetrics() {
    if (window.smartRouting) {
        const stats = window.smartRouting.getRoutingStats();
        const metrics = window.smartRouting.getPerformanceMetrics();

        const exportData = {
            timestamp: new Date().toISOString(),
            routingStats: stats,
            performanceMetrics: metrics
        };

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `routing-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Metrics exported successfully!', 'success');
    }
}

function showDetailedMetrics() {
    if (window.smartRouting) {
        const stats = window.smartRouting.getRoutingStats();

        // This could open a detailed metrics modal
        alert(`
Detailed Routing Metrics:
- Total Requests: ${stats.totalRequests}
- Success Rate: ${stats.successRate.toFixed(2)}%
- Cache Hit Rate: ${stats.cacheHitRate.toFixed(2)}%
- Average Response Time: ${stats.averageResponseTime}ms
- Active Routes: ${stats.activeRoutes}
- Circuit Breakers: ${stats.circuitBreakers.length}
        `);
    }
}

function setAlerts() {
    // Configure alerting thresholds
    showNotification('Alert configuration opened!', 'info');
}
