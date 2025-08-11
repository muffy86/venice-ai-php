/**
 * Developer Tools Suite Module
 * Provides advanced development tools including live editing, visual debugging,
 * performance profiling, code analysis, and real-time development assistance
 */

class DeveloperToolsSuite {
    constructor() {
        this.isInitialized = false;
        this.isActive = false;
        this.liveEditor = null;
        this.debugger = null;
        this.profiler = null;
        this.codeAnalyzer = null;
        this.hotReload = null;
        this.devPanel = null;
        this.originalConsole = {};
        this.logs = [];
        this.errors = [];
        this.warnings = [];
        
        this.init();
    }

    async init() {
        console.log('🛠️ Initializing Developer Tools Suite...');
        
        try {
            await this.initializeLiveEditor();
            await this.initializeVisualDebugger();
            await this.initializePerformanceProfiler();
            await this.initializeCodeAnalyzer();
            await this.initializeHotReload();
            await this.initializeConsoleInterceptor();
            await this.createDeveloperPanel();
            
            this.setupKeyboardShortcuts();
            this.isInitialized = true;
            
            console.log('✅ Developer Tools Suite initialized successfully');
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('developerToolsReady', {
                detail: { suite: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize Developer Tools Suite:', error);
        }
    }

    async initializeLiveEditor() {
        this.liveEditor = {
            isActive: false,
            editableElements: new Set(),
            originalStyles: new Map(),
            
            enable: () => {
                this.liveEditor.isActive = true;
                document.body.classList.add('live-edit-mode');
                this.liveEditor.makeElementsEditable();
                console.log('✏️ Live Editor enabled');
            },
            
            disable: () => {
                this.liveEditor.isActive = false;
                document.body.classList.remove('live-edit-mode');
                this.liveEditor.restoreElements();
                console.log('✏️ Live Editor disabled');
            },
            
            makeElementsEditable: () => {
                const elements = document.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, span, button');
                
                elements.forEach(element => {
                    if (!element.hasAttribute('contenteditable')) {
                        this.liveEditor.originalStyles.set(element, {
                            outline: element.style.outline,
                            cursor: element.style.cursor
                        });
                        
                        element.contentEditable = true;
                        element.style.outline = '2px dashed #667eea';
                        element.style.cursor = 'text';
                        
                        element.addEventListener('input', this.liveEditor.handleEdit);
                        element.addEventListener('blur', this.liveEditor.handleBlur);
                        
                        this.liveEditor.editableElements.add(element);
                    }
                });
            },
            
            restoreElements: () => {
                this.liveEditor.editableElements.forEach(element => {
                    element.contentEditable = false;
                    
                    const originalStyle = this.liveEditor.originalStyles.get(element);
                    if (originalStyle) {
                        element.style.outline = originalStyle.outline;
                        element.style.cursor = originalStyle.cursor;
                    }
                    
                    element.removeEventListener('input', this.liveEditor.handleEdit);
                    element.removeEventListener('blur', this.liveEditor.handleBlur);
                });
                
                this.liveEditor.editableElements.clear();
                this.liveEditor.originalStyles.clear();
            },
            
            handleEdit: (event) => {
                const element = event.target;
                
                // Dispatch edit event
                window.dispatchEvent(new CustomEvent('liveEdit', {
                    detail: {
                        element,
                        content: element.textContent,
                        html: element.innerHTML
                    }
                }));
            },
            
            handleBlur: (event) => {
                const element = event.target;
                element.style.outline = '1px solid #ccc';
                
                setTimeout(() => {
                    if (this.liveEditor.isActive) {
                        element.style.outline = '2px dashed #667eea';
                    }
                }, 100);
            }
        };
        
        console.log('✏️ Live Editor initialized');
    }

    async initializeVisualDebugger() {
        this.debugger = {
            isActive: false,
            highlightedElements: new Set(),
            
            enable: () => {
                this.debugger.isActive = true;
                document.body.classList.add('debug-mode');
                this.debugger.addDebugStyles();
                this.debugger.enableElementInspection();
                console.log('🔍 Visual Debugger enabled');
            },
            
            disable: () => {
                this.debugger.isActive = false;
                document.body.classList.remove('debug-mode');
                this.debugger.removeDebugStyles();
                this.debugger.disableElementInspection();
                console.log('🔍 Visual Debugger disabled');
            },
            
            addDebugStyles: () => {
                const style = document.createElement('style');
                style.id = 'debug-styles';
                style.textContent = `
                    .debug-mode * {
                        outline: 1px solid rgba(255, 0, 0, 0.3) !important;
                    }
                    
                    .debug-mode *:hover {
                        outline: 2px solid #ff0000 !important;
                        background: rgba(255, 0, 0, 0.1) !important;
                    }
                    
                    .debug-highlighted {
                        outline: 3px solid #00ff00 !important;
                        background: rgba(0, 255, 0, 0.1) !important;
                    }
                    
                    .debug-info {
                        position: absolute;
                        background: rgba(0, 0, 0, 0.9);
                        color: white;
                        padding: 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-family: monospace;
                        z-index: 10000;
                        pointer-events: none;
                        max-width: 300px;
                        word-wrap: break-word;
                    }
                `;
                document.head.appendChild(style);
            },
            
            removeDebugStyles: () => {
                const style = document.getElementById('debug-styles');
                if (style) style.remove();
                
                this.debugger.highlightedElements.forEach(element => {
                    element.classList.remove('debug-highlighted');
                });
                this.debugger.highlightedElements.clear();
                
                const debugInfos = document.querySelectorAll('.debug-info');
                debugInfos.forEach(info => info.remove());
            },
            
            enableElementInspection: () => {
                document.addEventListener('mouseover', this.debugger.handleMouseOver);
                document.addEventListener('mouseout', this.debugger.handleMouseOut);
                document.addEventListener('click', this.debugger.handleClick);
            },
            
            disableElementInspection: () => {
                document.removeEventListener('mouseover', this.debugger.handleMouseOver);
                document.removeEventListener('mouseout', this.debugger.handleMouseOut);
                document.removeEventListener('click', this.debugger.handleClick);
            },
            
            handleMouseOver: (event) => {
                if (!this.debugger.isActive) return;
                
                const element = event.target;
                this.debugger.showElementInfo(element, event);
            },
            
            handleMouseOut: (event) => {
                if (!this.debugger.isActive) return;
                
                const debugInfo = document.querySelector('.debug-info');
                if (debugInfo) debugInfo.remove();
            },
            
            handleClick: (event) => {
                if (!this.debugger.isActive) return;
                
                event.preventDefault();
                event.stopPropagation();
                
                const element = event.target;
                this.debugger.highlightElement(element);
                this.debugger.logElementDetails(element);
            },
            
            showElementInfo: (element, event) => {
                const existingInfo = document.querySelector('.debug-info');
                if (existingInfo) existingInfo.remove();
                
                const info = document.createElement('div');
                info.className = 'debug-info';
                
                const rect = element.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(element);
                
                info.innerHTML = `
                    <strong>${element.tagName.toLowerCase()}</strong>
                    ${element.id ? `#${element.id}` : ''}
                    ${element.className ? `.${element.className.split(' ').join('.')}` : ''}
                    <br>
                    Size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}
                    <br>
                    Position: ${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}
                    <br>
                    Display: ${computedStyle.display}
                    <br>
                    Z-index: ${computedStyle.zIndex}
                `;
                
                info.style.left = (event.pageX + 10) + 'px';
                info.style.top = (event.pageY + 10) + 'px';
                
                document.body.appendChild(info);
            },
            
            highlightElement: (element) => {
                // Remove previous highlights
                this.debugger.highlightedElements.forEach(el => {
                    el.classList.remove('debug-highlighted');
                });
                this.debugger.highlightedElements.clear();
                
                // Add new highlight
                element.classList.add('debug-highlighted');
                this.debugger.highlightedElements.add(element);
            },
            
            logElementDetails: (element) => {
                const details = {
                    element: element,
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    attributes: Array.from(element.attributes).map(attr => ({
                        name: attr.name,
                        value: attr.value
                    })),
                    computedStyle: window.getComputedStyle(element),
                    boundingRect: element.getBoundingClientRect(),
                    innerHTML: element.innerHTML,
                    textContent: element.textContent
                };
                
                console.group('🔍 Element Details');
                console.log(details);
                console.groupEnd();
                
                // Add to dev panel
                this.addToDevPanel('Element Inspected', details);
            }
        };
        
        console.log('🔍 Visual Debugger initialized');
    }

    async initializePerformanceProfiler() {
        this.profiler = {
            isActive: false,
            startTime: null,
            measurements: [],
            observers: [],
            
            start: () => {
                this.profiler.isActive = true;
                this.profiler.startTime = performance.now();
                this.profiler.setupObservers();
                console.log('📊 Performance Profiler started');
            },
            
            stop: () => {
                this.profiler.isActive = false;
                this.profiler.cleanupObservers();
                this.profiler.generateReport();
                console.log('📊 Performance Profiler stopped');
            },
            
            setupObservers: () => {
                // Performance Observer for various metrics
                if ('PerformanceObserver' in window) {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.profiler.measurements.push({
                                type: entry.entryType,
                                name: entry.name,
                                startTime: entry.startTime,
                                duration: entry.duration,
                                timestamp: Date.now()
                            });
                        }
                    });
                    
                    try {
                        observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
                        this.profiler.observers.push(observer);
                    } catch (e) {
                        console.warn('Some performance metrics not supported:', e);
                    }
                }
                
                // Memory usage monitoring
                if ('memory' in performance) {
                    const memoryInterval = setInterval(() => {
                        if (!this.profiler.isActive) {
                            clearInterval(memoryInterval);
                            return;
                        }
                        
                        this.profiler.measurements.push({
                            type: 'memory',
                            name: 'memory-usage',
                            usedJSHeapSize: performance.memory.usedJSHeapSize,
                            totalJSHeapSize: performance.memory.totalJSHeapSize,
                            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                            timestamp: Date.now()
                        });
                    }, 1000);
                }
                
                // FPS monitoring
                let frameCount = 0;
                let lastTime = performance.now();
                
                const fpsLoop = () => {
                    if (!this.profiler.isActive) return;
                    
                    frameCount++;
                    const currentTime = performance.now();
                    
                    if (currentTime - lastTime >= 1000) {
                        this.profiler.measurements.push({
                            type: 'fps',
                            name: 'frames-per-second',
                            value: frameCount,
                            timestamp: Date.now()
                        });
                        
                        frameCount = 0;
                        lastTime = currentTime;
                    }
                    
                    requestAnimationFrame(fpsLoop);
                };
                
                requestAnimationFrame(fpsLoop);
            },
            
            cleanupObservers: () => {
                this.profiler.observers.forEach(observer => {
                    observer.disconnect();
                });
                this.profiler.observers = [];
            },
            
            generateReport: () => {
                const report = {
                    duration: performance.now() - this.profiler.startTime,
                    measurements: this.profiler.measurements,
                    summary: this.profiler.generateSummary()
                };
                
                console.group('📊 Performance Report');
                console.log(report);
                console.groupEnd();
                
                this.addToDevPanel('Performance Report', report);
                return report;
            },
            
            generateSummary: () => {
                const summary = {};
                
                // Group measurements by type
                const byType = this.profiler.measurements.reduce((acc, measurement) => {
                    if (!acc[measurement.type]) acc[measurement.type] = [];
                    acc[measurement.type].push(measurement);
                    return acc;
                }, {});
                
                // Calculate averages and totals
                Object.entries(byType).forEach(([type, measurements]) => {
                    if (type === 'fps') {
                        const avgFPS = measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length;
                        summary[type] = { average: avgFPS.toFixed(2) };
                    } else if (type === 'memory') {
                        const latest = measurements[measurements.length - 1];
                        summary[type] = {
                            used: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
                            total: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
                        };
                    } else if (measurements[0].duration !== undefined) {
                        const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
                        summary[type] = { averageDuration: avgDuration.toFixed(2) + 'ms' };
                    }
                });
                
                return summary;
            },
            
            mark: (name) => {
                performance.mark(name);
                console.log(`📍 Performance mark: ${name}`);
            },
            
            measure: (name, startMark, endMark) => {
                performance.measure(name, startMark, endMark);
                console.log(`📏 Performance measure: ${name}`);
            }
        };
        
        console.log('📊 Performance Profiler initialized');
    }

    async initializeCodeAnalyzer() {
        this.codeAnalyzer = {
            analyze: () => {
                const analysis = {
                    scripts: this.codeAnalyzer.analyzeScripts(),
                    styles: this.codeAnalyzer.analyzeStyles(),
                    dom: this.codeAnalyzer.analyzeDom(),
                    performance: this.codeAnalyzer.analyzePerformance(),
                    accessibility: this.codeAnalyzer.analyzeAccessibility()
                };
                
                console.group('🔬 Code Analysis');
                console.log(analysis);
                console.groupEnd();
                
                this.addToDevPanel('Code Analysis', analysis);
                return analysis;
            },
            
            analyzeScripts: () => {
                const scripts = Array.from(document.scripts);
                return {
                    total: scripts.length,
                    external: scripts.filter(s => s.src).length,
                    inline: scripts.filter(s => !s.src).length,
                    modules: scripts.filter(s => s.type === 'module').length,
                    sizes: scripts.map(s => ({
                        src: s.src || 'inline',
                        size: s.textContent ? s.textContent.length : 'external'
                    }))
                };
            },
            
            analyzeStyles: () => {
                const stylesheets = Array.from(document.styleSheets);
                const inlineStyles = Array.from(document.querySelectorAll('[style]'));
                
                return {
                    stylesheets: stylesheets.length,
                    inlineStyles: inlineStyles.length,
                    totalRules: stylesheets.reduce((total, sheet) => {
                        try {
                            return total + (sheet.cssRules ? sheet.cssRules.length : 0);
                        } catch (e) {
                            return total;
                        }
                    }, 0)
                };
            },
            
            analyzeDom: () => {
                const all = document.querySelectorAll('*');
                const depth = this.codeAnalyzer.calculateMaxDepth(document.body);
                
                return {
                    totalElements: all.length,
                    maxDepth: depth,
                    byTagName: this.codeAnalyzer.countByTagName(all),
                    withIds: document.querySelectorAll('[id]').length,
                    withClasses: document.querySelectorAll('[class]').length
                };
            },
            
            analyzePerformance: () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                return {
                    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 'N/A',
                    loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 'N/A',
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 'N/A',
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 'N/A'
                };
            },
            
            analyzeAccessibility: () => {
                return {
                    imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
                    linksWithoutText: document.querySelectorAll('a:empty').length,
                    headingStructure: this.codeAnalyzer.analyzeHeadingStructure(),
                    formLabels: this.codeAnalyzer.analyzeFormLabels(),
                    colorContrast: 'Manual check required'
                };
            },
            
            calculateMaxDepth: (element, depth = 0) => {
                let maxDepth = depth;
                for (const child of element.children) {
                    const childDepth = this.codeAnalyzer.calculateMaxDepth(child, depth + 1);
                    maxDepth = Math.max(maxDepth, childDepth);
                }
                return maxDepth;
            },
            
            countByTagName: (elements) => {
                const counts = {};
                elements.forEach(el => {
                    const tag = el.tagName.toLowerCase();
                    counts[tag] = (counts[tag] || 0) + 1;
                });
                return Object.entries(counts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .reduce((obj, [tag, count]) => {
                        obj[tag] = count;
                        return obj;
                    }, {});
            },
            
            analyzeHeadingStructure: () => {
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                return headings.map(h => ({
                    level: parseInt(h.tagName[1]),
                    text: h.textContent.substring(0, 50)
                }));
            },
            
            analyzeFormLabels: () => {
                const inputs = document.querySelectorAll('input, select, textarea');
                const withLabels = Array.from(inputs).filter(input => {
                    return document.querySelector(`label[for="${input.id}"]`) || 
                           input.closest('label') ||
                           input.getAttribute('aria-label') ||
                           input.getAttribute('aria-labelledby');
                });
                
                return {
                    total: inputs.length,
                    withLabels: withLabels.length,
                    withoutLabels: inputs.length - withLabels.length
                };
            }
        };
        
        console.log('🔬 Code Analyzer initialized');
    }

    async initializeHotReload() {
        this.hotReload = {
            isActive: false,
            watchers: new Map(),
            
            enable: () => {
                this.hotReload.isActive = true;
                this.hotReload.watchStyles();
                this.hotReload.watchScripts();
                console.log('🔥 Hot Reload enabled');
            },
            
            disable: () => {
                this.hotReload.isActive = false;
                this.hotReload.watchers.clear();
                console.log('🔥 Hot Reload disabled');
            },
            
            watchStyles: () => {
                const stylesheets = Array.from(document.styleSheets);
                
                stylesheets.forEach((sheet, index) => {
                    if (sheet.href) {
                        this.hotReload.watchers.set(`style-${index}`, {
                            type: 'style',
                            href: sheet.href,
                            element: sheet.ownerNode
                        });
                    }
                });
            },
            
            watchScripts: () => {
                const scripts = Array.from(document.scripts);
                
                scripts.forEach((script, index) => {
                    if (script.src) {
                        this.hotReload.watchers.set(`script-${index}`, {
                            type: 'script',
                            src: script.src,
                            element: script
                        });
                    }
                });
            },
            
            reloadStyle: (href) => {
                const link = document.querySelector(`link[href="${href}"]`);
                if (link) {
                    const newLink = link.cloneNode();
                    newLink.href = href + '?t=' + Date.now();
                    link.parentNode.insertBefore(newLink, link.nextSibling);
                    link.remove();
                    console.log(`🎨 Reloaded stylesheet: ${href}`);
                }
            },
            
            reloadScript: (src) => {
                // Note: Script reloading is complex and may require page refresh
                console.log(`🔄 Script reload requested: ${src}`);
                console.warn('Script hot reload may require page refresh for full effect');
            }
        };
        
        console.log('🔥 Hot Reload initialized');
    }

    async initializeConsoleInterceptor() {
        // Backup original console methods
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };
        
        // Intercept console methods
        console.log = (...args) => {
            this.logs.push({ type: 'log', args, timestamp: Date.now() });
            this.originalConsole.log(...args);
            this.updateDevPanelConsole();
        };
        
        console.warn = (...args) => {
            this.warnings.push({ type: 'warn', args, timestamp: Date.now() });
            this.originalConsole.warn(...args);
            this.updateDevPanelConsole();
        };
        
        console.error = (...args) => {
            this.errors.push({ type: 'error', args, timestamp: Date.now() });
            this.originalConsole.error(...args);
            this.updateDevPanelConsole();
        };
        
        console.info = (...args) => {
            this.logs.push({ type: 'info', args, timestamp: Date.now() });
            this.originalConsole.info(...args);
            this.updateDevPanelConsole();
        };
        
        console.debug = (...args) => {
            this.logs.push({ type: 'debug', args, timestamp: Date.now() });
            this.originalConsole.debug(...args);
            this.updateDevPanelConsole();
        };
        
        // Intercept errors
        window.addEventListener('error', (event) => {
            this.errors.push({
                type: 'error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: Date.now()
            });
            this.updateDevPanelConsole();
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.errors.push({
                type: 'unhandledrejection',
                reason: event.reason,
                timestamp: Date.now()
            });
            this.updateDevPanelConsole();
        });
        
        console.log('📝 Console Interceptor initialized');
    }

    async createDeveloperPanel() {
        const panel = document.createElement('div');
        panel.id = 'developer-tools-panel';
        panel.innerHTML = `
            <style>
                #developer-tools-panel {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 300px;
                    background: rgba(0, 0, 0, 0.95);
                    color: white;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    z-index: 10001;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    border-top: 2px solid #667eea;
                    display: flex;
                    flex-direction: column;
                }
                
                #developer-tools-panel.active {
                    transform: translateY(0);
                }
                
                .dev-panel-header {
                    background: #1a1a1a;
                    padding: 8px 16px;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .dev-panel-title {
                    font-weight: bold;
                    color: #667eea;
                }
                
                .dev-panel-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .dev-panel-btn {
                    background: #333;
                    border: 1px solid #555;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                
                .dev-panel-btn:hover {
                    background: #444;
                }
                
                .dev-panel-btn.active {
                    background: #667eea;
                }
                
                .dev-panel-tabs {
                    display: flex;
                    background: #2a2a2a;
                    border-bottom: 1px solid #333;
                }
                
                .dev-panel-tab {
                    padding: 8px 16px;
                    cursor: pointer;
                    border-right: 1px solid #333;
                    transition: background 0.2s;
                }
                
                .dev-panel-tab:hover {
                    background: #3a3a3a;
                }
                
                .dev-panel-tab.active {
                    background: #667eea;
                }
                
                .dev-panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .dev-panel-section {
                    display: none;
                }
                
                .dev-panel-section.active {
                    display: block;
                }
                
                .console-entry {
                    margin-bottom: 4px;
                    padding: 2px 4px;
                    border-radius: 2px;
                }
                
                .console-entry.log {
                    color: #ccc;
                }
                
                .console-entry.warn {
                    color: #ffa500;
                    background: rgba(255, 165, 0, 0.1);
                }
                
                .console-entry.error {
                    color: #ff6b6b;
                    background: rgba(255, 107, 107, 0.1);
                }
                
                .console-entry.info {
                    color: #4ecdc4;
                }
                
                .console-timestamp {
                    color: #666;
                    font-size: 10px;
                }
                
                .analysis-item {
                    margin-bottom: 8px;
                    padding: 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }
                
                .analysis-label {
                    color: #667eea;
                    font-weight: bold;
                }
                
                .performance-metric {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    padding: 2px 4px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 2px;
                }
                
                .metric-value {
                    color: #4ecdc4;
                }
            </style>
            
            <div class="dev-panel-header">
                <div class="dev-panel-title">🛠️ Developer Tools Suite</div>
                <div class="dev-panel-controls">
                    <button class="dev-panel-btn" id="live-edit-toggle">Live Edit</button>
                    <button class="dev-panel-btn" id="debug-toggle">Debug</button>
                    <button class="dev-panel-btn" id="profiler-toggle">Profiler</button>
                    <button class="dev-panel-btn" id="hot-reload-toggle">Hot Reload</button>
                    <button class="dev-panel-btn" id="analyze-btn">Analyze</button>
                    <button class="dev-panel-btn" id="clear-btn">Clear</button>
                    <button class="dev-panel-btn" id="close-panel">×</button>
                </div>
            </div>
            
            <div class="dev-panel-tabs">
                <div class="dev-panel-tab active" data-tab="console">Console</div>
                <div class="dev-panel-tab" data-tab="analysis">Analysis</div>
                <div class="dev-panel-tab" data-tab="performance">Performance</div>
                <div class="dev-panel-tab" data-tab="network">Network</div>
                <div class="dev-panel-tab" data-tab="elements">Elements</div>
            </div>
            
            <div class="dev-panel-content">
                <div class="dev-panel-section active" id="console-section">
                    <div id="console-output"></div>
                </div>
                
                <div class="dev-panel-section" id="analysis-section">
                    <div id="analysis-output">Click "Analyze" to run code analysis</div>
                </div>
                
                <div class="dev-panel-section" id="performance-section">
                    <div id="performance-output">Start profiler to see performance metrics</div>
                </div>
                
                <div class="dev-panel-section" id="network-section">
                    <div>Network monitoring coming soon...</div>
                </div>
                
                <div class="dev-panel-section" id="elements-section">
                    <div>Element inspector - enable debug mode and click elements</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.devPanel = panel;
        
        this.setupPanelInteractions();
        console.log('🎛️ Developer Panel created');
    }

    setupPanelInteractions() {
        // Tab switching
        const tabs = this.devPanel.querySelectorAll('.dev-panel-tab');
        const sections = this.devPanel.querySelectorAll('.dev-panel-section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const targetSection = this.devPanel.querySelector(`#${tab.dataset.tab}-section`);
                if (targetSection) targetSection.classList.add('active');
            });
        });
        
        // Control buttons
        document.getElementById('live-edit-toggle').addEventListener('click', () => {
            const btn = document.getElementById('live-edit-toggle');
            if (this.liveEditor.isActive) {
                this.liveEditor.disable();
                btn.classList.remove('active');
            } else {
                this.liveEditor.enable();
                btn.classList.add('active');
            }
        });
        
        document.getElementById('debug-toggle').addEventListener('click', () => {
            const btn = document.getElementById('debug-toggle');
            if (this.debugger.isActive) {
                this.debugger.disable();
                btn.classList.remove('active');
            } else {
                this.debugger.enable();
                btn.classList.add('active');
            }
        });
        
        document.getElementById('profiler-toggle').addEventListener('click', () => {
            const btn = document.getElementById('profiler-toggle');
            if (this.profiler.isActive) {
                this.profiler.stop();
                btn.classList.remove('active');
                btn.textContent = 'Profiler';
            } else {
                this.profiler.start();
                btn.classList.add('active');
                btn.textContent = 'Stop';
            }
        });
        
        document.getElementById('hot-reload-toggle').addEventListener('click', () => {
            const btn = document.getElementById('hot-reload-toggle');
            if (this.hotReload.isActive) {
                this.hotReload.disable();
                btn.classList.remove('active');
            } else {
                this.hotReload.enable();
                btn.classList.add('active');
            }
        });
        
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.codeAnalyzer.analyze();
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearLogs();
        });
        
        document.getElementById('close-panel').addEventListener('click', () => {
            this.hide();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+D to toggle developer panel
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.toggle();
            }
            
            // Ctrl+Shift+L to toggle live edit
            if (event.ctrlKey && event.shiftKey && event.key === 'L') {
                event.preventDefault();
                if (this.liveEditor.isActive) {
                    this.liveEditor.disable();
                } else {
                    this.liveEditor.enable();
                }
            }
            
            // Ctrl+Shift+I to toggle debug mode
            if (event.ctrlKey && event.shiftKey && event.key === 'I') {
                event.preventDefault();
                if (this.debugger.isActive) {
                    this.debugger.disable();
                } else {
                    this.debugger.enable();
                }
            }
        });
        
        console.log('⌨️ Keyboard shortcuts enabled');
    }

    // Public API methods
    show() {
        if (this.devPanel) {
            this.devPanel.classList.add('active');
            this.isActive = true;
        }
    }

    hide() {
        if (this.devPanel) {
            this.devPanel.classList.remove('active');
            this.isActive = false;
        }
    }

    toggle() {
        if (this.isActive) {
            this.hide();
        } else {
            this.show();
        }
    }

    addToDevPanel(title, data) {
        const analysisOutput = document.getElementById('analysis-output');
        if (analysisOutput) {
            const entry = document.createElement('div');
            entry.className = 'analysis-item';
            entry.innerHTML = `
                <div class="analysis-label">${title}</div>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
            analysisOutput.appendChild(entry);
            analysisOutput.scrollTop = analysisOutput.scrollHeight;
        }
    }

    updateDevPanelConsole() {
        const consoleOutput = document.getElementById('console-output');
        if (!consoleOutput) return;
        
        const allLogs = [
            ...this.logs.map(log => ({ ...log, type: log.type || 'log' })),
            ...this.warnings.map(warn => ({ ...warn, type: 'warn' })),
            ...this.errors.map(error => ({ ...error, type: 'error' }))
        ].sort((a, b) => a.timestamp - b.timestamp);
        
        consoleOutput.innerHTML = allLogs.slice(-100).map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const args = entry.args ? entry.args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ') : entry.message || entry.reason || 'Unknown';
            
            return `
                <div class="console-entry ${entry.type}">
                    <span class="console-timestamp">[${time}]</span>
                    ${args}
                </div>
            `;
        }).join('');
        
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    clearLogs() {
        this.logs = [];
        this.warnings = [];
        this.errors = [];
        this.updateDevPanelConsole();
        
        const analysisOutput = document.getElementById('analysis-output');
        if (analysisOutput) {
            analysisOutput.innerHTML = 'Click "Analyze" to run code analysis';
        }
        
        const performanceOutput = document.getElementById('performance-output');
        if (performanceOutput) {
            performanceOutput.innerHTML = 'Start profiler to see performance metrics';
        }
    }

    // Cleanup method
    destroy() {
        // Restore original console methods
        Object.assign(console, this.originalConsole);
        
        // Disable all tools
        if (this.liveEditor.isActive) this.liveEditor.disable();
        if (this.debugger.isActive) this.debugger.disable();
        if (this.profiler.isActive) this.profiler.stop();
        if (this.hotReload.isActive) this.hotReload.disable();
        
        // Remove panel
        if (this.devPanel) {
            this.devPanel.remove();
        }
        
        console.log('🧹 Developer Tools Suite destroyed');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.developerToolsSuite = new DeveloperToolsSuite();
    });
} else {
    window.developerToolsSuite = new DeveloperToolsSuite();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeveloperToolsSuite;
}