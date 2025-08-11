/**
 * Neural Automation Core
 * Advanced ML-driven automation with neural network decision making
 */

class NeuralAutomationCore {
    constructor() {
        this.neuralNetwork = null;
        this.trainingData = [];
        this.models = new Map();
        this.predictions = new Map();
        
        try {
            this.reinforcementLearning = new ReinforcementLearner();
        } catch (error) {
            console.warn('ReinforcementLearner not available, using fallback:', error);
            this.reinforcementLearning = {
                learn: () => Promise.resolve(),
                getOptimalAction: () => Promise.resolve({}),
                updatePolicy: () => {},
                getQValue: () => 0
            };
        }
        
        this.init();
    }

    init() {
        this.initializeNeuralNetwork();
        this.loadTrainingData();
        this.setupContinuousLearning();
    }

    initializeNeuralNetwork() {
        try {
            // Simple neural network for pattern recognition
            this.neuralNetwork = {
                layers: [
                    { neurons: 20, activation: 'relu' },    // Input layer
                    { neurons: 15, activation: 'relu' },    // Hidden layer 1
                    { neurons: 10, activation: 'relu' },    // Hidden layer 2
                    { neurons: 5, activation: 'sigmoid' }   // Output layer
                ],
                learningRate: 0.01
            };
            
            // Initialize weights and biases after layers are defined
            this.neuralNetwork.weights = this.initializeWeights();
            this.neuralNetwork.biases = this.initializeBiases();
        } catch (error) {
            console.warn('Error initializing neural network:', error);
            // Fallback initialization
            this.neuralNetwork = {
                layers: [],
                weights: [],
                biases: [],
                learningRate: 0.01
            };
        }
    }

    async loadTrainingData() {
        try {
            // Initialize training data storage
            this.trainingData = [];
            
            // Load from localStorage if available
            const storedData = localStorage.getItem('neuralTrainingData');
            if (storedData) {
                this.trainingData = JSON.parse(storedData);
                console.log(`Loaded ${this.trainingData.length} training samples from storage`);
            }
            
            // Generate some initial training data if none exists
            if (this.trainingData.length === 0) {
                this.trainingData = this.generateInitialTrainingData();
                console.log(`Generated ${this.trainingData.length} initial training samples`);
            }
            
            // Validate and clean training data
            this.trainingData = this.trainingData.filter(sample => 
                sample && sample.input && sample.output && 
                Array.isArray(sample.input) && Array.isArray(sample.output)
            );
            
        } catch (error) {
            console.warn('Error loading training data:', error);
            this.trainingData = this.generateInitialTrainingData();
        }
    }

    generateInitialTrainingData() {
        const samples = [];
        
        // Generate sample patterns for different user intents
        for (let i = 0; i < 100; i++) {
            const hour = Math.floor(Math.random() * 24);
            const day = Math.floor(Math.random() * 7);
            const activity = Math.random();
            
            // Create input features
            const input = [
                hour / 24,                    // Time of day
                day / 7,                      // Day of week
                activity,                     // Activity level
                Math.random(),                // Random context
                Math.random() * 0.5 + 0.5,   // Battery level
                Math.random(),                // Network speed
                Math.random() * 0.3,          // CPU usage
                Math.random() * 0.4,          // Memory usage
                Math.random(),                // Repeat count
                Math.random(),                // Sequence position
                Math.random(),                // Interval consistency
                Math.random(),                // Context similarity
                Math.random(),                // App category
                Math.random(),                // Complexity
                Math.random(),                // User experience
                Math.random()                 // Automation potential
            ];
            
            // Create output based on patterns
            const output = [
                hour >= 9 && hour <= 17 ? 0.8 : 0.2,  // Productivity
                hour >= 18 || hour <= 2 ? 0.7 : 0.3,  // Entertainment
                Math.random() * 0.5,                   // Communication
                activity > 0.6 ? 0.6 : 0.2,          // Research
                activity > 0.8 ? 0.9 : 0.1            // Automation
            ];
            
            samples.push({ input, output, timestamp: Date.now() - Math.random() * 86400000 });
        }
        
        return samples;
    }

    // Advanced pattern recognition
    async recognizePattern(inputData) {
        const features = this.extractFeatures(inputData);
        const normalized = this.normalizeFeatures(features);
        const prediction = this.forwardPass(normalized);
        
        return {
            pattern: this.interpretPrediction(prediction),
            confidence: Math.max(...prediction),
            features: features,
            rawPrediction: prediction
        };
    }

    extractFeatures(data) {
        const features = [];
        
        // Time-based features
        const time = new Date(data.timestamp || Date.now());
        features.push(
            time.getHours() / 24,           // Hour of day (0-1)
            time.getDay() / 7,              // Day of week (0-1)
            time.getDate() / 31,            // Day of month (0-1)
            time.getMonth() / 12            // Month (0-1)
        );
        
        // Activity features
        features.push(
            data.clickCount || 0,           // User activity level
            data.scrollDistance || 0,      // Scroll behavior
            data.timeSpent || 0,           // Time on page
            data.keystrokes || 0           // Typing activity
        );
        
        // Context features
        const context = data.context || {};
        features.push(
            context.batteryLevel || 1,      // Device battery
            context.networkSpeed || 1,     // Network quality
            context.cpuUsage || 0,         // System load
            context.memoryUsage || 0       // Memory usage
        );
        
        // Behavioral features
        features.push(
            data.repeatCount || 0,          // How often this action repeats
            data.sequencePosition || 0,    // Position in action sequence
            data.intervalConsistency || 0, // Timing consistency
            data.contextSimilarity || 0    // Similar context occurrences
        );
        
        // Application features
        features.push(
            data.appCategory || 0,          // Type of application
            data.complexity || 0,           // Task complexity
            data.userExperience || 0,      // User skill level
            data.automationPotential || 0  // How automatable this is
        );
        
        return features;
    }

    forwardPass(input) {
        if (!this.neuralNetwork || !this.neuralNetwork.layers) {
            console.warn('Neural network not properly initialized, reinitializing...');
            this.initializeNeuralNetwork();
            if (!this.neuralNetwork || !this.neuralNetwork.layers) {
                return [0, 0, 0, 0, 0]; // Default prediction
            }
        }
        
        let activation = input;
        
        for (let i = 0; i < this.neuralNetwork.layers.length; i++) {
            const layer = this.neuralNetwork.layers[i];
            const weights = this.neuralNetwork.weights[i];
            const biases = this.neuralNetwork.biases[i];
            
            // Matrix multiplication + bias
            const newActivation = [];
            for (let j = 0; j < layer.neurons; j++) {
                let sum = biases[j];
                for (let k = 0; k < activation.length; k++) {
                    sum += activation[k] * weights[k][j];
                }
                newActivation.push(this.activate(sum, layer.activation));
            }
            activation = newActivation;
        }
        
        return activation;
    }

    activate(x, type) {
        switch (type) {
            case 'relu': return Math.max(0, x);
            case 'sigmoid': return 1 / (1 + Math.exp(-x));
            case 'tanh': return Math.tanh(x);
            default: return x;
        }
    }

    // Reinforcement learning for automation optimization
    async optimizeAutomation(automationId, feedback) {
        const automation = window.automationCore?.automations.get(automationId);
        if (!automation) return;

        const state = this.getAutomationState(automation);
        const action = automation.lastAction;
        const reward = this.calculateReward(feedback);

        await this.reinforcementLearning.learn(state, action, reward);
        
        // Update automation parameters based on learning
        const optimizedParams = await this.reinforcementLearning.getOptimalAction(state);
        this.updateAutomationParameters(automationId, optimizedParams);
    }

    calculateReward(feedback) {
        const rewards = {
            'positive': 1.0,
            'negative': -1.0,
            'neutral': 0.0,
            'excellent': 1.5,
            'poor': -1.5
        };
        return rewards[feedback] || 0;
    }

    // Advanced prediction models
    async predictUserIntent(currentContext) {
        const features = this.extractFeatures(currentContext);
        const prediction = await this.recognizePattern({ features, context: currentContext });
        
        const intents = [
            { intent: 'productivity', probability: prediction.rawPrediction[0] },
            { intent: 'entertainment', probability: prediction.rawPrediction[1] },
            { intent: 'communication', probability: prediction.rawPrediction[2] },
            { intent: 'research', probability: prediction.rawPrediction[3] },
            { intent: 'automation', probability: prediction.rawPrediction[4] }
        ];
        
        return intents.sort((a, b) => b.probability - a.probability);
    }

    async predictOptimalTiming(action) {
        const historicalData = this.getHistoricalData(action);
        const timeFeatures = historicalData.map(d => ({
            hour: new Date(d.timestamp).getHours(),
            success: d.success ? 1 : 0,
            userSatisfaction: d.satisfaction || 0.5
        }));
        
        // Simple time-based prediction
        const hourlySuccess = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        
        timeFeatures.forEach(({ hour, success }) => {
            hourlySuccess[hour] += success;
            hourlyCounts[hour]++;
        });
        
        const optimalHours = hourlySuccess.map((success, hour) => ({
            hour,
            successRate: hourlyCounts[hour] > 0 ? success / hourlyCounts[hour] : 0,
            confidence: Math.min(hourlyCounts[hour] / 10, 1)
        })).sort((a, b) => b.successRate - a.successRate);
        
        return optimalHours[0];
    }

    // Continuous learning system
    setupContinuousLearning() {
        setInterval(() => {
            this.retrainModels();
            this.updatePredictions();
            this.optimizePerformance();
        }, 300000); // Every 5 minutes
    }

    async retrainModels() {
        const newData = this.collectRecentData();
        if (newData.length < 10) return; // Need minimum data
        
        this.trainingData.push(...newData);
        
        // Keep only recent data (last 1000 samples)
        if (this.trainingData.length > 1000) {
            this.trainingData = this.trainingData.slice(-1000);
        }
        
        // Retrain neural network
        await this.trainNeuralNetwork(this.trainingData);
    }

    async trainNeuralNetwork(data) {
        const epochs = 50;
        const batchSize = 32;
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            const shuffled = this.shuffleArray([...data]);
            
            for (let i = 0; i < shuffled.length; i += batchSize) {
                const batch = shuffled.slice(i, i + batchSize);
                await this.trainBatch(batch);
            }
        }
    }

    async trainBatch(batch) {
        const gradients = this.calculateGradients(batch);
        this.updateWeights(gradients);
    }

    // Advanced automation strategies
    async generateAutomationStrategy(userGoals) {
        const strategies = [];
        
        for (const goal of userGoals) {
            const strategy = {
                goal: goal.description,
                approach: await this.selectOptimalApproach(goal),
                steps: await this.generateSteps(goal),
                metrics: this.defineSuccessMetrics(goal),
                timeline: this.estimateTimeline(goal)
            };
            
            strategies.push(strategy);
        }
        
        return this.prioritizeStrategies(strategies);
    }

    async selectOptimalApproach(goal) {
        const approaches = [
            { name: 'rule-based', complexity: 'low', flexibility: 'low', accuracy: 'high' },
            { name: 'ml-driven', complexity: 'medium', flexibility: 'medium', accuracy: 'medium' },
            { name: 'neural-adaptive', complexity: 'high', flexibility: 'high', accuracy: 'high' },
            { name: 'hybrid', complexity: 'medium', flexibility: 'high', accuracy: 'high' }
        ];
        
        const scores = approaches.map(approach => ({
            ...approach,
            score: this.scoreApproach(approach, goal)
        }));
        
        return scores.sort((a, b) => b.score - a.score)[0];
    }

    // Model management
    saveModel(name, model) {
        this.models.set(name, {
            model,
            timestamp: Date.now(),
            version: this.getModelVersion(name),
            performance: this.evaluateModel(model)
        });
        
        // Persist to localStorage
        localStorage.setItem(`neural_model_${name}`, JSON.stringify(model));
    }

    loadModel(name) {
        const stored = localStorage.getItem(`neural_model_${name}`);
        if (stored) {
            const model = JSON.parse(stored);
            this.models.set(name, model);
            return model;
        }
        return null;
    }

    // Utility methods
    initializeWeights() {
        if (!this.neuralNetwork || !this.neuralNetwork.layers) {
            console.warn('Neural network layers not defined, using default weights');
            return [];
        }
        
        const weights = [];
        let prevSize = 20; // Input size
        
        for (const layer of this.neuralNetwork.layers) {
            const layerWeights = [];
            for (let i = 0; i < prevSize; i++) {
                const neuronWeights = [];
                for (let j = 0; j < layer.neurons; j++) {
                    neuronWeights.push((Math.random() - 0.5) * 2);
                }
                layerWeights.push(neuronWeights);
            }
            weights.push(layerWeights);
            prevSize = layer.neurons;
        }
        
        return weights;
    }

    initializeBiases() {
        if (!this.neuralNetwork || !this.neuralNetwork.layers) {
            console.warn('Neural network layers not defined, using default biases');
            return [];
        }
        
        return this.neuralNetwork.layers.map(layer => 
            new Array(layer.neurons).fill(0).map(() => (Math.random() - 0.5) * 2)
        );
    }

    normalizeFeatures(features) {
        return features.map(f => Math.max(0, Math.min(1, f)));
    }

    interpretPrediction(prediction) {
        const patterns = ['productivity', 'entertainment', 'communication', 'research', 'automation'];
        const maxIndex = prediction.indexOf(Math.max(...prediction));
        return patterns[maxIndex];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Public API
    async analyzeUserBehavior(data) {
        return await this.recognizePattern(data);
    }

    async getAutomationRecommendations(context) {
        const intent = await this.predictUserIntent(context);
        const timing = await this.predictOptimalTiming(intent[0].intent);
        
        return {
            intent: intent[0],
            optimalTiming: timing,
            confidence: intent[0].probability * timing.confidence,
            recommendations: await this.generateRecommendations(intent[0], timing)
        };
    }

    getModelPerformance() {
        return Array.from(this.models.entries()).map(([name, model]) => ({
            name,
            performance: model.performance,
            lastUpdated: model.timestamp,
            version: model.version
        }));
    }
}

// Reinforcement Learning Component
class ReinforcementLearner {
    constructor() {
        this.qTable = new Map();
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.1;
    }

    async learn(state, action, reward) {
        const stateKey = this.stateToKey(state);
        const qValues = this.qTable.get(stateKey) || new Map();
        
        const currentQ = qValues.get(action) || 0;
        const maxFutureQ = Math.max(...Array.from(qValues.values()), 0);
        
        const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxFutureQ - currentQ);
        qValues.set(action, newQ);
        this.qTable.set(stateKey, qValues);
    }

    async getOptimalAction(state) {
        const stateKey = this.stateToKey(state);
        const qValues = this.qTable.get(stateKey);
        
        if (!qValues || Math.random() < this.explorationRate) {
            return this.getRandomAction();
        }
        
        let bestAction = null;
        let bestValue = -Infinity;
        
        for (const [action, value] of qValues) {
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }
        
        return bestAction;
    }

    stateToKey(state) {
        return JSON.stringify(state);
    }

    getRandomAction() {
        const actions = ['execute', 'delay', 'modify', 'skip'];
        return actions[Math.floor(Math.random() * actions.length)];
    }
}

// Initialize and expose globally
window.NeuralAutomationCore = NeuralAutomationCore;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.neuralAutomation = new NeuralAutomationCore();
    });
} else {
    window.neuralAutomation = new NeuralAutomationCore();
}