/**
 * Edge Computing Manager
 * Distributed processing and edge AI capabilities
 */

class EdgeComputingManager {
    constructor() {
        this.edgeNodes = new Map();
        this.distributedTasks = new Map();
        
        try {
            this.loadBalancer = new LoadBalancer();
            this.meshNetwork = new MeshNetwork();
            this.edgeCache = new EdgeCache();
        } catch (error) {
            console.warn('Error initializing edge computing components:', error);
            // Fallback initialization
            this.loadBalancer = { selectNode: () => null, getStatus: () => ({ status: 'error' }) };
            this.meshNetwork = { broadcast: () => {}, getStatus: () => ({ status: 'error' }) };
            this.edgeCache = { get: () => null, set: () => {}, getStatus: () => ({ status: 'error' }) };
        }
        
        this.init();
    }

    init() {
        this.discoverEdgeNodes();
        this.setupDistributedProcessing();
        this.initializeEdgeAI();
        this.startHealthMonitoring();
    }

    // Initialize Edge AI capabilities
    initializeEdgeAI() {
        this.aiCapabilities = {
            models: new Map(),
            inferenceEngines: new Map(),
            modelCache: new Map(),
            optimizers: new Map()
        };

        // Initialize AI model registry
        this.setupModelRegistry();
        
        // Initialize inference engines
        this.setupInferenceEngines();
        
        // Setup model optimization
        this.setupModelOptimization();
        
        // Initialize federated learning coordinator
        this.setupFederatedLearning();
    }

    setupModelRegistry() {
        this.aiCapabilities.models.set('lightweight-nlp', {
            type: 'nlp',
            size: '50MB',
            memoryRequirement: 128,
            computeRequirement: 0.5,
            accuracy: 0.85
        });

        this.aiCapabilities.models.set('edge-vision', {
            type: 'computer-vision',
            size: '25MB',
            memoryRequirement: 64,
            computeRequirement: 0.3,
            accuracy: 0.82
        });

        this.aiCapabilities.models.set('micro-llm', {
            type: 'language-model',
            size: '100MB',
            memoryRequirement: 256,
            computeRequirement: 1.0,
            accuracy: 0.78
        });
    }

    setupInferenceEngines() {
        this.aiCapabilities.inferenceEngines.set('tensorflowjs', {
            framework: 'tensorflow',
            backend: 'webgl',
            supported: ['nlp', 'computer-vision']
        });

        this.aiCapabilities.inferenceEngines.set('onnxjs', {
            framework: 'onnx',
            backend: 'webgl',
            supported: ['computer-vision', 'language-model']
        });
    }

    setupModelOptimization() {
        this.aiCapabilities.optimizers.set('quantization', {
            type: 'quantization',
            compressionRatio: 0.25,
            accuracyLoss: 0.02
        });

        this.aiCapabilities.optimizers.set('pruning', {
            type: 'pruning',
            compressionRatio: 0.4,
            accuracyLoss: 0.01
        });
    }

    setupFederatedLearning() {
        this.federatedLearning = {
            coordinator: null,
            participants: new Set(),
            rounds: 0,
            globalModel: null
        };
    }

    // Distributed task processing
    async distributeTask(task) {
        const optimalNodes = await this.selectOptimalNodes(task);
        const subtasks = this.partitionTask(task, optimalNodes.length);
        
        const promises = subtasks.map((subtask, i) => 
            this.executeOnEdge(optimalNodes[i], subtask)
        );
        
        const results = await Promise.all(promises);
        return this.aggregateResults(results, task.aggregationType);
    }

    async selectOptimalNodes(task) {
        const availableNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.status === 'active' && node.capabilities.includes(task.type));
        
        // Score nodes based on performance, load, and proximity
        const scoredNodes = availableNodes.map(node => ({
            ...node,
            score: this.calculateNodeScore(node, task)
        })).sort((a, b) => b.score - a.score);
        
        const optimalCount = Math.min(task.parallelism || 3, scoredNodes.length);
        return scoredNodes.slice(0, optimalCount);
    }

    partitionTask(task, nodeCount) {
        switch (task.partitionStrategy) {
            case 'data-parallel':
                return this.partitionByData(task, nodeCount);
            case 'model-parallel':
                return this.partitionByModel(task, nodeCount);
            case 'pipeline':
                return this.partitionByPipeline(task, nodeCount);
            default:
                return this.partitionEvenly(task, nodeCount);
        }
    }

    // Edge AI processing
    async processAIOnEdge(model, data, constraints = {}) {
        const edgeNode = await this.selectAINode(model, constraints);
        
        if (!edgeNode) {
            // Fallback to local processing
            return await this.processLocally(model, data);
        }
        
        const result = await this.executeAITask(edgeNode, {
            model: model.id,
            data,
            constraints
        });
        
        // Cache result for future use
        await this.edgeCache.set(`ai_${model.id}_${this.hashData(data)}`, result);
        
        return result;
    }

    async selectAINode(model, constraints) {
        const candidates = Array.from(this.edgeNodes.values()).filter(node => 
            node.aiCapabilities.models.includes(model.type) &&
            node.resources.memory >= model.memoryRequirement &&
            node.resources.compute >= model.computeRequirement &&
            (!constraints.latency || node.latency <= constraints.latency) &&
            (!constraints.privacy || node.privacyLevel >= constraints.privacy)
        );
        
        if (candidates.length === 0) return null;
        
        // Select based on current load and performance
        return candidates.reduce((best, current) => 
            current.currentLoad < best.currentLoad ? current : best
        );
    }

    // Federated learning coordination
    async coordinateFederatedLearning(participants, model) {
        const rounds = 10;
        let globalModel = model;
        
        for (let round = 0; round < rounds; round++) {
            // Distribute current model to participants
            const localUpdates = await Promise.all(
                participants.map(participant => 
                    this.trainLocalModel(participant, globalModel)
                )
            );
            
            // Aggregate updates using federated averaging
            globalModel = await this.federatedAveraging(localUpdates);
            
            // Evaluate global model performance
            const performance = await this.evaluateGlobalModel(globalModel);
            
            if (performance.accuracy > 0.95) break; // Early stopping
        }
        
        return globalModel;
    }

    async trainLocalModel(participant, globalModel) {
        const localData = await this.getLocalData(participant);
        const localModel = await this.cloneModel(globalModel);
        
        // Train on local data
        const trainedModel = await this.executeOnEdge(participant, {
            type: 'train',
            model: localModel,
            data: localData,
            epochs: 5
        });
        
        return {
            participant: participant.id,
            modelUpdate: trainedModel.weights,
            dataSize: localData.length
        };
    }

    async federatedAveraging(updates) {
        const totalSamples = updates.reduce((sum, update) => sum + update.dataSize, 0);
        const avgWeights = {};
        
        // Weighted average based on local data size
        for (const update of updates) {
            const weight = update.dataSize / totalSamples;
            
            for (const [layer, weights] of Object.entries(update.modelUpdate)) {
                if (!avgWeights[layer]) {
                    avgWeights[layer] = weights.map(w => w * weight);
                } else {
                    avgWeights[layer] = avgWeights[layer].map((w, i) => w + weights[i] * weight);
                }
            }
        }
        
        return { weights: avgWeights, version: Date.now() };
    }

    // Real-time edge orchestration
    setupDistributedProcessing() {
        this.orchestrator = {
            taskQueue: [],
            activeJobs: new Map(),
            resourceMonitor: null,
            failureDetector: null
        };
        
        // Initialize monitoring components after classes are defined
        setTimeout(() => {
            this.orchestrator.resourceMonitor = new ResourceMonitor();
            this.orchestrator.failureDetector = new FailureDetector();
        }, 0);
        
        // Start orchestration loop
        setInterval(() => {
            this.processTaskQueue();
            this.rebalanceLoad();
            this.handleFailures();
        }, 1000);
    }

    async processTaskQueue() {
        while (this.orchestrator.taskQueue.length > 0 && this.hasAvailableCapacity()) {
            const task = this.orchestrator.taskQueue.shift();
            const job = await this.createDistributedJob(task);
            this.orchestrator.activeJobs.set(job.id, job);
            this.executeDistributedJob(job);
        }
    }

    async rebalanceLoad() {
        const overloadedNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.currentLoad > 0.8);
        
        const underloadedNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.currentLoad < 0.3);
        
        if (overloadedNodes.length > 0 && underloadedNodes.length > 0) {
            await this.migrateTasksBetweenNodes(overloadedNodes, underloadedNodes);
        }
    }

    async handleFailures() {
        // Check for failed nodes and jobs
        const failedNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.status === 'unreachable' || 
                           (Date.now() - node.lastSeen) > 30000);
        
        // Remove failed nodes
        for (const node of failedNodes) {
            this.edgeNodes.delete(node.id);
            console.log(`Removed failed edge node: ${node.id}`);
        }
        
        // Check for failed jobs and reschedule them
        const failedJobs = Array.from(this.orchestrator.activeJobs.values())
            .filter(job => job.status === 'failed' || 
                          (Date.now() - job.startTime) > job.timeout);
        
        for (const job of failedJobs) {
            this.orchestrator.activeJobs.delete(job.id);
            if (job.retryCount < 3) {
                job.retryCount = (job.retryCount || 0) + 1;
                this.orchestrator.taskQueue.push(job.task);
                console.log(`Rescheduling failed job: ${job.id}, retry ${job.retryCount}`);
            } else {
                console.error(`Job ${job.id} failed after 3 retries`);
            }
        }
    }

    // Edge caching and optimization
    async optimizeEdgeCache() {
        const cacheStats = await this.edgeCache.getStats();
        
        // Implement cache replacement policies
        if (cacheStats.hitRate < 0.7) {
            await this.adjustCacheStrategy();
        }
        
        // Prefetch frequently accessed data
        const hotData = await this.identifyHotData();
        await this.prefetchToEdge(hotData);
    }

    async prefetchToEdge(data) {
        const predictions = await this.predictDataAccess();
        
        for (const item of predictions) {
            const targetNodes = await this.selectPrefetchNodes(item);
            
            await Promise.all(targetNodes.map(node => 
                this.edgeCache.prefetch(node.id, item.key, item.data)
            ));
        }
    }

    // Network mesh management
    discoverEdgeNodes() {
        // WebRTC-based peer discovery
        this.meshNetwork.on('peer-discovered', (peer) => {
            this.addEdgeNode(peer);
        });
        
        this.meshNetwork.on('peer-disconnected', (peerId) => {
            this.removeEdgeNode(peerId);
        });
        
        // Start discovery
        this.meshNetwork.startDiscovery();
    }

    addEdgeNode(peer) {
        const node = {
            id: peer.id,
            connection: peer.connection,
            capabilities: peer.capabilities || [],
            aiCapabilities: peer.aiCapabilities || { models: [] },
            resources: peer.resources || { memory: 0, compute: 0 },
            status: 'active',
            currentLoad: 0,
            latency: 0,
            privacyLevel: peer.privacyLevel || 1,
            lastSeen: Date.now()
        };
        
        this.edgeNodes.set(peer.id, node);
        this.measureNodeLatency(node);
    }

    async measureNodeLatency(node) {
        const start = performance.now();
        try {
            await this.pingNode(node);
            node.latency = performance.now() - start;
        } catch (error) {
            node.status = 'unreachable';
        }
    }

    // Utility methods
    calculateNodeScore(node, task) {
        const performanceScore = (node.resources.compute / task.computeRequirement) * 0.4;
        const loadScore = (1 - node.currentLoad) * 0.3;
        const latencyScore = (1 / (node.latency + 1)) * 0.2;
        const capabilityScore = node.capabilities.includes(task.type) ? 0.1 : 0;
        
        return performanceScore + loadScore + latencyScore + capabilityScore;
    }

    partitionByData(task, nodeCount) {
        const chunkSize = Math.ceil(task.data.length / nodeCount);
        const partitions = [];
        
        for (let i = 0; i < nodeCount; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, task.data.length);
            partitions.push({
                ...task,
                data: task.data.slice(start, end),
                partition: i
            });
        }
        
        return partitions;
    }

    aggregateResults(results, aggregationType) {
        switch (aggregationType) {
            case 'sum':
                return results.reduce((sum, result) => sum + result, 0);
            case 'average':
                return results.reduce((sum, result) => sum + result, 0) / results.length;
            case 'concat':
                return results.flat();
            case 'max':
                return Math.max(...results);
            case 'vote':
                return this.majorityVote(results);
            default:
                return results;
        }
    }

    hashData(data) {
        return btoa(JSON.stringify(data)).slice(0, 16);
    }

    // Public API
    async submitTask(task) {
        return await this.distributeTask(task);
    }

    async runEdgeAI(model, data, options = {}) {
        return await this.processAIOnEdge(model, data, options);
    }

    async startFederatedLearning(participants, model) {
        return await this.coordinateFederatedLearning(participants, model);
    }

    getEdgeStatus() {
        return {
            nodes: this.edgeNodes.size,
            activeJobs: this.orchestrator.activeJobs.size,
            queueLength: this.orchestrator.taskQueue.length,
            totalCapacity: this.calculateTotalCapacity(),
            networkHealth: this.meshNetwork.getHealth()
        };
    }

    // Missing method implementations
    hasAvailableCapacity() {
        const totalCapacity = this.calculateTotalCapacity();
        const currentLoad = this.getCurrentLoad();
        return currentLoad < totalCapacity * 0.8; // 80% threshold
    }

    async createDistributedJob(task) {
        return {
            id: this.generateJobId(),
            task,
            status: 'pending',
            startTime: Date.now(),
            timeout: task.timeout || 30000,
            retryCount: 0
        };
    }

    async executeDistributedJob(job) {
        try {
            job.status = 'running';
            job.startTime = Date.now();
            
            const result = await this.distributeTask(job.task);
            
            job.status = 'completed';
            job.result = result;
            job.endTime = Date.now();
            
            return result;
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.endTime = Date.now();
            throw error;
        }
    }

    async migrateTasksBetweenNodes(overloadedNodes, underloadedNodes) {
        for (const overloadedNode of overloadedNodes) {
            const tasksToMigrate = this.getNodeTasks(overloadedNode.id);
            const targetNode = underloadedNodes[0]; // Simple selection
            
            for (const task of tasksToMigrate.slice(0, 2)) { // Migrate up to 2 tasks
                await this.migrateTask(task, overloadedNode, targetNode);
            }
        }
    }

    calculateTotalCapacity() {
        return Array.from(this.edgeNodes.values())
            .reduce((total, node) => total + node.resources.compute, 0);
    }

    getCurrentLoad() {
        return Array.from(this.edgeNodes.values())
            .reduce((total, node) => total + (node.resources.compute * node.currentLoad), 0);
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getNodeTasks(nodeId) {
        return Array.from(this.orchestrator.activeJobs.values())
            .filter(job => job.assignedNode === nodeId)
            .map(job => job.task);
    }

    async migrateTask(task, fromNode, toNode) {
        console.log(`Migrating task from ${fromNode.id} to ${toNode.id}`);
        // Implementation would depend on the specific task type
        return true;
    }

    async executeOnEdge(node, task) {
        // Simulate edge execution
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    result: `Task executed on ${node.id}`,
                    executionTime: Math.random() * 1000,
                    nodeId: node.id
                });
            }, Math.random() * 500 + 100);
        });
    }

    async executeAITask(node, task) {
        // Simulate AI task execution
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    prediction: `AI result from ${node.id}`,
                    confidence: Math.random(),
                    model: task.model,
                    nodeId: node.id
                });
            }, Math.random() * 1000 + 200);
        });
    }

    async processLocally(model, data) {
        // Fallback local processing
        return {
            result: `Local processing of ${model.id}`,
            confidence: 0.7,
            local: true
        };
    }

    partitionByModel(task, nodeCount) {
        // Simple model partitioning
        return Array(nodeCount).fill(task);
    }

    partitionByPipeline(task, nodeCount) {
        // Simple pipeline partitioning
        return Array(nodeCount).fill(task);
    }

    partitionEvenly(task, nodeCount) {
        // Simple even partitioning
        return Array(nodeCount).fill(task);
    }

    removeEdgeNode(peerId) {
        this.edgeNodes.delete(peerId);
        console.log(`Removed edge node: ${peerId}`);
    }

    async pingNode(node) {
        // Simple ping simulation
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve();
                } else {
                    reject(new Error('Ping failed'));
                }
            }, Math.random() * 100 + 50);
        });
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.monitorNodeHealth();
        }, 30000); // Every 30 seconds
    }

    async monitorNodeHealth() {
        for (const [nodeId, node] of this.edgeNodes) {
            try {
                await this.pingNode(node);
                node.lastSeen = Date.now();
                node.status = 'active';
            } catch (error) {
                node.status = 'unreachable';
            }
        }
    }

    // Additional missing methods
    async adjustCacheStrategy() {
        console.log('Adjusting cache strategy for better hit rate');
        // Implementation for cache strategy adjustment
    }

    async identifyHotData() {
        // Return mock hot data for prefetching
        return [
            { key: 'popular_model_1', data: 'model_data_1' },
            { key: 'popular_model_2', data: 'model_data_2' }
        ];
    }

    async predictDataAccess() {
        // Return mock predictions for data access patterns
        return [
            { key: 'prediction_1', data: 'data_1' },
            { key: 'prediction_2', data: 'data_2' }
        ];
    }

    async selectPrefetchNodes(item) {
        // Select nodes for prefetching based on item characteristics
        return Array.from(this.edgeNodes.values()).slice(0, 2);
    }

    majorityVote(results) {
        const votes = {};
        results.forEach(result => {
            votes[result] = (votes[result] || 0) + 1;
        });
        
        return Object.keys(votes).reduce((a, b) => 
            votes[a] > votes[b] ? a : b
        );
    }

    async coordinateFederatedLearning(participants, model) {
        console.log(`Starting federated learning with ${participants.length} participants`);
        
        // Mock federated learning coordination
        return {
            status: 'completed',
            participants: participants.length,
            model: model.id,
            rounds: 5,
            accuracy: 0.95
        };
    }

    async selectAINode(model, constraints) {
        // Select the best node for AI processing
        const availableNodes = Array.from(this.edgeNodes.values())
            .filter(node => node.status === 'active' && 
                           node.aiCapabilities.models.includes(model.id));
        
        if (availableNodes.length === 0) {
            return null;
        }
        
        // Return node with lowest latency
        return availableNodes.reduce((best, current) => 
            current.latency < best.latency ? current : best
        );
    }

    setupModelRegistry() {
        // Initialize model registry with common models
        this.aiCapabilities.models.set('text-classification', {
            id: 'text-classification',
            type: 'nlp',
            size: '50MB',
            accuracy: 0.92
        });
        
        this.aiCapabilities.models.set('image-recognition', {
            id: 'image-recognition',
            type: 'computer-vision',
            size: '100MB',
            accuracy: 0.95
        });
    }

    setupInferenceEngines() {
        this.aiCapabilities.inferenceEngines.set('tensorflowjs', {
            framework: 'tensorflow',
            backend: 'webgl',
            supported: ['nlp', 'computer-vision']
        });

        this.aiCapabilities.inferenceEngines.set('onnxjs', {
            framework: 'onnx',
            backend: 'webgl',
            supported: ['computer-vision', 'language-model']
        });
    }
}

// Supporting classes
class LoadBalancer {
    constructor() {
        this.algorithm = 'weighted-round-robin';
        this.weights = new Map();
    }

    selectNode(nodes, task) {
        switch (this.algorithm) {
            case 'round-robin':
                return this.roundRobin(nodes);
            case 'weighted-round-robin':
                return this.weightedRoundRobin(nodes);
            case 'least-connections':
                return this.leastConnections(nodes);
            default:
                return nodes[0];
        }
    }
}

class MeshNetwork {
    constructor() {
        this.peers = new Map();
        this.eventHandlers = new Map();
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => handler(data));
    }

    startDiscovery() {
        // WebRTC peer discovery implementation
        setInterval(() => {
            this.discoverPeers();
        }, 5000);
    }

    discoverPeers() {
        // Mock peer discovery for demonstration
        // In a real implementation, this would use WebRTC or other P2P protocols
        console.log('Discovering peers...');
        
        // Simulate discovering a peer occasionally
        if (Math.random() > 0.8) {
            const mockPeer = {
                id: `peer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                connection: null,
                capabilities: ['compute', 'storage'],
                aiCapabilities: { models: ['text-classification'] },
                resources: { 
                    memory: Math.floor(Math.random() * 8000) + 2000, 
                    compute: Math.floor(Math.random() * 100) + 50 
                },
                privacyLevel: Math.floor(Math.random() * 3) + 1
            };
            
            this.emit('peer-discovered', mockPeer);
        }
    }

    getHealth() {
        return {
            status: 'healthy',
            peers: this.peers.size,
            lastDiscovery: Date.now()
        };
    }
}

class EdgeCache {
    constructor() {
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }

    async get(key) {
        if (this.cache.has(key)) {
            this.stats.hits++;
            return this.cache.get(key);
        }
        this.stats.misses++;
        return null;
    }

    async set(key, value) {
        this.cache.set(key, value);
    }

    async prefetch(nodeId, key, data) {
        // Stub implementation for prefetching data to edge nodes
        this.cache.set(`${nodeId}:${key}`, data);
        return true;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hitRate: total > 0 ? this.stats.hits / total : 0,
            size: this.cache.size
        };
    }
}

class ResourceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            cpu: 80,
            memory: 85,
            network: 90
        };
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            this.collectMetrics();
        }, 5000);
    }

    collectMetrics() {
        // Browser-based resource monitoring
        const metrics = {
            timestamp: Date.now(),
            memory: this.getMemoryUsage(),
            cpu: this.getCPUUsage(),
            network: this.getNetworkUsage(),
            storage: this.getStorageUsage()
        };

        this.metrics.set(metrics.timestamp, metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.size > 100) {
            const oldestKey = Math.min(...this.metrics.keys());
            this.metrics.delete(oldestKey);
        }

        this.checkThresholds(metrics);
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return { used: 0, total: 0, limit: 0, percentage: 0 };
    }

    getCPUUsage() {
        // Estimate CPU usage based on timing
        const start = performance.now();
        let iterations = 0;
        const endTime = start + 10; // 10ms test
        
        while (performance.now() < endTime) {
            iterations++;
        }
        
        // Rough estimation based on iterations completed
        const baselineIterations = 100000; // Baseline for comparison
        const percentage = Math.max(0, Math.min(100, 100 - (iterations / baselineIterations) * 100));
        
        return { percentage, iterations };
    }

    getNetworkUsage() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return { effectiveType: 'unknown', downlink: 0, rtt: 0, saveData: false };
    }

    getStorageUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    percentage: (estimate.usage / estimate.quota) * 100
                };
            });
        }
        return { quota: 0, usage: 0, percentage: 0 };
    }

    checkThresholds(metrics) {
        const alerts = [];
        
        if (metrics.memory.percentage > this.thresholds.memory) {
            alerts.push({ type: 'memory', value: metrics.memory.percentage, threshold: this.thresholds.memory });
        }
        
        if (metrics.cpu.percentage > this.thresholds.cpu) {
            alerts.push({ type: 'cpu', value: metrics.cpu.percentage, threshold: this.thresholds.cpu });
        }
        
        if (alerts.length > 0) {
            this.handleResourceAlerts(alerts);
        }
    }

    handleResourceAlerts(alerts) {
        console.warn('Resource threshold exceeded:', alerts);
        // Emit events for resource management
        alerts.forEach(alert => {
            window.dispatchEvent(new CustomEvent('resource-alert', { detail: alert }));
        });
    }

    getResourceStatus() {
        const latest = Array.from(this.metrics.values()).pop();
        return latest || { timestamp: Date.now(), memory: {}, cpu: {}, network: {}, storage: {} };
    }

    getResourceHistory(duration = 300000) { // 5 minutes default
        const cutoff = Date.now() - duration;
        return Array.from(this.metrics.entries())
            .filter(([timestamp]) => timestamp > cutoff)
            .map(([timestamp, metrics]) => ({ timestamp, ...metrics }));
    }
}

class FailureDetector {
    constructor() {
        this.nodeHealth = new Map();
        this.failureThreshold = 3;
        this.checkInterval = 10000; // 10 seconds
        this.startHealthChecks();
    }

    startHealthChecks() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.checkInterval);
    }

    async performHealthChecks() {
        // This would be called by the EdgeComputingManager
        // with the list of nodes to check
    }

    async checkNodeHealth(node) {
        try {
            const start = performance.now();
            
            // Simulate health check (ping)
            await this.pingNode(node);
            
            const responseTime = performance.now() - start;
            
            this.recordHealthCheck(node.id, true, responseTime);
            return { healthy: true, responseTime };
            
        } catch (error) {
            this.recordHealthCheck(node.id, false, null);
            return { healthy: false, error: error.message };
        }
    }

    async pingNode(node) {
        // Simulate network ping
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate occasional failures
                if (Math.random() < 0.05) { // 5% failure rate
                    reject(new Error('Node unreachable'));
                } else {
                    resolve();
                }
            }, Math.random() * 100 + 50); // 50-150ms response time
        });
    }

    recordHealthCheck(nodeId, success, responseTime) {
        if (!this.nodeHealth.has(nodeId)) {
            this.nodeHealth.set(nodeId, {
                consecutiveFailures: 0,
                lastSuccess: null,
                lastFailure: null,
                averageResponseTime: 0,
                totalChecks: 0,
                successfulChecks: 0
            });
        }

        const health = this.nodeHealth.get(nodeId);
        health.totalChecks++;

        if (success) {
            health.consecutiveFailures = 0;
            health.lastSuccess = Date.now();
            health.successfulChecks++;
            
            if (responseTime) {
                health.averageResponseTime = 
                    (health.averageResponseTime * (health.successfulChecks - 1) + responseTime) / health.successfulChecks;
            }
        } else {
            health.consecutiveFailures++;
            health.lastFailure = Date.now();
        }

        // Check if node should be marked as failed
        if (health.consecutiveFailures >= this.failureThreshold) {
            this.markNodeAsFailed(nodeId);
        }
    }

    markNodeAsFailed(nodeId) {
        console.warn(`Node ${nodeId} marked as failed after ${this.failureThreshold} consecutive failures`);
        
        // Emit failure event
        window.dispatchEvent(new CustomEvent('node-failure', { 
            detail: { nodeId, timestamp: Date.now() } 
        }));
    }

    isNodeHealthy(nodeId) {
        const health = this.nodeHealth.get(nodeId);
        return health ? health.consecutiveFailures < this.failureThreshold : true;
    }

    getNodeHealth(nodeId) {
        return this.nodeHealth.get(nodeId) || null;
    }

    getAllNodeHealth() {
        return Object.fromEntries(this.nodeHealth);
    }

    resetNodeHealth(nodeId) {
        if (this.nodeHealth.has(nodeId)) {
            this.nodeHealth.get(nodeId).consecutiveFailures = 0;
        }
    }
}

// Initialize and expose globally
window.EdgeComputingManager = EdgeComputingManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.edgeComputing = new EdgeComputingManager();
    });
} else {
    window.edgeComputing = new EdgeComputingManager();
}