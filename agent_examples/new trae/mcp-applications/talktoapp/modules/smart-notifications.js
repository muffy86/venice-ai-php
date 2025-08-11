/**
 * Smart Notifications System
 * Delivers contextually relevant notifications and reminders
 */

class SmartNotifications {
    constructor() {
        this.notifications = [];
        this.settings = {
            enabled: true,
            priority: 'medium',
            quietHours: { start: 22, end: 7 },
            categories: {
                automation: true,
                suggestions: true,
                reminders: true,
                achievements: true,
                system: true
            }
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.requestPermission();
        this.setupNotificationQueue();
        this.createNotificationUI();
    }

    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.settings.browserNotifications = permission === 'granted';
        }
    }

    createNotificationUI() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    setupNotificationQueue() {
        this.queue = [];
        this.processing = false;
        this.rateLimits = new Map();
        
        // Process queue every 2 seconds
        setInterval(() => {
            this.processQueue();
        }, 2000);
        
        // Reset rate limits every minute
        setInterval(() => {
            this.rateLimits.clear();
        }, 60000);
    }

    processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        const notification = this.queue.shift();
        
        if (this.shouldShowNotification(notification)) {
            this.show(notification);
        }
        
        this.processing = false;
    }

    queueNotification(notification) {
        this.queue.push(notification);
    }

    // Smart notification delivery based on context
    show(notification) {
        if (!this.shouldShowNotification(notification)) return;

        const enrichedNotification = this.enrichNotification(notification);
        
        // Show in-app notification
        this.showInAppNotification(enrichedNotification);
        
        // Show browser notification if enabled
        if (this.settings.browserNotifications && enrichedNotification.priority === 'high') {
            this.showBrowserNotification(enrichedNotification);
        }

        // Store notification
        this.notifications.unshift(enrichedNotification);
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.saveNotifications();
    }

    enrichNotification(notification) {
        const context = window.contextualIntelligence?.getCurrentContext() || {};
        
        return {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            context: {
                time: context.time,
                device: context.device?.type,
                activity: this.getCurrentActivity()
            },
            priority: this.calculatePriority(notification),
            category: notification.category || 'general',
            ...notification
        };
    }

    calculatePriority(notification) {
        let priority = 'medium';
        
        // High priority conditions
        if (notification.type === 'error' || notification.urgent) {
            priority = 'high';
        }
        
        // Context-based priority adjustment
        const context = window.contextualIntelligence?.getCurrentContext();
        if (context?.time?.period === 'night') {
            priority = priority === 'high' ? 'medium' : 'low';
        }
        
        // User activity based priority
        if (this.isUserActive()) {
            priority = priority === 'low' ? 'medium' : priority;
        }
        
        return priority;
    }

    shouldShowNotification(notification) {
        if (!this.settings.enabled) return false;
        
        // Check category settings
        if (!this.settings.categories[notification.category]) return false;
        
        // Check quiet hours
        if (this.isQuietHours() && notification.priority !== 'high') return false;
        
        // Check rate limiting
        if (this.isRateLimited(notification.category)) return false;
        
        return true;
    }

    showInAppNotification(notification) {
        const container = document.getElementById('notification-container');
        const element = document.createElement('div');
        element.className = `notification ${notification.priority} ${notification.type || 'info'}`;
        element.innerHTML = this.getNotificationHTML(notification);
        
        container.appendChild(element);
        
        // Animate in
        setTimeout(() => element.classList.add('show'), 100);
        
        // Auto-remove based on priority
        const duration = this.getNotificationDuration(notification.priority);
        setTimeout(() => {
            element.classList.remove('show');
            setTimeout(() => element.remove(), 300);
        }, duration);
        
        // Add interaction handlers
        this.addNotificationHandlers(element, notification);
    }

    getNotificationHTML(notification) {
        const icon = this.getNotificationIcon(notification);
        const actions = notification.actions ? this.getActionsHTML(notification.actions) : '';
        
        return `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">${icon}</span>
                    <span class="notification-title">${notification.title}</span>
                    <button class="notification-close">×</button>
                </div>
                <div class="notification-body">
                    <p class="notification-message">${notification.message}</p>
                    ${notification.details ? `<div class="notification-details">${notification.details}</div>` : ''}
                </div>
                ${actions}
            </div>
        `;
    }

    getNotificationIcon(notification) {
        const icons = {
            automation: '🤖',
            suggestion: '💡',
            achievement: '🏆',
            reminder: '⏰',
            error: '❌',
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️',
            system: '⚙️'
        };
        
        return icons[notification.type] || icons[notification.category] || icons.info;
    }

    getActionsHTML(actions) {
        return `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-action" data-action="${action.id}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    addNotificationHandlers(element, notification) {
        // Close button
        element.querySelector('.notification-close').addEventListener('click', () => {
            element.classList.remove('show');
            setTimeout(() => element.remove(), 300);
        });
        
        // Action buttons
        element.querySelectorAll('.notification-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.target.dataset.action;
                const action = notification.actions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler();
                }
                element.classList.remove('show');
                setTimeout(() => element.remove(), 300);
            });
        });
    }

    showBrowserNotification(notification) {
        if (!this.settings.browserNotifications) return;
        
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.category,
            requireInteraction: notification.priority === 'high'
        });
        
        browserNotification.onclick = () => {
            window.focus();
            if (notification.onClick) {
                notification.onClick();
            }
        };
    }

    // Smart notification types
    showAutomationSuggestion(automation) {
        this.show({
            category: 'automation',
            type: 'suggestion',
            title: 'New Automation Suggestion',
            message: `I can automate: ${automation.description}`,
            details: `Confidence: ${Math.round(automation.confidence * 100)}%`,
            actions: [
                {
                    id: 'approve',
                    text: '✓ Enable',
                    handler: () => this.approveAutomation(automation.id)
                },
                {
                    id: 'reject',
                    text: '✗ Dismiss',
                    handler: () => this.rejectAutomation(automation.id)
                },
                {
                    id: 'later',
                    text: '⏰ Later',
                    handler: () => this.snoozeAutomation(automation.id)
                }
            ]
        });
    }

    showContextualReminder(reminder) {
        const context = window.contextualIntelligence?.getCurrentContext();
        let contextualMessage = reminder.message;
        
        // Add contextual information
        if (context?.time?.period === 'morning') {
            contextualMessage += ' - Perfect timing for your morning routine!';
        }
        
        this.show({
            category: 'reminder',
            type: 'reminder',
            title: reminder.title,
            message: contextualMessage,
            priority: reminder.urgent ? 'high' : 'medium'
        });
    }

    showProductivityInsight(insight) {
        this.show({
            category: 'suggestion',
            type: 'info',
            title: 'Productivity Insight',
            message: insight.message,
            details: `Based on ${insight.dataPoints} data points`,
            actions: [
                {
                    id: 'learn_more',
                    text: 'Learn More',
                    handler: () => this.showInsightDetails(insight)
                }
            ]
        });
    }

    showAchievement(achievement) {
        this.show({
            category: 'achievement',
            type: 'achievement',
            title: achievement.title,
            message: achievement.description,
            priority: 'medium',
            celebratory: true
        });
        
        // Add celebration effects
        this.triggerCelebration();
    }

    // Context-aware scheduling
    scheduleNotification(notification, delay) {
        const context = window.contextualIntelligence?.getCurrentContext();
        
        // Adjust timing based on context
        let adjustedDelay = delay;
        
        if (context?.time?.period === 'night') {
            // Delay until morning
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(8, 0, 0, 0);
            adjustedDelay = tomorrow.getTime() - now.getTime();
        }
        
        setTimeout(() => {
            this.show(notification);
        }, adjustedDelay);
    }

    // Utility methods
    isQuietHours() {
        const now = new Date();
        const hour = now.getHours();
        const { start, end } = this.settings.quietHours;
        
        if (start > end) {
            return hour >= start || hour < end;
        }
        return hour >= start && hour < end;
    }

    isRateLimited(category) {
        const recentNotifications = this.notifications.filter(n => 
            n.category === category && 
            Date.now() - n.timestamp.getTime() < 300000 // 5 minutes
        );
        
        return recentNotifications.length >= 3;
    }

    isUserActive() {
        // Check if user has been active recently
        const lastActivity = localStorage.getItem('lastUserActivity');
        if (!lastActivity) return true;
        
        return Date.now() - parseInt(lastActivity) < 60000; // 1 minute
    }

    getCurrentActivity() {
        const sessions = JSON.parse(localStorage.getItem('behavioralData') || '{}').sessions || [];
        return sessions[sessions.length - 1]?.activity || 'unknown';
    }

    getNotificationDuration(priority) {
        const durations = {
            low: 3000,
            medium: 5000,
            high: 8000
        };
        return durations[priority] || durations.medium;
    }

    triggerCelebration() {
        // Add celebration animation
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = '🎉✨🎊';
        celebration.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            pointer-events: none;
            z-index: 20000;
            animation: celebrate 2s ease-out forwards;
        `;
        
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 2000);
    }

    // Action handlers
    approveAutomation(automationId) {
        if (window.automationCore) {
            window.automationCore.approveAutomation(automationId);
        }
    }

    rejectAutomation(automationId) {
        if (window.automationCore) {
            window.automationCore.rejectAutomation(automationId);
        }
    }

    snoozeAutomation(automationId) {
        // Snooze for 1 hour
        setTimeout(() => {
            const automation = window.automationCore?.automations.get(automationId);
            if (automation) {
                this.showAutomationSuggestion(automation);
            }
        }, 3600000);
    }

    showInsightDetails(insight) {
        if (window.dashboard) {
            window.dashboard.showDashboard();
            window.dashboard.switchView('patterns');
        }
    }

    // Settings management
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveNotifications() {
        const toSave = this.notifications.slice(0, 20); // Keep last 20
        localStorage.setItem('recentNotifications', JSON.stringify(toSave));
    }

    // Public API
    getRecentNotifications() {
        return this.notifications;
    }

    clearNotifications() {
        this.notifications = [];
        this.saveNotifications();
    }

    getSettings() {
        return this.settings;
    }
}

// Add notification styles
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 15000;
    max-width: 350px;
    pointer-events: none;
}

.notification {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(25px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 10px;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification.high {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2);
}

.notification.success {
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.2);
}

.notification-content {
    padding: 15px;
}

.notification-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.notification-icon {
    font-size: 18px;
}

.notification-title {
    flex: 1;
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.notification-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.notification-message {
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    line-height: 1.4;
    margin: 0;
}

.notification-details {
    color: rgba(255, 255, 255, 0.6);
    font-size: 11px;
    margin-top: 5px;
}

.notification-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.notification-action {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.notification-action:hover {
    background: rgba(255, 255, 255, 0.2);
}

.celebration-overlay {
    animation: celebrate 2s ease-out forwards;
}

@keyframes celebrate {
    0% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(1); }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Initialize and expose globally
window.SmartNotifications = SmartNotifications;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartNotifications = new SmartNotifications();
    });
} else {
    window.smartNotifications = new SmartNotifications();
}