/**
 * Intelligent Dashboard
 * Provides insights and controls for behavioral learning and automation
 */

class IntelligentDashboard {
    constructor() {
        this.isVisible = false;
        this.currentView = 'overview';
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.createDashboard();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    createDashboard() {
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'intelligent-dashboard';
        dashboard.className = 'dashboard-container';
        dashboard.innerHTML = this.getDashboardHTML();
        
        // Add to body
        document.body.appendChild(dashboard);
        
        // Create toggle button
        this.createToggleButton();
    }

    getDashboardHTML() {
        return `
            <div class="dashboard-header">
                <h2>🧠 AI Automation Dashboard</h2>
                <div class="dashboard-controls">
                    <button class="view-btn active" data-view="overview">Overview</button>
                    <button class="view-btn" data-view="patterns">Patterns</button>
                    <button class="view-btn" data-view="automations">Automations</button>
                    <button class="view-btn" data-view="settings">Settings</button>
                    <button class="close-btn" id="close-dashboard">×</button>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="view-content" id="overview-view">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="total-sessions">0</div>
                            <div class="stat-label">Learning Sessions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="active-automations">0</div>
                            <div class="stat-label">Active Automations</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="success-rate">0%</div>
                            <div class="stat-label">Success Rate</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="time-saved">0h</div>
                            <div class="stat-label">Time Saved</div>
                        </div>
                    </div>
                    
                    <div class="insights-section">
                        <h3>🔍 Recent Insights</h3>
                        <div id="insights-list" class="insights-list"></div>
                    </div>
                    
                    <div class="suggestions-section">
                        <h3>💡 Automation Suggestions</h3>
                        <div id="suggestions-list" class="suggestions-list"></div>
                    </div>
                </div>
                
                <div class="view-content hidden" id="patterns-view">
                    <div class="patterns-header">
                        <h3>📊 Behavioral Patterns</h3>
                        <select id="pattern-timeframe">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                    <div id="patterns-chart" class="chart-container"></div>
                    <div id="patterns-list" class="patterns-list"></div>
                </div>
                
                <div class="view-content hidden" id="automations-view">
                    <div class="automations-header">
                        <h3>🤖 Active Automations</h3>
                        <button id="create-automation" class="create-btn">+ Create New</button>
                    </div>
                    <div id="automations-list" class="automations-list"></div>
                </div>
                
                <div class="view-content hidden" id="settings-view">
                    <div class="settings-section">
                        <h3>⚙️ Learning Settings</h3>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="enable-learning" checked>
                                Enable Behavioral Learning
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Confidence Threshold: <span id="confidence-value">70%</span>
                                <input type="range" id="confidence-slider" min="50" max="95" value="70">
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="auto-approve" checked>
                                Auto-approve high confidence automations
                            </label>
                        </div>
                        <div class="setting-item">
                            <button id="export-data" class="export-btn">Export Learning Data</button>
                            <button id="clear-data" class="clear-btn">Clear All Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'dashboard-toggle';
        toggleBtn.className = 'dashboard-toggle';
        toggleBtn.innerHTML = '🧠';
        toggleBtn.title = 'Open AI Dashboard';
        
        document.body.appendChild(toggleBtn);
    }

    setupEventListeners() {
        // Toggle dashboard
        document.getElementById('dashboard-toggle').addEventListener('click', () => {
            this.toggleDashboard();
        });

        // Close dashboard
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hideDashboard();
        });

        // View switching
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Settings
        document.getElementById('enable-learning').addEventListener('change', (e) => {
            if (window.behavioralEngine) {
                e.target.checked ? window.behavioralEngine.enableLearning() : window.behavioralEngine.disableLearning();
            }
        });

        document.getElementById('confidence-slider').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('confidence-value').textContent = value + '%';
            if (window.automationCore) {
                window.automationCore.confidence_threshold = value / 100;
            }
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all learning data? This cannot be undone.')) {
                this.clearAllData();
            }
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
    }

    toggleDashboard() {
        if (this.isVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }

    showDashboard() {
        const dashboard = document.getElementById('intelligent-dashboard');
        dashboard.classList.add('visible');
        this.isVisible = true;
        this.refreshData();
    }

    hideDashboard() {
        const dashboard = document.getElementById('intelligent-dashboard');
        dashboard.classList.remove('visible');
        this.isVisible = false;
    }

    switchView(viewName) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Show/hide views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(`${viewName}-view`).classList.remove('hidden');

        this.currentView = viewName;
        this.refreshViewData(viewName);
    }

    refreshData() {
        if (!this.isVisible) return;

        switch (this.currentView) {
            case 'overview':
                this.refreshOverview();
                break;
            case 'patterns':
                this.refreshPatterns();
                break;
            case 'automations':
                this.refreshAutomations();
                break;
        }
    }

    refreshOverview() {
        // Get data from engines
        const behavioralData = window.behavioralEngine?.getInsights() || {};
        const automationData = window.automationCore?.getAutomationStats() || {};

        // Update stats
        document.getElementById('total-sessions').textContent = behavioralData.totalSessions || 0;
        document.getElementById('active-automations').textContent = automationData.active || 0;
        document.getElementById('success-rate').textContent = Math.round((automationData.avgSuccessRate || 0) * 100) + '%';
        document.getElementById('time-saved').textContent = this.calculateTimeSaved() + 'h';

        // Update insights
        this.updateInsights(behavioralData);
        
        // Update suggestions
        this.updateSuggestions(behavioralData.suggestions || []);
    }

    refreshPatterns() {
        const timeframe = document.getElementById('pattern-timeframe').value;
        const patterns = this.getPatternData(timeframe);
        
        this.renderPatternsChart(patterns);
        this.renderPatternsList(patterns);
    }

    refreshAutomations() {
        const automations = window.automationCore?.getAutomations() || [];
        this.renderAutomationsList(automations);
    }

    updateInsights(data) {
        const insightsList = document.getElementById('insights-list');
        const insights = this.generateInsights(data);
        
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                </div>
                <div class="insight-time">${insight.time}</div>
            </div>
        `).join('');
    }

    updateSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestions-list');
        
        suggestionsList.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                    <div class="suggestion-confidence">Confidence: ${Math.round(suggestion.confidence * 100)}%</div>
                </div>
                <div class="suggestion-actions">
                    <button class="approve-btn" onclick="window.dashboard.approveSuggestion('${suggestion.id}')">
                        ✓ Approve
                    </button>
                    <button class="reject-btn" onclick="window.dashboard.rejectSuggestion('${suggestion.id}')">
                        ✗ Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAutomationsList(automations) {
        const automationsList = document.getElementById('automations-list');
        
        automationsList.innerHTML = automations.map(automation => `
            <div class="automation-item ${automation.enabled ? 'enabled' : 'disabled'}">
                <div class="automation-header">
                    <div class="automation-name">${automation.name}</div>
                    <div class="automation-toggle">
                        <label class="switch">
                            <input type="checkbox" ${automation.enabled ? 'checked' : ''} 
                                   onchange="window.dashboard.toggleAutomation('${automation.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="automation-details">
                    <div class="automation-stats">
                        <span>Executions: ${automation.executionCount}</span>
                        <span>Success Rate: ${Math.round(automation.successRate * 100)}%</span>
                        <span>Confidence: ${Math.round(automation.confidence * 100)}%</span>
                    </div>
                    <div class="automation-trigger">
                        Trigger: ${this.formatTrigger(automation.trigger)}
                    </div>
                </div>
                <div class="automation-actions">
                    <button onclick="window.dashboard.editAutomation('${automation.id}')">Edit</button>
                    <button onclick="window.dashboard.testAutomation('${automation.id}')">Test</button>
                    <button onclick="window.dashboard.deleteAutomation('${automation.id}')" class="delete-btn">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Utility methods
    generateInsights(data) {
        const insights = [];
        const now = new Date();
        
        if (data.topActivities && data.topActivities.length > 0) {
            insights.push({
                type: 'info',
                icon: '📈',
                title: 'Most Common Activity',
                description: `You frequently ${data.topActivities[0]} during this time`,
                time: '2 min ago'
            });
        }

        if (data.timePatterns) {
            insights.push({
                type: 'success',
                icon: '⏰',
                title: 'Peak Activity Time',
                description: `Your most productive hours are ${data.timePatterns.peak}`,
                time: '5 min ago'
            });
        }

        return insights;
    }

    calculateTimeSaved() {
        const automations = window.automationCore?.getAutomations() || [];
        const totalExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0);
        return Math.round(totalExecutions * 0.5); // Assume 30 seconds saved per automation
    }

    formatTrigger(trigger) {
        if (trigger.time) {
            return `Daily at ${trigger.time.hour}:${trigger.time.minute || '00'}`;
        }
        return 'Context-based';
    }

    // Action handlers
    approveSuggestion(suggestionId) {
        // Implementation for approving suggestions
        console.log('Approving suggestion:', suggestionId);
    }

    rejectSuggestion(suggestionId) {
        // Implementation for rejecting suggestions
        console.log('Rejecting suggestion:', suggestionId);
    }

    toggleAutomation(automationId, enabled) {
        if (window.automationCore) {
            if (enabled) {
                window.automationCore.approveAutomation(automationId);
            } else {
                window.automationCore.rejectAutomation(automationId);
            }
        }
    }

    editAutomation(automationId) {
        // Implementation for editing automations
        console.log('Editing automation:', automationId);
    }

    testAutomation(automationId) {
        if (window.automationCore) {
            window.automationCore.executeAutomation(automationId);
        }
    }

    deleteAutomation(automationId) {
        if (confirm('Are you sure you want to delete this automation?')) {
            if (window.automationCore) {
                window.automationCore.automations.delete(automationId);
                window.automationCore.saveAutomations();
                this.refreshAutomations();
            }
        }
    }

    clearAllData() {
        if (window.behavioralEngine) {
            window.behavioralEngine.clearData();
        }
        if (window.automationCore) {
            window.automationCore.automations.clear();
            window.automationCore.saveAutomations();
        }
        this.refreshData();
    }

    exportData() {
        const data = {
            behavioral: window.behavioralEngine?.getInsights() || {},
            automations: window.automationCore?.getAutomations() || [],
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talktoapp-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                this.refreshData();
            }
        }, 30000); // Refresh every 30 seconds
    }

    refreshViewData(viewName) {
        switch (viewName) {
            case 'overview':
                this.refreshOverview();
                break;
            case 'patterns':
                this.refreshPatterns();
                break;
            case 'automations':
                this.refreshAutomations();
                break;
        }
    }
}

// Initialize and expose globally
window.IntelligentDashboard = IntelligentDashboard;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new IntelligentDashboard();
    });
} else {
    window.dashboard = new IntelligentDashboard();
}