/**
 * Behavioral Learning Engine Module
 * Tracks user behavior patterns and learns preferences for personalized assistance
 */

class BehavioralLearningEngine {
  constructor() {
    this.isEnabled = true;
    this.activities = [];
    this.patterns = new Map();
    this.preferences = new Map();
    this.insights = [];
    this.maxActivities = 5000;
    this.learningThreshold = 10; // Minimum activities to start learning
    
    // Activity categories
    this.activityTypes = {
      chat_interaction: 'User chat messages and responses',
      ui_interaction: 'Interface interactions (clicks, navigation)',
      time_pattern: 'Time-based usage patterns',
      content_preference: 'Content type preferences',
      response_feedback: 'Feedback on AI responses',
      task_completion: 'Task completion patterns',
      error_recovery: 'Error handling and recovery patterns'
    };

    // Core utility methods
    this.core = {
      calculateAverage: (numbers) => numbers.reduce((a, b) => a + b, 0) / numbers.length,
      calculateMedian: (numbers) => {
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      },
      calculateStandardDeviation: (numbers) => {
        const avg = this.core.calculateAverage(numbers);
        const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(this.core.calculateAverage(squareDiffs));
      },
      findMode: (array) => {
        const frequency = {};
        let maxFreq = 0;
        let mode = null;
        
        array.forEach(item => {
          frequency[item] = (frequency[item] || 0) + 1;
          if (frequency[item] > maxFreq) {
            maxFreq = frequency[item];
            mode = item;
          }
        });
        
        return mode;
      }
    };

    // Utility methods
    this.utils = {
      formatTime: (timestamp) => new Date(timestamp).toLocaleTimeString(),
      formatDate: (timestamp) => new Date(timestamp).toLocaleDateString(),
      getTimeOfDay: (timestamp) => {
        const hour = new Date(timestamp).getHours();
        if (hour < 6) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
      },
      getDayOfWeek: (timestamp) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(timestamp).getDay()];
      },
      calculateDuration: (start, end) => end - start,
      groupBy: (array, keyFn) => {
        return array.reduce((groups, item) => {
          const key = keyFn(item);
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
          return groups;
        }, {});
      }
    };

    // Automation methods
    this.automation = {
      scheduleTask: (taskFn, delay) => setTimeout(taskFn, delay),
      scheduleRecurringTask: (taskFn, interval) => setInterval(taskFn, interval),
      debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
      throttle: (func, limit) => {
        let inThrottle;
        return function() {
          const args = arguments;
          const context = this;
          if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      }
    };
  }

  async init() {
    console.log('🧠 Initializing Behavioral Learning Engine...');
    
    try {
      // Load existing data
      await this.loadData();
      
      // Start learning processes
      this.startLearning();
      
      // Setup maintenance
      this.setupMaintenance();
      
      console.log(`✅ Behavioral Learning Engine initialized with ${this.activities.length} activities`);
    } catch (error) {
      console.error('❌ Failed to initialize Behavioral Learning Engine:', error);
      throw error;
    }
  }

  async loadData() {
    try {
      const savedData = localStorage.getItem('behavioral-learning-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.activities = data.activities || [];
        this.patterns = new Map(data.patterns || []);
        this.preferences = new Map(data.preferences || []);
        this.insights = data.insights || [];
      }
    } catch (error) {
      console.warn('Failed to load behavioral data:', error);
      this.activities = [];
      this.patterns = new Map();
      this.preferences = new Map();
      this.insights = [];
    }
  }

  saveData() {
    try {
      const data = {
        activities: this.activities.slice(-this.maxActivities),
        patterns: Array.from(this.patterns.entries()),
        preferences: Array.from(this.preferences.entries()),
        insights: this.insights,
        lastSaved: Date.now()
      };
      
      localStorage.setItem('behavioral-learning-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save behavioral data:', error);
    }
  }

  // Core tracking methods

  trackActivity(type, data = {}) {
    if (!this.isEnabled) return;

    const activity = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.activities.push(activity);
    
    // Limit activities array size
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(-this.maxActivities);
    }

    // Trigger learning if we have enough data
    if (this.activities.length >= this.learningThreshold) {
      this.automation.debounce(() => this.updateLearning(), 1000)();
    }

    this.saveData();
    return activity.id;
  }

  // Learning and pattern detection

  startLearning() {
    // Update learning every 5 minutes
    this.automation.scheduleRecurringTask(() => {
      this.updateLearning();
    }, 5 * 60 * 1000);
  }

  updateLearning() {
    try {
      this.detectTimePatterns();
      this.detectInteractionPatterns();
      this.detectContentPreferences();
      this.detectTaskPatterns();
      this.generateInsights();
      this.saveData();
    } catch (error) {
      console.error('Error updating learning:', error);
    }
  }

  detectTimePatterns() {
    const timeActivities = this.activities.filter(a => a.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000));
    
    if (timeActivities.length < 10) return;

    // Analyze usage by time of day
    const timeGroups = this.utils.groupBy(timeActivities, a => this.utils.getTimeOfDay(a.timestamp));
    const timePattern = {
      mostActiveTime: null,
      leastActiveTime: null,
      averageSessionLength: 0,
      peakHours: [],
      weekdayVsWeekend: {}
    };

    // Find most/least active times
    const timeCounts = Object.entries(timeGroups).map(([time, activities]) => ({
      time,
      count: activities.length
    }));
    
    timeCounts.sort((a, b) => b.count - a.count);
    timePattern.mostActiveTime = timeCounts[0]?.time;
    timePattern.leastActiveTime = timeCounts[timeCounts.length - 1]?.time;

    // Analyze weekday vs weekend
    const weekdayActivities = timeActivities.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day >= 1 && day <= 5;
    });
    const weekendActivities = timeActivities.filter(a => {
      const day = new Date(a.timestamp).getDay();
      return day === 0 || day === 6;
    });

    timePattern.weekdayVsWeekend = {
      weekday: weekdayActivities.length,
      weekend: weekendActivities.length,
      preference: weekdayActivities.length > weekendActivities.length ? 'weekday' : 'weekend'
    };

    this.patterns.set('time_usage', timePattern);
  }

  detectInteractionPatterns() {
    const uiActivities = this.activities.filter(a => a.type === 'ui_interaction');
    
    if (uiActivities.length < 5) return;

    const interactionPattern = {
      preferredFeatures: [],
      navigationStyle: 'unknown',
      responseTime: 0,
      errorRate: 0
    };

    // Analyze feature usage
    const featureUsage = this.utils.groupBy(uiActivities, a => a.data.feature || 'unknown');
    const sortedFeatures = Object.entries(featureUsage)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    interactionPattern.preferredFeatures = sortedFeatures.map(([feature, activities]) => ({
      feature,
      usage: activities.length
    }));

    // Analyze response times
    const responseTimes = uiActivities
      .filter(a => a.data.responseTime)
      .map(a => a.data.responseTime);
    
    if (responseTimes.length > 0) {
      interactionPattern.responseTime = this.core.calculateAverage(responseTimes);
    }

    this.patterns.set('interaction_style', interactionPattern);
  }

  detectContentPreferences() {
    const chatActivities = this.activities.filter(a => a.type === 'chat_interaction');
    
    if (chatActivities.length < 5) return;

    const contentPattern = {
      preferredTopics: [],
      messageLength: 'medium',
      questionTypes: [],
      responseStyle: 'balanced'
    };

    // Analyze message lengths
    const messageLengths = chatActivities
      .filter(a => a.data.message)
      .map(a => a.data.message.length);
    
    if (messageLengths.length > 0) {
      const avgLength = this.core.calculateAverage(messageLengths);
      if (avgLength < 50) contentPattern.messageLength = 'short';
      else if (avgLength > 200) contentPattern.messageLength = 'long';
      else contentPattern.messageLength = 'medium';
    }

    // Analyze topics (simple keyword extraction)
    const allMessages = chatActivities
      .filter(a => a.data.message)
      .map(a => a.data.message.toLowerCase())
      .join(' ');
    
    const topicKeywords = this.extractTopics(allMessages);
    contentPattern.preferredTopics = topicKeywords.slice(0, 10);

    this.patterns.set('content_preferences', contentPattern);
  }

  detectTaskPatterns() {
    const taskActivities = this.activities.filter(a => a.type === 'task_completion');
    
    if (taskActivities.length < 3) return;

    const taskPattern = {
      completionRate: 0,
      averageTime: 0,
      preferredTaskTypes: [],
      strugglingAreas: []
    };

    // Calculate completion rate
    const completedTasks = taskActivities.filter(a => a.data.completed);
    taskPattern.completionRate = completedTasks.length / taskActivities.length;

    // Analyze task completion times
    const completionTimes = completedTasks
      .filter(a => a.data.duration)
      .map(a => a.data.duration);
    
    if (completionTimes.length > 0) {
      taskPattern.averageTime = this.core.calculateAverage(completionTimes);
    }

    // Analyze task types
    const taskTypes = this.utils.groupBy(taskActivities, a => a.data.taskType || 'unknown');
    const sortedTaskTypes = Object.entries(taskTypes)
      .sort((a, b) => b[1].length - a[1].length);
    
    taskPattern.preferredTaskTypes = sortedTaskTypes.slice(0, 5).map(([type, activities]) => ({
      type,
      count: activities.length,
      successRate: activities.filter(a => a.data.completed).length / activities.length
    }));

    this.patterns.set('task_completion', taskPattern);
  }

  generateInsights() {
    this.insights = [];

    // Time-based insights
    const timePattern = this.patterns.get('time_usage');
    if (timePattern) {
      this.insights.push({
        type: 'time_preference',
        title: 'Peak Usage Time',
        description: `You're most active during ${timePattern.mostActiveTime}`,
        confidence: 0.8,
        actionable: true,
        suggestion: `Consider scheduling important tasks during ${timePattern.mostActiveTime} for better productivity`
      });
    }

    // Interaction insights
    const interactionPattern = this.patterns.get('interaction_style');
    if (interactionPattern && interactionPattern.preferredFeatures.length > 0) {
      const topFeature = interactionPattern.preferredFeatures[0];
      this.insights.push({
        type: 'feature_usage',
        title: 'Favorite Feature',
        description: `You frequently use ${topFeature.feature}`,
        confidence: 0.9,
        actionable: true,
        suggestion: `I can provide shortcuts and advanced tips for ${topFeature.feature}`
      });
    }

    // Content insights
    const contentPattern = this.patterns.get('content_preferences');
    if (contentPattern && contentPattern.preferredTopics.length > 0) {
      this.insights.push({
        type: 'content_interest',
        title: 'Main Interests',
        description: `Your top interests include: ${contentPattern.preferredTopics.slice(0, 3).join(', ')}`,
        confidence: 0.7,
        actionable: true,
        suggestion: 'I can provide more targeted assistance in these areas'
      });
    }

    // Task completion insights
    const taskPattern = this.patterns.get('task_completion');
    if (taskPattern && taskPattern.completionRate < 0.7) {
      this.insights.push({
        type: 'task_difficulty',
        title: 'Task Completion',
        description: `Your task completion rate is ${Math.round(taskPattern.completionRate * 100)}%`,
        confidence: 0.8,
        actionable: true,
        suggestion: 'I can help break down complex tasks into smaller, manageable steps'
      });
    }
  }

  // Public API methods

  async getCurrentContext() {
    const recentActivities = this.activities.slice(-20);
    const currentSession = this.getCurrentSession();
    
    return {
      recentActivities: recentActivities.map(a => ({
        type: a.type,
        timestamp: a.timestamp,
        timeAgo: this.formatTimeAgo(a.timestamp)
      })),
      session: currentSession,
      patterns: Object.fromEntries(this.patterns),
      insights: this.insights.slice(0, 5),
      preferences: Object.fromEntries(this.preferences)
    };
  }

  async getActiveApplications() {
    // Simulate active applications (in a real implementation, this would use system APIs)
    return [
      { name: 'TalkToApp', active: true, lastUsed: Date.now() },
      { name: 'Browser', active: true, lastUsed: Date.now() - 60000 },
      { name: 'Code Editor', active: false, lastUsed: Date.now() - 300000 }
    ];
  }

  async getSystemMetrics() {
    // Simulate system metrics
    return {
      memory: {
        used: Math.random() * 8,
        total: 16,
        percentage: Math.random() * 50 + 25
      },
      cpu: {
        usage: Math.random() * 30 + 10,
        cores: navigator.hardwareConcurrency || 4
      },
      network: {
        online: navigator.onLine,
        speed: 'fast'
      }
    };
  }

  async getUserActivityLevel() {
    const recentActivities = this.activities.filter(a => 
      a.timestamp > Date.now() - (60 * 60 * 1000) // Last hour
    );

    const activityLevel = recentActivities.length;
    
    if (activityLevel > 20) return 'high';
    if (activityLevel > 10) return 'medium';
    if (activityLevel > 5) return 'low';
    return 'idle';
  }

  async getInsights() {
    return this.insights.map(insight => ({
      ...insight,
      timestamp: Date.now()
    }));
  }

  enableLearning() {
    this.isEnabled = true;
    this.startLearning();
    console.log('🧠 Behavioral learning enabled');
  }

  disableLearning() {
    this.isEnabled = false;
    console.log('🧠 Behavioral learning disabled');
  }

  // Utility methods

  getCurrentSession() {
    const sessionStart = this.getSessionId();
    const sessionActivities = this.activities.filter(a => a.data.sessionId === sessionStart);
    
    return {
      id: sessionStart,
      startTime: sessionStart,
      duration: Date.now() - sessionStart,
      activityCount: sessionActivities.length,
      lastActivity: sessionActivities.length > 0 ? sessionActivities[sessionActivities.length - 1].timestamp : sessionStart
    };
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now();
    }
    return this.sessionId;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

  extractTopics(text) {
    // Simple topic extraction using keyword frequency
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  setupMaintenance() {
    // Clean up old activities every day
    this.automation.scheduleRecurringTask(() => {
      this.performMaintenance();
    }, 24 * 60 * 60 * 1000);
  }

  performMaintenance() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const originalLength = this.activities.length;
    
    this.activities = this.activities.filter(a => a.timestamp > oneWeekAgo);
    
    if (this.activities.length < originalLength) {
      console.log(`🧹 Cleaned up ${originalLength - this.activities.length} old activities`);
      this.saveData();
    }
  }

  // Export/Import functionality

  exportData() {
    return {
      activities: this.activities,
      patterns: Array.from(this.patterns.entries()),
      preferences: Array.from(this.preferences.entries()),
      insights: this.insights,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  importData(data) {
    try {
      if (data.activities) {
        this.activities = [...this.activities, ...data.activities];
      }
      if (data.patterns) {
        data.patterns.forEach(([key, value]) => {
          this.patterns.set(key, value);
        });
      }
      if (data.preferences) {
        data.preferences.forEach(([key, value]) => {
          this.preferences.set(key, value);
        });
      }
      if (data.insights) {
        this.insights = [...this.insights, ...data.insights];
      }

      this.saveData();
      console.log(`📥 Imported behavioral data with ${data.activities?.length || 0} activities`);
    } catch (error) {
      console.error('Failed to import behavioral data:', error);
      throw error;
    }
  }

  clearData() {
    this.activities = [];
    this.patterns.clear();
    this.preferences.clear();
    this.insights = [];
    this.saveData();
    console.log('🗑️ Behavioral data cleared');
  }

  getStats() {
    return {
      totalActivities: this.activities.length,
      patterns: this.patterns.size,
      preferences: this.preferences.size,
      insights: this.insights.length,
      isEnabled: this.isEnabled,
      sessionId: this.getSessionId()
    };
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BehavioralLearningEngine = BehavioralLearningEngine;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BehavioralLearningEngine;
}