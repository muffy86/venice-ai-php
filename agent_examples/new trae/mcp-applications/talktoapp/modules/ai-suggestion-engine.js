/**
 * AI Suggestion Engine
 * Floating AI-guided task suggestions tailored to user
 */

class AISuggestionEngine {
    constructor() {
        this.suggestions = [];
        this.activeBanners = new Set();
        this.userProfile = {};
        this.categories = ['productivity', 'health', 'learning', 'finance', 'social', 'creative', 'wellness', 'coding', 'career', 'business', 'tech', 'design', 'marketing'];
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.createSuggestionContainer();
        this.startSuggestionCycle();
        this.setupPersonalization();
    }

    createSuggestionContainer() {
        const container = document.createElement('div');
        container.id = 'ai-suggestions-container';
        container.innerHTML = `
            <div class="suggestion-banner" id="main-banner">
                <div class="banner-content">
                    <div class="ai-avatar">🤖</div>
                    <div class="suggestion-text">
                        <div class="suggestion-title">AI Assistant</div>
                        <div class="suggestion-message">Analyzing your patterns...</div>
                    </div>
                    <div class="suggestion-actions">
                        <button class="accept-btn">✓</button>
                        <button class="dismiss-btn">✗</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        this.injectStyles();
    }

    async generatePersonalizedSuggestions() {
        const context = window.contextualIntelligence?.getCurrentContext() || {};
        const patterns = window.behavioralEngine?.getInsights() || {};
        
        const suggestions = [];
        
        // Time-based suggestions
        if (context.time?.period === 'morning') {
            suggestions.push(...this.getMorningSuggestions());
        } else if (context.time?.period === 'evening') {
            suggestions.push(...this.getEveningSuggestions());
        }
        
        // Pattern-based suggestions
        if (patterns.topActivities) {
            suggestions.push(...this.getActivitySuggestions(patterns.topActivities));
        }
        
        // Life category suggestions
        for (const category of this.categories) {
            suggestions.push(...await this.getCategorySuggestions(category));
        }
        
        return this.prioritizeSuggestions(suggestions);
    }

    getMorningSuggestions() {
        return [
            {
                category: 'productivity',
                title: 'Morning Boost',
                message: 'Start your day by reviewing your top 3 priorities',
                action: 'create_daily_plan',
                icon: '🌅',
                priority: 0.9
            },
            {
                category: 'health',
                title: 'Hydration Reminder',
                message: 'Drink a glass of water to kickstart your metabolism',
                action: 'set_hydration_reminder',
                icon: '💧',
                priority: 0.8
            },
            {
                category: 'wellness',
                title: 'Mindful Moment',
                message: 'Take 5 minutes for morning meditation',
                action: 'start_meditation',
                icon: '🧘',
                priority: 0.7
            }
        ];
    }

    getEveningSuggestions() {
        return [
            {
                category: 'wellness',
                title: 'Wind Down',
                message: 'Reflect on today\'s accomplishments',
                action: 'daily_reflection',
                icon: '🌙',
                priority: 0.8
            },
            {
                category: 'learning',
                title: 'Evening Learning',
                message: 'Spend 15 minutes learning something new',
                action: 'suggest_learning_content',
                icon: '📚',
                priority: 0.7
            }
        ];
    }

    getActivitySuggestions(topActivities) {
        const suggestions = [];
        
        if (!topActivities || !Array.isArray(topActivities)) {
            return suggestions;
        }
        
        for (const activity of topActivities) {
            switch (activity.type) {
                case 'coding':
                    suggestions.push({
                        category: 'productivity',
                        title: 'Code Optimization',
                        message: `Optimize your ${activity.language || 'code'} for better performance`,
                        action: 'optimize_code',
                        icon: '⚡',
                        priority: 0.8
                    });
                    break;
                case 'browsing':
                    suggestions.push({
                        category: 'productivity',
                        title: 'Research Focus',
                        message: 'Organize your browser tabs and bookmarks',
                        action: 'organize_tabs',
                        icon: '🔖',
                        priority: 0.6
                    });
                    break;
                case 'communication':
                    suggestions.push({
                        category: 'social',
                        title: 'Message Automation',
                        message: 'Set up templates for common responses',
                        action: 'create_templates',
                        icon: '💬',
                        priority: 0.7
                    });
                    break;
                default:
                    suggestions.push({
                        category: 'productivity',
                        title: 'Activity Optimization',
                        message: `Improve your ${activity.type} workflow`,
                        action: 'optimize_workflow',
                        icon: '🔧',
                        priority: 0.5
                    });
            }
        }
        
        return suggestions;
    }

    async getCategorySuggestions(category) {
        const suggestions = {
            productivity: [
                { title: 'Task Automation', message: 'Automate your repetitive email responses', action: 'create_email_automation', icon: '⚡' },
                { title: 'Focus Time', message: 'Block 2 hours for deep work', action: 'schedule_focus_time', icon: '🎯' },
                { title: 'Inbox Zero', message: 'Clear your inbox in 15 minutes', action: 'organize_inbox', icon: '📧' }
            ],
            health: [
                { title: 'Movement Break', message: 'Take a 5-minute walk', action: 'movement_reminder', icon: '🚶' },
                { title: 'Posture Check', message: 'Adjust your sitting posture', action: 'posture_reminder', icon: '🪑' },
                { title: 'Eye Rest', message: 'Look away from screen for 20 seconds', action: 'eye_break', icon: '👁️' }
            ],
            learning: [
                { title: 'Skill Building', message: 'Practice a new skill for 10 minutes', action: 'skill_practice', icon: '🎓' },
                { title: 'Knowledge Expansion', message: 'Read an article in your field', action: 'suggest_article', icon: '📖' },
                { title: 'Language Practice', message: 'Learn 5 new words today', action: 'language_lesson', icon: '🗣️' }
            ],
            finance: [
                { title: 'Expense Tracking', message: 'Log today\'s expenses', action: 'track_expenses', icon: '💰' },
                { title: 'Investment Check', message: 'Review your portfolio performance', action: 'check_investments', icon: '📈' },
                { title: 'Budget Review', message: 'Check your monthly budget status', action: 'budget_review', icon: '📊' }
            ],
            social: [
                { title: 'Connect', message: 'Reach out to a friend you haven\'t talked to', action: 'social_outreach', icon: '👥' },
                { title: 'Gratitude', message: 'Send a thank you message to someone', action: 'gratitude_message', icon: '🙏' },
                { title: 'Network', message: 'Connect with someone new in your field', action: 'professional_networking', icon: '🤝' }
            ],
            creative: [
                { title: 'Creative Break', message: 'Spend 10 minutes on a creative project', action: 'creative_time', icon: '🎨' },
                { title: 'Inspiration', message: 'Explore new creative ideas online', action: 'find_inspiration', icon: '💡' },
                { title: 'Document Ideas', message: 'Write down 3 new ideas', action: 'idea_capture', icon: '📝' }
            ],
            wellness: [
                { title: 'Breathing Exercise', message: 'Take 10 deep breaths', action: 'breathing_exercise', icon: '🫁' },
                { title: 'Gratitude Practice', message: 'List 3 things you\'re grateful for', action: 'gratitude_practice', icon: '✨' },
                { title: 'Stress Check', message: 'Rate your stress level and get tips', action: 'stress_assessment', icon: '😌' }
            ],
            coding: [
                { title: 'Code Review', message: 'Review and refactor 50 lines of old code', action: 'code_review', icon: '🔍' },
                { title: 'Algorithm Practice', message: 'Solve a coding challenge on LeetCode', action: 'algorithm_practice', icon: '🧩' },
                { title: 'Documentation', message: 'Document that function you wrote yesterday', action: 'write_documentation', icon: '📝' },
                { title: 'Git Cleanup', message: 'Clean up your git branches and commits', action: 'git_cleanup', icon: '🌿' },
                { title: 'Code Optimization', message: 'Optimize a slow function for better performance', action: 'optimize_code', icon: '⚡' },
                { title: 'Unit Tests', message: 'Write tests for your recent code changes', action: 'write_tests', icon: '🧪' },
                { title: 'Debug Session', message: 'Fix that bug you\'ve been putting off', action: 'debug_code', icon: '🐛' },
                { title: 'Learn New Tech', message: 'Explore a new programming language or framework', action: 'learn_technology', icon: '🚀' }
            ],
            career: [
                { title: 'Skill Assessment', message: 'Evaluate your current skill gaps', action: 'skill_assessment', icon: '📊' },
                { title: 'LinkedIn Update', message: 'Update your LinkedIn profile with recent achievements', action: 'update_linkedin', icon: '💼' },
                { title: 'Portfolio Review', message: 'Add your latest project to your portfolio', action: 'update_portfolio', icon: '🎯' },
                { title: 'Industry News', message: 'Read about trends in your industry', action: 'industry_research', icon: '📰' },
                { title: 'Mentor Connect', message: 'Reach out to a mentor or industry expert', action: 'mentor_outreach', icon: '🎓' },
                { title: 'Resume Update', message: 'Refresh your resume with recent accomplishments', action: 'update_resume', icon: '📄' }
            ],
            business: [
                { title: 'Market Research', message: 'Analyze your competitors\' latest moves', action: 'market_research', icon: '🔬' },
                { title: 'Client Follow-up', message: 'Check in with your top 3 clients', action: 'client_followup', icon: '📞' },
                { title: 'Process Optimization', message: 'Identify one workflow you can automate', action: 'process_optimization', icon: '⚙️' },
                { title: 'Revenue Analysis', message: 'Review this month\'s revenue metrics', action: 'revenue_analysis', icon: '💹' },
                { title: 'Team Check-in', message: 'Schedule 1-on-1s with your team members', action: 'team_checkin', icon: '👥' },
                { title: 'Strategic Planning', message: 'Review and adjust quarterly goals', action: 'strategic_planning', icon: '🎯' }
            ],
            tech: [
                { title: 'System Update', message: 'Update your development environment', action: 'system_update', icon: '🔄' },
                { title: 'Backup Check', message: 'Verify your code and data backups', action: 'backup_check', icon: '💾' },
                { title: 'Security Audit', message: 'Review security practices in your projects', action: 'security_audit', icon: '🔒' },
                { title: 'Performance Monitor', message: 'Check your application\'s performance metrics', action: 'performance_check', icon: '📈' },
                { title: 'Tool Exploration', message: 'Try a new development tool or IDE extension', action: 'explore_tools', icon: '🛠️' },
                { title: 'API Documentation', message: 'Review and update your API documentation', action: 'api_docs', icon: '📚' }
            ],
            design: [
                { title: 'UI Review', message: 'Analyze user interface of a competitor', action: 'ui_analysis', icon: '🎨' },
                { title: 'Color Palette', message: 'Create a new color scheme for your project', action: 'color_palette', icon: '🌈' },
                { title: 'Typography Study', message: 'Experiment with new font combinations', action: 'typography_study', icon: '✍️' },
                { title: 'User Experience', message: 'Map out user journey for a feature', action: 'ux_mapping', icon: '🗺️' },
                { title: 'Design Inspiration', message: 'Browse Dribbble or Behance for inspiration', action: 'design_inspiration', icon: '💡' },
                { title: 'Prototype Review', message: 'Test and refine your latest prototype', action: 'prototype_review', icon: '🔧' }
            ],
            marketing: [
                { title: 'Content Calendar', message: 'Plan next week\'s social media content', action: 'content_planning', icon: '📅' },
                { title: 'Analytics Review', message: 'Analyze your website traffic patterns', action: 'analytics_review', icon: '📊' },
                { title: 'SEO Optimization', message: 'Optimize one page for better search ranking', action: 'seo_optimization', icon: '🔍' },
                { title: 'Email Campaign', message: 'Draft your next newsletter or email campaign', action: 'email_campaign', icon: '📧' },
                { title: 'Brand Consistency', message: 'Audit brand consistency across platforms', action: 'brand_audit', icon: '🎭' },
                { title: 'Competitor Analysis', message: 'Study a competitor\'s marketing strategy', action: 'competitor_analysis', icon: '🕵️' }
            ]
        };

        return (suggestions[category] || []).map(s => ({
            ...s,
            category,
            priority: Math.random() * 0.6 + 0.4
        }));
    }

    prioritizeSuggestions(suggestions) {
        return suggestions
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 12); // Keep top 12 suggestions
    }

    startSuggestionCycle() {
        this.showNextSuggestion();
        
        // Rotate suggestions every 8 seconds
        setInterval(() => {
            this.showNextSuggestion();
        }, 8000);
        
        // Generate new suggestions every 5 minutes
        setInterval(async () => {
            this.suggestions = await this.generatePersonalizedSuggestions();
        }, 300000);
    }

    async showNextSuggestion() {
        if (this.suggestions.length === 0) {
            this.suggestions = await this.generatePersonalizedSuggestions();
        }
        
        const suggestion = this.suggestions.shift();
        if (suggestion) {
            this.displayFloatingSuggestion(suggestion);
        }
    }

    displayFloatingSuggestion(suggestion) {
        const banner = document.getElementById('main-banner');
        const content = banner.querySelector('.banner-content');
        
        // Update content
        content.querySelector('.ai-avatar').textContent = suggestion.icon;
        content.querySelector('.suggestion-title').textContent = suggestion.title;
        content.querySelector('.suggestion-message').textContent = suggestion.message;
        
        // Add category class
        banner.className = `suggestion-banner ${suggestion.category}`;
        
        // Animate in
        banner.classList.add('slide-in');
        
        // Setup action handlers
        this.setupSuggestionActions(banner, suggestion);
        
        // Auto-hide after 7 seconds
        setTimeout(() => {
            banner.classList.remove('slide-in');
        }, 7000);
    }

    setupSuggestionActions(banner, suggestion) {
        const acceptBtn = banner.querySelector('.accept-btn');
        const dismissBtn = banner.querySelector('.dismiss-btn');
        
        acceptBtn.onclick = () => {
            this.acceptSuggestion(suggestion);
            banner.classList.remove('slide-in');
        };
        
        dismissBtn.onclick = () => {
            this.dismissSuggestion(suggestion);
            banner.classList.remove('slide-in');
        };
    }

    async acceptSuggestion(suggestion) {
        // Execute the suggested action
        await this.executeSuggestionAction(suggestion);
        
        // Track acceptance for personalization
        this.trackSuggestionFeedback(suggestion, 'accepted');
        
        // Show success feedback
        this.showFeedback('✅ Great choice! Action initiated.', 'success');
    }

    dismissSuggestion(suggestion) {
        // Track dismissal for personalization
        this.trackSuggestionFeedback(suggestion, 'dismissed');
        
        // Reduce priority for similar suggestions
        this.adjustSuggestionWeights(suggestion.category, -0.1);
    }

    async executeSuggestionAction(suggestion) {
        switch (suggestion.action) {
            case 'create_daily_plan':
                this.openPlanningInterface();
                break;
            case 'set_hydration_reminder':
                this.createHydrationReminder();
                break;
            case 'start_meditation':
                this.launchMeditationApp();
                break;
            case 'create_email_automation':
                this.openAutomationBuilder('email');
                break;
            case 'schedule_focus_time':
                this.blockCalendarTime(2, 'Deep Work');
                break;
            case 'movement_reminder':
                this.setMovementReminder();
                break;
            case 'skill_practice':
                this.suggestSkillPractice();
                break;
            case 'track_expenses':
                this.openExpenseTracker();
                break;
            case 'social_outreach':
                this.suggestSocialContact();
                break;
            case 'creative_time':
                this.openCreativeTools();
                break;
            case 'breathing_exercise':
                this.startBreathingExercise();
                break;
            case 'code_review':
                this.openCodeReview();
                break;
            case 'algorithm_practice':
                this.openAlgorithmPractice();
                break;
            case 'write_documentation':
                this.openDocumentationEditor();
                break;
            case 'git_cleanup':
                this.startGitCleanup();
                break;
            case 'optimize_code':
                this.openCodeOptimizer();
                break;
            case 'write_tests':
                this.openTestEditor();
                break;
            case 'debug_code':
                this.startDebuggingSession();
                break;
            case 'learn_technology':
                this.suggestTechLearning();
                break;
            case 'skill_assessment':
                this.openSkillAssessment();
                break;
            case 'update_linkedin':
                this.openLinkedInUpdate();
                break;
            case 'update_portfolio':
                this.openPortfolioEditor();
                break;
            case 'market_research':
                this.startMarketResearch();
                break;
            case 'client_followup':
                this.openClientManager();
                break;
            case 'system_update':
                this.checkSystemUpdates();
                break;
            case 'security_audit':
                this.startSecurityAudit();
                break;
            case 'ui_analysis':
                this.openUIAnalyzer();
                break;
            case 'content_planning':
                this.openContentCalendar();
                break;
            case 'analytics_review':
                this.openAnalyticsDashboard();
                break;
            default:
                this.showGenericAction(suggestion);
        }
    }

    // Quick action implementations
    openPlanningInterface() {
        if (window.smartNotifications) {
            window.smartNotifications.show({
                title: 'Daily Planning',
                message: 'What are your top 3 priorities today?',
                actions: [
                    { id: 'open_planner', text: 'Open Planner', handler: () => console.log('Opening planner...') }
                ]
            });
        }
    }

    createHydrationReminder() {
        const reminder = setInterval(() => {
            this.showFeedback('💧 Time to hydrate! Drink some water.', 'info');
        }, 3600000); // Every hour
        
        this.showFeedback('💧 Hydration reminders set for every hour!', 'success');
    }

    startBreathingExercise() {
        let count = 0;
        const exercise = setInterval(() => {
            if (count < 10) {
                this.showFeedback(count % 2 === 0 ? '🫁 Breathe in...' : '🫁 Breathe out...', 'info');
                count++;
            } else {
                clearInterval(exercise);
                this.showFeedback('✨ Breathing exercise complete! Feel refreshed?', 'success');
            }
        }, 3000);
    }

    // Programming and work action implementations
    openCodeReview() {
        this.showFeedback('🔍 Opening code review interface...', 'info');
        window.open('https://github.com', '_blank');
    }

    openAlgorithmPractice() {
        const platforms = ['https://leetcode.com', 'https://hackerrank.com', 'https://codewars.com'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        this.showFeedback('🧩 Time to sharpen your algorithms!', 'success');
        window.open(platform, '_blank');
    }

    openDocumentationEditor() {
        this.showFeedback('📝 Remember: Good code tells you what, great comments tell you why!', 'info');
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Documentation Helper',
                message: 'Which function needs documentation?',
                actions: [
                    { text: 'Recent Function', action: () => this.documentRecentCode() },
                    { text: 'Complex Logic', action: () => this.documentComplexCode() }
                ]
            });
        }
    }

    startGitCleanup() {
        this.showFeedback('🌿 Git cleanup suggestions:', 'info');
        setTimeout(() => {
            this.showFeedback('• Delete merged branches\n• Squash related commits\n• Update commit messages', 'info');
        }, 1000);
    }

    openCodeOptimizer() {
        this.showFeedback('⚡ Code optimization checklist:', 'info');
        setTimeout(() => {
            this.showFeedback('• Remove unused variables\n• Optimize loops\n• Cache expensive operations', 'success');
        }, 1500);
    }

    openTestEditor() {
        this.showFeedback('🧪 Testing is not about finding bugs, it\'s about preventing them!', 'info');
        if (window.TalkToApp?.ui) {
            window.TalkToApp.ui.showNotification({
                title: 'Test Generator',
                message: 'What type of tests do you need?',
                actions: [
                    { text: 'Unit Tests', action: () => this.generateUnitTests() },
                    { text: 'Integration Tests', action: () => this.generateIntegrationTests() }
                ]
            });
        }
    }

    startDebuggingSession() {
        this.showFeedback('🐛 Debugging tips:', 'info');
        setTimeout(() => {
            this.showFeedback('• Reproduce the bug consistently\n• Use console.log strategically\n• Check edge cases', 'info');
        }, 1000);
    }

    suggestTechLearning() {
        const technologies = [
            { name: 'React Hooks', url: 'https://reactjs.org/docs/hooks-intro.html' },
            { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/' },
            { name: 'Node.js', url: 'https://nodejs.org/en/docs/' },
            { name: 'Python', url: 'https://docs.python.org/3/' },
            { name: 'Docker', url: 'https://docs.docker.com/' },
            { name: 'Kubernetes', url: 'https://kubernetes.io/docs/' }
        ];
        const tech = technologies[Math.floor(Math.random() * technologies.length)];
        this.showFeedback(`🚀 Today's learning: ${tech.name}`, 'success');
        window.open(tech.url, '_blank');
    }

    openSkillAssessment() {
        this.showFeedback('📊 Skill assessment areas:', 'info');
        setTimeout(() => {
            this.showFeedback('• Technical skills\n• Soft skills\n• Industry knowledge\n• Tool proficiency', 'info');
        }, 1000);
    }

    openLinkedInUpdate() {
        this.showFeedback('💼 LinkedIn profile tips:', 'info');
        setTimeout(() => {
            this.showFeedback('• Update recent projects\n• Add new skills\n• Share achievements', 'success');
        }, 1000);
        window.open('https://linkedin.com', '_blank');
    }

    openPortfolioEditor() {
        this.showFeedback('🎯 Portfolio enhancement ideas:', 'info');
        setTimeout(() => {
            this.showFeedback('• Add latest project\n• Update screenshots\n• Improve descriptions', 'success');
        }, 1000);
    }

    startMarketResearch() {
        this.showFeedback('🔬 Market research checklist:', 'info');
        setTimeout(() => {
            this.showFeedback('• Competitor analysis\n• Industry trends\n• Customer feedback', 'info');
        }, 1000);
    }

    openClientManager() {
        this.showFeedback('📞 Client follow-up template:', 'info');
        setTimeout(() => {
            this.showFeedback('• Project status update\n• Next steps discussion\n• Feedback collection', 'success');
        }, 1000);
    }

    checkSystemUpdates() {
        this.showFeedback('🔄 System update checklist:', 'info');
        setTimeout(() => {
            this.showFeedback('• IDE updates\n• Package dependencies\n• Security patches', 'info');
        }, 1000);
    }

    startSecurityAudit() {
        this.showFeedback('🔒 Security audit points:', 'info');
        setTimeout(() => {
            this.showFeedback('• Input validation\n• Authentication checks\n• Data encryption', 'info');
        }, 1000);
    }

    openUIAnalyzer() {
        this.showFeedback('🎨 UI analysis framework:', 'info');
        setTimeout(() => {
            this.showFeedback('• User flow efficiency\n• Visual hierarchy\n• Accessibility compliance', 'success');
        }, 1000);
    }

    openContentCalendar() {
        this.showFeedback('📅 Content planning strategy:', 'info');
        setTimeout(() => {
            this.showFeedback('• Educational content\n• Behind-the-scenes\n• Industry insights', 'success');
        }, 1000);
    }

    openAnalyticsDashboard() {
        this.showFeedback('📊 Analytics focus areas:', 'info');
        setTimeout(() => {
            this.showFeedback('• Traffic sources\n• User behavior\n• Conversion rates', 'info');
        }, 1000);
        window.open('https://analytics.google.com', '_blank');
    }

    showFeedback(message, type) {
        if (window.smartNotifications) {
            window.smartNotifications.show({
                title: 'AI Assistant',
                message,
                type,
                duration: 3000
            });
        }
    }

    trackSuggestionFeedback(suggestion, feedback) {
        const profile = this.userProfile;
        if (!profile.suggestionFeedback) profile.suggestionFeedback = {};
        if (!profile.suggestionFeedback[suggestion.category]) {
            profile.suggestionFeedback[suggestion.category] = { accepted: 0, dismissed: 0 };
        }
        
        profile.suggestionFeedback[suggestion.category][feedback]++;
        this.saveUserProfile();
    }

    adjustSuggestionWeights(category, adjustment) {
        if (!this.userProfile.categoryWeights) this.userProfile.categoryWeights = {};
        this.userProfile.categoryWeights[category] = 
            (this.userProfile.categoryWeights[category] || 1) + adjustment;
        this.saveUserProfile();
    }

    setupPersonalization() {
        // Learn from user behavior
        document.addEventListener('click', (e) => {
            this.learnFromInteraction(e.target);
        });
        
        // Adapt to time patterns
        setInterval(() => {
            this.adaptToTimePatterns();
        }, 600000); // Every 10 minutes
    }

    learnFromInteraction(element) {
        // Analyze what user clicks on to improve suggestions
        const context = {
            element: element.tagName,
            class: element.className,
            text: element.textContent?.slice(0, 50),
            time: new Date().getHours()
        };
        
        this.updateUserProfile('interactions', context);
    }

    updateUserProfile(key, data) {
        if (!this.userProfile[key]) this.userProfile[key] = [];
        this.userProfile[key].push({ data, timestamp: Date.now() });
        
        // Keep only recent data
        if (this.userProfile[key].length > 100) {
            this.userProfile[key] = this.userProfile[key].slice(-100);
        }
        
        this.saveUserProfile();
    }

    saveUserProfile() {
        localStorage.setItem('aiSuggestionProfile', JSON.stringify(this.userProfile));
    }

    loadUserProfile() {
        const saved = localStorage.getItem('aiSuggestionProfile');
        this.userProfile = saved ? JSON.parse(saved) : {};
    }

    injectStyles() {
        const styles = `
            <style>
            #ai-suggestions-container {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 15000;
                pointer-events: none;
            }

            .suggestion-banner {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
                backdrop-filter: blur(20px);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
                padding: 16px;
                min-width: 320px;
                max-width: 400px;
                transform: translateX(450px);
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                animation: float 6s ease-in-out infinite;
            }

            .suggestion-banner.slide-in {
                transform: translateX(0);
            }

            .suggestion-banner.productivity {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(139, 195, 74, 0.95));
            }

            .suggestion-banner.health {
                background: linear-gradient(135deg, rgba(244, 67, 54, 0.95), rgba(233, 30, 99, 0.95));
            }

            .suggestion-banner.learning {
                background: linear-gradient(135deg, rgba(63, 81, 181, 0.95), rgba(103, 58, 183, 0.95));
            }

            .suggestion-banner.finance {
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 152, 0, 0.95));
            }

            .suggestion-banner.social {
                background: linear-gradient(135deg, rgba(156, 39, 176, 0.95), rgba(233, 30, 99, 0.95));
            }

            .suggestion-banner.creative {
                background: linear-gradient(135deg, rgba(255, 87, 34, 0.95), rgba(255, 193, 7, 0.95));
            }

            .suggestion-banner.wellness {
                background: linear-gradient(135deg, rgba(0, 150, 136, 0.95), rgba(76, 175, 80, 0.95));
            }

            .suggestion-banner.coding {
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(63, 81, 181, 0.95));
            }

            .suggestion-banner.career {
                background: linear-gradient(135deg, rgba(121, 85, 72, 0.95), rgba(141, 110, 99, 0.95));
            }

            .suggestion-banner.business {
                background: linear-gradient(135deg, rgba(96, 125, 139, 0.95), rgba(69, 90, 100, 0.95));
            }

            .suggestion-banner.tech {
                background: linear-gradient(135deg, rgba(158, 158, 158, 0.95), rgba(117, 117, 117, 0.95));
            }

            .suggestion-banner.design {
                background: linear-gradient(135deg, rgba(255, 87, 34, 0.95), rgba(255, 152, 0, 0.95));
            }

            .suggestion-banner.marketing {
                background: linear-gradient(135deg, rgba(233, 30, 99, 0.95), rgba(156, 39, 176, 0.95));
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: white;
            }

            .ai-avatar {
                font-size: 32px;
                animation: pulse 2s ease-in-out infinite;
            }

            .suggestion-text {
                flex: 1;
            }

            .suggestion-title {
                font-weight: 700;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .suggestion-message {
                font-size: 14px;
                opacity: 0.9;
                line-height: 1.4;
            }

            .suggestion-actions {
                display: flex;
                gap: 8px;
            }

            .accept-btn, .dismiss-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .accept-btn {
                background: rgba(76, 175, 80, 0.8);
                color: white;
            }

            .accept-btn:hover {
                background: rgba(76, 175, 80, 1);
                transform: scale(1.1);
            }

            .dismiss-btn {
                background: rgba(244, 67, 54, 0.8);
                color: white;
            }

            .dismiss-btn:hover {
                background: rgba(244, 67, 54, 1);
                transform: scale(1.1);
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px) translateX(0); }
                50% { transform: translateY(-10px) translateX(0); }
            }

            .suggestion-banner.slide-in {
                animation: float 6s ease-in-out infinite, slideIn 0.6s ease;
            }

            @keyframes slideIn {
                from { transform: translateX(450px) translateY(0); }
                to { transform: translateX(0) translateY(0); }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @media (max-width: 768px) {
                #ai-suggestions-container {
                    right: 10px;
                    top: 80px;
                }
                
                .suggestion-banner {
                    min-width: 280px;
                    max-width: calc(100vw - 40px);
                }
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Public API
    addCustomSuggestion(suggestion) {
        this.suggestions.unshift(suggestion);
    }

    pauseSuggestions() {
        document.getElementById('main-banner').style.display = 'none';
    }

    resumeSuggestions() {
        document.getElementById('main-banner').style.display = 'block';
    }

    getSuggestionStats() {
        return {
            totalSuggestions: this.suggestions.length,
            userProfile: this.userProfile,
            categories: this.categories
        };
    }
}

// Initialize and expose globally
window.AISuggestionEngine = AISuggestionEngine;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiSuggestions = new AISuggestionEngine();
    });
} else {
    window.aiSuggestions = new AISuggestionEngine();
}