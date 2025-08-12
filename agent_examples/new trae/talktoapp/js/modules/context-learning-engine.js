/**
 * Context Learning Engine Module
 * Manages adaptive context learning and intelligent context switching
 */

class ContextLearningEngine {
  constructor() {
    this.contexts = new Map();
    this.activeContext = null;
    this.contextHistory = [];
    this.learningData = new Map();
    this.patterns = new Map();
    this.maxContextHistory = 1000;
    this.maxContexts = 100;
    
    // Context types
    this.contextTypes = {
      CONVERSATION: 'conversation',
      TASK: 'task',
      APPLICATION: 'application',
      TEMPORAL: 'temporal',
      SEMANTIC: 'semantic',
      USER_PREFERENCE: 'user_preference',
      ENVIRONMENTAL: 'environmental'
    };

    // Learning algorithms
    this.algorithms = {
      FREQUENCY_BASED: 'frequency',
      RECENCY_BASED: 'recency',
      SIMILARITY_BASED: 'similarity',
      PATTERN_BASED: 'pattern',
      HYBRID: 'hybrid'
    };

    // Configuration
    this.config = {
      enableAutoContextSwitch: true,
      enablePatternLearning: true,
      enableSemanticAnalysis: true,
      contextSimilarityThreshold: 0.7,
      patternConfidenceThreshold: 0.8,
      maxActiveContexts: 5,
      learningRate: 0.1,
      decayRate: 0.95,
      enableContextPrediction: true
    };

    // Statistics
    this.stats = {
      totalContexts: 0,
      contextSwitches: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      averageContextDuration: 0,
      learningAccuracy: 0
    };

    this.eventListeners = new Map();
  }

  async init() {
    console.log('🧠 Initializing Context Learning Engine...');
    
    try {
      // Load existing data
      await this.loadData();
      
      // Initialize learning systems
      this.initializeEventSystem();
      this.initializeLearningAlgorithms();
      this.initializePatternDetection();
      
      // Start background processes
      this.startLearningProcess();
      this.startMaintenanceProcess();
      
      console.log(`✅ Context Learning Engine initialized with ${this.contexts.size} contexts`);
    } catch (error) {
      console.error('❌ Failed to initialize Context Learning Engine:', error);
      throw error;
    }
  }

  async loadData() {
    try {
      const savedData = localStorage.getItem('context-learning-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore contexts
        if (data.contexts) {
          data.contexts.forEach(contextData => {
            const context = this.createContextFromData(contextData);
            this.contexts.set(context.id, context);
          });
        }

        // Restore learning data
        if (data.learningData) {
          this.learningData = new Map(data.learningData);
        }

        // Restore patterns
        if (data.patterns) {
          this.patterns = new Map(data.patterns);
        }

        // Restore history
        if (data.contextHistory) {
          this.contextHistory = data.contextHistory;
        }

        // Restore stats
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }

        // Restore config
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }
      }
    } catch (error) {
      console.warn('Failed to load context learning data:', error);
    }
  }

  saveData() {
    try {
      const data = {
        contexts: Array.from(this.contexts.values()).map(context => ({
          id: context.id,
          name: context.name,
          type: context.type,
          data: context.data,
          metadata: context.metadata,
          created: context.created,
          lastUsed: context.lastUsed,
          usageCount: context.usageCount,
          confidence: context.confidence
        })),
        learningData: Array.from(this.learningData.entries()),
        patterns: Array.from(this.patterns.entries()),
        contextHistory: this.contextHistory.slice(-this.maxContextHistory),
        stats: this.stats,
        config: this.config,
        lastSaved: Date.now()
      };
      
      localStorage.setItem('context-learning-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save context learning data:', error);
    }
  }

  // Context Management

  async createContext(name, type, data = {}, metadata = {}) {
    const context = {
      id: this.generateId(),
      name,
      type,
      data: { ...data },
      metadata: {
        created: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        confidence: 1.0,
        tags: [],
        relationships: [],
        ...metadata
      },
      embeddings: null,
      patterns: [],
      predictions: []
    };

    // Generate embeddings for semantic analysis
    if (this.config.enableSemanticAnalysis) {
      context.embeddings = await this.generateEmbeddings(context);
    }

    this.contexts.set(context.id, context);
    this.stats.totalContexts++;

    // Limit context storage
    if (this.contexts.size > this.maxContexts) {
      await this.pruneOldContexts();
    }

    this.saveData();
    this.emit('contextCreated', { context });

    console.log(`📝 Created context: ${name} (${context.id})`);
    return context.id;
  }

  async switchContext(contextId, reason = 'manual') {
    const newContext = this.contexts.get(contextId);
    if (!newContext) {
      throw new Error(`Context ${contextId} not found`);
    }

    const previousContext = this.activeContext;
    const switchTime = Date.now();

    // Record context switch
    const contextSwitch = {
      id: this.generateId(),
      from: previousContext?.id || null,
      to: contextId,
      reason,
      timestamp: switchTime,
      duration: previousContext ? switchTime - previousContext.metadata.lastUsed : 0
    };

    this.contextHistory.push(contextSwitch);
    this.stats.contextSwitches++;

    // Update context metadata
    newContext.metadata.lastUsed = switchTime;
    newContext.metadata.usageCount++;

    // Update previous context duration
    if (previousContext) {
      const duration = switchTime - previousContext.metadata.lastUsed;
      this.updateAverageContextDuration(duration);
    }

    this.activeContext = newContext;

    // Learn from context switch
    if (this.config.enablePatternLearning) {
      await this.learnFromContextSwitch(contextSwitch);
    }

    this.saveData();
    this.emit('contextSwitched', { contextSwitch, newContext, previousContext });

    console.log(`🔄 Switched to context: ${newContext.name} (${reason})`);
    return contextId;
  }

  async predictNextContext(currentData = {}) {
    if (!this.config.enableContextPrediction) {
      return null;
    }

    const predictions = [];

    // Frequency-based prediction
    const frequencyPrediction = this.predictByFrequency();
    if (frequencyPrediction) {
      predictions.push({
        contextId: frequencyPrediction.contextId,
        confidence: frequencyPrediction.confidence,
        algorithm: this.algorithms.FREQUENCY_BASED
      });
    }

    // Pattern-based prediction
    const patternPrediction = this.predictByPattern(currentData);
    if (patternPrediction) {
      predictions.push({
        contextId: patternPrediction.contextId,
        confidence: patternPrediction.confidence,
        algorithm: this.algorithms.PATTERN_BASED
      });
    }

    // Similarity-based prediction
    if (this.config.enableSemanticAnalysis) {
      const similarityPrediction = await this.predictBySimilarity(currentData);
      if (similarityPrediction) {
        predictions.push({
          contextId: similarityPrediction.contextId,
          confidence: similarityPrediction.confidence,
          algorithm: this.algorithms.SIMILARITY_BASED
        });
      }
    }

    // Combine predictions using weighted average
    const combinedPrediction = this.combinePredictions(predictions);
    
    this.stats.totalPredictions++;
    
    if (combinedPrediction) {
      this.emit('contextPredicted', { prediction: combinedPrediction, predictions });
    }

    return combinedPrediction;
  }

  // Learning Algorithms

  initializeLearningAlgorithms() {
    this.learningAlgorithms = {
      [this.algorithms.FREQUENCY_BASED]: this.learnFrequencyPatterns.bind(this),
      [this.algorithms.RECENCY_BASED]: this.learnRecencyPatterns.bind(this),
      [this.algorithms.SIMILARITY_BASED]: this.learnSimilarityPatterns.bind(this),
      [this.algorithms.PATTERN_BASED]: this.learnSequencePatterns.bind(this),
      [this.algorithms.HYBRID]: this.learnHybridPatterns.bind(this)
    };
  }

  async learnFromContextSwitch(contextSwitch) {
    // Learn frequency patterns
    await this.learnFrequencyPatterns(contextSwitch);
    
    // Learn sequence patterns
    await this.learnSequencePatterns(contextSwitch);
    
    // Learn temporal patterns
    await this.learnTemporalPatterns(contextSwitch);
    
    // Learn similarity patterns
    if (this.config.enableSemanticAnalysis) {
      await this.learnSimilarityPatterns(contextSwitch);
    }
  }

  async learnFrequencyPatterns(contextSwitch) {
    const key = `frequency_${contextSwitch.to}`;
    const currentData = this.learningData.get(key) || { count: 0, confidence: 0 };
    
    currentData.count++;
    currentData.confidence = Math.min(1.0, currentData.count / 10); // Max confidence at 10 uses
    currentData.lastUsed = contextSwitch.timestamp;
    
    this.learningData.set(key, currentData);
  }

  async learnSequencePatterns(contextSwitch) {
    if (!contextSwitch.from) return;

    const sequenceKey = `sequence_${contextSwitch.from}_${contextSwitch.to}`;
    const currentData = this.learningData.get(sequenceKey) || { 
      count: 0, 
      confidence: 0,
      averageDelay: 0,
      totalDelay: 0
    };
    
    currentData.count++;
    currentData.totalDelay += contextSwitch.duration;
    currentData.averageDelay = currentData.totalDelay / currentData.count;
    currentData.confidence = Math.min(1.0, currentData.count / 5);
    currentData.lastUsed = contextSwitch.timestamp;
    
    this.learningData.set(sequenceKey, currentData);
  }

  async learnTemporalPatterns(contextSwitch) {
    const hour = new Date(contextSwitch.timestamp).getHours();
    const dayOfWeek = new Date(contextSwitch.timestamp).getDay();
    
    const temporalKey = `temporal_${contextSwitch.to}_${hour}_${dayOfWeek}`;
    const currentData = this.learningData.get(temporalKey) || { count: 0, confidence: 0 };
    
    currentData.count++;
    currentData.confidence = Math.min(1.0, currentData.count / 3);
    currentData.lastUsed = contextSwitch.timestamp;
    
    this.learningData.set(temporalKey, currentData);
  }

  async learnSimilarityPatterns(contextSwitch) {
    const fromContext = this.contexts.get(contextSwitch.from);
    const toContext = this.contexts.get(contextSwitch.to);
    
    if (!fromContext || !toContext || !fromContext.embeddings || !toContext.embeddings) {
      return;
    }

    const similarity = this.calculateSimilarity(fromContext.embeddings, toContext.embeddings);
    
    const similarityKey = `similarity_${contextSwitch.from}_${contextSwitch.to}`;
    const currentData = this.learningData.get(similarityKey) || { 
      similarity: 0, 
      count: 0, 
      confidence: 0 
    };
    
    // Update running average of similarity
    currentData.similarity = (currentData.similarity * currentData.count + similarity) / (currentData.count + 1);
    currentData.count++;
    currentData.confidence = Math.min(1.0, currentData.count / 3);
    currentData.lastUsed = contextSwitch.timestamp;
    
    this.learningData.set(similarityKey, currentData);
  }

  async learnRecencyPatterns(contextSwitch) {
    // Apply decay to all recency-based learning data
    const now = contextSwitch.timestamp;
    
    for (const [key, data] of this.learningData.entries()) {
      if (key.startsWith('recency_')) {
        const timeDiff = now - (data.lastUsed || now);
        const decayFactor = Math.pow(this.config.decayRate, timeDiff / (24 * 60 * 60 * 1000)); // Daily decay
        data.confidence *= decayFactor;
      }
    }
  }

  async learnHybridPatterns(contextSwitch) {
    // Combine multiple learning approaches
    await Promise.all([
      this.learnFrequencyPatterns(contextSwitch),
      this.learnSequencePatterns(contextSwitch),
      this.learnTemporalPatterns(contextSwitch),
      this.learnRecencyPatterns(contextSwitch)
    ]);
  }

  // Prediction Methods

  predictByFrequency() {
    let bestContext = null;
    let bestScore = 0;

    for (const [key, data] of this.learningData.entries()) {
      if (key.startsWith('frequency_') && data.confidence > bestScore) {
        bestScore = data.confidence;
        bestContext = key.replace('frequency_', '');
      }
    }

    return bestContext ? { contextId: bestContext, confidence: bestScore } : null;
  }

  predictByPattern(currentData) {
    if (!this.activeContext) return null;

    let bestContext = null;
    let bestScore = 0;

    const currentContextId = this.activeContext.id;
    
    for (const [key, data] of this.learningData.entries()) {
      if (key.startsWith(`sequence_${currentContextId}_`) && data.confidence > bestScore) {
        bestScore = data.confidence;
        bestContext = key.split('_')[2];
      }
    }

    return bestContext ? { contextId: bestContext, confidence: bestScore } : null;
  }

  async predictBySimilarity(currentData) {
    if (!currentData || Object.keys(currentData).length === 0) return null;

    const currentEmbeddings = await this.generateEmbeddings({ data: currentData });
    let bestContext = null;
    let bestScore = 0;

    for (const [contextId, context] of this.contexts.entries()) {
      if (context.embeddings && contextId !== this.activeContext?.id) {
        const similarity = this.calculateSimilarity(currentEmbeddings, context.embeddings);
        
        if (similarity > bestScore && similarity > this.config.contextSimilarityThreshold) {
          bestScore = similarity;
          bestContext = contextId;
        }
      }
    }

    return bestContext ? { contextId: bestContext, confidence: bestScore } : null;
  }

  combinePredictions(predictions) {
    if (predictions.length === 0) return null;

    // Group predictions by context ID
    const contextScores = new Map();
    
    predictions.forEach(prediction => {
      const current = contextScores.get(prediction.contextId) || { totalScore: 0, count: 0 };
      current.totalScore += prediction.confidence;
      current.count++;
      contextScores.set(prediction.contextId, current);
    });

    // Find best combined score
    let bestContext = null;
    let bestScore = 0;

    for (const [contextId, scores] of contextScores.entries()) {
      const averageScore = scores.totalScore / scores.count;
      if (averageScore > bestScore) {
        bestScore = averageScore;
        bestContext = contextId;
      }
    }

    return bestContext ? { contextId: bestContext, confidence: bestScore } : null;
  }

  // Pattern Detection

  initializePatternDetection() {
    this.patternDetectors = {
      sequence: this.detectSequencePatterns.bind(this),
      temporal: this.detectTemporalPatterns.bind(this),
      frequency: this.detectFrequencyPatterns.bind(this),
      similarity: this.detectSimilarityPatterns.bind(this)
    };
  }

  async detectPatterns() {
    const detectedPatterns = [];

    for (const [type, detector] of Object.entries(this.patternDetectors)) {
      try {
        const patterns = await detector();
        detectedPatterns.push(...patterns.map(p => ({ ...p, type })));
      } catch (error) {
        console.error(`Error detecting ${type} patterns:`, error);
      }
    }

    // Update patterns map
    detectedPatterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });

    this.emit('patternsDetected', { patterns: detectedPatterns });
    return detectedPatterns;
  }

  detectSequencePatterns() {
    const patterns = [];
    const sequences = new Map();

    // Analyze context switch sequences
    for (let i = 1; i < this.contextHistory.length; i++) {
      const prev = this.contextHistory[i - 1];
      const curr = this.contextHistory[i];
      
      if (prev.to && curr.to) {
        const sequenceKey = `${prev.to}->${curr.to}`;
        const count = sequences.get(sequenceKey) || 0;
        sequences.set(sequenceKey, count + 1);
      }
    }

    // Identify significant patterns
    for (const [sequence, count] of sequences.entries()) {
      if (count >= 3) { // Minimum occurrences for a pattern
        patterns.push({
          id: this.generateId(),
          pattern: sequence,
          frequency: count,
          confidence: Math.min(1.0, count / 10),
          type: 'sequence'
        });
      }
    }

    return patterns;
  }

  detectTemporalPatterns() {
    const patterns = [];
    const timePatterns = new Map();

    this.contextHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const dayOfWeek = new Date(entry.timestamp).getDay();
      const timeKey = `${entry.to}@${hour}h_day${dayOfWeek}`;
      
      const count = timePatterns.get(timeKey) || 0;
      timePatterns.set(timeKey, count + 1);
    });

    for (const [timePattern, count] of timePatterns.entries()) {
      if (count >= 2) {
        patterns.push({
          id: this.generateId(),
          pattern: timePattern,
          frequency: count,
          confidence: Math.min(1.0, count / 5),
          type: 'temporal'
        });
      }
    }

    return patterns;
  }

  detectFrequencyPatterns() {
    const patterns = [];
    const contextFrequency = new Map();

    this.contextHistory.forEach(entry => {
      const count = contextFrequency.get(entry.to) || 0;
      contextFrequency.set(entry.to, count + 1);
    });

    const sortedContexts = Array.from(contextFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most frequent

    sortedContexts.forEach(([contextId, frequency]) => {
      patterns.push({
        id: this.generateId(),
        pattern: `frequent_${contextId}`,
        frequency,
        confidence: Math.min(1.0, frequency / 20),
        type: 'frequency'
      });
    });

    return patterns;
  }

  detectSimilarityPatterns() {
    const patterns = [];
    
    if (!this.config.enableSemanticAnalysis) {
      return patterns;
    }

    const contextPairs = [];
    const contextArray = Array.from(this.contexts.values());

    // Compare all context pairs
    for (let i = 0; i < contextArray.length; i++) {
      for (let j = i + 1; j < contextArray.length; j++) {
        const context1 = contextArray[i];
        const context2 = contextArray[j];
        
        if (context1.embeddings && context2.embeddings) {
          const similarity = this.calculateSimilarity(context1.embeddings, context2.embeddings);
          
          if (similarity > this.config.contextSimilarityThreshold) {
            contextPairs.push({
              contexts: [context1.id, context2.id],
              similarity
            });
          }
        }
      }
    }

    // Create similarity patterns
    contextPairs.forEach(pair => {
      patterns.push({
        id: this.generateId(),
        pattern: `similar_${pair.contexts[0]}_${pair.contexts[1]}`,
        similarity: pair.similarity,
        confidence: pair.similarity,
        type: 'similarity'
      });
    });

    return patterns;
  }

  // Utility Methods

  async generateEmbeddings(context) {
    // Simplified embedding generation (in real implementation, use proper NLP models)
    const text = JSON.stringify(context.data || {});
    const words = text.toLowerCase().match(/\w+/g) || [];
    
    // Create a simple word frequency vector
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Convert to fixed-size vector (simplified)
    const vector = new Array(100).fill(0);
    const wordList = Object.keys(wordFreq);
    
    wordList.forEach((word, index) => {
      if (index < 100) {
        vector[index] = wordFreq[word] / words.length;
      }
    });

    return vector;
  }

  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  createContextFromData(data) {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      data: data.data || {},
      metadata: {
        created: data.created || Date.now(),
        lastUsed: data.lastUsed || Date.now(),
        usageCount: data.usageCount || 0,
        confidence: data.confidence || 1.0,
        tags: data.tags || [],
        relationships: data.relationships || [],
        ...data.metadata
      },
      embeddings: data.embeddings || null,
      patterns: data.patterns || [],
      predictions: data.predictions || []
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  updateAverageContextDuration(duration) {
    const totalSwitches = this.stats.contextSwitches;
    const currentAverage = this.stats.averageContextDuration;
    
    this.stats.averageContextDuration = 
      (currentAverage * (totalSwitches - 1) + duration) / totalSwitches;
  }

  // Background Processes

  startLearningProcess() {
    // Run learning process every 5 minutes
    setInterval(async () => {
      try {
        await this.detectPatterns();
        this.saveData();
      } catch (error) {
        console.error('Error in learning process:', error);
      }
    }, 5 * 60 * 1000);
  }

  startMaintenanceProcess() {
    // Run maintenance every hour
    setInterval(async () => {
      try {
        await this.performMaintenance();
      } catch (error) {
        console.error('Error in maintenance process:', error);
      }
    }, 60 * 60 * 1000);
  }

  async performMaintenance() {
    // Clean up old learning data
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const [key, data] of this.learningData.entries()) {
      if (data.lastUsed && data.lastUsed < oneWeekAgo && data.confidence < 0.1) {
        this.learningData.delete(key);
      }
    }

    // Prune old contexts if needed
    if (this.contexts.size > this.maxContexts) {
      await this.pruneOldContexts();
    }

    // Limit context history
    if (this.contextHistory.length > this.maxContextHistory) {
      this.contextHistory = this.contextHistory.slice(-this.maxContextHistory);
    }

    this.saveData();
  }

  async pruneOldContexts() {
    const contextArray = Array.from(this.contexts.values());
    
    // Sort by last used time and usage count
    contextArray.sort((a, b) => {
      const scoreA = a.metadata.lastUsed + (a.metadata.usageCount * 1000);
      const scoreB = b.metadata.lastUsed + (b.metadata.usageCount * 1000);
      return scoreA - scoreB;
    });

    // Remove oldest contexts
    const toRemove = contextArray.slice(0, contextArray.length - this.maxContexts + 10);
    toRemove.forEach(context => {
      this.contexts.delete(context.id);
    });

    console.log(`🧹 Pruned ${toRemove.length} old contexts`);
  }

  // Event System

  initializeEventSystem() {
    this.eventListeners = new Map();
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API Methods

  async getContexts() {
    return Array.from(this.contexts.values()).map(context => ({
      id: context.id,
      name: context.name,
      type: context.type,
      lastUsed: context.metadata.lastUsed,
      usageCount: context.metadata.usageCount,
      confidence: context.metadata.confidence,
      isActive: this.activeContext?.id === context.id
    }));
  }

  async getContext(contextId) {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }
    return context;
  }

  async getActiveContext() {
    return this.activeContext;
  }

  async getContextHistory(limit = 50) {
    return this.contextHistory.slice(-limit);
  }

  async getPatterns() {
    return Array.from(this.patterns.values());
  }

  async getStats() {
    return {
      ...this.stats,
      totalContexts: this.contexts.size,
      activeContextId: this.activeContext?.id || null,
      learningDataSize: this.learningData.size,
      patternsDetected: this.patterns.size
    };
  }

  async updateContext(contextId, updates) {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    // Update context data
    if (updates.data) {
      context.data = { ...context.data, ...updates.data };
    }

    if (updates.metadata) {
      context.metadata = { ...context.metadata, ...updates.metadata };
    }

    // Regenerate embeddings if data changed
    if (updates.data && this.config.enableSemanticAnalysis) {
      context.embeddings = await this.generateEmbeddings(context);
    }

    this.saveData();
    this.emit('contextUpdated', { contextId, updates });
  }

  async deleteContext(contextId) {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    // Switch away from this context if it's active
    if (this.activeContext?.id === contextId) {
      this.activeContext = null;
    }

    this.contexts.delete(contextId);
    this.saveData();

    this.emit('contextDeleted', { contextId });
    console.log(`🗑️ Deleted context: ${contextId}`);
  }

  async exportData() {
    return {
      contexts: Array.from(this.contexts.values()),
      learningData: Array.from(this.learningData.entries()),
      patterns: Array.from(this.patterns.entries()),
      contextHistory: this.contextHistory,
      stats: this.stats,
      config: this.config,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  async importData(data) {
    try {
      if (data.contexts) {
        data.contexts.forEach(contextData => {
          const context = this.createContextFromData(contextData);
          this.contexts.set(context.id, context);
        });
      }

      if (data.learningData) {
        this.learningData = new Map([...this.learningData, ...data.learningData]);
      }

      if (data.patterns) {
        this.patterns = new Map([...this.patterns, ...data.patterns]);
      }

      if (data.contextHistory) {
        this.contextHistory = [...this.contextHistory, ...data.contextHistory];
      }

      if (data.config) {
        this.config = { ...this.config, ...data.config };
      }

      this.saveData();
      console.log(`📥 Imported context learning data with ${data.contexts?.length || 0} contexts`);
    } catch (error) {
      console.error('Failed to import context learning data:', error);
      throw error;
    }
  }

  async clearData() {
    this.contexts.clear();
    this.learningData.clear();
    this.patterns.clear();
    this.contextHistory = [];
    this.activeContext = null;
    
    this.stats = {
      totalContexts: 0,
      contextSwitches: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      averageContextDuration: 0,
      learningAccuracy: 0
    };

    this.saveData();
    console.log('🗑️ Context learning data cleared');
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ContextLearningEngine = ContextLearningEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextLearningEngine;
}