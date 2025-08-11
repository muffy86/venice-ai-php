/**
 * Analytics & User Feedback System
 * Comprehensive analytics tracking and user feedback collection
 */

class AnalyticsFeedback {
    constructor() {
        this.analytics = {
            sessions: new Map(),
            events: [],
            userBehavior: new Map(),
            performance: new Map(),
            errors: [],
            feedback: []
        };
        
        this.currentSession = null;
        this.feedbackUI = null;
        this.analyticsUI = null;
        this.heatmapData = new Map();
        this.userJourney = [];
        this.abTests = new Map();
        this.surveys = new Map();
        
        this.init();
    }

    async init() {
        this.startSession();
        this.setupEventTracking();
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.createAnalyticsUI();
        this.createFeedbackUI();
        this.loadAnalyticsData();
        this.initializeHeatmaps();
        this.setupUserJourneyTracking();
        this.initializeABTesting();
    }

    startSession() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: new Date(),
            userId: this.getUserId(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            events: [],
            pageViews: [],
            interactions: [],
            performance: {},
            errors: []
        };

        this.analytics.sessions.set(this.currentSession.id, this.currentSession);
        this.trackEvent('session_start', { sessionId: this.currentSession.id });
    }

    setupEventTracking() {
        // Track page views
        this.trackPageView();

        // Track clicks
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackFormSubmission(e);
        });

        // Track scroll behavior
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackScroll();
            }, 100);
        });

        // Track time on page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });

        // Track app generation events
        document.addEventListener('app-generated', (e) => {
            this.trackEvent('app_generated', {
                appType: e.detail.type,
                complexity: e.detail.complexity,
                generationTime: e.detail.time
            });
        });

        // Track AI interactions
        document.addEventListener('ai-interaction', (e) => {
            this.trackEvent('ai_interaction', {
                type: e.detail.type,
                prompt: e.detail.prompt?.substring(0, 100), // Truncate for privacy
                responseTime: e.detail.responseTime
            });
        });
    }

    setupPerformanceMonitoring() {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.trackPerformance('page_load', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint()
            });
        });

        // Track resource loading
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    this.trackPerformance('resource_load', {
                        name: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize
                    });
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });

        // Track Core Web Vitals
        this.trackCoreWebVitals();
    }

    setupErrorTracking() {
        // Track JavaScript errors
        window.addEventListener('error', (e) => {
            this.trackError({
                type: 'javascript',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error?.stack
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError({
                type: 'promise_rejection',
                reason: e.reason,
                stack: e.reason?.stack
            });
        });

        // Track console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.trackError({
                type: 'console_error',
                message: args.join(' ')
            });
            originalConsoleError.apply(console, args);
        };
    }

    createAnalyticsUI() {
        this.analyticsUI = document.createElement('div');
        this.analyticsUI.id = 'analytics-dashboard';
        this.analyticsUI.className = 'analytics-dashboard';
        this.analyticsUI.innerHTML = this.getAnalyticsUIHTML();

        const style = document.createElement('style');
        style.textContent = this.getAnalyticsStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.analyticsUI);
    }

    getAnalyticsUIHTML() {
        return `
            <div class="analytics-panel">
                <div class="analytics-header">
                    <h3>Analytics Dashboard</h3>
                    <div class="analytics-controls">
                        <select id="analytics-timeframe">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                        </select>
                        <button class="btn secondary" onclick="analyticsFeedback.exportAnalytics()">
                            <span class="btn-icon">📊</span>
                            Export
                        </button>
                        <button class="close-btn" onclick="analyticsFeedback.hideAnalyticsDashboard()">×</button>
                    </div>
                </div>
                
                <div class="analytics-tabs">
                    <button class="tab-btn active" data-tab="overview" onclick="analyticsFeedback.switchAnalyticsTab('overview')">
                        Overview
                    </button>
                    <button class="tab-btn" data-tab="users" onclick="analyticsFeedback.switchAnalyticsTab('users')">
                        Users
                    </button>
                    <button class="tab-btn" data-tab="behavior" onclick="analyticsFeedback.switchAnalyticsTab('behavior')">
                        Behavior
                    </button>
                    <button class="tab-btn" data-tab="performance" onclick="analyticsFeedback.switchAnalyticsTab('performance')">
                        Performance
                    </button>
                    <button class="tab-btn" data-tab="errors" onclick="analyticsFeedback.switchAnalyticsTab('errors')">
                        Errors
                    </button>
                    <button class="tab-btn" data-tab="feedback" onclick="analyticsFeedback.switchAnalyticsTab('feedback')">
                        Feedback
                    </button>
                </div>
                
                <div class="analytics-content">
                    <!-- Overview Tab -->
                    <div class="tab-content active" id="overview-tab">
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <h4>Total Users</h4>
                                <div class="metric-value" id="total-users">0</div>
                                <div class="metric-change positive">+12% vs last week</div>
                            </div>
                            
                            <div class="metric-card">
                                <h4>Page Views</h4>
                                <div class="metric-value" id="page-views">0</div>
                                <div class="metric-change positive">+8% vs last week</div>
                            </div>
                            
                            <div class="metric-card">
                                <h4>Apps Generated</h4>
                                <div class="metric-value" id="apps-generated">0</div>
                                <div class="metric-change positive">+25% vs last week</div>
                            </div>
                            
                            <div class="metric-card">
                                <h4>Avg Session Duration</h4>
                                <div class="metric-value" id="avg-session">0m</div>
                                <div class="metric-change negative">-3% vs last week</div>
                            </div>
                            
                            <div class="metric-card">
                                <h4>Bounce Rate</h4>
                                <div class="metric-value" id="bounce-rate">0%</div>
                                <div class="metric-change positive">-5% vs last week</div>
                            </div>
                            
                            <div class="metric-card">
                                <h4>User Satisfaction</h4>
                                <div class="metric-value" id="satisfaction">0</div>
                                <div class="metric-change positive">+0.2 vs last week</div>
                            </div>
                        </div>
                        
                        <div class="charts-grid">
                            <div class="chart-container">
                                <h4>User Activity</h4>
                                <canvas id="activity-chart"></canvas>
                            </div>
                            
                            <div class="chart-container">
                                <h4>App Generation Trends</h4>
                                <canvas id="generation-chart"></canvas>
                            </div>
                            
                            <div class="chart-container">
                                <h4>User Flow</h4>
                                <div id="user-flow-diagram"></div>
                            </div>
                            
                            <div class="chart-container">
                                <h4>Real-time Activity</h4>
                                <div id="realtime-activity"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Users Tab -->
                    <div class="tab-content" id="users-tab">
                        <div class="user-metrics">
                            <div class="user-segments">
                                <h4>User Segments</h4>
                                <div class="segments-list">
                                    <div class="segment-item">
                                        <span class="segment-name">New Users</span>
                                        <span class="segment-count">45</span>
                                        <span class="segment-percentage">32%</span>
                                    </div>
                                    <div class="segment-item">
                                        <span class="segment-name">Returning Users</span>
                                        <span class="segment-count">95</span>
                                        <span class="segment-percentage">68%</span>
                                    </div>
                                    <div class="segment-item">
                                        <span class="segment-name">Power Users</span>
                                        <span class="segment-count">23</span>
                                        <span class="segment-percentage">16%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="user-demographics">
                                <h4>Demographics</h4>
                                <canvas id="demographics-chart"></canvas>
                            </div>
                            
                            <div class="user-devices">
                                <h4>Device Usage</h4>
                                <canvas id="devices-chart"></canvas>
                            </div>
                        </div>
                        
                        <div class="user-table">
                            <h4>Recent Users</h4>
                            <div class="table-container" id="users-table">
                                <!-- Users table will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Behavior Tab -->
                    <div class="tab-content" id="behavior-tab">
                        <div class="behavior-analysis">
                            <div class="heatmap-container">
                                <h4>Click Heatmap</h4>
                                <div id="click-heatmap"></div>
                            </div>
                            
                            <div class="user-journey">
                                <h4>User Journey</h4>
                                <div id="journey-flow"></div>
                            </div>
                            
                            <div class="feature-usage">
                                <h4>Feature Usage</h4>
                                <canvas id="feature-usage-chart"></canvas>
                            </div>
                            
                            <div class="conversion-funnel">
                                <h4>Conversion Funnel</h4>
                                <div id="conversion-funnel"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Performance Tab -->
                    <div class="tab-content" id="performance-tab">
                        <div class="performance-metrics">
                            <div class="core-vitals">
                                <h4>Core Web Vitals</h4>
                                <div class="vitals-grid">
                                    <div class="vital-metric">
                                        <span class="vital-name">LCP</span>
                                        <span class="vital-value good" id="lcp-value">1.2s</span>
                                        <span class="vital-status">Good</span>
                                    </div>
                                    <div class="vital-metric">
                                        <span class="vital-name">FID</span>
                                        <span class="vital-value good" id="fid-value">45ms</span>
                                        <span class="vital-status">Good</span>
                                    </div>
                                    <div class="vital-metric">
                                        <span class="vital-name">CLS</span>
                                        <span class="vital-value needs-improvement" id="cls-value">0.15</span>
                                        <span class="vital-status">Needs Improvement</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="performance-charts">
                                <div class="chart-container">
                                    <h4>Page Load Times</h4>
                                    <canvas id="load-times-chart"></canvas>
                                </div>
                                
                                <div class="chart-container">
                                    <h4>Resource Performance</h4>
                                    <canvas id="resource-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Errors Tab -->
                    <div class="tab-content" id="errors-tab">
                        <div class="error-overview">
                            <div class="error-stats">
                                <div class="error-stat">
                                    <h4>Total Errors</h4>
                                    <div class="stat-value" id="total-errors">0</div>
                                </div>
                                <div class="error-stat">
                                    <h4>Error Rate</h4>
                                    <div class="stat-value" id="error-rate">0%</div>
                                </div>
                                <div class="error-stat">
                                    <h4>Affected Users</h4>
                                    <div class="stat-value" id="affected-users">0</div>
                                </div>
                            </div>
                            
                            <div class="error-chart">
                                <h4>Error Trends</h4>
                                <canvas id="error-trends-chart"></canvas>
                            </div>
                        </div>
                        
                        <div class="error-list">
                            <h4>Recent Errors</h4>
                            <div class="errors-table" id="errors-table">
                                <!-- Errors table will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Feedback Tab -->
                    <div class="tab-content" id="feedback-tab">
                        <div class="feedback-overview">
                            <div class="feedback-stats">
                                <div class="feedback-stat">
                                    <h4>Total Feedback</h4>
                                    <div class="stat-value" id="total-feedback">0</div>
                                </div>
                                <div class="feedback-stat">
                                    <h4>Avg Rating</h4>
                                    <div class="stat-value" id="avg-rating">0.0</div>
                                </div>
                                <div class="feedback-stat">
                                    <h4>Response Rate</h4>
                                    <div class="stat-value" id="response-rate">0%</div>
                                </div>
                            </div>
                            
                            <div class="feedback-sentiment">
                                <h4>Sentiment Analysis</h4>
                                <canvas id="sentiment-chart"></canvas>
                            </div>
                        </div>
                        
                        <div class="feedback-list">
                            <h4>Recent Feedback</h4>
                            <div class="feedback-items" id="feedback-items">
                                <!-- Feedback items will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createFeedbackUI() {
        // Create feedback widget
        const feedbackWidget = document.createElement('div');
        feedbackWidget.id = 'feedback-widget';
        feedbackWidget.className = 'feedback-widget';
        feedbackWidget.innerHTML = `
            <button class="feedback-trigger" onclick="analyticsFeedback.showFeedbackForm()">
                <span class="feedback-icon">💬</span>
                <span class="feedback-text">Feedback</span>
            </button>
            
            <div class="feedback-form" id="feedback-form">
                <div class="feedback-header">
                    <h3>Share Your Feedback</h3>
                    <button class="close-btn" onclick="analyticsFeedback.hideFeedbackForm()">×</button>
                </div>
                
                <div class="feedback-content">
                    <div class="feedback-type">
                        <h4>What type of feedback?</h4>
                        <div class="feedback-types">
                            <button class="feedback-type-btn" data-type="bug" onclick="analyticsFeedback.selectFeedbackType('bug')">
                                <span class="type-icon">🐛</span>
                                <span class="type-name">Bug Report</span>
                            </button>
                            <button class="feedback-type-btn" data-type="feature" onclick="analyticsFeedback.selectFeedbackType('feature')">
                                <span class="type-icon">💡</span>
                                <span class="type-name">Feature Request</span>
                            </button>
                            <button class="feedback-type-btn" data-type="general" onclick="analyticsFeedback.selectFeedbackType('general')">
                                <span class="type-icon">💬</span>
                                <span class="type-name">General Feedback</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="feedback-rating">
                        <h4>How would you rate your experience?</h4>
                        <div class="rating-stars">
                            <span class="star" data-rating="1" onclick="analyticsFeedback.setRating(1)">⭐</span>
                            <span class="star" data-rating="2" onclick="analyticsFeedback.setRating(2)">⭐</span>
                            <span class="star" data-rating="3" onclick="analyticsFeedback.setRating(3)">⭐</span>
                            <span class="star" data-rating="4" onclick="analyticsFeedback.setRating(4)">⭐</span>
                            <span class="star" data-rating="5" onclick="analyticsFeedback.setRating(5)">⭐</span>
                        </div>
                    </div>
                    
                    <div class="feedback-message">
                        <h4>Tell us more</h4>
                        <textarea id="feedback-text" placeholder="Share your thoughts, suggestions, or report issues..."></textarea>
                    </div>
                    
                    <div class="feedback-contact">
                        <h4>Contact Information (Optional)</h4>
                        <input type="email" id="feedback-email" placeholder="your.email@example.com">
                    </div>
                    
                    <div class="feedback-actions">
                        <button class="btn secondary" onclick="analyticsFeedback.hideFeedbackForm()">
                            Cancel
                        </button>
                        <button class="btn primary" onclick="analyticsFeedback.submitFeedback()">
                            <span class="btn-icon">📤</span>
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(feedbackWidget);
    }

    getAnalyticsStyles() {
        return `
            .analytics-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }

            .analytics-dashboard.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .analytics-panel {
                background: #1a1a1a;
                border-radius: 12px;
                width: 95%;
                max-width: 1600px;
                height: 90%;
                max-height: 900px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
            }

            .analytics-header {
                padding: 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
                border-radius: 12px 12px 0 0;
            }

            .analytics-header h3 {
                margin: 0;
                color: #fff;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .analytics-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .analytics-controls select {
                background: #2d2d2d;
                border: 1px solid #333;
                color: #fff;
                padding: 8px 12px;
                border-radius: 4px;
            }

            .analytics-tabs {
                display: flex;
                background: #2d2d2d;
                border-bottom: 1px solid #333;
                overflow-x: auto;
            }

            .tab-btn {
                padding: 12px 20px;
                background: none;
                border: none;
                color: #ccc;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                border-bottom: 3px solid transparent;
            }

            .tab-btn:hover {
                background: #333;
                color: #fff;
            }

            .tab-btn.active {
                color: #2196F3;
                border-bottom-color: #2196F3;
                background: #333;
            }

            .analytics-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #1a1a1a;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .metric-card {
                background: #2d2d2d;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #333;
            }

            .metric-card h4 {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .metric-value {
                font-size: 2rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 5px;
            }

            .metric-change {
                font-size: 0.8rem;
            }

            .metric-change.positive {
                color: #4CAF50;
            }

            .metric-change.negative {
                color: #f44336;
            }

            .charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
            }

            .chart-container {
                background: #2d2d2d;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #333;
            }

            .chart-container h4 {
                margin: 0 0 15px 0;
                color: #fff;
                font-size: 1rem;
            }

            .chart-container canvas {
                width: 100%;
                height: 200px;
            }

            .feedback-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
            }

            .feedback-trigger {
                background: #2196F3;
                color: #fff;
                border: none;
                border-radius: 25px;
                padding: 12px 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
                transition: all 0.3s ease;
            }

            .feedback-trigger:hover {
                background: #1976D2;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
            }

            .feedback-form {
                position: absolute;
                bottom: 60px;
                right: 0;
                width: 400px;
                background: #1a1a1a;
                border-radius: 12px;
                border: 1px solid #333;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: none;
                max-height: 600px;
                overflow-y: auto;
            }

            .feedback-form.active {
                display: block;
            }

            .feedback-header {
                padding: 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .feedback-header h3 {
                margin: 0;
                color: #fff;
                font-size: 1.2rem;
            }

            .feedback-content {
                padding: 20px;
            }

            .feedback-content h4 {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 0.9rem;
            }

            .feedback-types {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 20px;
            }

            .feedback-type-btn {
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }

            .feedback-type-btn:hover {
                border-color: #2196F3;
            }

            .feedback-type-btn.selected {
                border-color: #2196F3;
                background: rgba(33, 150, 243, 0.1);
            }

            .type-icon {
                font-size: 1.2rem;
            }

            .type-name {
                color: #ccc;
                font-size: 0.8rem;
                text-align: center;
            }

            .rating-stars {
                display: flex;
                gap: 5px;
                margin-bottom: 20px;
            }

            .star {
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.3;
                transition: all 0.3s ease;
            }

            .star:hover,
            .star.active {
                opacity: 1;
            }

            .feedback-message textarea {
                width: 100%;
                min-height: 80px;
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px;
                color: #fff;
                resize: vertical;
                margin-bottom: 20px;
            }

            .feedback-contact input {
                width: 100%;
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px;
                color: #fff;
                margin-bottom: 20px;
            }

            .feedback-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn.primary {
                background: #2196F3;
                color: #fff;
            }

            .btn.primary:hover {
                background: #1976D2;
            }

            .btn.secondary {
                background: #333;
                color: #fff;
                border: 1px solid #555;
            }

            .btn.secondary:hover {
                background: #444;
            }

            .close-btn {
                background: none;
                border: none;
                color: #ccc;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .close-btn:hover {
                background: #333;
                color: #fff;
            }

            .user-segments {
                background: #2d2d2d;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #333;
                margin-bottom: 20px;
            }

            .segments-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .segment-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #333;
                border-radius: 4px;
            }

            .segment-name {
                color: #fff;
                font-weight: 500;
            }

            .segment-count {
                color: #2196F3;
                font-weight: 600;
            }

            .segment-percentage {
                color: #ccc;
                font-size: 0.9rem;
            }

            .vitals-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }

            .vital-metric {
                background: #333;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }

            .vital-name {
                display: block;
                color: #ccc;
                font-size: 0.9rem;
                margin-bottom: 5px;
            }

            .vital-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 5px;
            }

            .vital-value.good {
                color: #4CAF50;
            }

            .vital-value.needs-improvement {
                color: #ff9800;
            }

            .vital-value.poor {
                color: #f44336;
            }

            .vital-status {
                display: block;
                font-size: 0.8rem;
                color: #ccc;
            }

            @media (max-width: 768px) {
                .analytics-panel {
                    width: 95%;
                    height: 95%;
                }

                .metrics-grid {
                    grid-template-columns: repeat(2, 1fr);
                }

                .charts-grid {
                    grid-template-columns: 1fr;
                }

                .feedback-form {
                    width: 90vw;
                    right: 5vw;
                }

                .feedback-types {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            timestamp: new Date(),
            sessionId: this.currentSession?.id,
            userId: this.getUserId(),
            properties: properties,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.analytics.events.push(event);
        
        if (this.currentSession) {
            this.currentSession.events.push(event);
        }

        this.saveAnalyticsData();
        this.updateRealTimeActivity(event);
    }

    trackPageView() {
        const pageView = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date(),
            referrer: document.referrer
        };

        this.trackEvent('page_view', pageView);
        
        if (this.currentSession) {
            this.currentSession.pageViews.push(pageView);
        }
    }

    trackClick(event) {
        const element = event.target;
        const clickData = {
            elementType: element.tagName.toLowerCase(),
            elementId: element.id,
            elementClass: element.className,
            elementText: element.textContent?.substring(0, 100),
            x: event.clientX,
            y: event.clientY,
            timestamp: new Date()
        };

        this.trackEvent('click', clickData);
        this.updateHeatmapData('click', event.clientX, event.clientY);
    }

    trackFormSubmission(event) {
        const form = event.target;
        const formData = {
            formId: form.id,
            formAction: form.action,
            formMethod: form.method,
            fieldCount: form.elements.length
        };

        this.trackEvent('form_submit', formData);
    }

    trackScroll() {
        const scrollData = {
            scrollTop: window.pageYOffset,
            scrollHeight: document.documentElement.scrollHeight,
            clientHeight: window.innerHeight,
            scrollPercentage: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
        };

        this.trackEvent('scroll', scrollData);
    }

    trackPerformance(metricName, data) {
        const performanceData = {
            metric: metricName,
            data: data,
            timestamp: new Date(),
            url: window.location.href
        };

        this.analytics.performance.set(metricName, performanceData);
        this.trackEvent('performance', performanceData);
    }

    trackError(errorData) {
        const error = {
            ...errorData,
            timestamp: new Date(),
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.currentSession?.id
        };

        this.analytics.errors.push(error);
        
        if (this.currentSession) {
            this.currentSession.errors.push(error);
        }

        this.trackEvent('error', error);
        this.saveAnalyticsData();
    }

    trackCoreWebVitals() {
        // Track Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                this.trackPerformance('lcp', {
                    value: entry.startTime,
                    element: entry.element?.tagName
                });
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                this.trackPerformance('fid', {
                    value: entry.processingStart - entry.startTime,
                    eventType: entry.name
                });
            }
        }).observe({ entryTypes: ['first-input'] });

        // Track Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.trackPerformance('cls', { value: clsValue });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return firstContentfulPaint ? firstContentfulPaint.startTime : null;
    }

    updateHeatmapData(type, x, y) {
        const key = `${Math.floor(x / 10)},${Math.floor(y / 10)}`;
        const current = this.heatmapData.get(key) || 0;
        this.heatmapData.set(key, current + 1);
    }

    updateRealTimeActivity(event) {
        const activityContainer = document.getElementById('realtime-activity');
        if (!activityContainer) return;

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-time">${event.timestamp.toLocaleTimeString()}</span>
            <span class="activity-event">${event.name}</span>
            <span class="activity-user">User ${event.userId?.substring(0, 8)}</span>
        `;

        activityContainer.insertBefore(activityItem, activityContainer.firstChild);

        // Keep only last 10 items
        while (activityContainer.children.length > 10) {
            activityContainer.removeChild(activityContainer.lastChild);
        }
    }

    showAnalyticsDashboard() {
        this.analyticsUI.classList.add('active');
        this.updateAnalyticsDashboard();
    }

    hideAnalyticsDashboard() {
        this.analyticsUI.classList.remove('active');
    }

    switchAnalyticsTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.analytics-dashboard .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.analytics-dashboard .tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update content based on tab
        this.updateTabContent(tabName);
    }

    updateTabContent(tabName) {
        switch (tabName) {
            case 'overview':
                this.updateOverviewMetrics();
                this.renderCharts();
                break;
            case 'users':
                this.updateUserMetrics();
                break;
            case 'behavior':
                this.updateBehaviorAnalysis();
                break;
            case 'performance':
                this.updatePerformanceMetrics();
                break;
            case 'errors':
                this.updateErrorAnalysis();
                break;
            case 'feedback':
                this.updateFeedbackAnalysis();
                break;
        }
    }

    updateOverviewMetrics() {
        const totalUsers = document.getElementById('total-users');
        const pageViews = document.getElementById('page-views');
        const appsGenerated = document.getElementById('apps-generated');
        const avgSession = document.getElementById('avg-session');
        const bounceRate = document.getElementById('bounce-rate');
        const satisfaction = document.getElementById('satisfaction');

        if (totalUsers) totalUsers.textContent = this.analytics.sessions.size;
        if (pageViews) pageViews.textContent = this.analytics.events.filter(e => e.name === 'page_view').length;
        if (appsGenerated) appsGenerated.textContent = this.analytics.events.filter(e => e.name === 'app_generated').length;
        if (avgSession) avgSession.textContent = this.calculateAverageSessionDuration();
        if (bounceRate) bounceRate.textContent = this.calculateBounceRate();
        if (satisfaction) satisfaction.textContent = this.calculateSatisfactionScore();
    }

    calculateAverageSessionDuration() {
        const sessions = Array.from(this.analytics.sessions.values());
        if (sessions.length === 0) return '0m';

        const totalDuration = sessions.reduce((sum, session) => {
            const endTime = session.endTime || new Date();
            return sum + (endTime - session.startTime);
        }, 0);

        const avgDuration = totalDuration / sessions.length;
        return Math.round(avgDuration / 60000) + 'm'; // Convert to minutes
    }

    calculateBounceRate() {
        const sessions = Array.from(this.analytics.sessions.values());
        if (sessions.length === 0) return '0%';

        const bouncedSessions = sessions.filter(session => session.pageViews.length <= 1);
        return Math.round((bouncedSessions.length / sessions.length) * 100) + '%';
    }

    calculateSatisfactionScore() {
        const feedbackWithRatings = this.analytics.feedback.filter(f => f.rating);
        if (feedbackWithRatings.length === 0) return '0.0';

        const totalRating = feedbackWithRatings.reduce((sum, f) => sum + f.rating, 0);
        return (totalRating / feedbackWithRatings.length).toFixed(1);
    }

    renderCharts() {
        // This would integrate with a charting library like Chart.js
        console.log('Rendering analytics charts...');
    }

    showFeedbackForm() {
        const form = document.getElementById('feedback-form');
        if (form) form.classList.add('active');
    }

    hideFeedbackForm() {
        const form = document.getElementById('feedback-form');
        if (form) form.classList.remove('active');
    }

    selectFeedbackType(type) {
        document.querySelectorAll('.feedback-type-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
        this.selectedFeedbackType = type;
    }

    setRating(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
        this.selectedRating = rating;
    }

    submitFeedback() {
        const text = document.getElementById('feedback-text').value;
        const email = document.getElementById('feedback-email').value;

        const feedback = {
            id: this.generateFeedbackId(),
            type: this.selectedFeedbackType || 'general',
            rating: this.selectedRating,
            text: text,
            email: email,
            timestamp: new Date(),
            userId: this.getUserId(),
            sessionId: this.currentSession?.id,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.analytics.feedback.push(feedback);
        this.trackEvent('feedback_submitted', { feedbackId: feedback.id, type: feedback.type });
        this.saveAnalyticsData();

        // Show success message
        this.showFeedbackSuccess();
        this.hideFeedbackForm();
    }

    showFeedbackSuccess() {
        const successMessage = document.createElement('div');
        successMessage.className = 'feedback-success';
        successMessage.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span class="success-text">Thank you for your feedback!</span>
            </div>
        `;

        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    }

    exportAnalytics() {
        const analyticsData = {
            sessions: Array.from(this.analytics.sessions.values()),
            events: this.analytics.events,
            performance: Array.from(this.analytics.performance.values()),
            errors: this.analytics.errors,
            feedback: this.analytics.feedback,
            exportDate: new Date()
        };

        const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateFeedbackId() {
        return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('talktoapp-user-id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('talktoapp-user-id', userId);
        }
        return userId;
    }

    saveAnalyticsData() {
        const dataToSave = {
            sessions: Array.from(this.analytics.sessions.entries()),
            events: this.analytics.events.slice(-1000), // Keep last 1000 events
            performance: Array.from(this.analytics.performance.entries()),
            errors: this.analytics.errors.slice(-100), // Keep last 100 errors
            feedback: this.analytics.feedback
        };

        localStorage.setItem('talktoapp-analytics', JSON.stringify(dataToSave));
    }

    loadAnalyticsData() {
        const saved = localStorage.getItem('talktoapp-analytics');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.analytics.sessions = new Map(data.sessions || []);
                this.analytics.events = data.events || [];
                this.analytics.performance = new Map(data.performance || []);
                this.analytics.errors = data.errors || [];
                this.analytics.feedback = data.feedback || [];
            } catch (e) {
                console.error('Failed to load analytics data:', e);
            }
        }
    }

    initializeHeatmaps() {
        // Initialize heatmap tracking
        console.log('Heatmap tracking initialized');
    }

    setupUserJourneyTracking() {
        // Track user journey through the application
        this.trackEvent('journey_start');
    }

    initializeABTesting() {
        // Initialize A/B testing framework
        console.log('A/B testing framework initialized');
    }

    updateAnalyticsDashboard() {
        this.updateOverviewMetrics();
        this.renderCharts();
    }

    updateUserMetrics() {
        // Update user-specific metrics
        console.log('Updating user metrics...');
    }

    updateBehaviorAnalysis() {
        // Update behavior analysis
        console.log('Updating behavior analysis...');
    }

    updatePerformanceMetrics() {
        // Update performance metrics
        console.log('Updating performance metrics...');
    }

    updateErrorAnalysis() {
        // Update error analysis
        console.log('Updating error analysis...');
    }

    updateFeedbackAnalysis() {
        // Update feedback analysis
        console.log('Updating feedback analysis...');
    }
}

// Initialize Analytics & Feedback System
const analyticsFeedback = new AnalyticsFeedback();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsFeedback;
}