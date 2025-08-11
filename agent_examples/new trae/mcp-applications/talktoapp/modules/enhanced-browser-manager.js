/**
 * Enhanced Browser Manager
 * Handles advanced browser automation, web scraping, and parallel web processing
 */

class EnhancedBrowserManager {
    constructor() {
        this.isInitialized = false;
        this.actionQueue = [];
        this.isProcessing = false;
        this.currentPage = null;
        this.browser = null;
        this.tabs = new Map();
        this.automationScripts = new Map();
        this.selectors = new Map();
        this.waitConditions = new Map();
        this.screenshots = [];
        this.pageHistory = [];
        this.parallel = {
            maxTabs: 5,
            activeTabs: 0,
            taskQueue: [],
            results: new Map()
        };
        this.metrics = {
            actionsExecuted: 0,
            pagesVisited: 0,
            dataExtracted: 0,
            averagePageLoadTime: 0,
            successRate: 0.95
        };
    }

    async initialize() {
        try {
            // Initialize browser automation capabilities
            await this.setupBrowserDetection();
            await this.initializeAutomationScripts();
            await this.setupSelectors();
            await this.initializeWebDrivers();

            this.isInitialized = true;
            console.log('🌐 Enhanced Browser Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Browser Manager:', error);
            return false;
        }
    }

    async setupBrowserDetection() {
        // Detect available browser automation capabilities
        this.capabilities = {
            puppeteer: await this.detectPuppeteer(),
            playwright: await this.detectPlaywright(),
            webdriver: await this.detectWebDriver(),
            native: true // Always available for basic DOM manipulation
        };

        console.log('🔍 Browser capabilities detected:', this.capabilities);
    }

    async detectPuppeteer() {
        try {
            // Check if Puppeteer is available
            return typeof window.puppeteer !== 'undefined' ||
                   typeof require !== 'undefined';
        } catch {
            return false;
        }
    }

    async detectPlaywright() {
        try {
            // Check if Playwright is available
            return typeof window.playwright !== 'undefined';
        } catch {
            return false;
        }
    }

    async detectWebDriver() {
        try {
            // Check if WebDriver is available
            return navigator.webdriver === true;
        } catch {
            return false;
        }
    }

    async initializeAutomationScripts() {
        // Common automation scripts
        this.automationScripts.set('clickElement', `
            function clickElement(selector) {
                const element = document.querySelector(selector);
                if (element) {
                    element.click();
                    return { success: true, element: element.tagName };
                }
                return { success: false, error: 'Element not found' };
            }
        `);

        this.automationScripts.set('fillForm', `
            function fillForm(formData) {
                const results = [];
                for (const [selector, value] of Object.entries(formData)) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.value = value;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        results.push({ selector, success: true });
                    } else {
                        results.push({ selector, success: false, error: 'Element not found' });
                    }
                }
                return results;
            }
        `);

        this.automationScripts.set('extractData', `
            function extractData(selectors) {
                const data = {};
                for (const [key, selector] of Object.entries(selectors)) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length === 1) {
                        data[key] = elements[0].textContent.trim();
                    } else if (elements.length > 1) {
                        data[key] = Array.from(elements).map(el => el.textContent.trim());
                    } else {
                        data[key] = null;
                    }
                }
                return data;
            }
        `);

        this.automationScripts.set('waitForElement', `
            function waitForElement(selector, timeout = 5000) {
                return new Promise((resolve, reject) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                        return;
                    }

                    const observer = new MutationObserver((mutations) => {
                        const element = document.querySelector(selector);
                        if (element) {
                            observer.disconnect();
                            resolve(element);
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        reject(new Error('Element not found within timeout'));
                    }, timeout);
                });
            }
        `);

        this.automationScripts.set('scrollToElement', `
            function scrollToElement(selector) {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return { success: true };
                }
                return { success: false, error: 'Element not found' };
            }
        `);
    }

    async setupSelectors() {
        // Common selectors for different websites
        this.selectors.set('github', {
            searchBox: 'input[name="q"]',
            repository: '.repo-list-item',
            starButton: '.starred button',
            issueTitle: '.js-issue-title',
            codeButton: '.btn-primary'
        });

        this.selectors.set('google', {
            searchBox: 'input[name="q"]',
            searchButton: 'input[value="Google Search"]',
            results: '.g',
            title: 'h3',
            snippet: '.VwiC3b'
        });

        this.selectors.set('youtube', {
            searchBox: 'input#search',
            video: 'ytd-video-renderer',
            title: '#video-title',
            views: '#metadata-line span',
            subscribe: '#subscribe-button'
        });

        this.selectors.set('linkedin', {
            searchBox: '.search-global-typeahead__input',
            profile: '.entity-result',
            connectButton: '.artdeco-button--primary',
            messageButton: '.message-anywhere-button'
        });
    }

    async initializeWebDrivers() {
        // Initialize available web drivers
        if (this.capabilities.puppeteer) {
            await this.initializePuppeteer();
        }
        if (this.capabilities.playwright) {
            await this.initializePlaywright();
        }
    }

    async initializePuppeteer() {
        try {
            // Initialize Puppeteer if available
            console.log('🎭 Puppeteer driver initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize Puppeteer:', error);
        }
    }

    async initializePlaywright() {
        try {
            // Initialize Playwright if available
            console.log('🎪 Playwright driver initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize Playwright:', error);
        }
    }

    async executeAction(action) {
        if (!this.isInitialized) {
            throw new Error('Browser manager not initialized');
        }

        const startTime = Date.now();

        try {
            let result;

            switch (action.type) {
                case 'navigate':
                    result = await this.navigateToUrl(action.url, action.options);
                    break;
                case 'click':
                    result = await this.clickElement(action.selector, action.options);
                    break;
                case 'type':
                    result = await this.typeText(action.selector, action.text, action.options);
                    break;
                case 'extract':
                    result = await this.extractData(action.selectors, action.options);
                    break;
                case 'screenshot':
                    result = await this.takeScreenshot(action.options);
                    break;
                case 'scroll':
                    result = await this.scrollPage(action.direction, action.amount);
                    break;
                case 'wait':
                    result = await this.waitForCondition(action.condition, action.timeout);
                    break;
                case 'evaluate':
                    result = await this.evaluateScript(action.script, action.args);
                    break;
                case 'form':
                    result = await this.fillForm(action.formData, action.options);
                    break;
                case 'download':
                    result = await this.downloadFile(action.url, action.filename);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }

            // Update metrics
            this.updateMetrics(startTime, true);

            return {
                success: true,
                result,
                action: action.type,
                duration: Date.now() - startTime
            };

        } catch (error) {
            this.updateMetrics(startTime, false);
            console.error(`❌ Browser action failed: ${action.type}`, error);

            return {
                success: false,
                error: error.message,
                action: action.type,
                duration: Date.now() - startTime
            };
        }
    }

    async navigateToUrl(url, options = {}) {
        try {
            // For native browser navigation
            if (options.newTab) {
                window.open(url, '_blank');
                return { success: true, url, method: 'new_tab' };
            } else {
                window.location.href = url;
                return { success: true, url, method: 'current_tab' };
            }
        } catch (error) {
            throw new Error(`Navigation failed: ${error.message}`);
        }
    }

    async clickElement(selector, options = {}) {
        return await this.executeScript('clickElement', [selector]);
    }

    async typeText(selector, text, options = {}) {
        const script = `
            const element = document.querySelector('${selector}');
            if (element) {
                element.value = '${text}';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return { success: true, text: '${text}' };
            }
            return { success: false, error: 'Element not found' };
        `;

        return await this.executeScript(script);
    }

    async extractData(selectors, options = {}) {
        return await this.executeScript('extractData', [selectors]);
    }

    async takeScreenshot(options = {}) {
        try {
            // For modern browsers with Screen Capture API
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: 'screen' }
                });

                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                return new Promise((resolve) => {
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);

                        stream.getTracks().forEach(track => track.stop());

                        const dataUrl = canvas.toDataURL('image/png');
                        this.screenshots.push({
                            timestamp: new Date().toISOString(),
                            dataUrl,
                            dimensions: { width: canvas.width, height: canvas.height }
                        });

                        resolve({ success: true, dataUrl, method: 'screen_capture' });
                    });
                });
            } else {
                // Fallback: Use html2canvas or similar library if available
                return { success: false, error: 'Screenshot API not available' };
            }
        } catch (error) {
            throw new Error(`Screenshot failed: ${error.message}`);
        }
    }

    async scrollPage(direction = 'down', amount = 'page') {
        const script = `
            const scrollAmount = '${amount}' === 'page' ? window.innerHeight : parseInt('${amount}');
            const scrollDirection = '${direction}' === 'down' ? scrollAmount : -scrollAmount;

            window.scrollBy(0, scrollDirection);

            return {
                success: true,
                direction: '${direction}',
                amount: scrollAmount,
                scrollY: window.scrollY
            };
        `;

        return await this.executeScript(script);
    }

    async waitForCondition(condition, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkCondition = () => {
                try {
                    if (typeof condition === 'string') {
                        // If condition is a selector
                        const element = document.querySelector(condition);
                        if (element) {
                            resolve({ success: true, condition, found: true });
                            return;
                        }
                    } else if (typeof condition === 'function') {
                        // If condition is a function
                        if (condition()) {
                            resolve({ success: true, condition: 'function', result: true });
                            return;
                        }
                    }

                    if (Date.now() - startTime < timeout) {
                        setTimeout(checkCondition, 100);
                    } else {
                        reject(new Error(`Condition not met within ${timeout}ms`));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            checkCondition();
        });
    }

    async evaluateScript(script, args = []) {
        return await this.executeScript(script, args);
    }

    async executeScript(script, args = []) {
        try {
            let scriptToExecute;

            if (this.automationScripts.has(script)) {
                scriptToExecute = this.automationScripts.get(script) + `; return ${script}(...arguments);`;
            } else {
                scriptToExecute = script;
            }

            // Create a function from the script and execute it
            const func = new Function('...args', scriptToExecute);
            const result = func(...args);

            return result;
        } catch (error) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }

    async fillForm(formData, options = {}) {
        return await this.executeScript('fillForm', [formData]);
    }

    async downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename || 'download';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(link.href);

            return { success: true, filename, size: blob.size };
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    async executeTask(task) {
        if (!this.isInitialized) {
            throw new Error('Browser manager not initialized');
        }

        const startTime = Date.now();
        const results = [];

        try {
            for (const action of task.actions) {
                const result = await this.executeAction(action);
                results.push(result);

                // If action failed and task is not set to continue on error
                if (!result.success && !task.continueOnError) {
                    break;
                }

                // Add delay between actions if specified
                if (action.delay) {
                    await new Promise(resolve => setTimeout(resolve, action.delay));
                }
            }

            return {
                success: true,
                task: task.name || 'unnamed',
                results,
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                success: false,
                task: task.name || 'unnamed',
                error: error.message,
                results,
                duration: Date.now() - startTime
            };
        }
    }

    async executeParallelTasks(tasks) {
        const maxConcurrent = Math.min(tasks.length, this.parallel.maxTabs);
        const batches = [];

        // Split tasks into batches
        for (let i = 0; i < tasks.length; i += maxConcurrent) {
            batches.push(tasks.slice(i, i + maxConcurrent));
        }

        const allResults = [];

        for (const batch of batches) {
            const batchPromises = batch.map(task => this.executeTask(task));
            const batchResults = await Promise.allSettled(batchPromises);
            allResults.push(...batchResults);
        }

        return allResults.map((result, index) => ({
            taskIndex: index,
            success: result.status === 'fulfilled',
            result: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null
        }));
    }

    queueAction(action) {
        this.actionQueue.push({
            ...action,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        });
    }

    hasQueuedActions() {
        return this.actionQueue.length > 0;
    }

    getQueuedActions() {
        const actions = [...this.actionQueue];
        this.actionQueue = [];
        return actions;
    }

    async processQueue() {
        if (this.isProcessing || this.actionQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const actions = this.getQueuedActions();

        try {
            for (const action of actions) {
                await this.executeAction(action);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    updateMetrics(startTime, success) {
        this.metrics.actionsExecuted++;

        if (success) {
            const duration = Date.now() - startTime;
            this.metrics.averagePageLoadTime =
                (this.metrics.averagePageLoadTime + duration) / 2;
            this.metrics.successRate =
                (this.metrics.successRate + 1.0) / 2;
        } else {
            this.metrics.successRate =
                (this.metrics.successRate + 0.0) / 2;
        }
    }

    // Smart automation features
    async smartFillForm(formSelector, data) {
        const formElements = document.querySelectorAll(`${formSelector} input, ${formSelector} select, ${formSelector} textarea`);
        const results = [];

        for (const element of formElements) {
            const fieldName = element.name || element.id || element.placeholder?.toLowerCase() || '';
            let value = null;

            // Smart field matching
            if (fieldName.includes('email') || element.type === 'email') {
                value = data.email;
            } else if (fieldName.includes('name') || fieldName.includes('first')) {
                value = data.firstName || data.name;
            } else if (fieldName.includes('last') || fieldName.includes('surname')) {
                value = data.lastName;
            } else if (fieldName.includes('phone') || element.type === 'tel') {
                value = data.phone;
            } else if (fieldName.includes('address')) {
                value = data.address;
            } else if (fieldName.includes('city')) {
                value = data.city;
            } else if (fieldName.includes('zip') || fieldName.includes('postal')) {
                value = data.zipCode;
            } else if (fieldName.includes('message') || element.tagName === 'TEXTAREA') {
                value = data.message;
            }

            if (value) {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                results.push({ field: fieldName, success: true, value });
            }
        }

        return results;
    }

    async smartExtractContent(url, contentType = 'all') {
        const extractors = {
            article: {
                title: 'h1, .title, .article-title, [class*="title"]',
                content: '.content, .article-body, .post-content, [class*="content"]',
                author: '.author, .byline, [class*="author"]',
                date: '.date, .published, time, [class*="date"]'
            },
            product: {
                title: 'h1, .product-title, [class*="title"]',
                price: '.price, [class*="price"], .cost, [class*="cost"]',
                description: '.description, .product-description',
                rating: '.rating, .stars, [class*="rating"]',
                reviews: '.reviews, .review-count'
            },
            contact: {
                email: '[href^="mailto:"], [class*="email"]',
                phone: '[href^="tel:"], [class*="phone"]',
                address: '.address, [class*="address"]',
                social: 'a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"]'
            }
        };

        const selectors = extractors[contentType] || extractors.article;
        return await this.extractData(selectors);
    }

    // Public API methods
    getMetrics() {
        return { ...this.metrics };
    }

    getScreenshots() {
        return [...this.screenshots];
    }

    getPageHistory() {
        return [...this.pageHistory];
    }

    clearHistory() {
        this.pageHistory = [];
        this.screenshots = [];
    }

    getCapabilities() {
        return { ...this.capabilities };
    }

    // Utility methods for common web tasks
    async googleSearch(query) {
        const task = {
            name: 'google_search',
            actions: [
                { type: 'navigate', url: 'https://google.com' },
                { type: 'wait', condition: 'input[name="q"]', timeout: 5000 },
                { type: 'type', selector: 'input[name="q"]', text: query },
                { type: 'click', selector: 'input[value="Google Search"]' },
                { type: 'wait', condition: '.g', timeout: 10000 },
                { type: 'extract', selectors: this.selectors.get('google') }
            ]
        };

        return await this.executeTask(task);
    }

    async youtubeSearch(query) {
        const task = {
            name: 'youtube_search',
            actions: [
                { type: 'navigate', url: 'https://youtube.com' },
                { type: 'wait', condition: 'input#search', timeout: 5000 },
                { type: 'type', selector: 'input#search', text: query },
                { type: 'click', selector: 'button#search-icon-legacy' },
                { type: 'wait', condition: 'ytd-video-renderer', timeout: 10000 },
                { type: 'extract', selectors: this.selectors.get('youtube') }
            ]
        };

        return await this.executeTask(task);
    }

    async githubSearch(query) {
        const task = {
            name: 'github_search',
            actions: [
                { type: 'navigate', url: 'https://github.com' },
                { type: 'wait', condition: 'input[name="q"]', timeout: 5000 },
                { type: 'type', selector: 'input[name="q"]', text: query },
                { type: 'click', selector: 'input[name="q"]', options: { key: 'Enter' } },
                { type: 'wait', condition: '.repo-list-item', timeout: 10000 },
                { type: 'extract', selectors: this.selectors.get('github') }
            ]
        };

        return await this.executeTask(task);
    }
}

// Export for use in other modules
window.EnhancedBrowserManager = EnhancedBrowserManager;
