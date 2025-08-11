/**
 * Predictive Automation Core
 * Executes automated actions based on learned patterns
 */

class PredictiveAutomationCore {
    constructor() {
        this.automations = new Map();
        this.scheduledTasks = new Map();
        this.isActive = true;
        this.confidence_threshold = 0.7;
        this.init();
    }

    init() {
        this.setupAutomationTypes();
        this.startScheduler();
        this.loadSavedAutomations();
    }

    // Define automation types
    setupAutomationTypes() {
        this.automationTypes = {
            web_navigation: {
                execute: async (params) => await this.navigateToSite(params),
                description: 'Open websites automatically'
            },
            email_management: {
                execute: async (params) => await this.manageEmails(params),
                description: 'Handle email tasks'
            },
            calendar_sync: {
                execute: async (params) => await this.syncCalendar(params),
                description: 'Manage calendar events'
            },
            file_organization: {
                execute: async (params) => await this.organizeFiles(params),
                description: 'Organize files and folders'
            },
            social_media: {
                execute: async (params) => await this.manageSocialMedia(params),
                description: 'Handle social media tasks'
            },
            productivity_apps: {
                execute: async (params) => await this.openProductivityApps(params),
                description: 'Launch productivity applications'
            }
        };
    }

    // Create automation from pattern
    createAutomation(pattern, prediction) {
        const automation = {
            id: `auto_${Date.now()}`,
            name: this.generateAutomationName(pattern),
            type: this.determineAutomationType(pattern),
            trigger: {
                time: prediction.timePattern,
                context: prediction.contextPattern,
                conditions: this.extractConditions(pattern)
            },
            action: {
                type: pattern.activity.type,
                parameters: pattern.activity.parameters || {},
                fallback: this.createFallbackAction(pattern)
            },
            confidence: prediction.confidence,
            enabled: false, // Requires user approval
            created: new Date(),
            lastExecuted: null,
            executionCount: 0,
            successRate: 0
        };

        this.automations.set(automation.id, automation);
        return automation;
    }

    // Execute automation
    async executeAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (!automation || !automation.enabled) return;

        try {
            console.log(`Executing automation: ${automation.name}`);
            
            // Check conditions
            if (!await this.checkConditions(automation.trigger.conditions)) {
                console.log('Conditions not met, skipping automation');
                return;
            }

            // Execute the automation
            const result = await this.automationTypes[automation.type].execute(automation.action.parameters);
            
            // Update statistics
            automation.lastExecuted = new Date();
            automation.executionCount++;
            automation.successRate = ((automation.successRate * (automation.executionCount - 1)) + 1) / automation.executionCount;
            
            this.logExecution(automationId, 'success', result);
            
            // Notify user of successful automation
            this.notifySuccess(automation, result);
            
        } catch (error) {
            console.error(`Automation failed: ${automation.name}`, error);
            
            // Try fallback action
            if (automation.action.fallback) {
                try {
                    await this.executeFallback(automation.action.fallback);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                }
            }
            
            // Update failure statistics
            automation.successRate = (automation.successRate * automation.executionCount) / (automation.executionCount + 1);
            automation.executionCount++;
            
            this.logExecution(automationId, 'failure', error);
            this.notifyFailure(automation, error);
        }

        this.saveAutomations();
    }

    // Automation execution methods
    async navigateToSite(params) {
        const { url, newTab = true } = params;
        
        if (newTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
        
        return { action: 'navigation', url, timestamp: new Date() };
    }

    async manageEmails(params) {
        const { action, recipient, subject, template } = params;
        
        switch (action) {
            case 'compose':
                const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`;
                window.open(mailtoLink);
                break;
            case 'open_client':
                // Try to open common email clients
                const emailClients = ['https://mail.google.com', 'https://outlook.live.com'];
                window.open(emailClients[0], '_blank');
                break;
        }
        
        return { action: 'email_management', params, timestamp: new Date() };
    }

    async syncCalendar(params) {
        const { action, event } = params;
        
        if (action === 'create_event') {
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}`;
            window.open(googleCalendarUrl, '_blank');
        }
        
        return { action: 'calendar_sync', params, timestamp: new Date() };
    }

    async organizeFiles(params) {
        // This would integrate with file system APIs when available
        console.log('File organization automation:', params);
        return { action: 'file_organization', params, timestamp: new Date() };
    }

    async manageSocialMedia(params) {
        const { platform, action, content } = params;
        
        const platforms = {
            twitter: 'https://twitter.com/compose/tweet',
            linkedin: 'https://www.linkedin.com/sharing/share-offsite/',
            facebook: 'https://www.facebook.com/'
        };
        
        if (platforms[platform]) {
            window.open(platforms[platform], '_blank');
        }
        
        return { action: 'social_media', platform, timestamp: new Date() };
    }

    async openProductivityApps(params) {
        const { apps } = params;
        
        const appUrls = {
            notion: 'https://notion.so',
            trello: 'https://trello.com',
            slack: 'https://slack.com',
            discord: 'https://discord.com/app',
            github: 'https://github.com',
            figma: 'https://figma.com'
        };
        
        for (const app of apps) {
            if (appUrls[app]) {
                window.open(appUrls[app], '_blank');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Stagger opening
            }
        }
        
        return { action: 'productivity_apps', apps, timestamp: new Date() };
    }

    // Condition checking
    async checkConditions(conditions) {
        if (!conditions) return true;
        
        for (const condition of conditions) {
            switch (condition.type) {
                case 'time_range':
                    if (!this.isInTimeRange(condition.start, condition.end)) return false;
                    break;
                case 'day_of_week':
                    if (!condition.days.includes(new Date().getDay())) return false;
                    break;
                case 'url_contains':
                    if (!window.location.href.includes(condition.value)) return false;
                    break;
                case 'system_idle':
                    if (!await this.isSystemIdle(condition.minutes)) return false;
                    break;
            }
        }
        
        return true;
    }

    // Scheduler for time-based automations
    startScheduler() {
        setInterval(() => {
            this.checkScheduledAutomations();
        }, 60000); // Check every minute
    }

    checkScheduledAutomations() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay();
        
        for (const [id, automation] of this.automations) {
            if (!automation.enabled) continue;
            
            const trigger = automation.trigger;
            if (trigger.time && 
                trigger.time.hour === currentHour && 
                Math.abs(trigger.time.minute - currentMinute) <= 1) {
                
                // Check if we should execute based on day pattern
                if (!trigger.time.days || trigger.time.days.includes(currentDay)) {
                    this.executeAutomation(id);
                }
            }
        }
    }

    // User interaction methods
    approveAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (automation) {
            automation.enabled = true;
            this.saveAutomations();
            this.notifyApproval(automation);
        }
    }

    rejectAutomation(automationId) {
        const automation = this.automations.get(automationId);
        if (automation) {
            automation.enabled = false;
            automation.rejected = true;
            this.saveAutomations();
        }
    }

    modifyAutomation(automationId, modifications) {
        const automation = this.automations.get(automationId);
        if (automation) {
            Object.assign(automation, modifications);
            this.saveAutomations();
        }
    }

    // Utility methods
    generateAutomationName(pattern) {
        const activity = pattern.activity.type;
        const time = new Date(pattern.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `Auto ${activity} at ${time}`;
    }

    determineAutomationType(pattern) {
        const activity = pattern.activity.type;
        
        if (activity.includes('website') || activity.includes('url')) return 'web_navigation';
        if (activity.includes('email')) return 'email_management';
        if (activity.includes('calendar')) return 'calendar_sync';
        if (activity.includes('file')) return 'file_organization';
        if (activity.includes('social')) return 'social_media';
        
        return 'productivity_apps';
    }

    extractConditions(pattern) {
        const conditions = [];
        
        // Time-based conditions
        if (pattern.timeOfDay) {
            conditions.push({
                type: 'time_range',
                start: pattern.timeOfDay - 1,
                end: pattern.timeOfDay + 1
            });
        }
        
        // Day-based conditions
        if (pattern.dayOfWeek !== undefined) {
            conditions.push({
                type: 'day_of_week',
                days: [pattern.dayOfWeek]
            });
        }
        
        return conditions;
    }

    isInTimeRange(start, end) {
        const currentHour = new Date().getHours();
        return currentHour >= start && currentHour <= end;
    }

    // Notification methods
    notifySuccess(automation, result) {
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Automation Completed',
                message: `Successfully executed: ${automation.name}`,
                type: 'success'
            });
        }
    }

    notifyFailure(automation, error) {
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Automation Failed',
                message: `Failed to execute: ${automation.name}. Error: ${error.message}`,
                type: 'error'
            });
        }
    }

    notifyApproval(automation) {
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Automation Enabled',
                message: `${automation.name} is now active`,
                type: 'info'
            });
        }
    }

    // Data persistence
    saveAutomations() {
        const data = Array.from(this.automations.entries());
        localStorage.setItem('automations', JSON.stringify(data));
    }

    loadSavedAutomations() {
        const saved = localStorage.getItem('automations');
        if (saved) {
            const data = JSON.parse(saved);
            this.automations = new Map(data);
        }
    }

    logExecution(automationId, status, details) {
        const log = {
            automationId,
            status,
            details,
            timestamp: new Date()
        };
        
        const logs = JSON.parse(localStorage.getItem('automationLogs') || '[]');
        logs.push(log);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('automationLogs', JSON.stringify(logs));
    }

    // Public API
    getAutomations() {
        return Array.from(this.automations.values());
    }

    getActiveAutomations() {
        return Array.from(this.automations.values()).filter(a => a.enabled);
    }

    getAutomationStats() {
        const automations = Array.from(this.automations.values());
        return {
            total: automations.length,
            active: automations.filter(a => a.enabled).length,
            avgSuccessRate: automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length || 0,
            totalExecutions: automations.reduce((sum, a) => sum + a.executionCount, 0)
        };
    }
}

// Initialize and expose globally
window.PredictiveAutomationCore = PredictiveAutomationCore;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.automationCore = new PredictiveAutomationCore();
    });
} else {
    window.automationCore = new PredictiveAutomationCore();
}