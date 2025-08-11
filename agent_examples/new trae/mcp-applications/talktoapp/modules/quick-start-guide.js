/**
 * Quick Start Guide for Behavioral Learning System
 * Helps users understand and set up automation
 */

class QuickStartGuide {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to AI Automation",
                content: "I'll learn your patterns and automate your online activities. Let's get started!",
                action: "intro"
            },
            {
                title: "Enable Learning Mode",
                content: "First, I need to observe your behavior. Click 'Start Learning' to begin tracking.",
                action: "enable_learning"
            },
            {
                title: "Use Your Computer Normally",
                content: "Go about your usual online activities. I'll quietly learn your patterns in the background.",
                action: "observe"
            },
            {
                title: "Review Suggestions",
                content: "After I've learned enough, I'll suggest automations. You can approve or reject them.",
                action: "suggestions"
            },
            {
                title: "Enjoy Automation",
                content: "Once approved, I'll automatically handle repetitive tasks for you!",
                action: "complete"
            }
        ];
        this.init();
    }

    init() {
        this.createGuideInterface();
        this.checkFirstTime();
    }

    checkFirstTime() {
        const hasSeenGuide = localStorage.getItem('hasSeenQuickStart');
        if (!hasSeenGuide) {
            setTimeout(() => this.showGuide(), 2000);
        }
    }

    createGuideInterface() {
        const guide = document.createElement('div');
        guide.id = 'quick-start-guide';
        guide.className = 'guide-overlay hidden';
        guide.innerHTML = this.getGuideHTML();
        document.body.appendChild(guide);
        this.setupEventListeners();
    }

    getGuideHTML() {
        return `
            <div class="guide-backdrop"></div>
            <div class="guide-container">
                <div class="guide-header">
                    <div class="guide-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="step-counter">Step 1 of ${this.steps.length}</span>
                    </div>
                    <button class="guide-close">×</button>
                </div>
                
                <div class="guide-content">
                    <div class="guide-icon">🤖</div>
                    <h2 class="guide-title">Welcome to AI Automation</h2>
                    <p class="guide-description">I'll learn your patterns and automate your online activities. Let's get started!</p>
                    
                    <div class="guide-visual">
                        <div class="automation-preview">
                            <div class="preview-item">
                                <span class="preview-icon">🌐</span>
                                <span class="preview-text">Auto-open websites</span>
                            </div>
                            <div class="preview-item">
                                <span class="preview-icon">📧</span>
                                <span class="preview-text">Compose emails</span>
                            </div>
                            <div class="preview-item">
                                <span class="preview-icon">📅</span>
                                <span class="preview-text">Schedule tasks</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="guide-actions">
                    <button class="guide-btn secondary" id="skip-guide">Skip Tour</button>
                    <button class="guide-btn primary" id="next-step">Get Started</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('next-step').addEventListener('click', () => {
            this.nextStep();
        });

        document.getElementById('skip-guide').addEventListener('click', () => {
            this.skipGuide();
        });

        document.querySelector('.guide-close').addEventListener('click', () => {
            this.hideGuide();
        });

        document.querySelector('.guide-backdrop').addEventListener('click', () => {
            this.hideGuide();
        });
    }

    showGuide() {
        const guide = document.getElementById('quick-start-guide');
        guide.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideGuide() {
        const guide = document.getElementById('quick-start-guide');
        guide.classList.add('hidden');
        document.body.style.overflow = '';
        localStorage.setItem('hasSeenQuickStart', 'true');
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateGuideContent();
            this.executeStepAction();
        } else {
            this.completeGuide();
        }
    }

    updateGuideContent() {
        const step = this.steps[this.currentStep];
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;

        // Update progress
        document.querySelector('.progress-fill').style.width = progress + '%';
        document.querySelector('.step-counter').textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;

        // Update content
        document.querySelector('.guide-title').textContent = step.title;
        document.querySelector('.guide-description').textContent = step.content;

        // Update button text
        const nextBtn = document.getElementById('next-step');
        if (this.currentStep === this.steps.length - 1) {
            nextBtn.textContent = 'Complete Setup';
        } else {
            nextBtn.textContent = 'Next';
        }

        // Update visual based on step
        this.updateVisual(step.action);
    }

    updateVisual(action) {
        const visual = document.querySelector('.guide-visual');
        
        switch (action) {
            case 'enable_learning':
                visual.innerHTML = `
                    <div class="learning-toggle-demo">
                        <div class="demo-switch">
                            <span>Learning Mode</span>
                            <div class="switch-demo active">
                                <div class="switch-slider"></div>
                            </div>
                        </div>
                        <div class="demo-status">✅ Now observing your behavior</div>
                    </div>
                `;
                break;
                
            case 'observe':
                visual.innerHTML = `
                    <div class="observation-demo">
                        <div class="activity-tracker">
                            <div class="activity-item">
                                <span class="activity-time">9:00 AM</span>
                                <span class="activity-desc">Opened Gmail</span>
                            </div>
                            <div class="activity-item">
                                <span class="activity-time">9:15 AM</span>
                                <span class="activity-desc">Visited GitHub</span>
                            </div>
                            <div class="activity-item">
                                <span class="activity-time">9:30 AM</span>
                                <span class="activity-desc">Opened Slack</span>
                            </div>
                        </div>
                        <div class="learning-indicator">🧠 Learning your patterns...</div>
                    </div>
                `;
                break;
                
            case 'suggestions':
                visual.innerHTML = `
                    <div class="suggestions-demo">
                        <div class="suggestion-card">
                            <div class="suggestion-header">
                                <span class="suggestion-icon">🤖</span>
                                <span class="suggestion-title">Automation Suggestion</span>
                            </div>
                            <div class="suggestion-body">
                                "I noticed you open Gmail every morning at 9 AM. Should I automate this?"
                            </div>
                            <div class="suggestion-actions">
                                <button class="demo-btn approve">✓ Yes</button>
                                <button class="demo-btn reject">✗ No</button>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'complete':
                visual.innerHTML = `
                    <div class="completion-demo">
                        <div class="success-animation">
                            <div class="success-icon">🎉</div>
                            <div class="success-text">Automation Active!</div>
                        </div>
                        <div class="automation-list">
                            <div class="auto-item active">
                                <span class="auto-icon">📧</span>
                                <span class="auto-text">Auto-open Gmail at 9 AM</span>
                                <span class="auto-status">✅</span>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }
    }

    executeStepAction() {
        const step = this.steps[this.currentStep];
        
        switch (step.action) {
            case 'enable_learning':
                // Actually enable learning mode
                if (window.behavioralEngine) {
                    window.behavioralEngine.enableLearning();
                }
                break;
                
            case 'observe':
                // Show dashboard toggle hint
                this.showDashboardHint();
                break;
                
            case 'suggestions':
                // Create a demo suggestion
                this.createDemoSuggestion();
                break;
        }
    }

    showDashboardHint() {
        const dashboardToggle = document.getElementById('dashboard-toggle');
        if (dashboardToggle) {
            dashboardToggle.style.animation = 'pulse 2s infinite';
            
            // Create hint tooltip
            const hint = document.createElement('div');
            hint.className = 'dashboard-hint';
            hint.innerHTML = '👆 Click here to view your learning progress';
            hint.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 10002;
                animation: fadeInOut 3s ease-in-out;
            `;
            
            document.body.appendChild(hint);
            
            setTimeout(() => {
                hint.remove();
                dashboardToggle.style.animation = '';
            }, 3000);
        }
    }

    createDemoSuggestion() {
        // This would integrate with the actual suggestion system
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Demo Suggestion',
                message: 'This is how I\'ll suggest automations based on your patterns!',
                type: 'info',
                duration: 5000
            });
        }
    }

    completeGuide() {
        this.hideGuide();
        
        // Show completion message
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Setup Complete! 🎉',
                message: 'I\'m now learning your patterns. Check the dashboard to see progress.',
                type: 'success',
                duration: 5000
            });
        }
        
        // Enable all systems
        this.enableAllSystems();
    }

    skipGuide() {
        this.hideGuide();
        this.enableAllSystems();
    }

    enableAllSystems() {
        // Enable behavioral learning
        if (window.behavioralEngine) {
            window.behavioralEngine.enableLearning();
        }
        
        // Activate automation core
        if (window.automationCore) {
            window.automationCore.isActive = true;
        }
        
        // Mark as configured
        localStorage.setItem('systemConfigured', 'true');
    }

    // Public method to restart guide
    restartGuide() {
        this.currentStep = 0;
        localStorage.removeItem('hasSeenQuickStart');
        this.updateGuideContent();
        this.showGuide();
    }
}

// Add CSS for the guide
const guideStyles = `
<style>
.guide-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.guide-overlay.hidden {
    display: none;
}

.guide-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
}

.guide-container {
    position: relative;
    width: 500px;
    max-width: 90vw;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(25px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideInUp 0.5s ease;
}

.guide-header {
    padding: 20px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.guide-progress {
    flex: 1;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    transition: width 0.3s ease;
}

.step-counter {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
}

.guide-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-left: 15px;
}

.guide-content {
    padding: 30px;
    text-align: center;
}

.guide-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.guide-title {
    color: white;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 15px;
}

.guide-description {
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 25px;
}

.guide-visual {
    margin-bottom: 25px;
}

.automation-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.preview-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-icon {
    font-size: 20px;
}

.preview-text {
    color: white;
    font-weight: 500;
}

.guide-actions {
    padding: 20px 30px 30px;
    display: flex;
    gap: 15px;
    justify-content: center;
}

.guide-btn {
    padding: 12px 24px;
    border-radius: 10px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.guide-btn.primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.guide-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.guide-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.learning-toggle-demo, .observation-demo, .suggestions-demo, .completion-demo {
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    color: white;
}

.switch-demo {
    width: 50px;
    height: 25px;
    background: #4ade80;
    border-radius: 25px;
    position: relative;
}

.switch-slider {
    width: 21px;
    height: 21px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    right: 2px;
    transition: all 0.3s ease;
}

.demo-status {
    color: #4ade80;
    font-size: 14px;
    font-weight: 500;
}

.activity-tracker {
    margin-bottom: 15px;
}

.activity-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 14px;
}

.activity-time {
    color: rgba(255, 255, 255, 0.6);
}

.learning-indicator {
    color: #667eea;
    font-weight: 500;
    text-align: center;
}

.suggestion-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.suggestion-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.suggestion-title {
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.suggestion-body {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    margin-bottom: 12px;
}

.suggestion-actions {
    display: flex;
    gap: 8px;
}

.demo-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    font-size: 11px;
    cursor: pointer;
}

.demo-btn.approve {
    background: #4ade80;
    color: white;
}

.demo-btn.reject {
    background: #f87171;
    color: white;
}

.success-animation {
    text-align: center;
    margin-bottom: 20px;
}

.success-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.success-text {
    color: #4ade80;
    font-size: 18px;
    font-weight: 600;
}

.auto-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(74, 222, 128, 0.3);
}

.auto-text {
    flex: 1;
    color: white;
    font-size: 14px;
}

.auto-status {
    color: #4ade80;
}

@keyframes fadeInOut {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', guideStyles);

// Initialize and expose globally
window.QuickStartGuide = QuickStartGuide;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.quickStartGuide = new QuickStartGuide();
    });
} else {
    window.quickStartGuide = new QuickStartGuide();
}