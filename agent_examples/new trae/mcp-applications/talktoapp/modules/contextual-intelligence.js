/**
 * Contextual Intelligence Engine
 * Provides relevant context and smart suggestions based on user environment
 */

class ContextualIntelligence {
    constructor() {
        this.context = {
            time: {},
            location: {},
            device: {},
            browser: {},
            activity: {},
            environment: {}
        };
        this.suggestions = [];
        this.relevantData = new Map();
        this.init();
    }

    init() {
        this.gatherSystemContext();
        this.setupContextMonitoring();
        this.loadRelevantData();
    }

    // Gather comprehensive system context
    gatherSystemContext() {
        this.context = {
            time: this.getTimeContext(),
            device: this.getDeviceContext(),
            browser: this.getBrowserContext(),
            network: this.getNetworkContext(),
            performance: this.getPerformanceContext(),
            user: this.getUserContext()
        };
    }

    getTimeContext() {
        const now = new Date();
        return {
            hour: now.getHours(),
            minute: now.getMinutes(),
            day: now.getDay(),
            date: now.getDate(),
            month: now.getMonth(),
            year: now.getFullYear(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            period: this.getTimePeriod(now.getHours()),
            workday: this.isWorkday(now.getDay()),
            season: this.getSeason(now.getMonth())
        };
    }

    getDeviceContext() {
        return {
            type: this.getDeviceType(),
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                ratio: window.devicePixelRatio,
                orientation: screen.orientation?.type || 'unknown'
            },
            memory: navigator.deviceMemory || 'unknown',
            cores: navigator.hardwareConcurrency || 'unknown',
            platform: navigator.platform,
            mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
    }

    getBrowserContext() {
        return {
            name: this.getBrowserName(),
            version: this.getBrowserVersion(),
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    getNetworkContext() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            type: connection?.type || 'unknown',
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 'unknown',
            rtt: connection?.rtt || 'unknown',
            saveData: connection?.saveData || false
        };
    }

    getPerformanceContext() {
        const memory = performance.memory;
        return {
            memory: memory ? {
                used: Math.round(memory.usedJSHeapSize / 1048576),
                total: Math.round(memory.totalJSHeapSize / 1048576),
                limit: Math.round(memory.jsHeapSizeLimit / 1048576)
            } : null,
            timing: performance.timing ? {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null
        };
    }

    getUserContext() {
        return {
            preferences: this.loadUserPreferences(),
            history: this.getRecentActivity(),
            patterns: this.getUserPatterns(),
            goals: this.getUserGoals()
        };
    }

    // Generate contextual suggestions
    generateContextualSuggestions() {
        const suggestions = [];
        const ctx = this.context;

        // Time-based suggestions
        if (ctx.time.period === 'morning') {
            suggestions.push({
                type: 'productivity',
                title: 'Morning Productivity Boost',
                description: 'Start your day with a task manager or calendar app',
                relevance: 0.8,
                apps: ['todo', 'calendar', 'notes']
            });
        }

        if (ctx.time.period === 'evening') {
            suggestions.push({
                type: 'relaxation',
                title: 'Evening Wind-down',
                description: 'Create a meditation or entertainment app',
                relevance: 0.7,
                apps: ['meditation', 'music', 'game']
            });
        }

        // Device-based suggestions
        if (ctx.device.mobile) {
            suggestions.push({
                type: 'mobile-optimized',
                title: 'Mobile-First Design',
                description: 'Your app will be optimized for touch interactions',
                relevance: 0.9,
                features: ['touch-gestures', 'responsive-design', 'offline-support']
            });
        }

        // Performance-based suggestions
        if (ctx.network.effectiveType === 'slow-2g' || ctx.network.effectiveType === '2g') {
            suggestions.push({
                type: 'performance',
                title: 'Lightweight App Recommended',
                description: 'Optimize for slow connections with minimal resources',
                relevance: 0.9,
                optimizations: ['lazy-loading', 'compression', 'minimal-assets']
            });
        }

        // Weather-based suggestions (if available)
        this.getWeatherContext().then(weather => {
            if (weather.condition === 'rainy') {
                suggestions.push({
                    type: 'indoor-activity',
                    title: 'Rainy Day Apps',
                    description: 'Perfect weather for creative indoor activities',
                    relevance: 0.6,
                    apps: ['art', 'music', 'reading', 'puzzle']
                });
            }
        });

        return suggestions;
    }

    // Provide relevant automation suggestions
    getAutomationSuggestions() {
        const automations = [];
        const ctx = this.context;

        // Work hours automation
        if (ctx.time.workday && ctx.time.hour >= 9 && ctx.time.hour <= 17) {
            automations.push({
                trigger: 'workday_start',
                action: 'open_productivity_apps',
                description: 'Automatically open work-related applications',
                apps: ['email', 'calendar', 'slack', 'github'],
                confidence: 0.8
            });
        }

        // Break time suggestions
        if (ctx.time.minute === 0 && (ctx.time.hour === 10 || ctx.time.hour === 15)) {
            automations.push({
                trigger: 'break_time',
                action: 'suggest_break',
                description: 'Remind to take a break and suggest relaxing activities',
                confidence: 0.7
            });
        }

        // End of day cleanup
        if (ctx.time.hour === 18 && ctx.time.workday) {
            automations.push({
                trigger: 'workday_end',
                action: 'cleanup_workspace',
                description: 'Close work apps and organize files',
                confidence: 0.9
            });
        }

        return automations;
    }

    // Smart app recommendations based on context
    getSmartAppRecommendations() {
        const recommendations = [];
        const ctx = this.context;

        // Based on time of day
        const timeRecommendations = {
            morning: ['productivity', 'news', 'weather', 'calendar'],
            afternoon: ['work-tools', 'communication', 'research'],
            evening: ['entertainment', 'social', 'relaxation'],
            night: ['reading', 'meditation', 'sleep-tracker']
        };

        const currentPeriod = ctx.time.period;
        if (timeRecommendations[currentPeriod]) {
            recommendations.push(...timeRecommendations[currentPeriod].map(type => ({
                type,
                reason: `Perfect for ${currentPeriod} activities`,
                relevance: 0.8
            })));
        }

        // Based on device capabilities
        if (ctx.device.mobile) {
            recommendations.push({
                type: 'camera-app',
                reason: 'Mobile devices are great for photo apps',
                relevance: 0.7
            });
        }

        // Based on network conditions
        if (ctx.network.effectiveType === '4g') {
            recommendations.push({
                type: 'video-streaming',
                reason: 'Fast connection supports video apps',
                relevance: 0.8
            });
        }

        return recommendations;
    }

    // Monitor context changes
    setupContextMonitoring() {
        // Update time context every minute
        setInterval(() => {
            this.context.time = this.getTimeContext();
            this.onContextChange('time');
        }, 60000);

        // Monitor network changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.context.network = this.getNetworkContext();
                this.onContextChange('network');
            });
        }

        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.context.browser.onLine = true;
            this.onContextChange('connectivity');
        });

        window.addEventListener('offline', () => {
            this.context.browser.onLine = false;
            this.onContextChange('connectivity');
        });

        // Monitor window resize
        window.addEventListener('resize', () => {
            this.context.browser.viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            this.onContextChange('viewport');
        });
    }

    // Handle context changes
    onContextChange(type) {
        console.log(`Context changed: ${type}`);
        
        // Update suggestions based on new context
        this.suggestions = this.generateContextualSuggestions();
        
        // Notify other systems
        if (window.behavioralEngine) {
            window.behavioralEngine.trackActivity({
                type: 'context_change',
                contextType: type,
                newContext: this.context[type]
            });
        }

        // Update UI if dashboard is visible
        if (window.dashboard && window.dashboard.isVisible) {
            window.dashboard.refreshData();
        }
    }

    // Utility methods
    getTimePeriod(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    isWorkday(day) {
        return day >= 1 && day <= 5; // Monday to Friday
    }

    getSeason(month) {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    getDeviceType() {
        const width = window.screen.width;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    getBrowserVersion() {
        const ua = navigator.userAgent;
        const match = ua.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
        return match ? match[1] : 'Unknown';
    }

    async getWeatherContext() {
        // This would integrate with a weather API
        // For now, return mock data
        return {
            condition: 'sunny',
            temperature: 22,
            humidity: 60
        };
    }

    loadUserPreferences() {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
    }

    getRecentActivity() {
        const sessions = JSON.parse(localStorage.getItem('behavioralData') || '{}').sessions || [];
        return sessions.slice(-10); // Last 10 activities
    }

    getUserPatterns() {
        const data = JSON.parse(localStorage.getItem('behavioralData') || '{}');
        return data.patterns || [];
    }

    getUserGoals() {
        return JSON.parse(localStorage.getItem('userGoals') || '[]');
    }

    loadRelevantData() {
        // Load contextually relevant data
        const ctx = this.context;
        
        // Load time-relevant data
        if (ctx.time.workday) {
            this.relevantData.set('workApps', ['email', 'calendar', 'slack', 'github', 'notion']);
        } else {
            this.relevantData.set('leisureApps', ['games', 'music', 'social', 'entertainment']);
        }

        // Load device-relevant data
        if (ctx.device.mobile) {
            this.relevantData.set('mobileFeatures', ['touch', 'camera', 'gps', 'accelerometer']);
        }
    }

    // Public API
    getCurrentContext() {
        return this.context;
    }

    getRelevantSuggestions() {
        return this.generateContextualSuggestions();
    }

    getContextualAutomations() {
        return this.getAutomationSuggestions();
    }

    getAppRecommendations() {
        return this.getSmartAppRecommendations();
    }

    updateUserPreferences(preferences) {
        const current = this.loadUserPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem('userPreferences', JSON.stringify(updated));
        this.context.user.preferences = updated;
    }

    setUserGoals(goals) {
        localStorage.setItem('userGoals', JSON.stringify(goals));
        this.context.user.goals = goals;
    }
}

// Initialize and expose globally
window.ContextualIntelligence = ContextualIntelligence;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contextualIntelligence = new ContextualIntelligence();
    });
} else {
    window.contextualIntelligence = new ContextualIntelligence();
}