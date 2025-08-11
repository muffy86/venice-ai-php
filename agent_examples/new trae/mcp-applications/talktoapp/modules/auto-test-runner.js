/**
 * Auto Test Runner - Automatically runs tests and reports results
 */

class AutoTestRunner {
    constructor() {
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.autoRunEnabled = true;
        this.init();
    }

    init() {
        this.waitForModules();
        this.createStatusIndicator();
    }

    waitForModules() {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkModules = () => {
            attempts++;
            const requiredModules = [
                'aiSuggestions', 'smartNotifications', 'dashboard', 
                'automationCore', 'behavioralEngine', 'systemTester'
            ];
            
            const loadedModules = requiredModules.filter(module => window[module]);
            
            if (loadedModules.length === requiredModules.length) {
                console.log('✅ All modules loaded, starting auto-tests...');
                setTimeout(() => this.runAutoTests(), 1000);
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Waiting for modules... ${loadedModules.length}/${requiredModules.length} loaded`);
                setTimeout(checkModules, 200);
            } else {
                console.error('❌ Timeout waiting for modules');
                this.showError('Module loading timeout');
            }
        };
        
        checkModules();
    }

    async runAutoTests() {
        console.log('🚀 Starting automated system verification...');
        
        // Test 1: Module Initialization
        await this.testModuleInitialization();
        
        // Test 2: AI Suggestions
        await this.testAISuggestions();
        
        // Test 3: Notifications
        await this.testNotifications();
        
        // Test 4: Dashboard
        await this.testDashboard();
        
        // Test 5: User Interface
        await this.testUserInterface();
        
        // Show final results
        this.showFinalResults();
    }

    async testModuleInitialization() {
        console.log('📦 Testing module initialization...');
        
        const modules = {
            'AI Suggestions': window.aiSuggestions,
            'Smart Notifications': window.smartNotifications,
            'Dashboard': window.dashboard,
            'Automation Core': window.automationCore,
            'Behavioral Engine': window.behavioralEngine,
            'System Tester': window.systemTester
        };
        
        for (const [name, module] of Object.entries(modules)) {
            if (module && typeof module === 'object') {
                console.log(`✅ ${name} - Loaded`);
                this.testsPassed++;
            } else {
                console.error(`❌ ${name} - Failed to load`);
                this.testsFailed++;
            }
        }
    }

    async testAISuggestions() {
        console.log('🤖 Testing AI Suggestions...');
        
        try {
            // Test suggestion generation
            const suggestions = await window.aiSuggestions.generatePersonalizedSuggestions();
            if (Array.isArray(suggestions) && suggestions.length > 0) {
                console.log(`✅ AI Suggestions - Generated ${suggestions.length} suggestions`);
                this.testsPassed++;
            } else {
                console.error('❌ AI Suggestions - No suggestions generated');
                this.testsFailed++;
            }
            
            // Test banner display
            const banner = document.getElementById('main-banner');
            if (banner) {
                console.log('✅ AI Suggestions - Banner element exists');
                this.testsPassed++;
                
                // Trigger a test suggestion
                window.aiSuggestions.showNextSuggestion();
                console.log('✅ AI Suggestions - Test suggestion displayed');
                this.testsPassed++;
            } else {
                console.error('❌ AI Suggestions - Banner element missing');
                this.testsFailed++;
            }
            
        } catch (error) {
            console.error('❌ AI Suggestions - Error:', error.message);
            this.testsFailed++;
        }
    }

    async testNotifications() {
        console.log('🔔 Testing Notifications...');
        
        try {
            // Test notification container
            const container = document.getElementById('notification-container');
            if (container) {
                console.log('✅ Notifications - Container exists');
                this.testsPassed++;
            } else {
                console.error('❌ Notifications - Container missing');
                this.testsFailed++;
            }
            
            // Test notification display
            window.smartNotifications.show({
                title: 'Auto Test',
                message: 'Notification system working!',
                type: 'success',
                duration: 2000
            });
            console.log('✅ Notifications - Test notification sent');
            this.testsPassed++;
            
        } catch (error) {
            console.error('❌ Notifications - Error:', error.message);
            this.testsFailed++;
        }
    }

    async testDashboard() {
        console.log('📊 Testing Dashboard...');
        
        try {
            // Test dashboard toggle
            const toggle = document.getElementById('dashboard-toggle');
            if (toggle) {
                console.log('✅ Dashboard - Toggle button exists');
                this.testsPassed++;
            } else {
                console.error('❌ Dashboard - Toggle button missing');
                this.testsFailed++;
            }
            
            // Test dashboard container
            const container = document.getElementById('intelligent-dashboard');
            if (container) {
                console.log('✅ Dashboard - Container exists');
                this.testsPassed++;
            } else {
                console.error('❌ Dashboard - Container missing');
                this.testsFailed++;
            }
            
        } catch (error) {
            console.error('❌ Dashboard - Error:', error.message);
            this.testsFailed++;
        }
    }

    async testUserInterface() {
        console.log('🎨 Testing User Interface...');
        
        try {
            // Test main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                console.log('✅ UI - Main container exists');
                this.testsPassed++;
            } else {
                console.error('❌ UI - Main container missing');
                this.testsFailed++;
            }
            
            // Test glass panels
            const glassPanels = document.querySelectorAll('.glass-panel');
            if (glassPanels.length > 0) {
                console.log(`✅ UI - ${glassPanels.length} glass panels found`);
                this.testsPassed++;
            } else {
                console.error('❌ UI - No glass panels found');
                this.testsFailed++;
            }
            
            // Test particles
            const particles = document.querySelector('.particles');
            if (particles) {
                console.log('✅ UI - Particle system exists');
                this.testsPassed++;
            } else {
                console.log('⚠️ UI - Particle system not found (optional)');
            }
            
        } catch (error) {
            console.error('❌ UI - Error:', error.message);
            this.testsFailed++;
        }
    }

    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'test-status-indicator';
        indicator.innerHTML = '🧪 Testing...';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 30000;
            font-family: monospace;
            border: 1px solid #333;
        `;
        document.body.appendChild(indicator);
    }

    updateStatusIndicator(message, color = 'white') {
        const indicator = document.getElementById('test-status-indicator');
        if (indicator) {
            indicator.innerHTML = message;
            indicator.style.color = color;
        }
    }

    showFinalResults() {
        const total = this.testsPassed + this.testsFailed;
        const percentage = Math.round((this.testsPassed / total) * 100);
        
        console.log('\n🎯 FINAL TEST RESULTS:');
        console.log(`✅ Passed: ${this.testsPassed}`);
        console.log(`❌ Failed: ${this.testsFailed}`);
        console.log(`📊 Success Rate: ${percentage}%`);
        
        if (this.testsFailed === 0) {
            console.log('🎉 ALL TESTS PASSED! System is working perfectly!');
            this.updateStatusIndicator('🎉 All Tests Passed!', '#4CAF50');
            
            // Show success notification
            setTimeout(() => {
                window.smartNotifications?.show({
                    title: '🎉 System Verified!',
                    message: `All ${this.testsPassed} tests passed successfully!`,
                    type: 'success',
                    duration: 5000
                });
            }, 1000);
            
        } else {
            console.log(`⚠️ ${this.testsFailed} tests failed. Check console for details.`);
            this.updateStatusIndicator(`⚠️ ${this.testsFailed} Failed`, '#f44336');
            
            // Show warning notification
            setTimeout(() => {
                window.smartNotifications?.show({
                    title: '⚠️ Tests Failed',
                    message: `${this.testsFailed} out of ${total} tests failed`,
                    type: 'warning',
                    duration: 5000
                });
            }, 1000);
        }
        
        // Auto-hide status after 10 seconds
        setTimeout(() => {
            const indicator = document.getElementById('test-status-indicator');
            if (indicator) {
                indicator.style.opacity = '0.3';
            }
        }, 10000);
    }

    showError(message) {
        console.error('❌ Auto Test Error:', message);
        this.updateStatusIndicator('❌ Test Error', '#f44336');
    }

    // Manual test trigger
    runManualTest() {
        this.testsPassed = 0;
        this.testsFailed = 0;
        this.updateStatusIndicator('🧪 Testing...', 'white');
        this.runAutoTests();
    }
}

// Initialize immediately
window.AutoTestRunner = AutoTestRunner;
window.autoTestRunner = new AutoTestRunner();

// Add manual trigger
console.log('🧪 Auto Test Runner loaded! Run window.autoTestRunner.runManualTest() to test manually');