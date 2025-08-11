/**
 * Context Learning Engine - Integrates all systems for intelligent context-aware assistance
 * Learns from web history, memory, and user interactions to provide predictive help
 */

class ContextLearningEngine {
    constructor() {
        this.webHistoryTracker = null;
        this.memorySystem = null;
        this.knowledgeDatabase = null;
        this.mcpPipelineManager = null;
        
        this.contextModel = new ContextModel();
        this.intentPredictor = new IntentPredictor();
        this.assistanceEngine = new AssistanceEngine();
        this.learningScheduler = new LearningScheduler();
        
        this.isLearning = true;
        this.contextHistory = [];
        this.predictions = [];
        
        this.init();
    }

    async init() {
        await this.waitForDependencies();
        this.setupIntegrations();
        this.startLearningLoop();
        this.createUI();
        
        console.log('🧠 Context Learning Engine initialized');
    }

    async waitForDependencies() {
        // Wait for other systems to initialize
        const checkInterval = 100;
        const maxWait = 10000; // 10 seconds
        let waited = 0;

        while (waited < maxWait) {
            if (window.webHistoryTracker && 
                window.memorySystem && 
                window.enhancedKnowledgeDatabase && 
                window.mcpPipelineManager) {
                
                this.webHistoryTracker = window.webHistoryTracker;
                this.memorySystem = window.memorySystem;
                this.knowledgeDatabase = window.enhancedKnowledgeDatabase;
                this.mcpPipelineManager = window.mcpPipelineManager;
                
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        console.warn('⚠️ Some dependencies not found, continuing with available systems');
    }

    setupIntegrations() {
        // Hook into web history events
        if (this.webHistoryTracker) {
            const originalRecordPageVisit = this.webHistoryTracker.recordPageVisit.bind(this.webHistoryTracker);
            this.webHistoryTracker.recordPageVisit = (url, title) => {
                const result = originalRecordPageVisit(url, title);
                this.processWebHistoryEvent('page_visit', { url, title });
                return result;
            };
        }

        // Hook into memory system events
        if (this.memorySystem) {
            const originalStore = this.memorySystem.store.bind(this.memorySystem);
            this.memorySystem.store = (type, data, metadata = {}) => {
                const result = originalStore(type, data, metadata);
                this.processMemoryEvent('store', { type, data, metadata });
                return result;
            };
        }

        // Set up real-time learning from user interactions
        this.setupInteractionListeners();
        
        console.log('🔗 Context Learning Engine integrations established');
    }

    setupInteractionListeners() {
        // Track user interactions for context learning
        document.addEventListener('click', (e) => this.processInteraction('click', e));
        document.addEventListener('input', (e) => this.processInteraction('input', e));
        document.addEventListener('scroll', () => this.processInteraction('scroll'));
        document.addEventListener('keydown', (e) => this.processInteraction('keydown', e));
        
        // Track focus changes
        window.addEventListener('focus', () => this.processInteraction('window_focus'));
        window.addEventListener('blur', () => this.processInteraction('window_blur'));
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.processInteraction('visibility_change', { hidden: document.hidden });
        });
    }

    async processWebHistoryEvent(eventType, data) {
        if (!this.isLearning) return;

        const context = await this.buildContext('web_history', eventType, data);
        await this.updateContextModel(context);
        await this.generatePredictions(context);
        
        this.contextHistory.push(context);
        this.trimContextHistory();
    }

    async processMemoryEvent(eventType, data) {
        if (!this.isLearning) return;

        const context = await this.buildContext('memory', eventType, data);
        await this.updateContextModel(context);
        await this.generatePredictions(context);
        
        this.contextHistory.push(context);
        this.trimContextHistory();
    }

    async processInteraction(interactionType, event = null) {
        if (!this.isLearning) return;

        const interactionData = this.extractInteractionData(interactionType, event);
        const context = await this.buildContext('interaction', interactionType, interactionData);
        
        await this.updateContextModel(context);
        await this.generatePredictions(context);
        
        this.contextHistory.push(context);
        this.trimContextHistory();
    }

    async buildContext(source, eventType, data) {
        const baseContext = {
            id: this.generateContextId(),
            source: source,
            eventType: eventType,
            timestamp: Date.now(),
            data: data,
            url: window.location.href,
            title: document.title
        };

        // Enrich context with additional information
        const enrichedContext = await this.enrichContext(baseContext);
        
        return enrichedContext;
    }

    async enrichContext(baseContext) {
        const enriched = { ...baseContext };

        // Add temporal context
        enriched.temporal = this.getTemporalContext();

        // Add user profile context
        if (this.webHistoryTracker) {
            enriched.userProfile = this.webHistoryTracker.getUserProfile();
        }

        // Add knowledge context
        if (this.knowledgeDatabase) {
            enriched.relatedKnowledge = await this.findRelatedKnowledge(baseContext);
        }

        // Add memory context
        if (this.memorySystem) {
            enriched.relatedMemories = await this.findRelatedMemories(baseContext);
        }

        // Add intent predictions
        enriched.predictedIntent = await this.intentPredictor.predictIntent(baseContext);

        // Add similarity to recent contexts
        enriched.similarity = this.calculateContextSimilarity(baseContext);

        return enriched;
    }

    getTemporalContext() {
        const now = new Date();
        return {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            month: now.getMonth(),
            season: this.getSeason(now.getMonth()),
            timeOfDay: this.getTimeOfDay(now.getHours()),
            isWeekend: now.getDay() === 0 || now.getDay() === 6
        };
    }

    getSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    getTimeOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    async findRelatedKnowledge(context) {
        if (!this.knowledgeDatabase) return [];

        const searchTerms = this.extractSearchTerms(context);
        const relatedKnowledge = [];

        for (const term of searchTerms) {
            try {
                const results = await this.knowledgeDatabase.search(term);
                relatedKnowledge.push(...results.slice(0, 3)); // Top 3 results per term
            } catch (error) {
                console.warn('Error searching knowledge:', error);
            }
        }

        return relatedKnowledge.slice(0, 10); // Max 10 related items
    }

    async findRelatedMemories(context) {
        if (!this.memorySystem) return [];

        const searchTerms = this.extractSearchTerms(context);
        const relatedMemories = [];

        for (const term of searchTerms) {
            try {
                const results = await this.memorySystem.search(term);
                relatedMemories.push(...results.slice(0, 3));
            } catch (error) {
                console.warn('Error searching memories:', error);
            }
        }

        return relatedMemories.slice(0, 10);
    }

    extractSearchTerms(context) {
        const terms = new Set();

        // Extract from URL
        if (context.url) {
            const url = new URL(context.url);
            terms.add(url.hostname);
            url.pathname.split('/').forEach(part => {
                if (part.length > 2) terms.add(part);
            });
        }

        // Extract from title
        if (context.title) {
            context.title.split(/\s+/).forEach(word => {
                if (word.length > 3) terms.add(word.toLowerCase());
            });
        }

        // Extract from data
        if (context.data && typeof context.data === 'object') {
            Object.values(context.data).forEach(value => {
                if (typeof value === 'string' && value.length > 3) {
                    terms.add(value.toLowerCase());
                }
            });
        }

        return Array.from(terms).slice(0, 5); // Max 5 search terms
    }

    calculateContextSimilarity(newContext) {
        const recentContexts = this.contextHistory.slice(-10); // Last 10 contexts
        const similarities = [];

        for (const context of recentContexts) {
            const similarity = this.computeSimilarity(newContext, context);
            similarities.push({ contextId: context.id, similarity });
        }

        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    computeSimilarity(context1, context2) {
        let similarity = 0;
        let factors = 0;

        // URL similarity
        if (context1.url && context2.url) {
            const url1 = new URL(context1.url);
            const url2 = new URL(context2.url);
            if (url1.hostname === url2.hostname) similarity += 0.3;
            if (url1.pathname === url2.pathname) similarity += 0.2;
            factors += 0.5;
        }

        // Event type similarity
        if (context1.eventType === context2.eventType) {
            similarity += 0.2;
        }
        factors += 0.2;

        // Temporal similarity
        if (context1.temporal && context2.temporal) {
            if (context1.temporal.timeOfDay === context2.temporal.timeOfDay) similarity += 0.1;
            if (context1.temporal.dayOfWeek === context2.temporal.dayOfWeek) similarity += 0.1;
            factors += 0.2;
        }

        // Source similarity
        if (context1.source === context2.source) {
            similarity += 0.1;
        }
        factors += 0.1;

        return factors > 0 ? similarity / factors : 0;
    }

    async updateContextModel(context) {
        await this.contextModel.update(context);
    }

    async generatePredictions(context) {
        const predictions = await this.intentPredictor.generatePredictions(context, this.contextHistory);
        
        // Filter and rank predictions
        const filteredPredictions = predictions
            .filter(p => p.confidence > 0.3)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

        this.predictions = filteredPredictions;
        
        // Trigger assistance if high-confidence predictions exist
        const highConfidencePredictions = filteredPredictions.filter(p => p.confidence > 0.7);
        if (highConfidencePredictions.length > 0) {
            await this.triggerAssistance(highConfidencePredictions);
        }

        this.updatePredictionsUI();
    }

    async triggerAssistance(predictions) {
        for (const prediction of predictions) {
            await this.assistanceEngine.providePredictiveAssistance(prediction);
        }
    }

    startLearningLoop() {
        // Periodic learning and optimization
        setInterval(() => {
            if (this.isLearning) {
                this.optimizeContextModel();
                this.updateUserProfile();
                this.cleanupOldContexts();
            }
        }, 60000); // Every minute

        // Deeper analysis every 5 minutes
        setInterval(() => {
            if (this.isLearning) {
                this.analyzePatterns();
                this.updatePredictionAccuracy();
            }
        }, 300000); // Every 5 minutes
    }

    optimizeContextModel() {
        this.contextModel.optimize(this.contextHistory);
    }

    updateUserProfile() {
        if (this.webHistoryTracker) {
            const profile = this.webHistoryTracker.getUserProfile();
            this.contextModel.updateUserProfile(profile);
        }
    }

    cleanupOldContexts() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;
        this.contextHistory = this.contextHistory.filter(c => c.timestamp > cutoff);
    }

    analyzePatterns() {
        const patterns = this.contextModel.analyzePatterns(this.contextHistory);
        this.learningScheduler.updateLearningSchedule(patterns);
    }

    updatePredictionAccuracy() {
        // Track prediction accuracy and adjust models
        this.intentPredictor.updateAccuracy(this.contextHistory);
    }

    extractInteractionData(interactionType, event) {
        const data = {
            type: interactionType,
            timestamp: Date.now()
        };

        if (event) {
            if (event.target) {
                data.element = {
                    tagName: event.target.tagName,
                    className: event.target.className,
                    id: event.target.id,
                    text: event.target.textContent?.substring(0, 100)
                };
            }

            if (event.key) {
                data.key = event.key;
            }

            if (event.type === 'click' && event.target.href) {
                data.href = event.target.href;
            }
        }

        return data;
    }

    trimContextHistory() {
        const maxHistory = 1000;
        if (this.contextHistory.length > maxHistory) {
            this.contextHistory = this.contextHistory.slice(-maxHistory);
        }
    }

    generateContextId() {
        return 'ctx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // UI Methods
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'context-learning-panel';
        panel.className = 'context-learning-panel';
        panel.innerHTML = `
            <div class="context-header">
                <h3>🧠 Context Learning</h3>
                <button id="toggle-learning">${this.isLearning ? 'Pause' : 'Resume'} Learning</button>
            </div>
            <div class="context-content">
                <div class="learning-status">
                    <div class="status-item">
                        <span class="status-label">Learning:</span>
                        <span class="status-value" id="learning-status">${this.isLearning ? 'Active' : 'Paused'}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Contexts:</span>
                        <span class="status-value" id="context-count">${this.contextHistory.length}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Predictions:</span>
                        <span class="status-value" id="prediction-count">${this.predictions.length}</span>
                    </div>
                </div>
                <div class="current-predictions" id="current-predictions">
                    <h4>🔮 Current Predictions</h4>
                    <div id="predictions-list"></div>
                </div>
                <div class="context-insights" id="context-insights">
                    <h4>💡 Insights</h4>
                    <div id="insights-list"></div>
                </div>
                <div class="learning-controls">
                    <button id="export-context">Export Context Data</button>
                    <button id="clear-context">Clear Context History</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.setupUIEventListeners();
        this.updateUI();
    }

    setupUIEventListeners() {
        document.getElementById('toggle-learning')?.addEventListener('click', () => {
            this.toggleLearning();
        });

        document.getElementById('export-context')?.addEventListener('click', () => {
            this.exportContextData();
        });

        document.getElementById('clear-context')?.addEventListener('click', () => {
            this.clearContextHistory();
        });
    }

    updateUI() {
        const learningStatus = document.getElementById('learning-status');
        const contextCount = document.getElementById('context-count');
        const predictionCount = document.getElementById('prediction-count');
        const toggleButton = document.getElementById('toggle-learning');

        if (learningStatus) learningStatus.textContent = this.isLearning ? 'Active' : 'Paused';
        if (contextCount) contextCount.textContent = this.contextHistory.length;
        if (predictionCount) predictionCount.textContent = this.predictions.length;
        if (toggleButton) toggleButton.textContent = `${this.isLearning ? 'Pause' : 'Resume'} Learning`;

        this.updatePredictionsUI();
        this.updateInsightsUI();
    }

    updatePredictionsUI() {
        const predictionsList = document.getElementById('predictions-list');
        if (!predictionsList) return;

        predictionsList.innerHTML = this.predictions.map(prediction => `
            <div class="prediction-item">
                <div class="prediction-text">${prediction.description}</div>
                <div class="prediction-confidence">${Math.round(prediction.confidence * 100)}%</div>
                <div class="prediction-type">${prediction.type}</div>
            </div>
        `).join('');
    }

    updateInsightsUI() {
        const insightsList = document.getElementById('insights-list');
        if (!insightsList) return;

        const insights = this.generateInsights();
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-text">${insight.text}</div>
                <div class="insight-confidence">${Math.round(insight.confidence * 100)}%</div>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];

        // Most active time of day
        const hourCounts = new Array(24).fill(0);
        this.contextHistory.forEach(context => {
            if (context.temporal) {
                hourCounts[context.temporal.hour]++;
            }
        });

        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        if (peakHour >= 0) {
            insights.push({
                text: `Most active at ${peakHour}:00`,
                confidence: 0.8
            });
        }

        // Most visited domains
        const domainCounts = {};
        this.contextHistory.forEach(context => {
            if (context.url) {
                try {
                    const domain = new URL(context.url).hostname;
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                } catch (e) {}
            }
        });

        const topDomain = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topDomain) {
            insights.push({
                text: `Frequently visits ${topDomain[0]}`,
                confidence: 0.7
            });
        }

        // Learning patterns
        const recentContexts = this.contextHistory.slice(-50);
        const patternTypes = {};
        recentContexts.forEach(context => {
            patternTypes[context.eventType] = (patternTypes[context.eventType] || 0) + 1;
        });

        const topPattern = Object.entries(patternTypes)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topPattern) {
            insights.push({
                text: `Primary activity: ${topPattern[0]}`,
                confidence: 0.6
            });
        }

        return insights.slice(0, 5);
    }

    toggleLearning() {
        this.isLearning = !this.isLearning;
        this.updateUI();
        console.log(`🧠 Context learning ${this.isLearning ? 'resumed' : 'paused'}`);
    }

    exportContextData() {
        const data = {
            contextHistory: this.contextHistory,
            predictions: this.predictions,
            insights: this.generateInsights(),
            exportTime: Date.now()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `context-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearContextHistory() {
        if (confirm('Are you sure you want to clear all context history?')) {
            this.contextHistory = [];
            this.predictions = [];
            this.updateUI();
            console.log('🧠 Context history cleared');
        }
    }

    // Public API
    getCurrentContext() {
        return this.contextHistory[this.contextHistory.length - 1];
    }

    getPredictions() {
        return this.predictions;
    }

    getInsights() {
        return this.generateInsights();
    }

    async addManualContext(type, data) {
        const context = await this.buildContext('manual', type, data);
        await this.updateContextModel(context);
        await this.generatePredictions(context);
        this.contextHistory.push(context);
        this.updateUI();
        return context;
    }
}

// Context Model
class ContextModel {
    constructor() {
        this.patterns = new Map();
        this.userProfile = {};
        this.weights = {
            temporal: 0.2,
            spatial: 0.3,
            behavioral: 0.3,
            content: 0.2
        };
    }

    async update(context) {
        this.updatePatterns(context);
        this.updateWeights(context);
    }

    updatePatterns(context) {
        const patternKey = this.generatePatternKey(context);
        const existing = this.patterns.get(patternKey) || { count: 0, lastSeen: 0, contexts: [] };
        
        existing.count++;
        existing.lastSeen = context.timestamp;
        existing.contexts.push(context.id);
        
        // Keep only recent context IDs
        if (existing.contexts.length > 10) {
            existing.contexts = existing.contexts.slice(-10);
        }
        
        this.patterns.set(patternKey, existing);
    }

    generatePatternKey(context) {
        const parts = [
            context.source,
            context.eventType,
            context.temporal?.timeOfDay,
            context.temporal?.dayOfWeek
        ].filter(Boolean);
        
        return parts.join('|');
    }

    updateWeights(context) {
        // Adjust weights based on context effectiveness
        // This is a simplified version - in practice, this would be more sophisticated
        if (context.predictedIntent?.confidence > 0.8) {
            this.weights.behavioral += 0.01;
            this.weights.content += 0.01;
        }
    }

    optimize(contextHistory) {
        // Remove old patterns
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
        for (const [key, pattern] of this.patterns) {
            if (pattern.lastSeen < cutoff) {
                this.patterns.delete(key);
            }
        }
    }

    updateUserProfile(profile) {
        this.userProfile = { ...this.userProfile, ...profile };
    }

    analyzePatterns(contextHistory) {
        const patterns = [];
        
        // Analyze temporal patterns
        const hourlyActivity = new Array(24).fill(0);
        contextHistory.forEach(context => {
            if (context.temporal) {
                hourlyActivity[context.temporal.hour]++;
            }
        });
        
        patterns.push({
            type: 'temporal',
            data: hourlyActivity,
            strength: Math.max(...hourlyActivity) / (hourlyActivity.reduce((a, b) => a + b, 0) / 24)
        });
        
        return patterns;
    }
}

// Intent Predictor
class IntentPredictor {
    constructor() {
        this.intentHistory = [];
        this.accuracyScore = 0.5;
    }

    async predictIntent(context) {
        const intent = {
            primary: this.classifyPrimaryIntent(context),
            secondary: this.classifySecondaryIntents(context),
            confidence: this.calculateIntentConfidence(context),
            timestamp: Date.now()
        };

        this.intentHistory.push(intent);
        return intent;
    }

    classifyPrimaryIntent(context) {
        // Simple intent classification based on context
        if (context.source === 'web_history') {
            if (context.data.url?.includes('github.com')) return 'development';
            if (context.data.url?.includes('stackoverflow.com')) return 'problem_solving';
            if (context.data.url?.includes('docs.')) return 'learning';
            return 'browsing';
        }
        
        if (context.source === 'interaction') {
            if (context.eventType === 'input') return 'content_creation';
            if (context.eventType === 'click') return 'navigation';
            return 'exploration';
        }
        
        if (context.source === 'memory') {
            return 'information_storage';
        }
        
        return 'general';
    }

    classifySecondaryIntents(context) {
        const secondary = [];
        
        // Add secondary intents based on context
        if (context.temporal?.timeOfDay === 'morning') {
            secondary.push('planning');
        }
        
        if (context.temporal?.isWeekend) {
            secondary.push('leisure');
        }
        
        if (context.relatedKnowledge?.length > 0) {
            secondary.push('knowledge_building');
        }
        
        return secondary;
    }

    calculateIntentConfidence(context) {
        let confidence = 0.5; // Base confidence
        
        // Increase confidence based on available context
        if (context.relatedKnowledge?.length > 0) confidence += 0.1;
        if (context.relatedMemories?.length > 0) confidence += 0.1;
        if (context.similarity?.length > 0) confidence += 0.1;
        if (context.userProfile) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    async generatePredictions(context, contextHistory) {
        const predictions = [];
        
        // Predict next action based on patterns
        const nextActionPrediction = this.predictNextAction(context, contextHistory);
        if (nextActionPrediction) {
            predictions.push(nextActionPrediction);
        }
        
        // Predict information needs
        const informationNeedPrediction = this.predictInformationNeed(context);
        if (informationNeedPrediction) {
            predictions.push(informationNeedPrediction);
        }
        
        // Predict assistance opportunities
        const assistancePrediction = this.predictAssistanceOpportunity(context);
        if (assistancePrediction) {
            predictions.push(assistancePrediction);
        }
        
        return predictions;
    }

    predictNextAction(context, contextHistory) {
        // Analyze recent patterns to predict next action
        const recentContexts = contextHistory.slice(-5);
        const actionSequences = this.findActionSequences(recentContexts);
        
        if (actionSequences.length > 0) {
            const mostLikely = actionSequences[0];
            return {
                type: 'next_action',
                description: `You might want to: ${mostLikely.action}`,
                confidence: mostLikely.confidence,
                data: mostLikely
            };
        }
        
        return null;
    }

    predictInformationNeed(context) {
        if (context.predictedIntent?.primary === 'problem_solving') {
            return {
                type: 'information_need',
                description: 'You might need documentation or examples',
                confidence: 0.7,
                data: { type: 'documentation' }
            };
        }
        
        if (context.predictedIntent?.primary === 'development') {
            return {
                type: 'information_need',
                description: 'You might need API references or code examples',
                confidence: 0.6,
                data: { type: 'api_reference' }
            };
        }
        
        return null;
    }

    predictAssistanceOpportunity(context) {
        if (context.eventType === 'input' && context.data?.text?.length > 50) {
            return {
                type: 'assistance_opportunity',
                description: 'I can help improve or expand this content',
                confidence: 0.5,
                data: { type: 'content_assistance' }
            };
        }
        
        return null;
    }

    findActionSequences(contexts) {
        // Simple sequence analysis - in practice, this would be more sophisticated
        const sequences = [];
        
        for (let i = 0; i < contexts.length - 1; i++) {
            const current = contexts[i];
            const next = contexts[i + 1];
            
            if (current.eventType === 'page_visit' && next.eventType === 'click') {
                sequences.push({
                    action: 'click on page elements',
                    confidence: 0.6
                });
            }
        }
        
        return sequences.sort((a, b) => b.confidence - a.confidence);
    }

    updateAccuracy(contextHistory) {
        // Update prediction accuracy based on actual outcomes
        // This is a simplified version
        const recentPredictions = this.intentHistory.slice(-10);
        let correctPredictions = 0;
        
        // In practice, you'd compare predictions with actual user actions
        recentPredictions.forEach(prediction => {
            if (prediction.confidence > 0.7) {
                correctPredictions++;
            }
        });
        
        this.accuracyScore = recentPredictions.length > 0 
            ? correctPredictions / recentPredictions.length 
            : 0.5;
    }
}

// Assistance Engine
class AssistanceEngine {
    constructor() {
        this.assistanceHistory = [];
        this.activeAssistance = new Map();
    }

    async providePredictiveAssistance(prediction) {
        const assistance = this.generateAssistance(prediction);
        
        if (assistance) {
            this.displayAssistance(assistance);
            this.assistanceHistory.push({
                prediction: prediction,
                assistance: assistance,
                timestamp: Date.now()
            });
        }
    }

    generateAssistance(prediction) {
        switch (prediction.type) {
            case 'next_action':
                return {
                    type: 'suggestion',
                    title: 'Suggested Action',
                    message: prediction.description,
                    actions: [
                        { label: 'Yes, help me', action: () => this.executeAction(prediction) },
                        { label: 'Not now', action: () => this.dismissAssistance(prediction.id) }
                    ]
                };
                
            case 'information_need':
                return {
                    type: 'resource',
                    title: 'Helpful Resources',
                    message: prediction.description,
                    actions: [
                        { label: 'Show resources', action: () => this.showResources(prediction) },
                        { label: 'Dismiss', action: () => this.dismissAssistance(prediction.id) }
                    ]
                };
                
            case 'assistance_opportunity':
                return {
                    type: 'offer',
                    title: 'Can I help?',
                    message: prediction.description,
                    actions: [
                        { label: 'Yes, please', action: () => this.provideHelp(prediction) },
                        { label: 'No thanks', action: () => this.dismissAssistance(prediction.id) }
                    ]
                };
                
            default:
                return null;
        }
    }

    displayAssistance(assistance) {
        const assistanceId = 'assistance_' + Date.now();
        
        const assistanceElement = document.createElement('div');
        assistanceElement.id = assistanceId;
        assistanceElement.className = 'predictive-assistance';
        assistanceElement.innerHTML = `
            <div class="assistance-header">
                <h4>${assistance.title}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="assistance-content">
                <p>${assistance.message}</p>
                <div class="assistance-actions">
                    ${assistance.actions.map((action, index) => 
                        `<button onclick="window.contextLearningEngine.assistanceEngine.handleAction('${assistanceId}', ${index})">${action.label}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(assistanceElement);
        this.activeAssistance.set(assistanceId, assistance);
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            const element = document.getElementById(assistanceId);
            if (element) {
                element.remove();
                this.activeAssistance.delete(assistanceId);
            }
        }, 30000);
    }

    handleAction(assistanceId, actionIndex) {
        const assistance = this.activeAssistance.get(assistanceId);
        if (assistance && assistance.actions[actionIndex]) {
            assistance.actions[actionIndex].action();
        }
        
        // Remove the assistance element
        const element = document.getElementById(assistanceId);
        if (element) {
            element.remove();
            this.activeAssistance.delete(assistanceId);
        }
    }

    executeAction(prediction) {
        console.log('Executing predicted action:', prediction);
        // Implementation would depend on the specific action
    }

    showResources(prediction) {
        console.log('Showing resources for:', prediction);
        // Implementation would show relevant resources
    }

    provideHelp(prediction) {
        console.log('Providing help for:', prediction);
        // Implementation would provide contextual help
    }

    dismissAssistance(predictionId) {
        console.log('Dismissed assistance for:', predictionId);
    }
}

// Learning Scheduler
class LearningScheduler {
    constructor() {
        this.schedule = new Map();
        this.learningTasks = [];
    }

    updateLearningSchedule(patterns) {
        // Schedule learning tasks based on identified patterns
        patterns.forEach(pattern => {
            if (pattern.strength > 1.5) { // Strong pattern
                this.scheduleLearningTask(pattern);
            }
        });
    }

    scheduleLearningTask(pattern) {
        const task = {
            id: 'task_' + Date.now(),
            type: 'pattern_analysis',
            pattern: pattern,
            scheduledTime: Date.now() + (60 * 60 * 1000), // 1 hour from now
            priority: pattern.strength
        };
        
        this.learningTasks.push(task);
        this.learningTasks.sort((a, b) => b.priority - a.priority);
    }

    getNextTask() {
        const now = Date.now();
        return this.learningTasks.find(task => task.scheduledTime <= now);
    }

    completeTask(taskId) {
        this.learningTasks = this.learningTasks.filter(task => task.id !== taskId);
    }
}

// Initialize Context Learning Engine
if (typeof window !== 'undefined') {
    window.ContextLearningEngine = ContextLearningEngine;
    
    // Auto-initialize after other systems
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.contextLearningEngine = new ContextLearningEngine();
        }, 2000); // Wait 2 seconds for other systems to initialize
    });
}