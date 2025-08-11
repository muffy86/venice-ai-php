// UI Management System
class UIManager {
    constructor() {
        this.currentWorkspace = 'overview';
        this.chatHistory = [];
        this.isVoiceEnabled = false;
        this.speechRecognition = null;
        this.speechSynthesis = null;
        this.currentTab = 'dashboard';
        this.isSettingsOpen = false;
        this.isLoading = false;
        this.notifications = [];
        this.analytics = null;
        this.notificationManager = null;
        this.themeManager = null;
        this.errorHandler = null;
        this.performanceMonitor = null;
        
        // Enhanced systems
        this.dataManager = null;
        this.pluginManager = null;
        this.testFramework = null;
        
        // UI state
        this.activeModals = new Set();
        this.draggedElement = null;
        this.resizeObserver = null;
        this.shortcuts = new Map();
        this.isVoiceListening = false;
        this.currentTheme = 'dark';
        this.isInitialized = false;
        
        // Event handling
        this.eventListeners = new Map();
        
        // Don't call init() here - let the app call it when DOM is ready
        this.loadSavedSettings();
    }

    loadSavedSettings() {
        try {
            // Load saved theme
            const savedTheme = localStorage.getItem('ui_theme') || 'dark';
            this.currentTheme = savedTheme;
            
            // Load other UI preferences
            const savedSettings = localStorage.getItem('ui_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                // Apply saved settings to CONFIG if needed
                if (settings.animations !== undefined) {
                    CONFIG.ui.animations = settings.animations;
                }
                if (settings.notifications !== undefined) {
                    CONFIG.ui.notifications = settings.notifications;
                }
                if (settings.autoScroll !== undefined) {
                    CONFIG.ui.autoScroll = settings.autoScroll;
                }
            }
            
            console.log('✅ Saved settings loaded');
        } catch (error) {
            console.warn('⚠️ Failed to load saved settings:', error);
        }
    }

    async initialize() {
        try {
            // Initialize enhanced systems
            if (window.AnalyticsManager) {
                this.analytics = new window.AnalyticsManager();
                await this.analytics.initialize();
            }
            
            if (window.NotificationManager) {
                this.notificationManager = new window.NotificationManager();
                await this.notificationManager.initialize();
            }
            
            if (window.ThemeManager) {
                this.themeManager = new window.ThemeManager();
                await this.themeManager.initialize();
                this.setupThemeSelector();
            }
            
            if (window.ErrorHandler) {
                this.errorHandler = window.ErrorHandler;
            }
            
            if (window.PerformanceMonitor) {
                this.performanceMonitor = window.PerformanceMonitor;
            }
            
            // Track initialization
            if (this.analytics) {
                this.analytics.trackEvent('ui_initialized', {
                    timestamp: Date.now(),
                    features: ['analytics', 'notifications', 'themes']
                });
            }
            
            this.showNotification('UI Manager initialized successfully', 'success');
            
        } catch (error) {
            console.error('Failed to initialize UI Manager:', error);
            if (this.errorHandler) {
                this.errorHandler.handleError(error, 'UIManager.initialize');
            }
        }
    }

    // Settings Modal Management
    initializeSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        const saveSettings = document.getElementById('save-settings');
        const resetSettings = document.getElementById('reset-settings');
        const testConnection = document.getElementById('test-connection');

        // Open settings modal
        settingsBtn?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Close settings modal
        closeSettings?.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        // Close modal when clicking outside
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsTab(btn.dataset.tab);
            });
        });

        // Save settings
        saveSettings?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset settings
        resetSettings?.addEventListener('click', () => {
            this.resetSettings();
        });

        // Test connection
        testConnection?.addEventListener('click', () => {
            this.testApiConnection();
        });

        // Password toggle functionality
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                this.togglePasswordVisibility(btn.dataset.target);
            });
        });

        // Range input updates
        this.initializeRangeInputs();

        // Load current settings
        this.loadCurrentSettings();
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.loadCurrentSettings();
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }
    }

    loadCurrentSettings() {
        // Load API keys (masked for security)
        const openrouterKey = localStorage.getItem('openrouter_api_key') || '';
        const elevenlabsKey = localStorage.getItem('elevenlabs_api_key') || '';
        
        document.getElementById('openrouter-key').value = openrouterKey ? '••••••••••••••••' : '';
        document.getElementById('elevenlabs-key').value = elevenlabsKey ? '••••••••••••••••' : '';

        // Load other settings from CONFIG
        document.getElementById('default-model').value = CONFIG.agents.defaultModel;
        document.getElementById('enable-voice').checked = CONFIG.voice.enabled;
        document.getElementById('enable-tts').checked = CONFIG.voice.enableTTS;
        document.getElementById('use-elevenlabs').checked = CONFIG.voice.useElevenLabs;
        document.getElementById('voice-selection').value = CONFIG.voice.voice;
        document.getElementById('speech-rate').value = CONFIG.voice.speechRate;
        document.getElementById('speech-pitch').value = CONFIG.voice.speechPitch;
        document.getElementById('speech-volume').value = CONFIG.voice.speechVolume;
        document.getElementById('max-agents').value = CONFIG.agents.maxConcurrent;
        document.getElementById('auto-spawn').checked = CONFIG.system.autoSpawnAgents;
        document.getElementById('debug-mode').checked = CONFIG.system.debug;
        document.getElementById('health-check-interval').value = CONFIG.system.healthCheckInterval / 1000;
        document.getElementById('memory-threshold').value = CONFIG.system.maxMemoryUsage;
        document.getElementById('theme-select').value = CONFIG.ui.theme;
        document.getElementById('enable-animations').checked = CONFIG.ui.animations;
        document.getElementById('enable-notifications').checked = CONFIG.ui.notifications;
        document.getElementById('auto-scroll').checked = CONFIG.ui.autoScroll;
        document.getElementById('refresh-interval').value = CONFIG.ui.refreshInterval / 1000;

        // Update range value displays
        this.updateRangeDisplays();
    }

    saveSettings() {
        try {
            // Save API keys to localStorage (if changed)
            const openrouterInput = document.getElementById('openrouter-key');
            const elevenlabsInput = document.getElementById('elevenlabs-key');
            
            if (openrouterInput.value && !openrouterInput.value.includes('••••')) {
                localStorage.setItem('openrouter_api_key', openrouterInput.value);
                CONFIG.apis.openRouter.apiKey = openrouterInput.value;
            }
            
            if (elevenlabsInput.value && !elevenlabsInput.value.includes('••••')) {
                localStorage.setItem('elevenlabs_api_key', elevenlabsInput.value);
                CONFIG.apis.elevenLabs.apiKey = elevenlabsInput.value;
            }

            // Update CONFIG object
            CONFIG.agents.defaultModel = document.getElementById('default-model').value;
            CONFIG.voice.enabled = document.getElementById('enable-voice').checked;
            CONFIG.voice.enableTTS = document.getElementById('enable-tts').checked;
            CONFIG.voice.useElevenLabs = document.getElementById('use-elevenlabs').checked;
            CONFIG.voice.voice = document.getElementById('voice-selection').value;
            CONFIG.voice.speechRate = parseFloat(document.getElementById('speech-rate').value);
            CONFIG.voice.speechPitch = parseFloat(document.getElementById('speech-pitch').value);
            CONFIG.voice.speechVolume = parseFloat(document.getElementById('speech-volume').value);
            CONFIG.agents.maxConcurrent = parseInt(document.getElementById('max-agents').value);
            CONFIG.system.autoSpawnAgents = document.getElementById('auto-spawn').checked;
            CONFIG.system.debug = document.getElementById('debug-mode').checked;
            CONFIG.system.healthCheckInterval = parseInt(document.getElementById('health-check-interval').value) * 1000;
            CONFIG.system.maxMemoryUsage = parseInt(document.getElementById('memory-threshold').value);
            CONFIG.ui.theme = document.getElementById('theme-select').value;
            CONFIG.ui.animations = document.getElementById('enable-animations').checked;
            CONFIG.ui.notifications = document.getElementById('enable-notifications').checked;
            CONFIG.ui.autoScroll = document.getElementById('auto-scroll').checked;
            CONFIG.ui.refreshInterval = parseInt(document.getElementById('refresh-interval').value) * 1000;

            // Save to localStorage
            localStorage.setItem('ai_workforce_config', JSON.stringify(CONFIG));

            // Update UI status
            this.updateApiStatus();
            this.updateVoiceStatus();

            // Show success message
            this.showNotification('Settings saved successfully!', 'success');
            
            // Close modal
            this.closeSettingsModal();

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings: ' + error.message, 'error');
        }
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This will clear your API keys.')) {
            // Clear localStorage
            localStorage.removeItem('openrouter_api_key');
            localStorage.removeItem('elevenlabs_api_key');
            localStorage.removeItem('ai_workforce_config');

            // Reset CONFIG to defaults (reload page to get fresh config)
            location.reload();
        }
    }

    async testApiConnection() {
        const testBtn = document.getElementById('test-connection');
        const originalText = testBtn.innerHTML;
        
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        testBtn.disabled = true;

        try {
            // Test OpenRouter connection
            const openrouterKey = localStorage.getItem('openrouter_api_key');
            if (openrouterKey) {
                await this.testOpenRouterConnection(openrouterKey);
            }

            // Test ElevenLabs connection
            const elevenlabsKey = localStorage.getItem('elevenlabs_api_key');
            if (elevenlabsKey) {
                await this.testElevenLabsConnection(elevenlabsKey);
            }

            this.showNotification('API connections tested successfully!', 'success');

        } catch (error) {
            console.error('API test failed:', error);
            this.showNotification('API test failed: ' + error.message, 'error');
        } finally {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }

    async testOpenRouterConnection(apiKey) {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('OpenRouter API connection failed');
        }

        // Update status
        const statusCard = document.getElementById('openrouter-status');
        statusCard.classList.add('connected');
        statusCard.innerHTML = '<i class="fas fa-circle status-indicator"></i><span>OpenRouter: Connected</span>';
    }

    async testElevenLabsConnection(apiKey) {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('ElevenLabs API connection failed');
        }

        // Update status
        const statusCard = document.getElementById('elevenlabs-status');
        statusCard.classList.add('connected');
        statusCard.innerHTML = '<i class="fas fa-circle status-indicator"></i><span>ElevenLabs: Connected</span>';
    }

    togglePasswordVisibility(targetId) {
        const input = document.getElementById(targetId);
        const button = document.querySelector(`[data-target="${targetId}"]`);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    initializeRangeInputs() {
        const ranges = ['speech-rate', 'speech-pitch', 'speech-volume'];
        
        ranges.forEach(rangeId => {
            const range = document.getElementById(rangeId);
            const valueDisplay = document.getElementById(rangeId.replace('speech-', '') + '-value');
            
            if (range && valueDisplay) {
                range.addEventListener('input', () => {
                    valueDisplay.textContent = range.value;
                });
            }
        });
    }

    updateRangeDisplays() {
        document.getElementById('rate-value').textContent = document.getElementById('speech-rate').value;
        document.getElementById('pitch-value').textContent = document.getElementById('speech-pitch').value;
        document.getElementById('volume-value').textContent = document.getElementById('speech-volume').value;
    }

    // API Status Monitoring
    initializeApiStatusMonitoring() {
        this.updateApiStatus();
        
        // Check API status periodically
        setInterval(() => {
            this.updateApiStatus();
        }, 30000); // Check every 30 seconds
    }

    updateApiStatus() {
        const apiStatusElement = document.getElementById('api-status');
        if (!apiStatusElement) {
            console.warn('API status element not found');
            return;
        }
        
        const openrouterKey = localStorage.getItem('openrouter_api_key');
        const elevenlabsKey = localStorage.getItem('elevenlabs_api_key');

        if (openrouterKey) {
            apiStatusElement.classList.remove('offline');
            apiStatusElement.classList.add('online');
            apiStatusElement.innerHTML = '<i class="fas fa-key"></i><span>API Configured</span>';
        } else {
            apiStatusElement.classList.remove('online');
            apiStatusElement.classList.add('offline');
            apiStatusElement.innerHTML = '<i class="fas fa-key"></i><span>API Not Configured</span>';
        }
    }

    updateVoiceStatus() {
        const voiceStatusElement = document.getElementById('voice-status');
        if (!voiceStatusElement) {
            console.warn('Voice status element not found');
            return;
        }
        
        if (CONFIG.voice.enabled && CONFIG.voice.enableTTS) {
            voiceStatusElement.classList.remove('offline');
            voiceStatusElement.classList.add('online');
            voiceStatusElement.innerHTML = '<i class="fas fa-microphone"></i><span>Voice On</span>';
        } else {
            voiceStatusElement.classList.remove('online');
            voiceStatusElement.classList.add('offline');
            voiceStatusElement.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Voice Off</span>';
        }
    }

    // Enhanced Voice Features
    // New UI Component Initializers
    initializeAnalyticsDashboard() {
        // Setup analytics charts and metrics
        this.setupAnalyticsCharts();
        this.setupAnalyticsFilters();
        this.setupAnalyticsExport();
        
        // Real-time updates
        setInterval(() => {
            this.updateAnalyticsDashboard();
        }, 30000); // Update every 30 seconds
    }

    initializeTestingInterface() {
        // Setup test controls
        this.setupTestControls();
        this.setupTestResults();
        
        // Load available tests
        if (this.testFramework) {
            this.loadAvailableTests();
        }
    }

    initializeMonitoringDashboard() {
        // Setup system health monitoring
        this.setupHealthIndicators();
        this.setupPerformanceMetrics();
        this.setupErrorLogs();
        
        // Real-time monitoring
        setInterval(() => {
            this.updateMonitoringDashboard();
        }, 5000); // Update every 5 seconds
    }

    initializeSecurityInterface() {
        // Setup security controls
        this.setupSecuritySettings();
        this.setupSessionManagement();
        this.setupSecurityLogs();
    }

    initializePerformanceInterface() {
        // Setup performance controls
        this.setupPerformanceSettings();
        this.setupCacheManagement();
        this.setupOptimizationControls();
    }

    initializeAdvancedSettings() {
        // Setup advanced configuration
        this.setupDebugControls();
        this.setupExperimentalFeatures();
        this.setupSystemActions();
    }

    // Analytics Dashboard Methods
    setupAnalyticsCharts() {
        // Initialize charts for usage statistics
        const usageChart = document.getElementById('usage-chart');
        if (usageChart && this.analyticsManager) {
            // Setup Chart.js or similar charting library
            this.initializeUsageChart(usageChart);
        }
        
        const performanceChart = document.getElementById('performance-chart');
        if (performanceChart && this.performanceMonitor) {
            this.initializePerformanceChart(performanceChart);
        }
    }

    setupAnalyticsFilters() {
        const timeRangeSelect = document.getElementById('analytics-time-range');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.updateAnalyticsTimeRange(e.target.value);
            });
        }
        
        const metricSelect = document.getElementById('analytics-metric');
        if (metricSelect) {
            metricSelect.addEventListener('change', (e) => {
                this.updateAnalyticsMetric(e.target.value);
            });
        }
    }

    setupAnalyticsExport() {
        const exportBtn = document.getElementById('export-analytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalyticsData();
            });
        }
    }

    // Testing Interface Methods
    setupTestControls() {
        const runAllBtn = document.getElementById('run-all-tests');
        if (runAllBtn) {
            runAllBtn.addEventListener('click', () => {
                this.runAllTests();
            });
        }
        
        const runSelectedBtn = document.getElementById('run-selected-tests');
        if (runSelectedBtn) {
            runSelectedBtn.addEventListener('click', () => {
                this.runSelectedTests();
            });
        }
        
        const clearResultsBtn = document.getElementById('clear-test-results');
        if (clearResultsBtn) {
            clearResultsBtn.addEventListener('click', () => {
                this.clearTestResults();
            });
        }
    }

    setupTestResults() {
        // Initialize test results display
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p>No tests run yet</p>';
        }
    }

    // Monitoring Dashboard Methods
    setupHealthIndicators() {
        // Initialize health status indicators
        this.updateHealthStatus();
    }

    setupPerformanceMetrics() {
        // Initialize performance metrics display
        this.updatePerformanceMetrics();
    }

    setupErrorLogs() {
        const clearLogsBtn = document.getElementById('clear-error-logs');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                this.clearErrorLogs();
            });
        }
        
        const exportLogsBtn = document.getElementById('export-error-logs');
        if (exportLogsBtn) {
            exportLogsBtn.addEventListener('click', () => {
                this.exportErrorLogs();
            });
        }
    }

    // Security Interface Methods
    setupSecuritySettings() {
        const encryptionToggle = document.getElementById('enable-encryption');
        if (encryptionToggle) {
            encryptionToggle.addEventListener('change', (e) => {
                this.toggleEncryption(e.target.checked);
            });
        }
        
        const sessionTimeoutInput = document.getElementById('session-timeout');
        if (sessionTimeoutInput) {
            sessionTimeoutInput.addEventListener('change', (e) => {
                this.updateSessionTimeout(e.target.value);
            });
        }
    }

    setupSessionManagement() {
        const clearSessionsBtn = document.getElementById('clear-sessions');
        if (clearSessionsBtn) {
            clearSessionsBtn.addEventListener('click', () => {
                this.clearAllSessions();
            });
        }
    }

    setupSecurityLogs() {
        const viewSecurityLogsBtn = document.getElementById('view-security-logs');
        if (viewSecurityLogsBtn) {
            viewSecurityLogsBtn.addEventListener('click', () => {
                this.viewSecurityLogs();
            });
        }
    }

    // Performance Interface Methods
    setupPerformanceSettings() {
        const cacheEnabledToggle = document.getElementById('cache-enabled');
        if (cacheEnabledToggle) {
            cacheEnabledToggle.addEventListener('change', (e) => {
                this.toggleCache(e.target.checked);
            });
        }
        
        const compressionToggle = document.getElementById('data-compression');
        if (compressionToggle) {
            compressionToggle.addEventListener('change', (e) => {
                this.toggleCompression(e.target.checked);
            });
        }
    }

    setupCacheManagement() {
        const clearCacheBtn = document.getElementById('clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }
        
        const cacheSizeInput = document.getElementById('cache-size');
        if (cacheSizeInput) {
            cacheSizeInput.addEventListener('change', (e) => {
                this.updateCacheSize(e.target.value);
            });
        }
    }

    setupOptimizationControls() {
        const optimizeBtn = document.getElementById('optimize-performance');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.optimizePerformance();
            });
        }
    }

    // Advanced Settings Methods
    setupDebugControls() {
        const debugModeToggle = document.getElementById('debug-mode');
        if (debugModeToggle) {
            debugModeToggle.addEventListener('change', (e) => {
                this.toggleDebugMode(e.target.checked);
            });
        }
    }

    setupExperimentalFeatures() {
        const experimentalToggle = document.getElementById('experimental-features');
        if (experimentalToggle) {
            experimentalToggle.addEventListener('change', (e) => {
                this.toggleExperimentalFeatures(e.target.checked);
            });
        }
    }

    setupSystemActions() {
        const resetBtn = document.getElementById('reset-system');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSystem();
            });
        }
        
        const exportBtn = document.getElementById('export-settings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }
        
        const importBtn = document.getElementById('import-settings');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importSettings();
            });
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        // Define shortcuts
        this.shortcuts.set('Ctrl+Shift+S', () => this.openSettingsModal());
        this.shortcuts.set('Ctrl+Shift+T', () => this.loadWorkspace('testing'));
        this.shortcuts.set('Ctrl+Shift+M', () => this.loadWorkspace('monitoring'));
        this.shortcuts.set('Ctrl+Shift+A', () => this.loadWorkspace('analytics'));
        this.shortcuts.set('Escape', () => this.closeAllModals());
        this.shortcuts.set('Ctrl+/', () => this.toggleCommandPalette());
        
        // Setup event listener
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);
            const action = this.shortcuts.get(key);
            if (action) {
                e.preventDefault();
                action();
            }
        });
    }

    getKeyCombo(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        if (event.metaKey) parts.push('Meta');
        
        if (event.key !== 'Control' && event.key !== 'Shift' && 
            event.key !== 'Alt' && event.key !== 'Meta') {
            parts.push(event.key);
        }
        
        return parts.join('+');
    }

    // Drag and Drop
    setupDragAndDrop() {
        // Enable drag and drop for workspace tabs
        const workspaceTabs = document.querySelectorAll('.tab-header');
        if (workspaceTabs) {
            workspaceTabs.forEach(tab => {
                tab.draggable = true;
                tab.addEventListener('dragstart', (e) => {
                    this.draggedElement = e.target;
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                tab.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                });
                
                tab.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (this.draggedElement && this.draggedElement !== e.target) {
                        this.reorderWorkspaceTabs(this.draggedElement, e.target);
                    }
                    this.draggedElement = null;
                });
            });
        }
    }

    // Responsive Design
    setupResponsiveDesign() {
        if (!document.body) {
            console.warn('⚠️ Document body not ready for responsive design setup');
            return;
        }
        
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.handleResize(entry);
            }
        });
        
        this.resizeObserver.observe(document.body);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    initializeVoiceFeatures() {
        // Test voice button
        const testVoiceBtn = document.getElementById('test-voice');
        testVoiceBtn?.addEventListener('click', () => {
            this.testVoice();
        });

        // Update voice status
        this.updateVoiceStatus();
    }

    async testVoice() {
        const testText = "Hello! This is a test of the voice synthesis system. Voice settings are working correctly.";
        
        try {
            if (CONFIG.voice.useElevenLabs && CONFIG.apis.elevenLabs.apiKey) {
                await this.speakWithElevenLabs(testText);
            } else {
                await this.speakWithBrowserTTS(testText);
            }
            
            this.showNotification('Voice test completed successfully!', 'success');
        } catch (error) {
            console.error('Voice test failed:', error);
            this.showNotification('Voice test failed: ' + error.message, 'error');
        }
    }

    async speakWithElevenLabs(text) {
        const response = await fetch(`${CONFIG.apis.elevenLabs.baseUrl}/text-to-speech/${CONFIG.apis.elevenLabs.voices[CONFIG.voice.voice]}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': CONFIG.apis.elevenLabs.apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) {
            throw new Error('ElevenLabs TTS failed');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = CONFIG.voice.speechVolume;
        await audio.play();
    }

    async speakWithBrowserTTS(text) {
        if (!('speechSynthesis' in window)) {
            throw new Error('Browser TTS not supported');
        }

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = CONFIG.voice.speechRate;
            utterance.pitch = CONFIG.voice.speechPitch;
            utterance.volume = CONFIG.voice.speechVolume;
            utterance.lang = CONFIG.voice.language || 'en-US';

            utterance.onend = resolve;
            utterance.onerror = reject;

            speechSynthesis.speak(utterance);
        });
    }

    async init() {
        try {
            console.log('🎨 Initializing UI Manager...');
            
            // Initialize enhanced systems
            await this.initializeEnhancedSystems();
            
            // Track UI initialization
            if (this.analytics) {
                this.analytics.trackEvent('ui_initialization_started');
            }
            
            this.setupEventListeners();
            this.initializeVoice();
            this.loadWorkspace('overview');
            this.startUIUpdater();
            
            // Settings modal functionality
            this.initializeSettingsModal();
            
            // Voice functionality
            this.initializeVoiceFeatures();
            
            // API status monitoring
            this.initializeApiStatusMonitoring();
            
            // Initialize new UI components
            this.initializeAnalyticsDashboard();
            this.initializeTestingInterface();
            this.initializeMonitoringDashboard();
            this.initializeSecurityInterface();
            this.initializePerformanceInterface();
            this.initializeAdvancedSettings();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup drag and drop
            this.setupDragAndDrop();
            
            // Setup responsive design
            this.setupResponsiveDesign();
            
            // Apply saved theme
            await this.applySavedTheme();
            
            this.isInitialized = true;
            console.log('✅ UI Manager initialized successfully');
            
            // Track successful initialization
            if (this.analytics) {
                this.analytics.trackEvent('ui_initialization_completed');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize UI Manager:', error);
            if (this.errorHandler) {
                this.errorHandler.handleError(error, 'UIManager.init');
            }
            this.showNotification('Failed to initialize UI', 'error');
        }
    }

    async initializeEnhancedSystems() {
        try {
            // Use global data manager instance
            if (window.dataManager) {
                this.dataManager = window.dataManager;
            }
            
            // Use global plugin manager instance
            if (window.pluginManager) {
                this.pluginManager = window.pluginManager;
            }
            
            // Initialize test framework
            if (window.TestFramework) {
                this.testFramework = new TestFramework();
            }
            
            console.log('✅ Enhanced systems initialized');
        } catch (error) {
            console.error('❌ Failed to initialize enhanced systems:', error);
            throw error;
        }
    }

    async initializeVoice() {
        if (!CONFIG.voice.enabled) {
            console.log('🔇 Voice features disabled in config');
            return;
        }

        try {
            // Check for speech recognition support
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.speechRecognition = new SpeechRecognition();
                this.speechRecognition.continuous = false;
                this.speechRecognition.interimResults = false;
                this.speechRecognition.lang = CONFIG.voice.language;

                this.speechRecognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    document.getElementById('chat-input').value = transcript;
                    this.sendMessage();
                };

                this.speechRecognition.onerror = (event) => {
                    console.warn('Speech recognition error:', event.error);
                    this.showNotification('Voice recognition error: ' + event.error, 'warning');
                    this.stopVoiceInput();
                };

                this.speechRecognition.onend = () => {
                    this.stopVoiceInput();
                };

                console.log('🎤 Speech recognition initialized');
            } else {
                console.warn('⚠️ Speech recognition not supported');
                this.showNotification('Speech recognition not supported in this browser', 'warning');
            }

            // Check for speech synthesis support
            if ('speechSynthesis' in window) {
                this.speechSynthesis = window.speechSynthesis;
                console.log('🔊 Speech synthesis initialized');
            } else {
                console.warn('⚠️ Speech synthesis not supported');
            }

            // Initialize ElevenLabs if configured
            if (CONFIG.apis.elevenLabs.apiKey) {
                console.log('🎵 ElevenLabs integration ready');
            }

            this.isVoiceListening = false;
            this.showNotification('Voice system initialized', 'success');

        } catch (error) {
            console.error('Failed to initialize voice features:', error);
            this.showNotification('Voice initialization failed: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // Workspace navigation
        const workspaceBtns = document.querySelectorAll('.tab-header');
        if (workspaceBtns) {
            workspaceBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const workspace = e.target.dataset.tab;
                    this.loadWorkspace(workspace);
                });
            });
        }

        // Agent spawning
        const spawnBtn = document.getElementById('spawn-agent-btn');
        if (spawnBtn) {
            spawnBtn.addEventListener('click', () => this.showSpawnModal());
        }

        // Modal handling
        this.setupModalHandlers();

        // Chat interface
        this.setupChatInterface();

        // System controls
        this.setupSystemControls();

        // Voice controls
        this.setupVoiceControls();
    }

    setupModalHandlers() {
        const modal = document.getElementById('spawn-agent-modal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = modal?.querySelector('.cancel-btn');
        const spawnBtn = modal?.querySelector('.spawn-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideSpawnModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideSpawnModal());
        }

        if (spawnBtn) {
            spawnBtn.addEventListener('click', () => this.handleAgentSpawn());
        }

        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideSpawnModal();
                }
            });
        }

        // Agent type selection
        const typeSelect = document.getElementById('agent-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.updateAgentCapabilities(e.target.value);
            });
        }
    }

    setupChatInterface() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceBtn = document.getElementById('voice-btn');

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
    }

    setupSystemControls() {
        const emergencyStop = document.getElementById('emergency-stop');
        const pauseSystem = document.getElementById('pause-system');
        const clearTasks = document.getElementById('clear-tasks');

        if (emergencyStop) {
            emergencyStop.addEventListener('click', () => this.emergencyStop());
        }

        if (pauseSystem) {
            pauseSystem.addEventListener('click', () => this.toggleSystemPause());
        }

        if (clearTasks) {
            clearTasks.addEventListener('click', () => this.clearAllTasks());
        }
    }

    setupVoiceControls() {
        // Set up voice toggle button
        const voiceToggleBtn = document.getElementById('voice-toggle');
        if (voiceToggleBtn) {
            voiceToggleBtn.addEventListener('click', () => {
                this.toggleVoice();
            });
        }
        
        // Voice controls are already initialized in initializeVoice()
        // This method is kept for any additional voice-related UI setup
        console.log('🎤 Voice controls setup completed');
    }

    // Workspace Management
    loadWorkspace(workspaceName) {
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Show selected tab pane
        const tabPane = document.getElementById(`${workspaceName}-tab`);
        if (tabPane) {
            tabPane.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.tab-header').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-tab="${workspaceName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentWorkspace = workspaceName;
        this.loadWorkspaceContent(workspaceName);
    }

    loadWorkspaceContent(workspaceName) {
        switch (workspaceName) {
            case 'overview':
                this.loadOverviewContent();
                break;
            case 'code':
                this.loadCodeContent();
                break;
            case 'research':
                this.loadResearchContent();
                break;
            case 'vision':
                this.loadVisionContent();
                break;
            case 'automation':
                this.loadAutomationContent();
                break;
        }
    }

    loadOverviewContent() {
        // Update metrics and charts
        this.updateSystemMetrics();
        this.updatePerformanceChart();
    }

    loadCodeContent() {
        // Initialize code editor if not already done
        if (!window.codeEditor) {
            this.initializeCodeEditor();
        }
    }

    loadResearchContent() {
        // Load recent research results
        this.loadRecentResearch();
    }

    loadVisionContent() {
        // Initialize vision tools
        this.initializeVisionTools();
    }

    loadAutomationContent() {
        // Load automation workflows
        this.loadAutomationWorkflows();
    }

    // Agent Spawning
    showSpawnModal() {
        const modal = document.getElementById('spawn-agent-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateAgentTypes();
        }
    }

    hideSpawnModal() {
        const modal = document.getElementById('spawn-agent-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetSpawnForm();
        }
    }

    populateAgentTypes() {
        const typeSelect = document.getElementById('agent-type');
        if (!typeSelect) return;

        typeSelect.innerHTML = '<option value="">Select Agent Type</option>';
        
        Object.keys(CONFIG.agents.capabilities).forEach(type => {
            const capability = CONFIG.agents.capabilities[type];
            const option = document.createElement('option');
            option.value = type;
            option.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${capability.description}`;
            typeSelect.appendChild(option);
        });
    }

    updateAgentCapabilities(agentType) {
        const capabilitiesContainer = document.getElementById('agent-capabilities');
        if (!capabilitiesContainer || !agentType) return;

        const capability = CONFIG.agents.capabilities[agentType];
        if (!capability) return;

        capabilitiesContainer.innerHTML = `
            <h4>Capabilities:</h4>
            <ul>
                ${capability.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
            <h4>Available Tools:</h4>
            <ul>
                ${capability.tools.map(tool => `<li>${tool}</li>`).join('')}
            </ul>
        `;
    }

    async handleAgentSpawn() {
        const form = document.getElementById('spawn-agent-form');
        const formData = new FormData(form);
        
        const config = {
            name: formData.get('agent-name') || `Agent-${Date.now()}`,
            type: formData.get('agent-type'),
            model: formData.get('agent-model') || 'gpt-3.5-turbo',
            autonomyLevel: formData.get('autonomy-level') || 'supervised',
            capabilities: Array.from(formData.getAll('capabilities'))
        };

        if (!config.type) {
            this.showNotification('Please select an agent type', 'error');
            return;
        }

        try {
            this.showNotification('Spawning agent...', 'info');
            const agent = await agentManager.createAgent(config);
            this.hideSpawnModal();
            this.showNotification(`Agent ${agent.name} spawned successfully!`, 'success');
        } catch (error) {
            this.showNotification(`Failed to spawn agent: ${error.message}`, 'error');
        }
    }

    resetSpawnForm() {
        const form = document.getElementById('spawn-agent-form');
        if (form) {
            form.reset();
            document.getElementById('agent-capabilities').innerHTML = '';
        }
    }

    // Chat Interface
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        input.value = '';

        // Process message
        try {
            const response = await this.processUserMessage(message);
            this.addMessageToChat('assistant', response);
            
            // Text-to-speech if enabled
            if (this.isVoiceEnabled && CONFIG.voice.enableTTS) {
                this.speakText(response);
            }
        } catch (error) {
            this.addMessageToChat('system', `Error: ${error.message}`);
        }
    }

    async processUserMessage(message) {
        // Determine if this is a command or a general query
        if (message.startsWith('/')) {
            return await this.processCommand(message);
        }

        // Create a task for the best available agent
        const task = {
            id: 'task_' + Date.now(),
            description: message,
            priority: 'medium',
            requiredCapabilities: this.extractCapabilities(message),
            preferredAgentType: this.determineAgentType(message)
        };

        const result = await agentManager.assignTask(task);
        return result ? result.response : 'Task has been queued for processing.';
    }

    async processCommand(command) {
        const [cmd, ...args] = command.slice(1).split(' ');
        
        switch (cmd.toLowerCase()) {
            case 'spawn':
                return this.handleSpawnCommand(args);
            case 'list':
                return this.handleListCommand(args);
            case 'stop':
                return this.handleStopCommand(args);
            case 'status':
                return this.handleStatusCommand();
            case 'help':
                return this.getHelpText();
            default:
                return `Unknown command: ${cmd}. Type /help for available commands.`;
        }
    }

    extractCapabilities(message) {
        const capabilities = [];
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
            capabilities.push('coding');
        }
        if (lowerMessage.includes('research') || lowerMessage.includes('search')) {
            capabilities.push('research');
        }
        if (lowerMessage.includes('image') || lowerMessage.includes('visual')) {
            capabilities.push('vision');
        }
        if (lowerMessage.includes('automate') || lowerMessage.includes('script')) {
            capabilities.push('automation');
        }
        
        return capabilities;
    }

    determineAgentType(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
            return 'coding';
        }
        if (lowerMessage.includes('research') || lowerMessage.includes('search')) {
            return 'research';
        }
        if (lowerMessage.includes('image') || lowerMessage.includes('visual')) {
            return 'vision';
        }
        if (lowerMessage.includes('automate') || lowerMessage.includes('script')) {
            return 'automation';
        }
        
        return 'general';
    }

    addMessageToChat(sender, content) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="sender">${sender === 'user' ? 'You' : 'Assistant'}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Store in history
        this.chatHistory.push({ sender, content, timestamp });
        
        // Limit history
        if (this.chatHistory.length > CONFIG.ui.maxChatHistory) {
            this.chatHistory = this.chatHistory.slice(-CONFIG.ui.maxChatHistory);
        }
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Voice Interface
    toggleVoiceInput() {
        if (this.isVoiceListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        if (!this.speechRecognition) {
            this.showNotification('Speech recognition not supported', 'error');
            return;
        }

        this.isVoiceListening = true;
        this.speechRecognition.start();
        
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
    }

    stopVoiceInput() {
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        
        this.isVoiceListening = false;
        
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    async speakText(text) {
        if (CONFIG.voice.useElevenLabs && CONFIG.apis.elevenLabs.apiKey) {
            await this.speakWithElevenLabs(text);
        } else if (this.speechSynthesis) {
            this.speakWithBrowserTTS(text);
        }
    }

    async speakWithElevenLabs(text) {
        try {
            const response = await fetch(`${CONFIG.apis.elevenLabs.baseUrl}/text-to-speech/${CONFIG.apis.elevenLabs.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': CONFIG.apis.elevenLabs.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();
            }
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            this.speakWithBrowserTTS(text);
        }
    }

    speakWithBrowserTTS(text) {
        if (!this.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = CONFIG.voice.speechRate;
        utterance.pitch = CONFIG.voice.speechPitch;
        utterance.volume = CONFIG.voice.speechVolume;
        
        this.speechSynthesis.speak(utterance);
    }

    toggleVoice() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        
        const voiceToggleBtn = document.getElementById('voice-toggle');
        if (voiceToggleBtn) {
            const icon = voiceToggleBtn.querySelector('i');
            const text = voiceToggleBtn.querySelector('span');
            
            if (this.isVoiceEnabled) {
                if (icon) icon.className = 'fas fa-microphone';
                if (text) text.textContent = 'Disable Voice';
                voiceToggleBtn.classList.add('active');
                this.showNotification('Voice enabled', 'success');
            } else {
                if (icon) icon.className = 'fas fa-microphone-slash';
                if (text) text.textContent = 'Enable Voice';
                voiceToggleBtn.classList.remove('active');
                this.showNotification('Voice disabled', 'info');
            }
        }
        
        // Update voice status indicator
        this.updateVoiceStatus();
    }

    // System Controls
    emergencyStop() {
        if (confirm('Are you sure you want to perform an emergency stop? This will halt all agents and clear all tasks.')) {
            agentManager.getAllAgents().forEach(agent => {
                agentManager.destroyAgent(agent.id);
            });
            agentManager.taskQueue = [];
            this.showNotification('Emergency stop executed', 'warning');
        }
    }

    toggleSystemPause() {
        // Implementation for pausing/resuming the system
        this.showNotification('System pause/resume functionality coming soon', 'info');
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all queued tasks?')) {
            agentManager.taskQueue = [];
            agentManager.renderTaskQueue();
            this.showNotification('All tasks cleared', 'info');
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        // Check if document.body exists
        if (!document.body) {
            console.warn('Cannot show notification: document.body is null');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Manual close
        const closeBtn = notification.querySelector('.close-notification');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Utility Methods
    updateSystemMetrics() {
        // Update various system metrics displays
        agentManager.updateMetrics();
    }

    updatePerformanceChart() {
        // Update performance visualization
        // This would integrate with a charting library like Chart.js
    }

    initializeCodeEditor() {
        // Initialize code editor (would use Monaco Editor or similar)
        console.log('Code editor initialization');
    }

    loadRecentResearch() {
        // Load and display recent research results
        console.log('Loading recent research');
    }

    initializeVisionTools() {
        // Initialize computer vision tools
        console.log('Initializing vision tools');
    }

    loadAutomationWorkflows() {
        // Load automation workflows
        console.log('Loading automation workflows');
    }

    startUIUpdater() {
        setInterval(() => {
            this.updateSystemMetrics();
        }, CONFIG.ui.refreshInterval);
    }

    // Implementation Methods for New Features
    
    // Analytics Methods
    updateAnalyticsDashboard() {
        if (!this.analyticsManager) return;
        
        const data = this.analyticsManager.getAnalyticsData();
        this.updateUsageStats(data.usage);
        this.updatePerformanceStats(data.performance);
        this.updateAgentActivity(data.agents);
    }

    updateUsageStats(usage) {
        const totalTasks = document.getElementById('total-tasks');
        const activeAgents = document.getElementById('active-agents');
        const avgResponseTime = document.getElementById('avg-response-time');
        
        if (totalTasks) totalTasks.textContent = usage.totalTasks || 0;
        if (activeAgents) activeAgents.textContent = usage.activeAgents || 0;
        if (avgResponseTime) avgResponseTime.textContent = `${usage.avgResponseTime || 0}ms`;
    }

    updatePerformanceStats(performance) {
        const memoryUsage = document.getElementById('memory-usage');
        const cpuUsage = document.getElementById('cpu-usage');
        const networkLatency = document.getElementById('network-latency');
        
        if (memoryUsage) memoryUsage.textContent = `${performance.memoryUsage || 0}MB`;
        if (cpuUsage) cpuUsage.textContent = `${performance.cpuUsage || 0}%`;
        if (networkLatency) networkLatency.textContent = `${performance.networkLatency || 0}ms`;
    }

    updateAgentActivity(agents) {
        const agentList = document.getElementById('agent-activity-list');
        if (!agentList || !agents) return;
        
        agentList.innerHTML = agents.map(agent => `
            <div class="agent-activity-item">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-status ${agent.status}">${agent.status}</span>
                <span class="agent-tasks">${agent.tasksCompleted} tasks</span>
            </div>
        `).join('');
    }

    exportAnalyticsData() {
        if (!this.analyticsManager) return;
        
        const data = this.analyticsManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Analytics data exported successfully', 'success');
    }

    // Testing Methods
    loadAvailableTests() {
        const testList = document.getElementById('test-list');
        if (!testList || !this.testFramework) return;
        
        const tests = this.testFramework.getAvailableTests();
        testList.innerHTML = tests.map(test => `
            <div class="test-item">
                <input type="checkbox" id="test-${test.id}" value="${test.id}">
                <label for="test-${test.id}">
                    <span class="test-name">${test.name}</span>
                    <span class="test-description">${test.description}</span>
                </label>
            </div>
        `).join('');
    }

    async runAllTests() {
        if (!this.testFramework) return;
        
        this.showNotification('Running all tests...', 'info');
        const results = await this.testFramework.runAllTests();
        this.displayTestResults(results);
    }

    async runSelectedTests() {
        if (!this.testFramework) return;
        
        const selectedTests = Array.from(document.querySelectorAll('#test-list input:checked'))
            .map(input => input.value);
        
        if (selectedTests.length === 0) {
            this.showNotification('No tests selected', 'warning');
            return;
        }
        
        this.showNotification(`Running ${selectedTests.length} tests...`, 'info');
        const results = await this.testFramework.runTests(selectedTests);
        this.displayTestResults(results);
    }

    displayTestResults(results) {
        const resultsContainer = document.getElementById('test-results');
        if (!resultsContainer) return;
        
        const summary = this.generateTestSummary(results);
        const details = this.generateTestDetails(results);
        
        resultsContainer.innerHTML = `
            <div class="test-summary">
                <h4>Test Summary</h4>
                <div class="summary-stats">
                    <span class="passed">Passed: ${summary.passed}</span>
                    <span class="failed">Failed: ${summary.failed}</span>
                    <span class="skipped">Skipped: ${summary.skipped}</span>
                    <span class="total">Total: ${summary.total}</span>
                </div>
            </div>
            <div class="test-details">
                <h4>Test Details</h4>
                ${details}
            </div>
        `;
    }

    generateTestSummary(results) {
        return results.reduce((summary, result) => {
            summary.total++;
            summary[result.status]++;
            return summary;
        }, { passed: 0, failed: 0, skipped: 0, total: 0 });
    }

    generateTestDetails(results) {
        return results.map(result => `
            <div class="test-result ${result.status}">
                <div class="test-header">
                    <span class="test-name">${result.name}</span>
                    <span class="test-status">${result.status}</span>
                    <span class="test-duration">${result.duration}ms</span>
                </div>
                ${result.error ? `<div class="test-error">${result.error}</div>` : ''}
                ${result.output ? `<div class="test-output">${result.output}</div>` : ''}
            </div>
        `).join('');
    }

    clearTestResults() {
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p>No tests run yet</p>';
        }
    }

    // Monitoring Methods
    updateMonitoringDashboard() {
        this.updateHealthStatus();
        this.updatePerformanceMetrics();
        this.updateErrorLogs();
        this.updateRealTimeMetrics();
    }

    updateHealthStatus() {
        const healthIndicator = document.getElementById('system-health');
        if (!healthIndicator) return;
        
        const health = this.getSystemHealth();
        healthIndicator.className = `health-indicator ${health.status}`;
        healthIndicator.textContent = health.status.toUpperCase();
        
        const healthDetails = document.getElementById('health-details');
        if (healthDetails) {
            healthDetails.innerHTML = `
                <div class="health-metric">
                    <span>CPU Usage:</span>
                    <span class="${this.getHealthClass(health.cpu)}">${health.cpu}%</span>
                </div>
                <div class="health-metric">
                    <span>Memory Usage:</span>
                    <span class="${this.getHealthClass(health.memory)}">${health.memory}%</span>
                </div>
                <div class="health-metric">
                    <span>Active Agents:</span>
                    <span>${health.activeAgents}</span>
                </div>
                <div class="health-metric">
                    <span>Queue Length:</span>
                    <span>${health.queueLength}</span>
                </div>
            `;
        }
    }

    getSystemHealth() {
        // Mock health data - in real implementation, this would come from actual system monitoring
        return {
            status: 'healthy',
            cpu: Math.floor(Math.random() * 30) + 10,
            memory: Math.floor(Math.random() * 40) + 20,
            activeAgents: agentManager ? agentManager.getAllAgents().length : 0,
            queueLength: agentManager ? agentManager.taskQueue.length : 0
        };
    }

    getHealthClass(value) {
        if (value < 50) return 'good';
        if (value < 80) return 'warning';
        return 'critical';
    }

    updatePerformanceMetrics() {
        if (!this.performanceMonitor) return;
        
        const metrics = this.performanceMonitor.getMetrics();
        
        const responseTime = document.getElementById('avg-response-time-metric');
        const throughput = document.getElementById('throughput-metric');
        const errorRate = document.getElementById('error-rate-metric');
        
        if (responseTime) responseTime.textContent = `${metrics.avgResponseTime || 0}ms`;
        if (throughput) throughput.textContent = `${metrics.throughput || 0}/min`;
        if (errorRate) errorRate.textContent = `${metrics.errorRate || 0}%`;
    }

    updateErrorLogs() {
        if (!this.errorHandler) return;
        
        const errorLogs = this.errorHandler.getRecentErrors(10);
        const errorList = document.getElementById('error-log-list');
        
        if (errorList) {
            errorList.innerHTML = errorLogs.map(error => `
                <div class="error-log-item ${error.level}">
                    <div class="error-header">
                        <span class="error-time">${new Date(error.timestamp).toLocaleTimeString()}</span>
                        <span class="error-level">${error.level}</span>
                    </div>
                    <div class="error-message">${error.message}</div>
                    ${error.stack ? `<div class="error-stack">${error.stack}</div>` : ''}
                </div>
            `).join('');
        }
    }

    updateRealTimeMetrics() {
        const metricsContainer = document.getElementById('real-time-metrics');
        if (!metricsContainer) return;
        
        const metrics = {
            timestamp: new Date().toLocaleTimeString(),
            memoryUsage: this.getMemoryUsage(),
            activeConnections: this.getActiveConnections(),
            requestsPerSecond: this.getRequestsPerSecond()
        };
        
        metricsContainer.innerHTML = `
            <div class="metric">
                <span class="metric-label">Memory:</span>
                <span class="metric-value">${metrics.memoryUsage}MB</span>
            </div>
            <div class="metric">
                <span class="metric-label">Connections:</span>
                <span class="metric-value">${metrics.activeConnections}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Requests/sec:</span>
                <span class="metric-value">${metrics.requestsPerSecond}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Updated:</span>
                <span class="metric-value">${metrics.timestamp}</span>
            </div>
        `;
    }

    // Utility Methods for Monitoring
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return Math.floor(Math.random() * 100) + 50; // Mock data
    }

    getActiveConnections() {
        return Math.floor(Math.random() * 10) + 1; // Mock data
    }

    getRequestsPerSecond() {
        return Math.floor(Math.random() * 50) + 10; // Mock data
    }

    // Security Methods
    toggleEncryption(enabled) {
        if (this.dataManager) {
            this.dataManager.setEncryption(enabled);
            this.showNotification(`Encryption ${enabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    updateSessionTimeout(timeout) {
        if (window.SessionManager) {
            window.SessionManager.setSessionTimeout(timeout);
            this.showNotification(`Session timeout updated to ${timeout} minutes`, 'info');
        }
    }

    clearAllSessions() {
        if (confirm('Are you sure you want to clear all active sessions?')) {
            if (window.SessionManager) {
                window.SessionManager.clearAllSessions();
                this.showNotification('All sessions cleared', 'info');
            }
        }
    }

    viewSecurityLogs() {
        // Implementation for viewing security logs
        this.showNotification('Security logs feature coming soon', 'info');
    }

    // Performance Methods
    toggleCache(enabled) {
        if (window.CacheManager) {
            if (enabled) {
                window.CacheManager.enable();
            } else {
                window.CacheManager.disable();
            }
            this.showNotification(`Cache ${enabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    toggleCompression(enabled) {
        if (this.dataManager) {
            this.dataManager.setCompression(enabled);
            this.showNotification(`Data compression ${enabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    clearCache() {
        if (confirm('Are you sure you want to clear all cached data?')) {
            if (window.CacheManager) {
                window.CacheManager.clear();
                this.showNotification('Cache cleared successfully', 'success');
            }
        }
    }

    updateCacheSize(size) {
        if (window.CacheManager) {
            window.CacheManager.setMaxSize(size);
            this.showNotification(`Cache size updated to ${size}MB`, 'info');
        }
    }

    async optimizePerformance() {
        this.showNotification('Optimizing performance...', 'info');
        
        try {
            // Clear cache
            if (window.CacheManager) {
                window.CacheManager.optimize();
            }
            
            // Garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Optimize data storage
            if (this.dataManager) {
                await this.dataManager.optimize();
            }
            
            this.showNotification('Performance optimization completed', 'success');
        } catch (error) {
            this.showNotification('Performance optimization failed', 'error');
            if (this.errorHandler) {
                this.errorHandler.handleError(error, 'UIManager.optimizePerformance');
            }
        }
    }

    // Advanced Settings Methods
    toggleDebugMode(enabled) {
        CONFIG.debug = enabled;
        if (enabled) {
            console.log('Debug mode enabled');
            document.body.classList.add('debug-mode');
        } else {
            console.log('Debug mode disabled');
            document.body.classList.remove('debug-mode');
        }
        this.showNotification(`Debug mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    toggleExperimentalFeatures(enabled) {
        CONFIG.experimental = enabled;
        this.showNotification(`Experimental features ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    resetSystem() {
        if (confirm('Are you sure you want to reset the system? This will clear all data and settings.')) {
            // Clear all data
            localStorage.clear();
            sessionStorage.clear();
            
            // Reset to defaults
            if (this.dataManager) {
                this.dataManager.reset();
            }
            
            // Reload page
            location.reload();
        }
    }

    exportSettings() {
        const settings = {
            config: CONFIG,
            theme: this.currentTheme,
            workspace: this.currentWorkspace,
            chatHistory: this.chatHistory,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-agent-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Settings exported successfully', 'success');
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    this.applyImportedSettings(settings);
                    this.showNotification('Settings imported successfully', 'success');
                } catch (error) {
                    this.showNotification('Failed to import settings', 'error');
                    if (this.errorHandler) {
                        this.errorHandler.handleError(error, 'UIManager.importSettings');
                    }
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    applyImportedSettings(settings) {
        if (settings.config) {
            Object.assign(CONFIG, settings.config);
        }
        
        if (settings.theme && this.themeManager) {
            this.themeManager.setTheme(settings.theme);
        }
        
        if (settings.workspace) {
            this.loadWorkspace(settings.workspace);
        }
        
        if (settings.chatHistory) {
            this.chatHistory = settings.chatHistory;
        }
        
        // Save imported settings
        this.saveSettings();
    }

    // Utility Methods
    closeAllModals() {
        this.activeModals.forEach(modal => {
            modal.style.display = 'none';
        });
        this.activeModals.clear();
    }

    toggleCommandPalette() {
        // Implementation for command palette
        this.showNotification('Command palette feature coming soon', 'info');
    }

    reorderWorkspaceTabs(draggedTab, targetTab) {
        const parent = draggedTab.parentNode;
        const draggedIndex = Array.from(parent.children).indexOf(draggedTab);
        const targetIndex = Array.from(parent.children).indexOf(targetTab);
        
        if (draggedIndex < targetIndex) {
            parent.insertBefore(draggedTab, targetTab.nextSibling);
        } else {
            parent.insertBefore(draggedTab, targetTab);
        }
        
        this.showNotification('Workspace tabs reordered', 'info');
    }

    handleResize(entry) {
        // Handle responsive design changes
        if (!document.body) {
            console.warn('Document body not available for resize handling');
            return;
        }
        
        const width = entry.contentRect.width;
        
        if (width < 768) {
            document.body.classList.add('mobile');
            document.body.classList.remove('tablet', 'desktop');
        } else if (width < 1024) {
            document.body.classList.add('tablet');
            document.body.classList.remove('mobile', 'desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile', 'tablet');
        }
    }

    handleWindowResize() {
        // Handle window resize events
        if (this.analyticsManager) {
            this.analyticsManager.trackEvent('window_resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    async applySavedTheme() {
        try {
            const savedTheme = localStorage.getItem('ai-agent-theme');
            if (savedTheme && this.themeManager) {
                await this.themeManager.setTheme(savedTheme);
                this.currentTheme = savedTheme;
            } else if (savedTheme) {
                // Fallback if themeManager is not available
                this.currentTheme = savedTheme;
                console.warn('ThemeManager not available, theme not applied');
            }
        } catch (error) {
            console.error('Failed to apply saved theme:', error);
            // Don't throw error to prevent initialization failure
        }
    }

    getHelpText() {
        return `
Available Commands:
/spawn [type] [name] - Spawn a new agent
/list [agents|tasks] - List agents or tasks
/stop [agent-id] - Stop a specific agent
/status - Show system status
/help - Show this help message

You can also chat naturally and the system will assign tasks to appropriate agents.
        `.trim();
    }

    // Plugin API methods
    addMenuItem(item) {
        try {
            if (!item || !item.label) {
                console.warn('Invalid menu item:', item);
                return;
            }

            // Find or create the menu container
            let menuContainer = document.querySelector('.menu-container');
            if (!menuContainer) {
                // Create a basic menu container if it doesn't exist
                menuContainer = document.createElement('div');
                menuContainer.className = 'menu-container';
                menuContainer.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                    background: var(--bg-secondary, #2a2a2a);
                    border: 1px solid var(--border-color, #444);
                    border-radius: 4px;
                    padding: 5px;
                `;
                document.body.appendChild(menuContainer);
            }

            // Create menu item element
            const menuItem = document.createElement('button');
            menuItem.className = 'menu-item';
            menuItem.textContent = item.label;
            menuItem.style.cssText = `
                display: block;
                width: 100%;
                padding: 8px 12px;
                margin: 2px 0;
                background: transparent;
                border: none;
                color: var(--text-primary, #fff);
                cursor: pointer;
                border-radius: 3px;
                text-align: left;
            `;

            // Add hover effect
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'var(--bg-hover, #3a3a3a)';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });

            // Add click handler
            if (item.action && typeof item.action === 'function') {
                menuItem.addEventListener('click', item.action);
            }

            menuContainer.appendChild(menuItem);
            
            this.showNotification(`Menu item "${item.label}" added`, 'success');
        } catch (error) {
            console.error('Failed to add menu item:', error);
            this.showNotification('Failed to add menu item', 'error');
        }
    }

    addTab(tab) {
        try {
            if (!tab || !tab.title) {
                console.warn('Invalid tab:', tab);
                return;
            }

            // Find or create the tab container
            let tabContainer = document.querySelector('.workspace-tabs');
            if (!tabContainer) {
                // Create a basic tab container if it doesn't exist
                tabContainer = document.createElement('div');
                tabContainer.className = 'workspace-tabs';
                tabContainer.style.cssText = `
                    display: flex;
                    background: var(--bg-secondary, #2a2a2a);
                    border-bottom: 1px solid var(--border-color, #444);
                    padding: 0 10px;
                `;
                
                // Insert at the top of the main content area
                const mainContent = document.querySelector('.main-content') || document.body;
                mainContent.insertBefore(tabContainer, mainContent.firstChild);
            }

            // Create tab element
            const tabElement = document.createElement('div');
            tabElement.className = 'workspace-tab';
            tabElement.textContent = tab.title;
            tabElement.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                color: var(--text-secondary, #ccc);
                transition: all 0.2s ease;
            `;

            // Add hover and active states
            tabElement.addEventListener('mouseenter', () => {
                tabElement.style.color = 'var(--text-primary, #fff)';
            });
            tabElement.addEventListener('mouseleave', () => {
                if (!tabElement.classList.contains('active')) {
                    tabElement.style.color = 'var(--text-secondary, #ccc)';
                }
            });

            // Add click handler
            if (tab.action && typeof tab.action === 'function') {
                tabElement.addEventListener('click', () => {
                    // Remove active class from other tabs
                    tabContainer.querySelectorAll('.workspace-tab').forEach(t => {
                        t.classList.remove('active');
                        t.style.borderBottomColor = 'transparent';
                        t.style.color = 'var(--text-secondary, #ccc)';
                    });
                    
                    // Activate this tab
                    tabElement.classList.add('active');
                    tabElement.style.borderBottomColor = 'var(--accent-color, #007acc)';
                    tabElement.style.color = 'var(--text-primary, #fff)';
                    
                    tab.action();
                });
            }

            tabContainer.appendChild(tabElement);
            
            this.showNotification(`Tab "${tab.title}" added`, 'success');
        } catch (error) {
            console.error('Failed to add tab:', error);
            this.showNotification('Failed to add tab', 'error');
        }
    }

    // Event handling methods
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
}

// Initialize UI Manager
const uiManager = new UIManager();