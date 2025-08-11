/**
 * Web History Tracker - Monitors browsing behavior to learn user preferences
 * Provides intelligent context learning and predictive assistance
 */

class WebHistoryTracker {
    constructor() {
        this.isEnabled = localStorage.getItem('webHistoryEnabled') !== 'false';
        this.privacySettings = this.loadPrivacySettings();
        this.historyData = new Map();
        this.sessionData = new Map();
        this.patterns = new Map();
        this.interests = new Map();
        this.contextEngine = new ContextLearningEngine();
        this.predictiveAssistant = new PredictiveAssistant();
        
        this.init();
    }

    init() {
        if (!this.isEnabled) return;
        
        this.setupEventListeners();
        this.loadHistoryData();
        this.startSessionTracking();
        this.createUI();
        
        console.log('🌐 Web History Tracker initialized');
    }

    startSessionTracking() {
        // Initialize session tracking
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionStartTime = Date.now();
        
        // Set up session data structure
        this.currentSession = {
            id: this.sessionId,
            startTime: this.sessionStartTime,
            endTime: null,
            pages: [],
            interactions: 0,
            totalTimeSpent: 0,
            topics: new Set(),
            interests: new Map(),
            patterns: []
        };
        
        // Store session in sessionStorage for persistence across page loads
        sessionStorage.setItem('webHistorySession', JSON.stringify({
            id: this.sessionId,
            startTime: this.sessionStartTime
        }));
        
        // Track initial page visit
        this.recordPageVisit();
        
        // Set up session cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
        
        // Periodic session updates
        this.sessionUpdateInterval = setInterval(() => {
            this.updateSessionMetrics();
        }, 10000); // Every 10 seconds
        
        console.log(`📊 Session tracking started: ${this.sessionId}`);
    }

    getSessionId() {
        return this.sessionId || 'unknown_session';
    }

    getSessionStart() {
        return this.sessionStartTime || Date.now();
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = Date.now();
            this.currentSession.totalTimeSpent = this.currentSession.endTime - this.currentSession.startTime;
            
            // Save session data
            this.saveSessionData();
            
            // Clear intervals
            if (this.sessionUpdateInterval) {
                clearInterval(this.sessionUpdateInterval);
            }
        }
    }

    updateSessionMetrics() {
        if (this.currentSession) {
            this.currentSession.totalTimeSpent = Date.now() - this.currentSession.startTime;
            this.currentSession.interactions = this.getTotalInteractions();
        }
    }

    setupEventListeners() {
        // Track page navigation
        window.addEventListener('beforeunload', () => this.recordPageExit());
        window.addEventListener('focus', () => this.recordPageFocus());
        window.addEventListener('blur', () => this.recordPageBlur());
        
        // Track user interactions
        document.addEventListener('click', (e) => this.recordClick(e));
        document.addEventListener('scroll', () => this.recordScroll());
        document.addEventListener('keydown', (e) => this.recordKeyActivity(e));
        
        // Track form interactions
        document.addEventListener('submit', (e) => this.recordFormSubmission(e));
        document.addEventListener('input', (e) => this.recordInput(e));
        
        // Track search activities
        this.trackSearchQueries();
        
        // Periodic analysis
        setInterval(() => this.analyzeCurrentSession(), 30000); // Every 30 seconds
        setInterval(() => this.updatePatterns(), 300000); // Every 5 minutes
    }

    recordPageVisit(url = window.location.href, title = document.title) {
        if (!this.isEnabled || !this.privacySettings.trackPageVisits) return;
        
        const visitData = {
            url: this.sanitizeUrl(url),
            title: title,
            timestamp: Date.now(),
            domain: new URL(url).hostname,
            path: new URL(url).pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            timeSpent: 0,
            interactions: 0,
            scrollDepth: 0,
            clicks: 0,
            keystrokes: 0
        };
        
        this.historyData.set(visitData.timestamp, visitData);
        this.sessionData.set('currentVisit', visitData);
        
        // Extract topics and interests
        this.contextEngine.analyzePageContent(visitData);
        
        this.saveHistoryData();
    }

    recordPageExit() {
        const currentVisit = this.sessionData.get('currentVisit');
        if (currentVisit) {
            currentVisit.timeSpent = Date.now() - currentVisit.timestamp;
            this.updateVisitMetrics(currentVisit);
        }
    }

    recordClick(event) {
        if (!this.privacySettings.trackClicks) return;
        
        const currentVisit = this.sessionData.get('currentVisit');
        if (currentVisit) {
            currentVisit.clicks++;
            currentVisit.interactions++;
            
            // Analyze click context
            const clickData = {
                element: event.target.tagName,
                text: event.target.textContent?.substring(0, 100),
                href: event.target.href,
                timestamp: Date.now()
            };
            
            this.contextEngine.analyzeClickBehavior(clickData);
        }
    }

    recordScroll() {
        if (!this.privacySettings.trackScrolling) return;
        
        const currentVisit = this.sessionData.get('currentVisit');
        if (currentVisit) {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            currentVisit.scrollDepth = Math.max(currentVisit.scrollDepth, scrollDepth);
        }
    }

    recordKeyActivity(event) {
        if (!this.privacySettings.trackKeyActivity) return;
        
        const currentVisit = this.sessionData.get('currentVisit');
        if (currentVisit) {
            currentVisit.keystrokes++;
            currentVisit.interactions++;
        }
        
        // Analyze typing patterns (without storing actual content)
        this.contextEngine.analyzeTypingBehavior({
            key: event.key,
            timestamp: Date.now(),
            element: event.target.tagName
        });
    }

    recordFormSubmission(event) {
        if (!this.privacySettings.trackForms) return;
        
        const formData = {
            action: event.target.action,
            method: event.target.method,
            fieldCount: event.target.elements.length,
            timestamp: Date.now()
        };
        
        this.contextEngine.analyzeFormBehavior(formData);
    }

    recordInput(event) {
        if (!this.privacySettings.trackInputs) return;
        
        // Only track input patterns, not actual content
        const inputData = {
            type: event.target.type,
            length: event.target.value.length,
            timestamp: Date.now()
        };
        
        this.contextEngine.analyzeInputBehavior(inputData);
    }

    trackSearchQueries() {
        // Monitor search activities across different platforms
        const searchPatterns = [
            /google\.com\/search\?q=([^&]+)/,
            /bing\.com\/search\?q=([^&]+)/,
            /duckduckgo\.com\/\?q=([^&]+)/,
            /stackoverflow\.com\/search\?q=([^&]+)/,
            /github\.com\/search\?q=([^&]+)/
        ];
        
        const url = window.location.href;
        searchPatterns.forEach(pattern => {
            const match = url.match(pattern);
            if (match) {
                this.recordSearchQuery(decodeURIComponent(match[1]));
            }
        });
    }

    recordSearchQuery(query) {
        if (!this.privacySettings.trackSearches) return;
        
        const searchData = {
            query: this.sanitizeSearchQuery(query),
            timestamp: Date.now(),
            source: window.location.hostname
        };
        
        this.contextEngine.analyzeSearchBehavior(searchData);
    }

    analyzeCurrentSession() {
        const sessionAnalysis = {
            duration: Date.now() - this.getSessionStart(),
            pagesVisited: this.sessionData.size,
            totalInteractions: this.getTotalInteractions(),
            dominantTopics: this.contextEngine.getSessionTopics(),
            userIntent: this.contextEngine.predictUserIntent()
        };
        
        // Generate predictive suggestions
        this.predictiveAssistant.generateSuggestions(sessionAnalysis);
    }

    updatePatterns() {
        // Analyze long-term patterns
        const patterns = this.contextEngine.analyzePatterns(this.historyData);
        this.patterns = patterns;
        
        // Update user interests
        this.interests = this.contextEngine.extractInterests(patterns);
        
        // Save updated patterns
        this.savePatterns();
    }

    // Privacy and Security Methods
    loadPrivacySettings() {
        const defaults = {
            trackPageVisits: true,
            trackClicks: true,
            trackScrolling: true,
            trackKeyActivity: false,
            trackForms: false,
            trackInputs: false,
            trackSearches: true,
            anonymizeData: true,
            retentionDays: 30
        };
        
        const saved = localStorage.getItem('webHistoryPrivacySettings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    savePrivacySettings() {
        localStorage.setItem('webHistoryPrivacySettings', JSON.stringify(this.privacySettings));
    }

    sanitizeUrl(url) {
        if (!this.privacySettings.anonymizeData) return url;
        
        // Remove sensitive parameters
        const urlObj = new URL(url);
        const sensitiveParams = ['token', 'key', 'password', 'auth', 'session', 'id'];
        
        sensitiveParams.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        
        return urlObj.toString();
    }

    sanitizeSearchQuery(query) {
        if (!this.privacySettings.anonymizeData) return query;
        
        // Remove potentially sensitive information
        return query.replace(/\b\d{4,}\b/g, '[NUMBER]')
                   .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                   .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');
    }

    // Data Management
    loadHistoryData() {
        const saved = localStorage.getItem('webHistoryData');
        if (saved) {
            const data = JSON.parse(saved);
            this.historyData = new Map(data);
        }
    }

    saveHistoryData() {
        const dataArray = Array.from(this.historyData.entries());
        localStorage.setItem('webHistoryData', JSON.stringify(dataArray));
    }

    savePatterns() {
        localStorage.setItem('webHistoryPatterns', JSON.stringify(Array.from(this.patterns.entries())));
        localStorage.setItem('webHistoryInterests', JSON.stringify(Array.from(this.interests.entries())));
    }

    clearHistory() {
        this.historyData.clear();
        this.patterns.clear();
        this.interests.clear();
        localStorage.removeItem('webHistoryData');
        localStorage.removeItem('webHistoryPatterns');
        localStorage.removeItem('webHistoryInterests');
        console.log('🗑️ Web history cleared');
    }

    // Utility Methods
    getSessionId() {
        let sessionId = sessionStorage.getItem('webHistorySessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('webHistorySessionId', sessionId);
        }
        return sessionId;
    }

    getSessionStart() {
        let sessionStart = sessionStorage.getItem('webHistorySessionStart');
        if (!sessionStart) {
            sessionStart = Date.now();
            sessionStorage.setItem('webHistorySessionStart', sessionStart);
        }
        return parseInt(sessionStart);
    }

    getTotalInteractions() {
        const currentVisit = this.sessionData.get('currentVisit');
        return currentVisit ? currentVisit.interactions : 0;
    }

    updateVisitMetrics(visitData) {
        this.historyData.set(visitData.timestamp, visitData);
        this.saveHistoryData();
    }

    // UI Creation
    createUI() {
        const panel = document.createElement('div');
        panel.id = 'web-history-panel';
        panel.className = 'web-history-panel';
        panel.innerHTML = `
            <div class="web-history-header">
                <h3>🌐 Web History Tracker</h3>
                <button id="toggle-history-tracking">${this.isEnabled ? 'Disable' : 'Enable'}</button>
            </div>
            <div class="web-history-content">
                <div class="history-stats">
                    <div class="stat">
                        <span class="stat-label">Pages Visited:</span>
                        <span class="stat-value" id="pages-visited">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Session Time:</span>
                        <span class="stat-value" id="session-time">0m</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Top Interest:</span>
                        <span class="stat-value" id="top-interest">Learning...</span>
                    </div>
                </div>
                <div class="history-suggestions" id="history-suggestions">
                    <h4>💡 Smart Suggestions</h4>
                    <div id="suggestion-list"></div>
                </div>
                <div class="history-controls">
                    <button id="view-patterns">View Patterns</button>
                    <button id="privacy-settings">Privacy Settings</button>
                    <button id="clear-history">Clear History</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.setupUIEventListeners();
        this.updateUI();
    }

    setupUIEventListeners() {
        document.getElementById('toggle-history-tracking')?.addEventListener('click', () => {
            this.isEnabled = !this.isEnabled;
            localStorage.setItem('webHistoryEnabled', this.isEnabled);
            location.reload();
        });
        
        document.getElementById('clear-history')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all web history data?')) {
                this.clearHistory();
                this.updateUI();
            }
        });
        
        document.getElementById('privacy-settings')?.addEventListener('click', () => {
            this.showPrivacySettings();
        });
        
        document.getElementById('view-patterns')?.addEventListener('click', () => {
            this.showPatterns();
        });
    }

    updateUI() {
        const pagesElement = document.getElementById('pages-visited');
        const timeElement = document.getElementById('session-time');
        const interestElement = document.getElementById('top-interest');
        
        if (pagesElement) pagesElement.textContent = this.historyData.size;
        if (timeElement) {
            const sessionTime = Math.round((Date.now() - this.getSessionStart()) / 60000);
            timeElement.textContent = sessionTime + 'm';
        }
        if (interestElement) {
            const topInterest = this.getTopInterest();
            interestElement.textContent = topInterest || 'Learning...';
        }
    }

    getTopInterest() {
        if (this.interests.size === 0) return null;
        
        let topInterest = '';
        let maxScore = 0;
        
        for (const [interest, score] of this.interests) {
            if (score > maxScore) {
                maxScore = score;
                topInterest = interest;
            }
        }
        
        return topInterest;
    }

    showPrivacySettings() {
        // Create privacy settings modal
        const modal = document.createElement('div');
        modal.className = 'privacy-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🔒 Privacy Settings</h3>
                <div class="privacy-options">
                    ${Object.entries(this.privacySettings).map(([key, value]) => `
                        <label>
                            <input type="checkbox" id="privacy-${key}" ${value ? 'checked' : ''}>
                            ${this.getPrivacyLabel(key)}
                        </label>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button id="save-privacy">Save</button>
                    <button id="cancel-privacy">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('save-privacy').addEventListener('click', () => {
            this.updatePrivacySettings();
            document.body.removeChild(modal);
        });
        
        document.getElementById('cancel-privacy').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    getPrivacyLabel(key) {
        const labels = {
            trackPageVisits: 'Track page visits',
            trackClicks: 'Track clicks',
            trackScrolling: 'Track scrolling',
            trackKeyActivity: 'Track key activity',
            trackForms: 'Track form submissions',
            trackInputs: 'Track input behavior',
            trackSearches: 'Track search queries',
            anonymizeData: 'Anonymize sensitive data',
            retentionDays: 'Data retention (days)'
        };
        return labels[key] || key;
    }

    updatePrivacySettings() {
        Object.keys(this.privacySettings).forEach(key => {
            const checkbox = document.getElementById(`privacy-${key}`);
            if (checkbox) {
                this.privacySettings[key] = checkbox.checked;
            }
        });
        this.savePrivacySettings();
    }

    showPatterns() {
        console.log('📊 Web History Patterns:', this.patterns);
        console.log('🎯 User Interests:', this.interests);
    }

    // Public API
    getHistoryData() {
        return Array.from(this.historyData.values());
    }

    getPatterns() {
        return Array.from(this.patterns.entries());
    }

    getInterests() {
        return Array.from(this.interests.entries());
    }

    getUserProfile() {
        return {
            interests: this.getInterests(),
            patterns: this.getPatterns(),
            sessionData: Array.from(this.sessionData.entries()),
            preferences: this.contextEngine.getPreferences()
        };
    }
}

/**
 * Predictive Assistant - Provides intelligent suggestions based on user behavior
 */
class PredictiveAssistant {
    constructor() {
        this.suggestions = new Map();
        this.patterns = new Map();
        this.userPreferences = new Map();
        this.contextHistory = [];
        this.learningModel = new SimpleLearningModel();
    }

    generateSuggestions(sessionAnalysis) {
        const suggestions = [];
        
        // Analyze current context
        const currentContext = this.analyzeCurrentContext(sessionAnalysis);
        
        // Generate content suggestions
        suggestions.push(...this.generateContentSuggestions(currentContext));
        
        // Generate workflow suggestions
        suggestions.push(...this.generateWorkflowSuggestions(currentContext));
        
        // Generate time-based suggestions
        suggestions.push(...this.generateTimeSuggestions(currentContext));
        
        // Store suggestions for learning
        this.storeSuggestions(suggestions);
        
        return suggestions;
    }

    analyzeCurrentContext(sessionAnalysis) {
        return {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            currentDomain: window.location.hostname,
            recentTopics: sessionAnalysis.topics || [],
            userActivity: sessionAnalysis.interactions || 0,
            sessionDuration: sessionAnalysis.totalTimeSpent || 0
        };
    }

    generateContentSuggestions(context) {
        const suggestions = [];
        
        // Based on time of day
        if (context.timeOfDay >= 9 && context.timeOfDay <= 17) {
            suggestions.push({
                type: 'content',
                title: 'Work-related resources',
                description: 'Productivity tools and work-related content',
                confidence: 0.7,
                category: 'productivity'
            });
        } else if (context.timeOfDay >= 18 || context.timeOfDay <= 8) {
            suggestions.push({
                type: 'content',
                title: 'Learning and entertainment',
                description: 'Educational content and entertainment options',
                confidence: 0.6,
                category: 'leisure'
            });
        }
        
        // Based on recent topics
        context.recentTopics.forEach(topic => {
            suggestions.push({
                type: 'content',
                title: `More about ${topic}`,
                description: `Related content and resources for ${topic}`,
                confidence: 0.8,
                category: 'related'
            });
        });
        
        return suggestions;
    }

    generateWorkflowSuggestions(context) {
        const suggestions = [];
        
        // Suggest automation based on repetitive patterns
        if (context.userActivity > 50) {
            suggestions.push({
                type: 'workflow',
                title: 'Automate repetitive tasks',
                description: 'Create automation for frequently performed actions',
                confidence: 0.75,
                category: 'automation'
            });
        }
        
        // Suggest breaks based on session duration
        if (context.sessionDuration > 3600000) { // 1 hour
            suggestions.push({
                type: 'workflow',
                title: 'Take a break',
                description: 'Consider taking a short break to maintain productivity',
                confidence: 0.9,
                category: 'wellness'
            });
        }
        
        return suggestions;
    }

    generateTimeSuggestions(context) {
        const suggestions = [];
        
        // Morning suggestions
        if (context.timeOfDay >= 6 && context.timeOfDay <= 10) {
            suggestions.push({
                type: 'time',
                title: 'Morning routine',
                description: 'Start your day with planned activities',
                confidence: 0.6,
                category: 'routine'
            });
        }
        
        // End of day suggestions
        if (context.timeOfDay >= 17 && context.timeOfDay <= 19) {
            suggestions.push({
                type: 'time',
                title: 'Wrap up tasks',
                description: 'Review and complete pending tasks',
                confidence: 0.7,
                category: 'routine'
            });
        }
        
        return suggestions;
    }

    storeSuggestions(suggestions) {
        const timestamp = Date.now();
        this.suggestions.set(timestamp, suggestions);
        
        // Keep only recent suggestions (last 24 hours)
        const dayAgo = timestamp - 24 * 60 * 60 * 1000;
        for (const [time] of this.suggestions) {
            if (time < dayAgo) {
                this.suggestions.delete(time);
            }
        }
    }

    learnFromFeedback(suggestionId, feedback) {
        // Update learning model based on user feedback
        this.learningModel.updateFromFeedback(suggestionId, feedback);
    }

    getPersonalizedSuggestions(limit = 5) {
        const allSuggestions = Array.from(this.suggestions.values()).flat();
        
        // Sort by confidence and relevance
        return allSuggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }
}

/**
 * Simple Learning Model for the Predictive Assistant
 */
class SimpleLearningModel {
    constructor() {
        this.weights = new Map();
        this.feedback = new Map();
    }

    updateFromFeedback(suggestionId, feedback) {
        this.feedback.set(suggestionId, feedback);
        
        // Simple weight adjustment based on feedback
        const currentWeight = this.weights.get(suggestionId) || 0.5;
        const adjustment = feedback.positive ? 0.1 : -0.1;
        this.weights.set(suggestionId, Math.max(0, Math.min(1, currentWeight + adjustment)));
    }

    predict(context) {
        // Simple prediction based on learned weights
        return Math.random() * 0.5 + 0.25; // Placeholder implementation
    }
}

// Import the ContextLearningEngine from its dedicated module
// Note: In a browser environment, this would be handled by the module loader

// Initialize Web History Tracker
if (typeof window !== 'undefined') {
    window.WebHistoryTracker = WebHistoryTracker;
    
    // Auto-initialize if enabled
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('webHistoryEnabled') !== 'false') {
            window.webHistoryTracker = new WebHistoryTracker();
            
            // Record initial page visit
            window.webHistoryTracker.recordPageVisit();
        }
    });
}