/**
 * Behavioral Learning Engine
 * Learns user patterns and predicts automation needs
 */

class BehavioralLearningEngine {
    constructor() {
        this.patterns = new Map();
        this.sessions = [];
        this.preferences = {};
        this.automationRules = [];
        this.isLearning = true;
        this.init();
    }

    init() {
        this.loadStoredData();
        this.startPatternTracking();
        this.setupEventListeners();
    }

    // Track user behavior patterns
    trackActivity(activity) {
        const timestamp = Date.now();
        const timeOfDay = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        
        const pattern = {
            activity,
            timestamp,
            timeOfDay,
            dayOfWeek,
            context: this.getCurrentContext()
        };

        this.sessions.push(pattern);
        this.analyzePattern(pattern);
        this.saveData();
    }

    // Analyze patterns to predict needs
    analyzePattern(newPattern) {
        const similar = this.findSimilarPatterns(newPattern);
        
        if (similar.length >= 3) {
            const prediction = this.generatePrediction(similar);
            this.suggestAutomation(prediction);
        }
    }

    findSimilarPatterns(pattern) {
        return this.sessions.filter(session => 
            Math.abs(session.timeOfDay - pattern.timeOfDay) <= 1 &&
            session.dayOfWeek === pattern.dayOfWeek &&
            this.calculateSimilarity(session.context, pattern.context) > 0.7
        );
    }

    // Generate automation predictions
    generatePrediction(patterns) {
        const activities = patterns.map(p => p.activity);
        const mostCommon = this.getMostFrequent(activities);
        
        return {
            predictedActivity: mostCommon,
            confidence: patterns.length / 10,
            timePattern: this.extractTimePattern(patterns),
            contextPattern: this.extractContextPattern(patterns)
        };
    }

    // Suggest automation based on predictions
    suggestAutomation(prediction) {
        if (prediction.confidence > 0.8) {
            const automation = {
                id: Date.now(),
                type: 'predictive',
                trigger: prediction.timePattern,
                action: prediction.predictedActivity,
                confidence: prediction.confidence,
                created: new Date()
            };

            this.automationRules.push(automation);
            this.notifyUser(automation);
        }
    }

    // Execute automated actions
    async executeAutomation(rule) {
        try {
            switch (rule.action.type) {
                case 'openWebsite':
                    await this.openWebsite(rule.action.url);
                    break;
                case 'sendEmail':
                    await this.composeEmail(rule.action.template);
                    break;
                case 'scheduleTask':
                    await this.scheduleTask(rule.action.task);
                    break;
                case 'runScript':
                    await this.runAutomationScript(rule.action.script);
                    break;
            }
            
            this.trackActivity({
                type: 'automation_executed',
                rule: rule.id,
                success: true
            });
        } catch (error) {
            console.error('Automation failed:', error);
            this.trackActivity({
                type: 'automation_failed',
                rule: rule.id,
                error: error.message
            });
        }
    }

    // Learn from user feedback
    provideFeedback(automationId, feedback) {
        const rule = this.automationRules.find(r => r.id === automationId);
        if (rule) {
            rule.feedback = feedback;
            rule.confidence *= feedback === 'positive' ? 1.1 : 0.8;
            
            if (rule.confidence < 0.3) {
                this.disableAutomation(automationId);
            }
        }
    }

    // Context awareness
    getCurrentContext() {
        return {
            url: window.location.href,
            time: new Date().toISOString(),
            activeApps: this.getActiveApplications(),
            systemLoad: this.getSystemMetrics(),
            userActivity: this.getUserActivityLevel()
        };
    }

    // Get active applications (browser-based detection)
    getActiveApplications() {
        const apps = [];
        
        // Detect current browser
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) apps.push('Chrome');
        else if (userAgent.includes('Firefox')) apps.push('Firefox');
        else if (userAgent.includes('Safari')) apps.push('Safari');
        else if (userAgent.includes('Edge')) apps.push('Edge');
        
        // Detect current domain/app
        const domain = window.location.hostname;
        if (domain) apps.push(domain);
        
        // Check for common web apps
        if (domain.includes('gmail')) apps.push('Gmail');
        if (domain.includes('github')) apps.push('GitHub');
        if (domain.includes('slack')) apps.push('Slack');
        if (domain.includes('zoom')) apps.push('Zoom');
        if (domain.includes('teams')) apps.push('Microsoft Teams');
        
        return apps;
    }

    // Get system metrics (browser-based)
    getSystemMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: 0,
            cpu: 0,
            network: navigator.onLine ? 'online' : 'offline'
        };

        // Get memory info if available
        if (performance.memory) {
            metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
        }

        // Get connection info if available
        if (navigator.connection) {
            metrics.connectionType = navigator.connection.effectiveType;
            metrics.downlink = navigator.connection.downlink;
        }

        return metrics;
    }

    // Get user activity level
    getUserActivityLevel() {
        const now = Date.now();
        const recentActivity = this.sessions.filter(s => 
            now - s.timestamp < 300000 // Last 5 minutes
        );

        if (recentActivity.length === 0) return 'idle';
        if (recentActivity.length < 3) return 'low';
        if (recentActivity.length < 10) return 'medium';
        return 'high';
    }

    // Utility methods
    calculateSimilarity(context1, context2) {
        // Simple similarity calculation
        let matches = 0;
        let total = 0;
        
        for (let key in context1) {
            total++;
            if (context1[key] === context2[key]) matches++;
        }
        
        return total > 0 ? matches / total : 0;
    }

    getMostFrequent(arr) {
        const frequency = {};
        arr.forEach(item => frequency[item] = (frequency[item] || 0) + 1);
        return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
    }

    extractTimePattern(patterns) {
        const times = patterns.map(p => p.timeOfDay);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        return {
            hour: Math.round(avgTime),
            variance: this.calculateVariance(times)
        };
    }

    extractContextPattern(patterns) {
        const contexts = patterns.map(p => p.context);
        return {
            commonUrls: this.findCommonUrls(contexts),
            commonApps: this.findCommonApps(contexts)
        };
    }

    // Additional utility methods
    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        return variance;
    }

    findCommonUrls(contexts) {
        const urls = contexts.map(c => c.url).filter(Boolean);
        const frequency = {};
        urls.forEach(url => frequency[url] = (frequency[url] || 0) + 1);
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([url]) => url);
    }

    findCommonApps(contexts) {
        const apps = contexts.flatMap(c => c.activeApps || []);
        const frequency = {};
        apps.forEach(app => frequency[app] = (frequency[app] || 0) + 1);
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([app]) => app);
    }

    getTopActivities() {
        const activities = this.sessions.map(s => s.activity.type);
        const frequency = {};
        activities.forEach(activity => frequency[activity] = (frequency[activity] || 0) + 1);
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([activity, count]) => ({ activity, count }));
    }

    getTimePatterns() {
        const hourCounts = new Array(24).fill(0);
        this.sessions.forEach(session => {
            const hour = new Date(session.timestamp).getHours();
            hourCounts[hour]++;
        });
        
        return hourCounts.map((count, hour) => ({ hour, count }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count);
    }

    generateSuggestions() {
        const suggestions = [];
        const now = new Date();
        const currentHour = now.getHours();
        
        // Time-based suggestions
        const timePatterns = this.getTimePatterns();
        const currentTimePattern = timePatterns.find(p => p.hour === currentHour);
        
        if (currentTimePattern && currentTimePattern.count > 5) {
            suggestions.push({
                type: 'time_based',
                message: `You're usually active at this time. Consider setting up automation for common tasks.`,
                confidence: Math.min(currentTimePattern.count / 20, 1)
            });
        }
        
        // Activity-based suggestions
        const topActivities = this.getTopActivities();
        if (topActivities.length > 0 && topActivities[0].count > 10) {
            suggestions.push({
                type: 'activity_based',
                message: `You frequently perform "${topActivities[0].activity}" actions. Would you like to automate this?`,
                confidence: Math.min(topActivities[0].count / 50, 1)
            });
        }
        
        return suggestions;
    }

    // Data persistence
    saveData() {
        localStorage.setItem('behavioralData', JSON.stringify({
            patterns: Array.from(this.patterns.entries()),
            sessions: this.sessions.slice(-1000), // Keep last 1000 sessions
            preferences: this.preferences,
            automationRules: this.automationRules
        }));
    }

    loadStoredData() {
        const stored = localStorage.getItem('behavioralData');
        if (stored) {
            const data = JSON.parse(stored);
            this.patterns = new Map(data.patterns || []);
            this.sessions = data.sessions || [];
            this.preferences = data.preferences || {};
            this.automationRules = data.automationRules || [];
        }
    }

    // Event listeners for behavior tracking
    setupEventListeners() {
        // Track clicks
        document.addEventListener('click', (e) => {
            this.trackActivity({
                type: 'click',
                element: e.target.tagName,
                text: e.target.textContent?.slice(0, 50)
            });
        });

        // Track navigation
        window.addEventListener('beforeunload', () => {
            this.trackActivity({
                type: 'navigation',
                from: window.location.href
            });
        });

        // Track focus changes
        window.addEventListener('focus', () => {
            this.trackActivity({ type: 'window_focus' });
        });

        window.addEventListener('blur', () => {
            this.trackActivity({ type: 'window_blur' });
        });
    }

    // Start continuous pattern tracking
    startPatternTracking() {
        setInterval(() => {
            this.trackActivity({
                type: 'periodic_check',
                context: this.getCurrentContext()
            });
        }, 60000); // Every minute
    }

    // Notification system
    notifyUser(automation) {
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Automation Suggestion',
                message: `I noticed you often ${automation.action} at this time. Should I automate this?`,
                actions: [
                    { text: 'Yes', action: () => this.enableAutomation(automation.id) },
                    { text: 'No', action: () => this.disableAutomation(automation.id) },
                    { text: 'Later', action: () => this.snoozeAutomation(automation.id) }
                ]
            });
        }
    }

    // Public API
    getInsights() {
        return {
            totalSessions: this.sessions.length,
            activeAutomations: this.automationRules.filter(r => r.enabled).length,
            topActivities: this.getTopActivities(),
            timePatterns: this.getTimePatterns(),
            suggestions: this.generateSuggestions()
        };
    }

    enableLearning() {
        this.isLearning = true;
    }

    disableLearning() {
        this.isLearning = false;
    }

    clearData() {
        this.patterns.clear();
        this.sessions = [];
        this.automationRules = [];
        this.saveData();
    }

    // Automation management methods
    enableAutomation(automationId) {
        const rule = this.automationRules.find(r => r.id === automationId);
        if (rule) {
            rule.enabled = true;
            this.saveData();
            console.log(`Automation "${rule.name}" enabled`);
        }
    }

    disableAutomation(automationId) {
        const rule = this.automationRules.find(r => r.id === automationId);
        if (rule) {
            rule.enabled = false;
            this.saveData();
            console.log(`Automation "${rule.name}" disabled`);
        }
    }

    snoozeAutomation(automationId, duration = 3600000) { // Default 1 hour
        const rule = this.automationRules.find(r => r.id === automationId);
        if (rule) {
            rule.snoozedUntil = Date.now() + duration;
            this.saveData();
            console.log(`Automation "${rule.name}" snoozed for ${duration / 60000} minutes`);
        }
    }
}

// Initialize and expose globally
window.BehavioralLearningEngine = BehavioralLearningEngine;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.behavioralEngine = new BehavioralLearningEngine();
    });
} else {
    window.behavioralEngine = new BehavioralLearningEngine();
}