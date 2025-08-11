/**
 * Adaptive UI Manager
 * Dynamically adjusts interface based on user context and preferences
 */

class AdaptiveUIManager {
    constructor() {
        this.adaptations = new Map();
        this.userPreferences = {};
        this.contextualThemes = {};
        this.accessibilitySettings = {};
        this.performanceMode = 'auto';
        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupContextualAdaptations();
        this.initializeAccessibility();
        this.startAdaptiveMonitoring();
    }

    setupContextualAdaptations() {
        // Initialize adaptation rules
        this.adaptationRules = {
            timeOfDay: {
                enabled: true,
                autoTheme: true,
                nightModeStart: 20,
                nightModeEnd: 7
            },
            device: {
                enabled: true,
                autoMobile: true,
                autoCompact: true,
                autoHighDPI: true
            },
            network: {
                enabled: true,
                autoLowBandwidth: true,
                dataSaver: false
            },
            performance: {
                enabled: true,
                autoOptimize: true,
                memoryThreshold: 0.8
            }
        };

        // Set up context monitoring
        this.contextMonitor = setInterval(() => {
            this.adaptToContext();
        }, 5000);

        // Listen for context changes
        try {
            if (window.contextualIntelligence) {
                if (typeof window.contextualIntelligence.addEventListener === 'function') {
                    window.contextualIntelligence.addEventListener('contextChange', () => {
                        this.adaptToContext();
                    });
                } else if (typeof window.contextualIntelligence.on === 'function') {
                    window.contextualIntelligence.on('contextChange', () => {
                        this.adaptToContext();
                    });
                }
            } else {
                // Create a mock contextual intelligence if not available
                window.contextualIntelligence = {
                    getCurrentContext: () => ({
                        time: { period: 'day', hour: new Date().getHours() },
                        device: { type: 'desktop', screen: { width: window.innerWidth, ratio: window.devicePixelRatio || 1 }, mobile: false },
                        network: { effectiveType: '4g', saveData: false },
                        performance: { memory: { used: 0, total: 1 } }
                    }),
                    addEventListener: () => {},
                    on: () => {}
                };
            }
        } catch (error) {
            console.warn('Contextual intelligence not available:', error);
            // Fallback mock
            window.contextualIntelligence = {
                getCurrentContext: () => ({
                    time: { period: 'day', hour: new Date().getHours() },
                    device: { type: 'desktop', screen: { width: window.innerWidth, ratio: window.devicePixelRatio || 1 }, mobile: false },
                    network: { effectiveType: '4g', saveData: false },
                    performance: { memory: { used: 0, total: 1 } }
                }),
                addEventListener: () => {},
                on: () => {}
            };
        }

        // Initial adaptation
        this.adaptToContext();
    }

    // Context-based UI adaptations
    adaptToContext() {
        const context = window.contextualIntelligence?.getCurrentContext();
        if (!context) return;

        this.adaptToTimeOfDay(context.time);
        this.adaptToDevice(context.device);
        this.adaptToNetwork(context.network);
        this.adaptToPerformance(context.performance);
        this.adaptToEnvironment(context);
    }

    adaptToTimeOfDay(timeContext) {
        const { period, hour } = timeContext;
        
        // Dynamic theme based on time
        const themes = {
            morning: {
                primary: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                accent: '#ff6b6b',
                brightness: 1.1
            },
            afternoon: {
                primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                accent: '#4ecdc4',
                brightness: 1.0
            },
            evening: {
                primary: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                accent: '#e74c3c',
                brightness: 0.9
            },
            night: {
                primary: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
                accent: '#3498db',
                brightness: 0.7
            }
        };

        const theme = themes[period];
        if (theme) {
            this.applyTheme(theme);
            
            // Adjust UI elements for night mode
            if (period === 'night') {
                this.enableNightMode();
            } else {
                this.disableNightMode();
            }
        }
    }

    adaptToDevice(deviceContext) {
        const { type, screen, mobile } = deviceContext;
        
        // Mobile optimizations
        if (mobile) {
            this.enableMobileOptimizations();
        }
        
        // Screen size adaptations
        if (screen.width < 768) {
            this.enableCompactMode();
        } else if (screen.width > 1920) {
            this.enableWideScreenMode();
        }
        
        // High DPI adaptations
        if (screen.ratio > 1.5) {
            this.enableHighDPIMode();
        }
    }

    adaptToNetwork(networkContext) {
        const { effectiveType, saveData } = networkContext;
        
        // Slow connection optimizations
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
            this.enableLowBandwidthMode();
        } else if (effectiveType === '4g') {
            this.enableHighBandwidthMode();
        }
    }

    adaptToPerformance(performanceContext) {
        if (!performanceContext?.memory) return;
        
        const { memory } = performanceContext;
        
        // Low memory optimizations
        if (memory.used / memory.total > 0.8) {
            this.enablePerformanceMode();
        } else {
            this.disablePerformanceMode();
        }
    }

    adaptToEnvironment(context) {
        // Adapt based on user activity patterns
        const recentActivity = this.getRecentUserActivity();
        
        if (recentActivity.includes('productivity')) {
            this.enableFocusMode();
        } else if (recentActivity.includes('entertainment')) {
            this.enableRelaxedMode();
        }
    }

    // Theme management
    applyTheme(theme) {
        const root = document.documentElement;
        
        root.style.setProperty('--adaptive-primary', theme.primary);
        root.style.setProperty('--adaptive-accent', theme.accent);
        root.style.setProperty('--adaptive-brightness', theme.brightness);
        
        // Apply to body background
        document.body.style.background = theme.primary;
        document.body.style.filter = `brightness(${theme.brightness})`;
    }

    enableNightMode() {
        document.body.classList.add('night-mode');
        
        // Reduce blue light
        const filter = 'sepia(10%) saturate(120%) hue-rotate(15deg)';
        document.body.style.filter = filter;
        
        // Dim bright elements
        this.dimBrightElements();
    }

    disableNightMode() {
        document.body.classList.remove('night-mode');
        document.body.style.filter = '';
        this.restoreBrightElements();
    }

    // Device-specific optimizations
    enableMobileOptimizations() {
        document.body.classList.add('mobile-optimized');
        
        // Larger touch targets
        const style = document.createElement('style');
        style.textContent = `
            .mobile-optimized button,
            .mobile-optimized .clickable {
                min-height: 44px;
                min-width: 44px;
                padding: 12px;
            }
            
            .mobile-optimized .glass-panel {
                border-radius: 20px;
                margin: 10px;
            }
            
            .mobile-optimized .dashboard-container {
                width: calc(100vw - 20px);
                height: calc(100vh - 40px);
            }
        `;
        document.head.appendChild(style);
    }

    enableCompactMode() {
        document.body.classList.add('compact-mode');
        
        // Reduce spacing and sizes
        const compactStyles = `
            .compact-mode .glass-panel {
                padding: 15px;
                gap: 15px;
            }
            
            .compact-mode .panel-title {
                font-size: 1.5rem;
            }
            
            .compact-mode .stat-card {
                padding: 15px;
            }
        `;
        
        this.injectStyles('compact-styles', compactStyles);
    }

    enableWideScreenMode() {
        document.body.classList.add('widescreen-mode');
        
        // Utilize extra space
        const widescreenStyles = `
            .widescreen-mode .main-container {
                grid-template-columns: 500px 1fr 500px;
                gap: 40px;
            }
            
            .widescreen-mode .dashboard-container {
                width: 600px;
            }
        `;
        
        this.injectStyles('widescreen-styles', widescreenStyles);
    }

    enableHighDPIMode() {
        document.body.classList.add('high-dpi-mode');
        
        // Optimize for high DPI displays
        const highDPIStyles = `
            .high-dpi-mode {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            
            .high-dpi-mode .glass-panel {
                border: 0.5px solid rgba(255, 255, 255, 0.3);
            }
            
            .high-dpi-mode .panel-title {
                font-weight: 300;
                letter-spacing: 0.5px;
            }
            
            .high-dpi-mode button {
                border: 0.5px solid rgba(255, 255, 255, 0.4);
            }
        `;
        
        this.injectStyles('high-dpi-styles', highDPIStyles);
    }

    // Performance optimizations
    enableLowBandwidthMode() {
        document.body.classList.add('low-bandwidth');
        
        // Disable heavy animations
        const lowBandwidthStyles = `
            .low-bandwidth * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .low-bandwidth .particles {
                display: none;
            }
            
            .low-bandwidth .glass-panel::before {
                display: none;
            }
        `;
        
        this.injectStyles('low-bandwidth-styles', lowBandwidthStyles);
    }

    enableHighBandwidthMode() {
        document.body.classList.add('high-bandwidth');
        
        // Enable enhanced animations and effects
        const highBandwidthStyles = `
            .high-bandwidth * {
                animation-duration: 0.6s !important;
                transition-duration: 0.3s !important;
            }
            
            .high-bandwidth .particles {
                display: block;
                animation: float 6s ease-in-out infinite;
            }
            
            .high-bandwidth .glass-panel::before {
                display: block;
                backdrop-filter: blur(20px);
            }
            
            .high-bandwidth .glass-panel {
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
        `;
        
        this.injectStyles('high-bandwidth-styles', highBandwidthStyles);
    }

    enablePerformanceMode() {
        document.body.classList.add('performance-mode');
        
        // Reduce visual effects
        const performanceStyles = `
            .performance-mode {
                backdrop-filter: none !important;
                box-shadow: none !important;
            }
            
            .performance-mode .glass-panel {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: none;
            }
            
            .performance-mode .particles {
                display: none;
            }
        `;
        
        this.injectStyles('performance-styles', performanceStyles);
    }

    disablePerformanceMode() {
        document.body.classList.remove('performance-mode');
        
        // Remove performance styles
        this.removeStyles('performance-styles');
        
        // Restore normal visual effects
        const normalStyles = `
            .glass-panel {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            }
            
            .particles {
                display: block;
            }
        `;
        
        this.injectStyles('normal-styles', normalStyles);
    }

    // Accessibility enhancements
    initializeAccessibility() {
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupHighContrastMode();
        this.setupReducedMotion();
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupHighContrastMode() {
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.enableHighContrastMode();
        }
    }

    setupReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.enableReducedMotion();
        }
    }

    enableHighContrastMode() {
        document.body.classList.add('high-contrast');
        
        const highContrastStyles = `
            .high-contrast {
                filter: contrast(150%);
            }
            
            .high-contrast .glass-panel {
                border: 2px solid white;
                background: rgba(0, 0, 0, 0.8);
            }
            
            .high-contrast button {
                border: 2px solid white;
            }
        `;
        
        this.injectStyles('high-contrast-styles', highContrastStyles);
    }

    enableReducedMotion() {
        document.body.classList.add('reduced-motion');
        
        const reducedMotionStyles = `
            .reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        
        this.injectStyles('reduced-motion-styles', reducedMotionStyles);
    }

    // Focus and productivity modes
    enableFocusMode() {
        document.body.classList.add('focus-mode');
        
        // Minimize distractions
        const focusStyles = `
            .focus-mode .particles {
                opacity: 0.3;
            }
            
            .focus-mode .glass-panel {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .focus-mode .notification-container {
                opacity: 0.7;
            }
        `;
        
        this.injectStyles('focus-styles', focusStyles);
        
        // Show focus indicator
        this.showFocusIndicator();
    }

    enableRelaxedMode() {
        document.body.classList.add('relaxed-mode');
        
        // Enhanced visual effects
        const relaxedStyles = `
            .relaxed-mode .particles {
                opacity: 1;
                animation-duration: 8s;
            }
            
            .relaxed-mode .glass-panel {
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
            }
        `;
        
        this.injectStyles('relaxed-styles', relaxedStyles);
    }

    // Utility methods
    injectStyles(id, styles) {
        let styleElement = document.getElementById(id);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = id;
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = styles;
    }

    removeStyles(id) {
        const styleElement = document.getElementById(id);
        if (styleElement) {
            styleElement.remove();
        }
    }

    dimBrightElements() {
        const brightElements = document.querySelectorAll('.bright, .glow, .sparkle');
        brightElements.forEach(el => {
            el.style.opacity = '0.6';
        });
    }

    restoreBrightElements() {
        const brightElements = document.querySelectorAll('.bright, .glow, .sparkle');
        brightElements.forEach(el => {
            el.style.opacity = '';
        });
    }

    showFocusIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'focus-indicator';
        indicator.innerHTML = '🎯 Focus Mode Active';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 20000;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 3000);
    }

    getRecentUserActivity() {
        const sessions = JSON.parse(localStorage.getItem('behavioralData') || '{}').sessions || [];
        return sessions.slice(-5).map(s => s.activity?.type || 'unknown');
    }

    startAdaptiveMonitoring() {
        // Monitor context changes
        setInterval(() => {
            this.adaptToContext();
        }, 30000); // Every 30 seconds
        
        // Monitor user preferences changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'userPreferences') {
                this.loadUserPreferences();
                this.adaptToContext();
            }
        });
        
        // Monitor system changes
        window.addEventListener('resize', () => {
            setTimeout(() => this.adaptToContext(), 100);
        });
    }

    // User preference management
    loadUserPreferences() {
        this.userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        this.applyUserPreferences();
    }

    applyUserPreferences() {
        const prefs = this.userPreferences;
        
        if (prefs.theme) {
            this.applyTheme(prefs.theme);
        }
        
        if (prefs.accessibility) {
            if (prefs.accessibility.highContrast) {
                this.enableHighContrastMode();
            }
            if (prefs.accessibility.reducedMotion) {
                this.enableReducedMotion();
            }
        }
        
        if (prefs.performance) {
            this.performanceMode = prefs.performance.mode || 'auto';
        }
    }

    updateUserPreferences(newPrefs) {
        this.userPreferences = { ...this.userPreferences, ...newPrefs };
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
        this.applyUserPreferences();
    }

    // Public API
    getCurrentAdaptations() {
        return Array.from(this.adaptations.entries());
    }

    forceAdaptation() {
        this.adaptToContext();
    }

    resetToDefaults() {
        // Remove all adaptive classes
        const classes = [
            'night-mode', 'mobile-optimized', 'compact-mode', 'widescreen-mode',
            'low-bandwidth', 'performance-mode', 'high-contrast', 'reduced-motion',
            'focus-mode', 'relaxed-mode', 'keyboard-navigation'
        ];
        
        classes.forEach(cls => document.body.classList.remove(cls));
        
        // Remove injected styles
        const styleIds = [
            'compact-styles', 'widescreen-styles', 'low-bandwidth-styles',
            'performance-styles', 'high-contrast-styles', 'reduced-motion-styles',
            'focus-styles', 'relaxed-styles'
        ];
        
        styleIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // Reset body styles
        document.body.style.background = '';
        document.body.style.filter = '';
    }

    getAdaptationSettings() {
        return {
            userPreferences: this.userPreferences,
            performanceMode: this.performanceMode,
            activeAdaptations: this.getCurrentAdaptations()
        };
    }
}

// Add adaptive styles
const adaptiveStyles = `
@keyframes fadeInOut {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}

.keyboard-navigation *:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
}

.focus-indicator {
    animation: fadeInOut 3s ease-in-out;
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = adaptiveStyles;
document.head.appendChild(styleElement);

// Initialize and expose globally
window.AdaptiveUIManager = AdaptiveUIManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adaptiveUI = new AdaptiveUIManager();
    });
} else {
    window.adaptiveUI = new AdaptiveUIManager();
}