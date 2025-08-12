/**
 * Enhanced Knowledge Database Module
 * Stores, indexes, and retrieves contextual knowledge for intelligent assistance
 */

class EnhancedKnowledgeDatabase {
  constructor() {
    this.knowledge = new Map();
    this.index = new Map(); // For fast text search
    this.categories = new Map();
    this.relationships = new Map();
    this.maxEntries = 10000;
    this.version = '1.0';
    
    // Knowledge categories
    this.categoryTypes = {
      code: 'Programming and code-related knowledge',
      concept: 'General concepts and explanations',
      procedure: 'Step-by-step procedures',
      fact: 'Factual information',
      preference: 'User preferences and patterns',
      context: 'Contextual information from interactions',
      reference: 'Reference materials and documentation'
    };
  }

  async init() {
    console.log('🧠 Initializing Enhanced Knowledge Database...');
    
    try {
      // Load existing knowledge from storage
      await this.loadKnowledge();
      
      // Initialize search index
      this.rebuildIndex();
      
      // Setup periodic cleanup
      this.setupMaintenance();
      
      console.log(`✅ Knowledge Database initialized with ${this.knowledge.size} entries`);
    } catch (error) {
      console.error('❌ Failed to initialize Knowledge Database:', error);
      throw error;
    }
  }

  async loadKnowledge() {
    try {
      const savedData = localStorage.getItem('knowledge-database');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Convert arrays back to Maps
        if (data.knowledge) {
          this.knowledge = new Map(data.knowledge);
        }
        if (data.categories) {
          this.categories = new Map(data.categories);
        }
        if (data.relationships) {
          this.relationships = new Map(data.relationships);
        }
      }
    } catch (error) {
      console.warn('Failed to load knowledge database:', error);
      this.knowledge = new Map();
      this.categories = new Map();
      this.relationships = new Map();
    }
  }

  saveKnowledge() {
    try {
      const data = {
        knowledge: Array.from(this.knowledge.entries()),
        categories: Array.from(this.categories.entries()),
        relationships: Array.from(this.relationships.entries()),
        version: this.version,
        lastSaved: Date.now()
      };
      
      localStorage.setItem('knowledge-database', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save knowledge database:', error);
    }
  }

  // Core knowledge management methods

  addKnowledge(content, metadata = {}) {
    const id = this.generateId();
    const timestamp = Date.now();
    
    const entry = {
      id,
      content,
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      source: metadata.source || 'user_interaction',
      confidence: metadata.confidence || 0.8,
      importance: metadata.importance || 0.5,
      timestamp,
      lastAccessed: timestamp,
      accessCount: 0,
      relationships: [],
      metadata: {
        ...metadata,
        wordCount: this.countWords(content),
        language: metadata.language || 'en'
      }
    };

    this.knowledge.set(id, entry);
    this.updateIndex(entry);
    this.updateCategories(entry);
    
    // Auto-detect relationships
    this.detectRelationships(entry);
    
    // Cleanup if needed
    this.enforceStorageLimit();
    
    // Save to storage
    this.saveKnowledge();
    
    return id;
  }

  getKnowledge(id) {
    const entry = this.knowledge.get(id);
    if (entry) {
      // Update access statistics
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.saveKnowledge();
    }
    return entry;
  }

  updateKnowledge(id, updates) {
    const entry = this.knowledge.get(id);
    if (!entry) return false;

    // Update entry
    Object.assign(entry, updates, {
      lastModified: Date.now()
    });

    // Update index if content changed
    if (updates.content) {
      this.updateIndex(entry);
    }

    // Update categories if category changed
    if (updates.category) {
      this.updateCategories(entry);
    }

    this.saveKnowledge();
    return true;
  }

  deleteKnowledge(id) {
    const entry = this.knowledge.get(id);
    if (!entry) return false;

    // Remove from index
    this.removeFromIndex(entry);
    
    // Remove relationships
    this.removeRelationships(id);
    
    // Remove from knowledge
    this.knowledge.delete(id);
    
    this.saveKnowledge();
    return true;
  }

  // Search and retrieval methods

  async search(query, options = {}) {
    const {
      category = null,
      tags = [],
      limit = 20,
      minConfidence = 0.3,
      sortBy = 'relevance' // relevance, timestamp, importance, accessCount
    } = options;

    const results = [];
    const queryTerms = this.tokenize(query.toLowerCase());

    for (const [id, entry] of this.knowledge) {
      // Filter by category
      if (category && entry.category !== category) continue;
      
      // Filter by tags
      if (tags.length > 0 && !tags.some(tag => entry.tags.includes(tag))) continue;
      
      // Calculate relevance score
      const score = this.calculateRelevanceScore(entry, queryTerms);
      
      if (score >= minConfidence) {
        results.push({
          ...entry,
          relevanceScore: score,
          snippet: this.generateSnippet(entry.content, queryTerms)
        });
      }
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'importance':
          return b.importance - a.importance;
        case 'accessCount':
          return b.accessCount - a.accessCount;
        default: // relevance
          return b.relevanceScore - a.relevanceScore;
      }
    });

    return results.slice(0, limit);
  }

  async getRelevantKnowledge(context = {}) {
    const {
      recentMessages = [],
      currentActivity = {},
      userPreferences = {}
    } = context;

    const relevantEntries = [];

    // Extract keywords from recent messages
    const keywords = this.extractKeywords(recentMessages);
    
    // Search for relevant knowledge
    if (keywords.length > 0) {
      const searchResults = await this.search(keywords.join(' '), {
        limit: 10,
        minConfidence: 0.4
      });
      relevantEntries.push(...searchResults);
    }

    // Add contextually relevant knowledge based on current activity
    if (currentActivity.category) {
      const categoryResults = await this.getByCategory(currentActivity.category, 5);
      relevantEntries.push(...categoryResults);
    }

    // Remove duplicates and sort by relevance
    const uniqueEntries = this.removeDuplicates(relevantEntries);
    
    return uniqueEntries.slice(0, 15);
  }

  async getByCategory(category, limit = 10) {
    const entries = [];
    
    for (const [id, entry] of this.knowledge) {
      if (entry.category === category) {
        entries.push(entry);
      }
    }

    return entries
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  async getByTags(tags, limit = 10) {
    const entries = [];
    
    for (const [id, entry] of this.knowledge) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        entries.push(entry);
      }
    }

    return entries
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Learning and interaction methods

  addInteraction(userMessage, assistantResponse, context = {}) {
    // Extract knowledge from the interaction
    const knowledge = this.extractKnowledgeFromInteraction(userMessage, assistantResponse, context);
    
    knowledge.forEach(item => {
      this.addKnowledge(item.content, {
        category: item.category,
        tags: item.tags,
        source: 'interaction',
        confidence: item.confidence,
        importance: item.importance,
        context: {
          userMessage: userMessage.substring(0, 200), // Store snippet
          timestamp: Date.now()
        }
      });
    });
  }

  extractKnowledgeFromInteraction(userMessage, assistantResponse, context) {
    const knowledge = [];
    
    // Extract code snippets
    const codeBlocks = this.extractCodeBlocks(assistantResponse);
    codeBlocks.forEach(code => {
      knowledge.push({
        content: code.content,
        category: 'code',
        tags: [code.language, 'snippet'],
        confidence: 0.9,
        importance: 0.7
      });
    });

    // Extract concepts and explanations
    const concepts = this.extractConcepts(assistantResponse);
    concepts.forEach(concept => {
      knowledge.push({
        content: concept,
        category: 'concept',
        tags: ['explanation'],
        confidence: 0.8,
        importance: 0.6
      });
    });

    // Extract procedures
    const procedures = this.extractProcedures(assistantResponse);
    procedures.forEach(procedure => {
      knowledge.push({
        content: procedure,
        category: 'procedure',
        tags: ['steps', 'howto'],
        confidence: 0.85,
        importance: 0.7
      });
    });

    return knowledge;
  }

  // Utility methods

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  calculateRelevanceScore(entry, queryTerms) {
    const contentTokens = this.tokenize(entry.content);
    const titleTokens = entry.metadata.title ? this.tokenize(entry.metadata.title) : [];
    const tagTokens = entry.tags.join(' ').toLowerCase().split(' ');

    let score = 0;
    let matches = 0;

    queryTerms.forEach(term => {
      // Content matches (weight: 1.0)
      const contentMatches = contentTokens.filter(token => token.includes(term)).length;
      score += contentMatches * 1.0;
      matches += contentMatches;

      // Title matches (weight: 2.0)
      const titleMatches = titleTokens.filter(token => token.includes(term)).length;
      score += titleMatches * 2.0;
      matches += titleMatches;

      // Tag matches (weight: 1.5)
      const tagMatches = tagTokens.filter(token => token.includes(term)).length;
      score += tagMatches * 1.5;
      matches += tagMatches;
    });

    // Normalize score
    const maxPossibleScore = queryTerms.length * 4; // Assuming best case scenario
    let normalizedScore = score / maxPossibleScore;

    // Boost score based on entry quality
    normalizedScore *= entry.confidence;
    normalizedScore *= (1 + entry.importance * 0.5);

    // Boost frequently accessed entries
    if (entry.accessCount > 5) {
      normalizedScore *= 1.2;
    }

    return Math.min(normalizedScore, 1.0);
  }

  generateSnippet(content, queryTerms, maxLength = 200) {
    const sentences = content.split(/[.!?]+/);
    let bestSentence = sentences[0] || content;
    let maxMatches = 0;

    sentences.forEach(sentence => {
      const matches = queryTerms.filter(term => 
        sentence.toLowerCase().includes(term)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });

    if (bestSentence.length > maxLength) {
      bestSentence = bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence.trim();
  }

  extractKeywords(messages) {
    const allText = messages
      .map(msg => msg.content || '')
      .join(' ');
    
    const tokens = this.tokenize(allText);
    
    // Simple keyword extraction (in a real implementation, you might use TF-IDF)
    const wordFreq = {};
    tokens.forEach(token => {
      wordFreq[token] = (wordFreq[token] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  extractCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }

    return blocks;
  }

  extractConcepts(text) {
    // Simple concept extraction - look for definition patterns
    const conceptPatterns = [
      /(\w+) is (?:a|an) ([^.]+)/gi,
      /(\w+) refers to ([^.]+)/gi,
      /(\w+) means ([^.]+)/gi
    ];

    const concepts = [];
    conceptPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        concepts.push(`${match[1]}: ${match[2]}`);
      }
    });

    return concepts;
  }

  extractProcedures(text) {
    // Look for numbered lists or step-by-step instructions
    const stepPattern = /(?:^|\n)\s*(?:\d+\.|\*|-)\s*([^\n]+)/g;
    const procedures = [];
    let match;
    let currentProcedure = [];

    while ((match = stepPattern.exec(text)) !== null) {
      currentProcedure.push(match[1].trim());
    }

    if (currentProcedure.length > 2) {
      procedures.push(currentProcedure.join('\n'));
    }

    return procedures;
  }

  updateIndex(entry) {
    const tokens = this.tokenize(entry.content);
    tokens.forEach(token => {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token).add(entry.id);
    });
  }

  removeFromIndex(entry) {
    const tokens = this.tokenize(entry.content);
    tokens.forEach(token => {
      const entrySet = this.index.get(token);
      if (entrySet) {
        entrySet.delete(entry.id);
        if (entrySet.size === 0) {
          this.index.delete(token);
        }
      }
    });
  }

  rebuildIndex() {
    this.index.clear();
    for (const [id, entry] of this.knowledge) {
      this.updateIndex(entry);
    }
  }

  updateCategories(entry) {
    if (!this.categories.has(entry.category)) {
      this.categories.set(entry.category, {
        count: 0,
        lastUpdated: Date.now()
      });
    }
    
    const categoryInfo = this.categories.get(entry.category);
    categoryInfo.count++;
    categoryInfo.lastUpdated = Date.now();
  }

  detectRelationships(entry) {
    // Simple relationship detection based on content similarity
    const entryTokens = new Set(this.tokenize(entry.content));
    
    for (const [otherId, otherEntry] of this.knowledge) {
      if (otherId === entry.id) continue;
      
      const otherTokens = new Set(this.tokenize(otherEntry.content));
      const intersection = new Set([...entryTokens].filter(x => otherTokens.has(x)));
      const similarity = intersection.size / Math.max(entryTokens.size, otherTokens.size);
      
      if (similarity > 0.3) {
        this.addRelationship(entry.id, otherId, 'similar', similarity);
      }
    }
  }

  addRelationship(fromId, toId, type, strength) {
    if (!this.relationships.has(fromId)) {
      this.relationships.set(fromId, []);
    }
    
    const relationships = this.relationships.get(fromId);
    relationships.push({
      targetId: toId,
      type,
      strength,
      createdAt: Date.now()
    });
  }

  removeRelationships(entryId) {
    // Remove outgoing relationships
    this.relationships.delete(entryId);
    
    // Remove incoming relationships
    for (const [id, relationships] of this.relationships) {
      const filtered = relationships.filter(rel => rel.targetId !== entryId);
      if (filtered.length !== relationships.length) {
        this.relationships.set(id, filtered);
      }
    }
  }

  removeDuplicates(entries) {
    const seen = new Set();
    return entries.filter(entry => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  enforceStorageLimit() {
    if (this.knowledge.size <= this.maxEntries) return;

    // Remove least important and least accessed entries
    const entries = Array.from(this.knowledge.values());
    entries.sort((a, b) => {
      const scoreA = a.importance * 0.7 + (a.accessCount / 100) * 0.3;
      const scoreB = b.importance * 0.7 + (b.accessCount / 100) * 0.3;
      return scoreA - scoreB;
    });

    const toRemove = entries.slice(0, this.knowledge.size - this.maxEntries);
    toRemove.forEach(entry => {
      this.deleteKnowledge(entry.id);
    });

    console.log(`🧹 Removed ${toRemove.length} low-priority knowledge entries`);
  }

  setupMaintenance() {
    // Run maintenance every hour
    setInterval(() => {
      this.performMaintenance();
    }, 3600000); // 1 hour
  }

  performMaintenance() {
    // Clean up old, unused entries
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, entry] of this.knowledge) {
      if (entry.lastAccessed < oneMonthAgo && entry.accessCount < 2) {
        this.deleteKnowledge(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Maintenance: Removed ${removedCount} unused knowledge entries`);
    }

    // Rebuild index for optimization
    this.rebuildIndex();
  }

  // Export/Import functionality

  exportKnowledge() {
    return {
      knowledge: Array.from(this.knowledge.entries()),
      categories: Array.from(this.categories.entries()),
      relationships: Array.from(this.relationships.entries()),
      version: this.version,
      exportedAt: Date.now()
    };
  }

  importKnowledge(data) {
    try {
      if (data.knowledge) {
        data.knowledge.forEach(([id, entry]) => {
          this.knowledge.set(id, entry);
        });
      }
      
      if (data.categories) {
        data.categories.forEach(([category, info]) => {
          this.categories.set(category, info);
        });
      }
      
      if (data.relationships) {
        data.relationships.forEach(([id, relationships]) => {
          this.relationships.set(id, relationships);
        });
      }

      this.rebuildIndex();
      this.saveKnowledge();
      
      console.log(`📥 Imported knowledge database with ${data.knowledge?.length || 0} entries`);
    } catch (error) {
      console.error('Failed to import knowledge:', error);
      throw error;
    }
  }

  clearKnowledge() {
    this.knowledge.clear();
    this.index.clear();
    this.categories.clear();
    this.relationships.clear();
    this.saveKnowledge();
    console.log('🗑️ Knowledge database cleared');
  }

  getStats() {
    return {
      totalEntries: this.knowledge.size,
      categories: this.categories.size,
      relationships: Array.from(this.relationships.values()).reduce((sum, rels) => sum + rels.length, 0),
      indexSize: this.index.size,
      version: this.version
    };
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EnhancedKnowledgeDatabase = EnhancedKnowledgeDatabase;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedKnowledgeDatabase;
}