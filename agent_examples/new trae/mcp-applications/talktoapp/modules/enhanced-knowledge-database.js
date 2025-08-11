/**
 * Enhanced Knowledge Database - Integrates web history context with memory system
 * Creates and maintains intelligent knowledge database with user preference learning
 */

class EnhancedKnowledgeDatabase {
    constructor() {
        this.database = null;
        this.memorySystem = null;
        this.webHistoryTracker = null;
        this.knowledgeGraph = new Map();
        this.userProfile = new Map();
        this.contextEngine = new KnowledgeContextEngine();
        this.learningEngine = new KnowledgeLearningEngine();
        this.predictionEngine = new KnowledgePredictionEngine();
        
        this.init();
    }

    async init() {
        await this.initDatabase();
        this.setupIntegrations();
        this.startLearningProcess();
        this.createUI();
        
        console.log('🧠 Enhanced Knowledge Database initialized');
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EnhancedKnowledgeDB', 3);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.database = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Knowledge entries store
                if (!db.objectStoreNames.contains('knowledge')) {
                    const knowledgeStore = db.createObjectStore('knowledge', { keyPath: 'id', autoIncrement: true });
                    knowledgeStore.createIndex('topic', 'topic', { unique: false });
                    knowledgeStore.createIndex('category', 'category', { unique: false });
                    knowledgeStore.createIndex('timestamp', 'timestamp', { unique: false });
                    knowledgeStore.createIndex('source', 'source', { unique: false });
                    knowledgeStore.createIndex('relevance', 'relevance', { unique: false });
                }
                
                // User preferences store
                if (!db.objectStoreNames.contains('preferences')) {
                    const preferencesStore = db.createObjectStore('preferences', { keyPath: 'key' });
                    preferencesStore.createIndex('category', 'category', { unique: false });
                    preferencesStore.createIndex('confidence', 'confidence', { unique: false });
                }
                
                // Context associations store
                if (!db.objectStoreNames.contains('contexts')) {
                    const contextsStore = db.createObjectStore('contexts', { keyPath: 'id', autoIncrement: true });
                    contextsStore.createIndex('contextType', 'contextType', { unique: false });
                    contextsStore.createIndex('associatedKnowledge', 'associatedKnowledge', { unique: false });
                }
                
                // Learning patterns store
                if (!db.objectStoreNames.contains('patterns')) {
                    const patternsStore = db.createObjectStore('patterns', { keyPath: 'id', autoIncrement: true });
                    patternsStore.createIndex('patternType', 'patternType', { unique: false });
                    patternsStore.createIndex('strength', 'strength', { unique: false });
                }
                
                // Predictions store
                if (!db.objectStoreNames.contains('predictions')) {
                    const predictionsStore = db.createObjectStore('predictions', { keyPath: 'id', autoIncrement: true });
                    predictionsStore.createIndex('predictionType', 'predictionType', { unique: false });
                    predictionsStore.createIndex('confidence', 'confidence', { unique: false });
                    predictionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    setupIntegrations() {
        // Integrate with existing memory system
        if (window.memorySystem) {
            this.memorySystem = window.memorySystem;
            this.integrateWithMemorySystem();
        }
        
        // Integrate with web history tracker
        if (window.webHistoryTracker) {
            this.webHistoryTracker = window.webHistoryTracker;
            this.integrateWithWebHistory();
        }
        
        // Set up event listeners for real-time learning
        this.setupEventListeners();
    }

    startLearningProcess() {
        // Initialize continuous learning algorithms
        this.learningEngine = {
            patterns: new Map(),
            preferences: new Map(),
            contexts: new Map(),
            predictions: new Map()
        };
        
        // Start pattern recognition
        this.startPatternRecognition();
        
        // Start preference learning
        this.startPreferenceLearning();
        
        // Start context analysis
        this.startContextAnalysis();
        
        // Start predictive modeling
        this.startPredictiveModeling();
        
        console.log('🧠 Learning process started');
    }

    startPatternRecognition() {
        setInterval(() => {
            this.analyzeUserPatterns();
        }, 120000); // Every 2 minutes
    }

    startPreferenceLearning() {
        setInterval(() => {
            this.updatePreferenceLearning();
        }, 180000); // Every 3 minutes
    }

    startContextAnalysis() {
        setInterval(() => {
            this.analyzeCurrentContext();
        }, 90000); // Every 1.5 minutes
    }

    startPredictiveModeling() {
        setInterval(() => {
            this.updatePredictiveModels();
        }, 300000); // Every 5 minutes
    }

    async analyzeUserPatterns() {
        try {
            const recentKnowledge = await this.getRecentKnowledge(24 * 60 * 60 * 1000); // Last 24 hours
            const patterns = this.extractPatterns(recentKnowledge);
            
            for (const pattern of patterns) {
                this.learningEngine.patterns.set(pattern.id, pattern);
            }
        } catch (error) {
            console.error('Error analyzing user patterns:', error);
        }
    }

    async updatePreferenceLearning() {
        try {
            const interactions = await this.getRecentInteractions();
            const preferences = this.extractPreferencesFromInteractions(interactions);
            
            for (const [key, value] of preferences) {
                this.learningEngine.preferences.set(key, value);
            }
        } catch (error) {
            console.error('Error updating preference learning:', error);
        }
    }

    async analyzeCurrentContext() {
        try {
            const context = this.getCurrentContext();
            const contextAnalysis = this.analyzeContext(context);
            
            this.learningEngine.contexts.set(Date.now(), contextAnalysis);
        } catch (error) {
            console.error('Error analyzing current context:', error);
        }
    }

    async updatePredictiveModels() {
        try {
            const historicalData = await this.getHistoricalData();
            const predictions = this.generatePredictions(historicalData);
            
            for (const prediction of predictions) {
                this.learningEngine.predictions.set(prediction.id, prediction);
            }
        } catch (error) {
            console.error('Error updating predictive models:', error);
        }
    }

    integrateWithMemorySystem() {
        // Hook into memory system events
        const originalStore = this.memorySystem.store.bind(this.memorySystem);
        this.memorySystem.store = (type, data, metadata = {}) => {
            // Call original store method
            const result = originalStore(type, data, metadata);
            
            // Enhance with knowledge database
            this.processMemoryForKnowledge(type, data, metadata);
            
            return result;
        };
        
        console.log('🔗 Integrated with Memory System');
    }

    integrateWithWebHistory() {
        // Hook into web history events
        const originalRecordPageVisit = this.webHistoryTracker.recordPageVisit.bind(this.webHistoryTracker);
        this.webHistoryTracker.recordPageVisit = (url, title) => {
            // Call original method
            const result = originalRecordPageVisit(url, title);
            
            // Extract knowledge from page visit
            this.extractKnowledgeFromPageVisit(url, title);
            
            return result;
        };
        
        console.log('🔗 Integrated with Web History Tracker');
    }

    setupEventListeners() {
        // Listen for user interactions to learn preferences
        document.addEventListener('click', (e) => this.learnFromInteraction('click', e));
        document.addEventListener('input', (e) => this.learnFromInteraction('input', e));
        document.addEventListener('scroll', () => this.learnFromInteraction('scroll'));
        
        // Periodic knowledge processing
        setInterval(() => this.processKnowledgeUpdates(), 60000); // Every minute
        setInterval(() => this.updatePredictions(), 300000); // Every 5 minutes
    }

    async processMemoryForKnowledge(type, data, metadata) {
        try {
            const knowledgeEntry = {
                topic: this.extractTopic(data),
                category: type,
                content: this.sanitizeContent(data),
                source: 'memory_system',
                timestamp: Date.now(),
                relevance: this.calculateRelevance(data, metadata),
                context: this.extractContext(metadata),
                associations: this.findAssociations(data)
            };
            
            await this.storeKnowledge(knowledgeEntry);
            await this.updateUserPreferences(knowledgeEntry);
            
        } catch (error) {
            console.error('Error processing memory for knowledge:', error);
        }
    }

    async extractKnowledgeFromPageVisit(url, title) {
        try {
            const knowledgeEntry = {
                topic: this.extractTopicFromPage(title, url),
                category: 'web_browsing',
                content: { title, url, domain: new URL(url).hostname },
                source: 'web_history',
                timestamp: Date.now(),
                relevance: this.calculatePageRelevance(title, url),
                context: this.extractPageContext(url),
                associations: this.findPageAssociations(title, url)
            };
            
            await this.storeKnowledge(knowledgeEntry);
            await this.updateUserPreferences(knowledgeEntry);
            
        } catch (error) {
            console.error('Error extracting knowledge from page visit:', error);
        }
    }

    async storeKnowledge(knowledgeEntry) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['knowledge'], 'readwrite');
            const store = transaction.objectStore('knowledge');
            
            const request = store.add(knowledgeEntry);
            request.onsuccess = () => {
                this.updateKnowledgeGraph(knowledgeEntry);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateUserPreferences(knowledgeEntry) {
        const preferences = await this.extractPreferences(knowledgeEntry);
        
        for (const [key, value] of preferences) {
            await this.updatePreference(key, value);
        }
    }

    async updatePreference(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['preferences'], 'readwrite');
            const store = transaction.objectStore('preferences');
            
            // Get existing preference
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const preference = {
                    key: key,
                    value: existing ? this.mergePreferenceValues(existing.value, value) : value,
                    category: this.categorizePreference(key),
                    confidence: this.calculatePreferenceConfidence(existing, value),
                    lastUpdated: Date.now(),
                    updateCount: existing ? existing.updateCount + 1 : 1
                };
                
                const putRequest = store.put(preference);
                putRequest.onsuccess = () => {
                    this.userProfile.set(key, preference);
                    resolve();
                };
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    updateKnowledgeGraph(knowledgeEntry) {
        const topic = knowledgeEntry.topic;
        
        if (!this.knowledgeGraph.has(topic)) {
            this.knowledgeGraph.set(topic, {
                entries: [],
                associations: new Set(),
                strength: 0,
                lastAccessed: Date.now()
            });
        }
        
        const topicData = this.knowledgeGraph.get(topic);
        topicData.entries.push(knowledgeEntry);
        topicData.strength += knowledgeEntry.relevance;
        topicData.lastAccessed = Date.now();
        
        // Add associations
        if (knowledgeEntry.associations) {
            knowledgeEntry.associations.forEach(assoc => topicData.associations.add(assoc));
        }
    }

    async learnFromInteraction(type, event) {
        const interactionData = this.extractInteractionData(type, event);
        const learningResult = await this.learningEngine.processInteraction(interactionData);
        
        if (learningResult.shouldUpdateKnowledge) {
            await this.storeKnowledge(learningResult.knowledgeEntry);
        }
        
        if (learningResult.shouldUpdatePreferences) {
            await this.updateUserPreferences(learningResult.knowledgeEntry);
        }
    }

    async processKnowledgeUpdates() {
        // Process accumulated knowledge and update patterns
        const patterns = await this.learningEngine.analyzePatterns(this.knowledgeGraph);
        await this.storePatterns(patterns);
        
        // Update knowledge relevance scores
        await this.updateRelevanceScores();
        
        // Clean up old or irrelevant knowledge
        await this.cleanupKnowledge();
    }

    async updatePredictions() {
        const predictions = await this.predictionEngine.generatePredictions(
            this.userProfile,
            this.knowledgeGraph,
            this.webHistoryTracker?.getUserProfile()
        );
        
        await this.storePredictions(predictions);
        this.displayPredictions(predictions);
    }

    // Knowledge Extraction Methods
    extractTopic(data) {
        if (typeof data === 'string') {
            return this.extractTopicFromText(data);
        } else if (data && data.topic) {
            return data.topic;
        } else if (data && data.title) {
            return this.extractTopicFromText(data.title);
        }
        return 'general';
    }

    extractTopicFromText(text) {
        // Simple topic extraction - can be enhanced with NLP
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const meaningfulWords = words.filter(word => word.length > 3 && !stopWords.has(word));
        
        return meaningfulWords.slice(0, 3).join('_') || 'general';
    }

    extractTopicFromPage(title, url) {
        const titleTopics = this.extractTopicFromText(title);
        const urlTopics = this.extractTopicFromText(url);
        
        return titleTopics !== 'general' ? titleTopics : urlTopics;
    }

    sanitizeContent(data) {
        // Remove sensitive information while preserving useful content
        if (typeof data === 'string') {
            return data.replace(/\b\d{4,}\b/g, '[NUMBER]')
                      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                      .substring(0, 1000); // Limit content length
        }
        
        return JSON.stringify(data).substring(0, 1000);
    }

    calculateRelevance(data, metadata) {
        let relevance = 0.5; // Base relevance
        
        // Increase relevance based on metadata
        if (metadata.importance) relevance += 0.3;
        if (metadata.userGenerated) relevance += 0.2;
        if (metadata.frequency && metadata.frequency > 1) relevance += 0.1;
        
        return Math.min(relevance, 1.0);
    }

    calculatePageRelevance(title, url) {
        let relevance = 0.3; // Base relevance for web pages
        
        // Increase relevance for certain domains
        const domain = new URL(url).hostname;
        const highValueDomains = ['stackoverflow.com', 'github.com', 'developer.mozilla.org', 'docs.microsoft.com'];
        
        if (highValueDomains.some(d => domain.includes(d))) {
            relevance += 0.4;
        }
        
        // Increase relevance for longer titles (more descriptive)
        if (title && title.length > 50) {
            relevance += 0.2;
        }
        
        return Math.min(relevance, 1.0);
    }

    extractContext(metadata) {
        return {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            ...metadata
        };
    }

    extractPageContext(url) {
        const urlObj = new URL(url);
        return {
            domain: urlObj.hostname,
            path: urlObj.pathname,
            protocol: urlObj.protocol,
            timestamp: Date.now()
        };
    }

    findAssociations(data) {
        // Find related topics and concepts
        const associations = [];
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Look for existing topics in the knowledge graph
        for (const [topic, topicData] of this.knowledgeGraph) {
            if (text.toLowerCase().includes(topic.toLowerCase())) {
                associations.push(topic);
            }
        }
        
        return associations;
    }

    findPageAssociations(title, url) {
        const associations = [];
        const text = (title + ' ' + url).toLowerCase();
        
        // Find associations with existing knowledge
        for (const [topic, topicData] of this.knowledgeGraph) {
            if (text.includes(topic.toLowerCase())) {
                associations.push(topic);
            }
        }
        
        return associations;
    }

    extractPreferences(knowledgeEntry) {
        const preferences = new Map();
        
        // Extract topic preferences
        preferences.set(`topic_${knowledgeEntry.topic}`, {
            interest: knowledgeEntry.relevance,
            frequency: 1,
            lastSeen: Date.now()
        });
        
        // Extract category preferences
        preferences.set(`category_${knowledgeEntry.category}`, {
            interest: knowledgeEntry.relevance * 0.8,
            frequency: 1,
            lastSeen: Date.now()
        });
        
        // Extract source preferences
        preferences.set(`source_${knowledgeEntry.source}`, {
            trust: knowledgeEntry.relevance,
            frequency: 1,
            lastSeen: Date.now()
        });
        
        return preferences;
    }

    mergePreferenceValues(existing, newValue) {
        return {
            interest: (existing.interest + newValue.interest) / 2,
            frequency: (existing.frequency || 0) + (newValue.frequency || 1),
            trust: existing.trust ? (existing.trust + (newValue.trust || 0)) / 2 : newValue.trust,
            lastSeen: Math.max(existing.lastSeen || 0, newValue.lastSeen || Date.now())
        };
    }

    categorizePreference(key) {
        if (key.startsWith('topic_')) return 'topic';
        if (key.startsWith('category_')) return 'category';
        if (key.startsWith('source_')) return 'source';
        return 'general';
    }

    calculatePreferenceConfidence(existing, newValue) {
        const baseConfidence = 0.5;
        const frequencyBonus = existing ? Math.min(existing.updateCount * 0.1, 0.4) : 0;
        const recencyBonus = newValue.lastSeen ? 0.1 : 0;
        
        return Math.min(baseConfidence + frequencyBonus + recencyBonus, 1.0);
    }

    extractInteractionData(type, event) {
        const data = {
            type: type,
            timestamp: Date.now(),
            element: event?.target?.tagName,
            text: event?.target?.textContent?.substring(0, 100),
            url: window.location.href
        };
        
        if (type === 'click' && event?.target?.href) {
            data.href = event.target.href;
        }
        
        return data;
    }

    // Database Operations
    async storePatterns(patterns) {
        const transaction = this.database.transaction(['patterns'], 'readwrite');
        const store = transaction.objectStore('patterns');
        
        for (const pattern of patterns) {
            await new Promise((resolve, reject) => {
                const request = store.put(pattern);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    async storePredictions(predictions) {
        const transaction = this.database.transaction(['predictions'], 'readwrite');
        const store = transaction.objectStore('predictions');
        
        for (const prediction of predictions) {
            await new Promise((resolve, reject) => {
                const request = store.add(prediction);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    async updateRelevanceScores() {
        // Update relevance scores based on recent activity
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        for (const [topic, topicData] of this.knowledgeGraph) {
            const daysSinceAccess = (now - topicData.lastAccessed) / dayMs;
            const decayFactor = Math.exp(-daysSinceAccess / 30); // 30-day half-life
            
            topicData.strength *= decayFactor;
            
            // Remove topics with very low strength
            if (topicData.strength < 0.1) {
                this.knowledgeGraph.delete(topic);
            }
        }
    }

    async cleanupKnowledge() {
        // Remove old or irrelevant knowledge entries
        const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
        
        const transaction = this.database.transaction(['knowledge'], 'readwrite');
        const store = transaction.objectStore('knowledge');
        const index = store.index('timestamp');
        
        const range = IDBKeyRange.upperBound(cutoffDate);
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.relevance < 0.3) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    }

    // Query Methods
    async queryKnowledge(query) {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['knowledge'], 'readonly');
            const store = transaction.objectStore('knowledge');
            const results = [];
            
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const entry = cursor.value;
                    if (this.matchesQuery(entry, query)) {
                        results.push(entry);
                    }
                    cursor.continue();
                } else {
                    resolve(results.sort((a, b) => b.relevance - a.relevance));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    matchesQuery(entry, query) {
        const queryLower = query.toLowerCase();
        return entry.topic.toLowerCase().includes(queryLower) ||
               entry.category.toLowerCase().includes(queryLower) ||
               (typeof entry.content === 'string' && entry.content.toLowerCase().includes(queryLower));
    }

    async getUserPreferences() {
        return new Promise((resolve, reject) => {
            const transaction = this.database.transaction(['preferences'], 'readonly');
            const store = transaction.objectStore('preferences');
            const results = [];
            
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results.sort((a, b) => b.confidence - a.confidence));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // UI Methods
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'knowledge-database-panel';
        panel.className = 'knowledge-database-panel';
        panel.innerHTML = `
            <div class="knowledge-header">
                <h3>🧠 Knowledge Database</h3>
                <button id="toggle-knowledge-learning">Learning: ON</button>
            </div>
            <div class="knowledge-content">
                <div class="knowledge-stats">
                    <div class="stat">
                        <span class="stat-label">Knowledge Entries:</span>
                        <span class="stat-value" id="knowledge-count">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">User Preferences:</span>
                        <span class="stat-value" id="preferences-count">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Learning Accuracy:</span>
                        <span class="stat-value" id="learning-accuracy">0%</span>
                    </div>
                </div>
                <div class="knowledge-search">
                    <input type="text" id="knowledge-search-input" placeholder="Search knowledge...">
                    <button id="knowledge-search-btn">Search</button>
                </div>
                <div class="knowledge-results" id="knowledge-results"></div>
                <div class="knowledge-predictions" id="knowledge-predictions">
                    <h4>🔮 Predictions</h4>
                    <div id="prediction-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.setupUIEventListeners();
        this.updateUI();
    }

    setupUIEventListeners() {
        document.getElementById('knowledge-search-btn')?.addEventListener('click', async () => {
            const query = document.getElementById('knowledge-search-input').value;
            if (query) {
                const results = await this.queryKnowledge(query);
                this.displaySearchResults(results);
            }
        });
        
        document.getElementById('knowledge-search-input')?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query) {
                    const results = await this.queryKnowledge(query);
                    this.displaySearchResults(results);
                }
            }
        });
    }

    async updateUI() {
        const knowledgeCount = this.knowledgeGraph.size;
        const preferencesCount = this.userProfile.size;
        const accuracy = this.calculateLearningAccuracy();
        
        const countElement = document.getElementById('knowledge-count');
        const prefsElement = document.getElementById('preferences-count');
        const accuracyElement = document.getElementById('learning-accuracy');
        
        if (countElement) countElement.textContent = knowledgeCount;
        if (prefsElement) prefsElement.textContent = preferencesCount;
        if (accuracyElement) accuracyElement.textContent = Math.round(accuracy * 100) + '%';
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('knowledge-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = results.map(result => `
            <div class="knowledge-result">
                <div class="result-topic">${result.topic}</div>
                <div class="result-category">${result.category}</div>
                <div class="result-relevance">Relevance: ${Math.round(result.relevance * 100)}%</div>
                <div class="result-timestamp">${new Date(result.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    displayPredictions(predictions) {
        const predictionList = document.getElementById('prediction-list');
        if (!predictionList) return;
        
        predictionList.innerHTML = predictions.slice(0, 5).map(prediction => `
            <div class="prediction-item">
                <span class="prediction-text">${prediction.description}</span>
                <span class="prediction-confidence">${Math.round(prediction.confidence * 100)}%</span>
            </div>
        `).join('');
    }

    calculateLearningAccuracy() {
        // Simple accuracy calculation based on prediction success
        const totalPredictions = this.predictionEngine.getTotalPredictions();
        const successfulPredictions = this.predictionEngine.getSuccessfulPredictions();
        
        return totalPredictions > 0 ? successfulPredictions / totalPredictions : 0.5;
    }

    // Utility Methods
    getSessionId() {
        let sessionId = sessionStorage.getItem('knowledgeSessionId');
        if (!sessionId) {
            sessionId = 'knowledge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('knowledgeSessionId', sessionId);
        }
        return sessionId;
    }

    // Public API
    async search(query) {
        return await this.queryKnowledge(query);
    }

    async getPreferences() {
        return await this.getUserPreferences();
    }

    getKnowledgeGraph() {
        return Array.from(this.knowledgeGraph.entries());
    }

    async addKnowledge(topic, content, metadata = {}) {
        const knowledgeEntry = {
            topic: topic,
            category: metadata.category || 'user_input',
            content: content,
            source: 'manual',
            timestamp: Date.now(),
            relevance: metadata.relevance || 0.8,
            context: this.extractContext(metadata),
            associations: metadata.associations || []
        };
        
        await this.storeKnowledge(knowledgeEntry);
        await this.updateUserPreferences(knowledgeEntry);
        
        return knowledgeEntry;
    }
}

// Knowledge Context Engine
class KnowledgeContextEngine {
    constructor() {
        this.contextTypes = ['temporal', 'spatial', 'topical', 'behavioral', 'social'];
    }

    analyzeContext(data) {
        const context = {};
        
        // Temporal context
        context.temporal = this.analyzeTemporalContext(data);
        
        // Topical context
        context.topical = this.analyzeTopicalContext(data);
        
        // Behavioral context
        context.behavioral = this.analyzeBehavioralContext(data);
        
        return context;
    }

    analyzeTemporalContext(data) {
        const now = new Date();
        return {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            month: now.getMonth(),
            season: this.getSeason(now.getMonth())
        };
    }

    analyzeTopicalContext(data) {
        // Extract topics and themes from data
        const topics = [];
        if (data.topic) topics.push(data.topic);
        if (data.category) topics.push(data.category);
        
        return { topics, primaryTopic: topics[0] };
    }

    analyzeBehavioralContext(data) {
        return {
            source: data.source,
            userGenerated: data.source === 'manual' || data.source === 'memory_system',
            automated: data.source === 'web_history' || data.source === 'system'
        };
    }

    getSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }
}

// Knowledge Learning Engine
class KnowledgeLearningEngine {
    constructor() {
        this.learningRate = 0.1;
        this.patterns = new Map();
        this.interactionHistory = [];
    }

    async processInteraction(interactionData) {
        this.interactionHistory.push(interactionData);
        
        // Analyze if this interaction should generate knowledge
        const shouldLearn = this.shouldLearnFromInteraction(interactionData);
        
        if (shouldLearn) {
            const knowledgeEntry = this.generateKnowledgeFromInteraction(interactionData);
            return {
                shouldUpdateKnowledge: true,
                shouldUpdatePreferences: true,
                knowledgeEntry: knowledgeEntry
            };
        }
        
        return {
            shouldUpdateKnowledge: false,
            shouldUpdatePreferences: false
        };
    }

    shouldLearnFromInteraction(interactionData) {
        // Learn from meaningful interactions
        if (interactionData.type === 'click' && interactionData.href) return true;
        if (interactionData.type === 'input' && interactionData.text?.length > 10) return true;
        
        return false;
    }

    generateKnowledgeFromInteraction(interactionData) {
        return {
            topic: this.extractTopicFromInteraction(interactionData),
            category: 'user_interaction',
            content: {
                type: interactionData.type,
                context: interactionData.text || interactionData.href,
                timestamp: interactionData.timestamp
            },
            source: 'interaction_learning',
            timestamp: interactionData.timestamp,
            relevance: 0.6,
            context: { url: interactionData.url },
            associations: []
        };
    }

    extractTopicFromInteraction(interactionData) {
        if (interactionData.href) {
            return this.extractTopicFromUrl(interactionData.href);
        }
        if (interactionData.text) {
            return this.extractTopicFromText(interactionData.text);
        }
        return 'interaction';
    }

    extractTopicFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
            return pathParts.slice(0, 2).join('_') || urlObj.hostname.replace(/\./g, '_');
        } catch {
            return 'web_link';
        }
    }

    extractTopicFromText(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const meaningfulWords = words.filter(word => word.length > 3);
        return meaningfulWords.slice(0, 2).join('_') || 'text_input';
    }

    async analyzePatterns(knowledgeGraph) {
        const patterns = [];
        
        // Analyze topic frequency patterns
        const topicFrequency = new Map();
        for (const [topic, data] of knowledgeGraph) {
            topicFrequency.set(topic, data.entries.length);
        }
        
        patterns.push({
            id: 'topic_frequency_' + Date.now(),
            patternType: 'topic_frequency',
            data: Array.from(topicFrequency.entries()),
            strength: this.calculatePatternStrength(topicFrequency),
            timestamp: Date.now()
        });
        
        // Analyze temporal patterns
        const temporalPattern = this.analyzeTemporalPatterns(knowledgeGraph);
        if (temporalPattern) {
            patterns.push(temporalPattern);
        }
        
        return patterns;
    }

    analyzeTemporalPatterns(knowledgeGraph) {
        const hourlyActivity = new Array(24).fill(0);
        
        for (const [topic, data] of knowledgeGraph) {
            for (const entry of data.entries) {
                const hour = new Date(entry.timestamp).getHours();
                hourlyActivity[hour]++;
            }
        }
        
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        
        return {
            id: 'temporal_activity_' + Date.now(),
            patternType: 'temporal_activity',
            data: { hourlyActivity, peakHour },
            strength: Math.max(...hourlyActivity) / hourlyActivity.reduce((a, b) => a + b, 0),
            timestamp: Date.now()
        };
    }

    calculatePatternStrength(data) {
        if (data instanceof Map) {
            const values = Array.from(data.values());
            const max = Math.max(...values);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            return max / avg; // Higher ratio indicates stronger pattern
        }
        return 0.5;
    }
}

// Knowledge Prediction Engine
class KnowledgePredictionEngine {
    constructor() {
        this.totalPredictions = 0;
        this.successfulPredictions = 0;
        this.predictionHistory = [];
    }

    async generatePredictions(userProfile, knowledgeGraph, webHistoryProfile) {
        const predictions = [];
        
        // Predict next topics of interest
        const topicPredictions = this.predictNextTopics(userProfile, knowledgeGraph);
        predictions.push(...topicPredictions);
        
        // Predict user needs based on patterns
        const needsPredictions = this.predictUserNeeds(userProfile, webHistoryProfile);
        predictions.push(...needsPredictions);
        
        // Predict optimal learning times
        const timingPredictions = this.predictOptimalTimes(knowledgeGraph);
        predictions.push(...timingPredictions);
        
        this.totalPredictions += predictions.length;
        
        return predictions;
    }

    predictNextTopics(userProfile, knowledgeGraph) {
        const predictions = [];
        const topicScores = new Map();
        
        // Score topics based on user preferences and knowledge graph
        for (const [key, preference] of userProfile) {
            if (key.startsWith('topic_')) {
                const topic = key.replace('topic_', '');
                const score = preference.value.interest * preference.value.frequency;
                topicScores.set(topic, score);
            }
        }
        
        // Get top 3 predicted topics
        const sortedTopics = Array.from(topicScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        sortedTopics.forEach(([topic, score]) => {
            predictions.push({
                id: 'topic_prediction_' + Date.now() + '_' + Math.random(),
                predictionType: 'next_topic',
                description: `You might be interested in: ${topic}`,
                confidence: Math.min(score / 10, 1),
                timestamp: Date.now(),
                data: { topic, score }
            });
        });
        
        return predictions;
    }

    predictUserNeeds(userProfile, webHistoryProfile) {
        const predictions = [];
        
        if (webHistoryProfile && webHistoryProfile.interests) {
            const recentInterests = webHistoryProfile.interests
                .filter(([interest, score]) => score > 3)
                .slice(0, 2);
            
            recentInterests.forEach(([interest, score]) => {
                predictions.push({
                    id: 'need_prediction_' + Date.now() + '_' + Math.random(),
                    predictionType: 'user_need',
                    description: `You might need help with: ${interest}`,
                    confidence: Math.min(score / 10, 0.8),
                    timestamp: Date.now(),
                    data: { interest, score }
                });
            });
        }
        
        return predictions;
    }

    predictOptimalTimes(knowledgeGraph) {
        const predictions = [];
        const hourlyActivity = new Array(24).fill(0);
        
        // Analyze when user is most active
        for (const [topic, data] of knowledgeGraph) {
            for (const entry of data.entries) {
                const hour = new Date(entry.timestamp).getHours();
                hourlyActivity[hour]++;
            }
        }
        
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
        const currentHour = new Date().getHours();
        
        if (Math.abs(currentHour - peakHour) <= 1) {
            predictions.push({
                id: 'timing_prediction_' + Date.now(),
                predictionType: 'optimal_time',
                description: 'This is your peak learning time!',
                confidence: 0.7,
                timestamp: Date.now(),
                data: { peakHour, currentHour }
            });
        }
        
        return predictions;
    }

    getTotalPredictions() {
        return this.totalPredictions;
    }

    getSuccessfulPredictions() {
        return this.successfulPredictions;
    }

    markPredictionSuccess(predictionId) {
        this.successfulPredictions++;
    }
}

// Initialize Enhanced Knowledge Database
if (typeof window !== 'undefined') {
    window.EnhancedKnowledgeDatabase = EnhancedKnowledgeDatabase;
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.enhancedKnowledgeDatabase = new EnhancedKnowledgeDatabase();
    });
}