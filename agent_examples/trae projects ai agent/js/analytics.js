/**
 * Analytics and Metrics System
 * Tracks user interactions, system performance, and provides insights
 */

class AnalyticsManager {
    constructor() {
        this.events = [];
        this.sessions = new Map();
        this.currentSession = this.createSession();
        this.metrics = {
            userInteractions: 0,
            tasksCompleted: 0,
            errorsEncountered: 0,
            averageResponseTime: 0,
            systemUptime: Date.now()
        };
        this.setupEventTracking();
    }

    createSession() {
        const sessionId = this.generateId();
        const session = {
            id: sessionId,
            startTime: Date.now(),
            events: [],
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        this.sessions.set(sessionId, session);
        return session;
    }

    setupEventTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });

        // Track window resize
        window.addEventListener('resize', () => {
            this.trackEvent('window_resize', {
                width: window.innerWidth,
                height: window.innerHeight,
                timestamp: Date.now()
            });
        });

        // Track clicks on important elements
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.matches('button, .agent-card, .task-item, .tab-button')) {
                this.trackEvent('user_interaction', {
                    type: 'click',
                    element: target.tagName.toLowerCase(),
                    className: target.className,
                    id: target.id,
                    text: target.textContent?.slice(0, 50),
                    timestamp: Date.now()
                });
            }
        });
    }

    trackEvent(eventType, data = {}) {
        const event = {
            id: this.generateId(),
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.currentSession.id,
            ...data
        };

        this.events.push(event);
        this.currentSession.events.push(event);

        // Update metrics
        if (eventType === 'user_interaction') {
            this.metrics.userInteractions++;
        } else if (eventType === 'task_completed') {
            this.metrics.tasksCompleted++;
        } else if (eventType === 'error') {
            this.metrics.errorsEncountered++;
        }

        // Persist to localStorage
        this.persistAnalytics();
    }

    trackUserJourney(step, data = {}) {
        this.trackEvent('user_journey', {
            step,
            ...data
        });
    }

    trackPerformance(operation, duration, success = true) {
        this.trackEvent('performance', {
            operation,
            duration,
            success,
            timestamp: Date.now()
        });

        // Update average response time
        const performanceEvents = this.events.filter(e => e.type === 'performance');
        const totalDuration = performanceEvents.reduce((sum, e) => sum + e.duration, 0);
        this.metrics.averageResponseTime = totalDuration / performanceEvents.length;
    }

    getAnalytics() {
        const now = Date.now();
        const sessionDuration = now - this.currentSession.startTime;
        
        return {
            currentSession: {
                ...this.currentSession,
                duration: sessionDuration
            },
            metrics: {
                ...this.metrics,
                systemUptime: now - this.metrics.systemUptime
            },
            eventSummary: this.getEventSummary(),
            userBehavior: this.analyzeUserBehavior(),
            performanceInsights: this.getPerformanceInsights()
        };
    }

    getEventSummary() {
        const summary = {};
        this.events.forEach(event => {
            summary[event.type] = (summary[event.type] || 0) + 1;
        });
        return summary;
    }

    analyzeUserBehavior() {
        const interactions = this.events.filter(e => e.type === 'user_interaction');
        const clicksByElement = {};
        
        interactions.forEach(interaction => {
            const key = interaction.element || 'unknown';
            clicksByElement[key] = (clicksByElement[key] || 0) + 1;
        });

        return {
            totalInteractions: interactions.length,
            clicksByElement,
            averageSessionLength: this.currentSession.events.length,
            mostUsedFeatures: Object.entries(clicksByElement)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
        };
    }

    getPerformanceInsights() {
        const performanceEvents = this.events.filter(e => e.type === 'performance');
        
        if (performanceEvents.length === 0) {
            return { message: 'No performance data available' };
        }

        const operations = {};
        performanceEvents.forEach(event => {
            if (!operations[event.operation]) {
                operations[event.operation] = {
                    count: 0,
                    totalDuration: 0,
                    successes: 0,
                    failures: 0
                };
            }
            
            const op = operations[event.operation];
            op.count++;
            op.totalDuration += event.duration;
            if (event.success) op.successes++;
            else op.failures++;
        });

        Object.keys(operations).forEach(op => {
            operations[op].averageDuration = operations[op].totalDuration / operations[op].count;
            operations[op].successRate = (operations[op].successes / operations[op].count) * 100;
        });

        return {
            totalOperations: performanceEvents.length,
            operations,
            slowestOperations: Object.entries(operations)
                .sort(([,a], [,b]) => b.averageDuration - a.averageDuration)
                .slice(0, 5)
        };
    }

    persistAnalytics() {
        try {
            const data = {
                events: this.events.slice(-500), // Keep last 500 events
                metrics: this.metrics,
                lastUpdated: Date.now()
            };
            localStorage.setItem('ai_agent_analytics', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to persist analytics:', error);
        }
    }

    loadPersistedAnalytics() {
        try {
            const data = JSON.parse(localStorage.getItem('ai_agent_analytics') || '{}');
            if (data.events) {
                this.events = data.events;
            }
            if (data.metrics) {
                this.metrics = { ...this.metrics, ...data.metrics };
            }
        } catch (error) {
            console.warn('Failed to load persisted analytics:', error);
        }
    }

    exportAnalytics() {
        const analytics = this.getAnalytics();
        const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-agent-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.container = this.createContainer();
        this.setupPermissions();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    async setupPermissions() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            timestamp: Date.now(),
            duration: options.duration || this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || []
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-remove if not persistent
        if (!notification.persistent) {
            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }

        // Show browser notification if permitted
        if (options.browser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(message, {
                icon: '/favicon.ico',
                tag: notification.id
            });
        }

        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.remove(oldest.id);
        }

        return notification.id;
    }

    renderNotification(notification) {
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.style.cssText = `
            background: ${this.getTypeColor(notification.type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: auto;
            cursor: pointer;
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1; margin-right: 8px;">
                    ${notification.message}
                </div>
                <button onclick="window.notificationManager.remove('${notification.id}')" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1;">
                    ×
                </button>
            </div>
        `;

        // Add actions if any
        if (notification.actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'margin-top: 8px; display: flex; gap: 8px;';
            
            notification.actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.label;
                button.style.cssText = `
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                button.onclick = () => {
                    action.callback();
                    this.remove(notification.id);
                };
                actionsDiv.appendChild(button);
            });
            
            element.appendChild(actionsDiv);
        }

        this.container.appendChild(element);

        // Animate in
        requestAnimationFrame(() => {
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        });
    }

    remove(id) {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    getTypeColor(type) {
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c',
            system: '#9b59b6'
        };
        return colors[type] || colors.info;
    }

    clear() {
        this.notifications.forEach(n => this.remove(n.id));
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Export for global use
window.AnalyticsManager = AnalyticsManager;
window.NotificationManager = NotificationManager;