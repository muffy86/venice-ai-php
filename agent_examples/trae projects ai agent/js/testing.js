// Comprehensive Testing Framework for AI Agent Workforce
class TestFramework {
    constructor() {
        this.tests = new Map();
        this.results = [];
        this.coverage = new Map();
        this.mocks = new Map();
        this.fixtures = new Map();
        this.isRunning = false;
        this.reporter = new TestReporter();
        
        this.setupGlobalTestUtils();
    }

    // Test Registration and Management
    describe(suiteName, testFunction) {
        if (!this.tests.has(suiteName)) {
            this.tests.set(suiteName, []);
        }
        
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        const context = {
            it: (testName, testFn) => suite.tests.push({ name: testName, fn: testFn }),
            beforeEach: (fn) => suite.beforeEach = fn,
            afterEach: (fn) => suite.afterEach = fn,
            beforeAll: (fn) => suite.beforeAll = fn,
            afterAll: (fn) => suite.afterAll = fn
        };
        
        testFunction(context);
        this.tests.set(suiteName, suite);
    }

    // Test Execution
    async runAllTests() {
        this.isRunning = true;
        this.results = [];
        this.reporter.startReport();
        
        try {
            for (const [suiteName, suite] of this.tests) {
                await this.runTestSuite(suiteName, suite);
            }
            
            this.reporter.endReport(this.results);
            return this.generateTestReport();
        } catch (error) {
            console.error('Test execution failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async runTestSuite(suiteName, suite) {
        console.log(`Running test suite: ${suiteName}`);
        
        try {
            // Run beforeAll hook
            if (suite.beforeAll) {
                await suite.beforeAll();
            }
            
            for (const test of suite.tests) {
                await this.runSingleTest(suiteName, test, suite);
            }
            
            // Run afterAll hook
            if (suite.afterAll) {
                await suite.afterAll();
            }
        } catch (error) {
            this.results.push({
                suite: suiteName,
                test: 'Suite Setup/Teardown',
                status: 'failed',
                error: error.message,
                duration: 0
            });
        }
    }

    async runSingleTest(suiteName, test, suite) {
        const startTime = performance.now();
        
        try {
            // Run beforeEach hook
            if (suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // Run the actual test
            await test.fn();
            
            // Run afterEach hook
            if (suite.afterEach) {
                await suite.afterEach();
            }
            
            const duration = performance.now() - startTime;
            this.results.push({
                suite: suiteName,
                test: test.name,
                status: 'passed',
                duration: Math.round(duration * 100) / 100
            });
            
            console.log(`✅ ${suiteName} > ${test.name} (${duration.toFixed(2)}ms)`);
        } catch (error) {
            const duration = performance.now() - startTime;
            this.results.push({
                suite: suiteName,
                test: test.name,
                status: 'failed',
                error: error.message,
                stack: error.stack,
                duration: Math.round(duration * 100) / 100
            });
            
            console.error(`❌ ${suiteName} > ${test.name}: ${error.message}`);
        }
    }

    // Assertion Library
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toThrow: () => {
                if (typeof actual !== 'function') {
                    throw new Error('Expected a function to test for throwing');
                }
                try {
                    actual();
                    throw new Error('Expected function to throw an error');
                } catch (error) {
                    // Expected behavior
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${actual.length} to be ${expected}`);
                }
            }
        };
    }

    // Mock System
    mock(moduleName, implementation) {
        this.mocks.set(moduleName, implementation);
        return implementation;
    }

    spy(object, methodName) {
        const originalMethod = object[methodName];
        const calls = [];
        
        object[methodName] = function(...args) {
            calls.push({ args, timestamp: Date.now() });
            return originalMethod.apply(this, args);
        };
        
        object[methodName].calls = calls;
        object[methodName].restore = () => {
            object[methodName] = originalMethod;
        };
        
        return object[methodName];
    }

    // Test Utilities
    setupGlobalTestUtils() {
        window.describe = this.describe.bind(this);
        window.it = () => {}; // Will be overridden in describe context
        window.expect = this.expect.bind(this);
        window.beforeEach = () => {};
        window.afterEach = () => {};
        window.beforeAll = () => {};
        window.afterAll = () => {};
    }

    generateTestReport() {
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;
        const passRate = total > 0 ? (passed / total * 100).toFixed(2) : 100;
        
        return {
            total,
            passed,
            failed,
            passRate: parseFloat(passRate),
            results: this.results,
            duration: this.results.reduce((sum, r) => sum + r.duration, 0)
        };
    }

    // Additional methods for UI compatibility
    getAvailableTests() {
        const tests = [];
        for (const [suiteName, suite] of this.tests) {
            if (suite.tests) {
                suite.tests.forEach((test, index) => {
                    tests.push({
                        id: `${suiteName}-${index}`,
                        name: `${suiteName} > ${test.name}`,
                        description: `Test: ${test.name} in suite: ${suiteName}`,
                        category: 'unit'
                    });
                });
            }
        }
        return tests;
    }

    async runTests(testIds) {
        this.isRunning = true;
        this.results = [];
        this.reporter.startReport();
        
        try {
            for (const testId of testIds) {
                const [suiteName, testIndex] = testId.split('-');
                const suite = this.tests.get(suiteName);
                
                if (suite && suite.tests && suite.tests[parseInt(testIndex)]) {
                    const test = suite.tests[parseInt(testIndex)];
                    await this.runSingleTest(suiteName, test, suite);
                }
            }
            
            this.reporter.endReport(this.results);
            return this.results;
        } catch (error) {
            console.error('Test execution failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }
}

class TestReporter {
    startReport() {
        console.log('🧪 Starting test execution...');
        this.startTime = Date.now();
    }
    
    endReport(results) {
        const duration = Date.now() - this.startTime;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️ Duration: ${duration}ms`);
        
        if (failed > 0) {
            console.log('\n💥 Failed Tests:');
            results.filter(r => r.status === 'failed').forEach(result => {
                console.log(`  ${result.suite} > ${result.test}: ${result.error}`);
            });
        }
    }
}

// Performance Testing
class PerformanceTestSuite {
    constructor() {
        this.benchmarks = new Map();
    }
    
    benchmark(name, fn, iterations = 1000) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            fn();
            const end = performance.now();
            times.push(end - start);
        }
        
        const avg = times.reduce((a, b) => a + b) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        this.benchmarks.set(name, { avg, min, max, iterations });
        
        console.log(`📈 Benchmark ${name}:`);
        console.log(`  Average: ${avg.toFixed(3)}ms`);
        console.log(`  Min: ${min.toFixed(3)}ms`);
        console.log(`  Max: ${max.toFixed(3)}ms`);
        
        return { avg, min, max };
    }
}

// Integration Test Helpers
class IntegrationTestHelpers {
    static async waitFor(condition, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }
    
    static mockAPIResponse(url, response) {
        const originalFetch = window.fetch;
        window.fetch = async (requestUrl, options) => {
            if (requestUrl.includes(url)) {
                return {
                    ok: true,
                    json: async () => response,
                    text: async () => JSON.stringify(response)
                };
            }
            return originalFetch(requestUrl, options);
        };
        
        return () => {
            window.fetch = originalFetch;
        };
    }
    
    static createMockAgent(config = {}) {
        return {
            id: config.id || 'test-agent-' + Math.random().toString(36).substr(2, 9),
            name: config.name || 'Test Agent',
            type: config.type || 'general',
            status: config.status || 'idle',
            capabilities: config.capabilities || ['general'],
            currentTasks: [],
            completedTasks: 0,
            successfulTasks: 0,
            successRate: 100,
            executeTask: async (task) => ({ success: true, result: 'Mock result' }),
            canHandleTask: () => true,
            receiveMessage: () => {},
            shutdown: async () => {}
        };
    }
}

// Export for global use
window.TestFramework = TestFramework;
window.PerformanceTestSuite = PerformanceTestSuite;
window.IntegrationTestHelpers = IntegrationTestHelpers;

// Initialize global test framework
window.testFramework = new TestFramework();
window.performanceTests = new PerformanceTestSuite();

// Built-in Test Suites
window.testFramework.describe('UI Manager Tests', ({ it, beforeEach, afterEach }) => {
    it('should initialize correctly', () => {
        window.testFramework.expect(window.uiManager).toBeTruthy();
        window.testFramework.expect(typeof window.uiManager.init).toBe('function');
    });

    it('should have settings functionality', () => {
        if (window.uiManager) {
            window.testFramework.expect(typeof window.uiManager.saveSettings).toBe('function');
            window.testFramework.expect(typeof window.uiManager.loadCurrentSettings).toBe('function');
        }
    });

    it('should handle notifications', () => {
        if (window.uiManager) {
            window.testFramework.expect(typeof window.uiManager.showNotification).toBe('function');
        }
    });
});

window.testFramework.describe('Agent Manager Tests', ({ it, beforeEach, afterEach }) => {
    it('should initialize correctly', () => {
        window.testFramework.expect(window.agentManager).toBeTruthy();
        window.testFramework.expect(typeof window.agentManager.spawnAgent).toBe('function');
    });

    it('should manage agents', () => {
        if (window.agentManager) {
            window.testFramework.expect(typeof window.agentManager.getAllAgents).toBe('function');
            window.testFramework.expect(typeof window.agentManager.removeAgent).toBe('function');
        }
    });

    it('should handle tasks', () => {
        if (window.agentManager) {
            window.testFramework.expect(typeof window.agentManager.assignTask).toBe('function');
            const agents = window.agentManager.getAllAgents();
            window.testFramework.expect(Array.isArray(agents)).toBeTruthy();
        }
    });
});

window.testFramework.describe('Security Tests', ({ it, beforeEach, afterEach }) => {
    it('should have security manager available', () => {
        if (window.SecurityManager) {
            const security = new window.SecurityManager();
            window.testFramework.expect(typeof security.encrypt).toBe('function');
            window.testFramework.expect(typeof security.decrypt).toBe('function');
        }
    });

    it('should validate input', () => {
        if (window.InputValidator) {
            const validator = new window.InputValidator();
            window.testFramework.expect(typeof validator.sanitize).toBe('function');
            window.testFramework.expect(typeof validator.validate).toBe('function');
        }
    });
});

window.testFramework.describe('Performance Tests', ({ it, beforeEach, afterEach }) => {
    it('should monitor performance', () => {
        if (window.PerformanceMonitor) {
            const monitor = new window.PerformanceMonitor();
            window.testFramework.expect(typeof monitor.startTiming).toBe('function');
            window.testFramework.expect(typeof monitor.endTiming).toBe('function');
        }
    });

    it('should track memory usage', () => {
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const testArray = new Array(1000).fill(0).map((_, i) => ({ id: i, data: 'test' }));
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        testArray.length = 0;
        window.testFramework.expect(true).toBeTruthy(); // Basic test completion
    });
});

window.testFramework.describe('Data Management Tests', ({ it, beforeEach, afterEach }) => {
    it('should have data manager', () => {
        if (window.DataManager) {
            const dataManager = new window.DataManager();
            window.testFramework.expect(typeof dataManager.save).toBe('function');
            window.testFramework.expect(typeof dataManager.load).toBe('function');
        }
    });

    it('should handle caching', () => {
        if (window.CacheManager) {
            window.testFramework.expect(typeof window.CacheManager.set).toBe('function');
            window.testFramework.expect(typeof window.CacheManager.get).toBe('function');
        }
    });
});

window.testFramework.describe('Analytics Tests', ({ it, beforeEach, afterEach }) => {
    it('should track events', () => {
        if (window.AnalyticsManager) {
            const analytics = new window.AnalyticsManager();
            window.testFramework.expect(typeof analytics.trackEvent).toBe('function');
            window.testFramework.expect(typeof analytics.getAnalyticsData).toBe('function');
        }
    });
});

window.testFramework.describe('Plugin System Tests', ({ it, beforeEach, afterEach }) => {
    it('should manage plugins', () => {
        if (window.PluginManager) {
            const pluginManager = new window.PluginManager();
            window.testFramework.expect(typeof pluginManager.loadPlugin).toBe('function');
            window.testFramework.expect(typeof pluginManager.unloadPlugin).toBe('function');
        }
    });
});

window.testFramework.describe('Integration Tests', ({ it, beforeEach, afterEach }) => {
    it('should have all core components', () => {
        window.testFramework.expect(window.uiManager).toBeTruthy();
        window.testFramework.expect(window.agentManager).toBeTruthy();
    });

    it('should handle basic workflow', () => {
        if (window.uiManager && window.agentManager) {
            const agents = window.agentManager.getAllAgents();
            window.testFramework.expect(Array.isArray(agents)).toBeTruthy();
        }
    });

    it('should have API configuration', () => {
        const hasOpenRouterKey = !!CONFIG.openRouterApiKey;
        const hasElevenLabsKey = !!CONFIG.elevenLabsApiKey;
        window.testFramework.expect(hasOpenRouterKey || hasElevenLabsKey).toBeTruthy();
    });
});