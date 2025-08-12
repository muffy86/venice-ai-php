/**
 * Web History Tracker Module
 * Tracks and analyzes web browsing activity for context-aware assistance
 */

class WebHistoryTracker {
  constructor() {
    this.isEnabled = true;
    this.history = [];
    this.maxHistorySize = 1000;
    this.trackingInterval = null;
    this.lastActiveTab = null;
    this.sessionStartTime = Date.now();
    
    // Categories for URL classification
    this.categories = {
      development: ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'npmjs.com', 'codepen.io'],
      documentation: ['docs.', 'documentation', 'wiki', 'readme'],
      social: ['twitter.com', 'linkedin.com', 'facebook.com', 'reddit.com'],
      productivity: ['gmail.com', 'calendar.google.com', 'notion.so', 'trello.com'],
      learning: ['youtube.com', 'coursera.org', 'udemy.com', 'khan academy'],
      news: ['news.', 'bbc.com', 'cnn.com', 'techcrunch.com']
    };
  }

  async init() {
    console.log('🌐 Initializing Web History Tracker...');
    
    try {
      // Load existing history from storage
      await this.loadHistory();
      
      // Start tracking if enabled
      if (this.isEnabled) {
        this.startTracking();
      }
      
      // Setup cleanup interval
      this.setupCleanup();
      
      console.log('✅ Web History Tracker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Web History Tracker:', error);
      throw error;
    }
  }

  async loadHistory() {
    try {
      const savedHistory = localStorage.getItem('webhistory-data');
      if (savedHistory) {
        const data = JSON.parse(savedHistory);
        this.history = data.history || [];
        this.sessionStartTime = data.sessionStartTime || Date.now();
      }
    } catch (error) {
      console.warn('Failed to load web history:', error);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      const data = {
        history: this.history.slice(-this.maxHistorySize), // Keep only recent entries
        sessionStartTime: this.sessionStartTime,
        lastSaved: Date.now()
      };
      localStorage.setItem('webhistory-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save web history:', error);
    }
  }

  startTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    // Track current tab every 5 seconds
    this.trackingInterval = setInterval(() => {
      this.trackCurrentActivity();
    }, 5000);

    // Track initial state
    this.trackCurrentActivity();
  }

  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  trackCurrentActivity() {
    try {
      // Since we can't access browser history directly due to security restrictions,
      // we'll track the current page if available
      const currentUrl = window.location.href;
      const currentTitle = document.title;
      
      if (currentUrl && currentUrl !== this.lastActiveTab) {
        this.addHistoryEntry({
          url: currentUrl,
          title: currentTitle,
          timestamp: Date.now(),
          duration: 0,
          category: this.categorizeUrl(currentUrl)
        });
        
        this.lastActiveTab = currentUrl;
      }
    } catch (error) {
      // Silently handle errors as this might fail in certain contexts
    }
  }

  addHistoryEntry(entry) {
    // Update duration of previous entry
    if (this.history.length > 0) {
      const lastEntry = this.history[this.history.length - 1];
      lastEntry.duration = entry.timestamp - lastEntry.timestamp;
    }

    // Add new entry
    this.history.push({
      id: this.generateId(),
      url: entry.url,
      title: entry.title || 'Unknown Page',
      timestamp: entry.timestamp,
      duration: entry.duration || 0,
      category: entry.category || 'other',
      domain: this.extractDomain(entry.url),
      sessionId: this.sessionStartTime
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Save to storage
    this.saveHistory();
  }

  categorizeUrl(url) {
    const domain = this.extractDomain(url).toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categories)) {
      if (keywords.some(keyword => domain.includes(keyword) || url.toLowerCase().includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public API methods

  async getRecentActivity(limit = 20) {
    return this.history
      .slice(-limit)
      .reverse()
      .map(entry => ({
        ...entry,
        timeAgo: this.formatTimeAgo(entry.timestamp)
      }));
  }

  async getActivityByCategory(category, limit = 10) {
    return this.history
      .filter(entry => entry.category === category)
      .slice(-limit)
      .reverse();
  }

  async getActivityByDomain(domain, limit = 10) {
    return this.history
      .filter(entry => entry.domain === domain)
      .slice(-limit)
      .reverse();
  }

  async getSessionSummary() {
    const sessionEntries = this.history.filter(entry => entry.sessionId === this.sessionStartTime);
    
    const summary = {
      totalTime: sessionEntries.reduce((sum, entry) => sum + entry.duration, 0),
      totalPages: sessionEntries.length,
      categories: {},
      domains: {},
      mostVisited: null,
      sessionStart: this.sessionStartTime,
      sessionDuration: Date.now() - this.sessionStartTime
    };

    // Calculate category distribution
    sessionEntries.forEach(entry => {
      summary.categories[entry.category] = (summary.categories[entry.category] || 0) + 1;
      summary.domains[entry.domain] = (summary.domains[entry.domain] || 0) + 1;
    });

    // Find most visited domain
    const sortedDomains = Object.entries(summary.domains).sort((a, b) => b[1] - a[1]);
    summary.mostVisited = sortedDomains[0] ? sortedDomains[0][0] : null;

    return summary;
  }

  async searchHistory(query, limit = 50) {
    const searchTerm = query.toLowerCase();
    
    return this.history
      .filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.url.toLowerCase().includes(searchTerm) ||
        entry.domain.toLowerCase().includes(searchTerm)
      )
      .slice(-limit)
      .reverse();
  }

  async getContextForAssistant() {
    const recentActivity = await this.getRecentActivity(10);
    const sessionSummary = await this.getSessionSummary();
    
    return {
      recentPages: recentActivity.map(entry => ({
        title: entry.title,
        domain: entry.domain,
        category: entry.category,
        timeAgo: entry.timeAgo
      })),
      currentSession: {
        duration: this.formatDuration(sessionSummary.sessionDuration),
        pagesVisited: sessionSummary.totalPages,
        topCategories: Object.entries(sessionSummary.categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, count]) => ({ category, count }))
      },
      insights: this.generateInsights(sessionSummary)
    };
  }

  generateInsights(summary) {
    const insights = [];
    
    // Development activity insight
    const devActivity = summary.categories.development || 0;
    if (devActivity > 5) {
      insights.push({
        type: 'development',
        message: `High development activity detected (${devActivity} pages). I can help with coding questions.`,
        confidence: 0.9
      });
    }

    // Learning activity insight
    const learningActivity = summary.categories.learning || 0;
    if (learningActivity > 3) {
      insights.push({
        type: 'learning',
        message: `Learning session detected (${learningActivity} educational pages). I can help explain concepts.`,
        confidence: 0.8
      });
    }

    // Documentation reading insight
    const docsActivity = summary.categories.documentation || 0;
    if (docsActivity > 2) {
      insights.push({
        type: 'documentation',
        message: `Documentation reading detected. I can help clarify technical concepts.`,
        confidence: 0.85
      });
    }

    return insights;
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(ms / 3600000);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  setupCleanup() {
    // Clean up old entries every hour
    setInterval(() => {
      this.cleanupOldEntries();
    }, 3600000); // 1 hour
  }

  cleanupOldEntries() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const originalLength = this.history.length;
    
    this.history = this.history.filter(entry => entry.timestamp > oneWeekAgo);
    
    if (this.history.length < originalLength) {
      console.log(`🧹 Cleaned up ${originalLength - this.history.length} old history entries`);
      this.saveHistory();
    }
  }

  // Configuration methods

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.startTracking();
    } else {
      this.stopTracking();
    }
  }

  isTrackingEnabled() {
    return this.isEnabled;
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    console.log('🗑️ Web history cleared');
  }

  exportHistory() {
    return {
      history: this.history,
      sessionStartTime: this.sessionStartTime,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  importHistory(data) {
    try {
      if (data.history && Array.isArray(data.history)) {
        this.history = [...this.history, ...data.history];
        this.saveHistory();
        console.log(`📥 Imported ${data.history.length} history entries`);
      }
    } catch (error) {
      console.error('Failed to import history:', error);
      throw error;
    }
  }

  // Cleanup on destruction
  destroy() {
    this.stopTracking();
    this.saveHistory();
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.WebHistoryTracker = WebHistoryTracker;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebHistoryTracker;
}