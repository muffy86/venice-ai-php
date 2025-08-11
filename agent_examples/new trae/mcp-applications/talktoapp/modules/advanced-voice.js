/**
 * Advanced Voice Features System
 * Comprehensive voice interaction, commands, and accessibility features
 */

class AdvancedVoice {
    constructor() {
        this.isSupported = false;
        this.isListening = false;
        this.isRecording = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.voiceCommands = new Map();
        this.voiceProfiles = new Map();
        this.currentLanguage = 'en-US';
        this.currentVoice = null;
        this.voiceSettings = {};
        this.conversationHistory = [];
        this.voiceUI = null;
        
        this.init();
    }

    async init() {
        await this.checkSupport();
        this.setupVoiceRecognition();
        this.setupVoiceSynthesis();
        this.setupVoiceCommands();
        this.setupVoiceProfiles();
        this.createVoiceUI();
        this.loadVoiceSettings();
        this.setupEventListeners();
        this.setupAccessibilityFeatures();
    }

    async checkSupport() {
        // Check for Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const speechSupported = !!SpeechRecognition;

        // Check for Speech Synthesis
        const synthesisSupported = 'speechSynthesis' in window;

        // Check for MediaRecorder
        const mediaRecorderSupported = 'MediaRecorder' in window;

        // Check for Web Audio API
        const audioContextSupported = 'AudioContext' in window || 'webkitAudioContext' in window;

        this.isSupported = speechSupported && synthesisSupported;
        
        console.log('Voice Features Support:', {
            speechRecognition: speechSupported,
            speechSynthesis: synthesisSupported,
            mediaRecorder: mediaRecorderSupported,
            audioContext: audioContextSupported,
            overall: this.isSupported
        });

        if (!this.isSupported) {
            this.showVoiceError('Voice features are not supported in this browser');
        }
    }

    setupVoiceRecognition() {
        if (!this.isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceUI();
            this.showVoiceStatus('Listening...', 'listening');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceUI();
            this.showVoiceStatus('Voice recognition stopped', 'stopped');
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleVoiceError(event.error);
        };

        this.recognition.onresult = (event) => {
            this.handleVoiceResult(event);
        };
    }

    setupVoiceSynthesis() {
        if (!('speechSynthesis' in window)) return;

        this.synthesis = window.speechSynthesis;
        
        // Load available voices
        this.loadAvailableVoices();
        
        // Handle voice changes
        this.synthesis.onvoiceschanged = () => {
            this.loadAvailableVoices();
        };
    }

    loadAvailableVoices() {
        const voices = this.synthesis.getVoices();
        this.voiceProfiles.clear();
        
        voices.forEach(voice => {
            this.voiceProfiles.set(voice.name, {
                voice: voice,
                lang: voice.lang,
                name: voice.name,
                localService: voice.localService,
                default: voice.default
            });
        });

        // Set default voice
        if (!this.currentVoice && voices.length > 0) {
            const defaultVoice = voices.find(v => v.default && v.lang.startsWith('en')) || voices[0];
            this.currentVoice = defaultVoice;
        }

        this.updateVoiceUI();
    }

    setupVoiceCommands() {
        // Navigation commands
        this.voiceCommands.set('go home', () => this.executeCommand('navigation', 'home'));
        this.voiceCommands.set('go back', () => this.executeCommand('navigation', 'back'));
        this.voiceCommands.set('refresh page', () => this.executeCommand('navigation', 'refresh'));
        
        // App creation commands
        this.voiceCommands.set('create app', () => this.executeCommand('app', 'create'));
        this.voiceCommands.set('new app', () => this.executeCommand('app', 'create'));
        this.voiceCommands.set('build app', () => this.executeCommand('app', 'create'));
        this.voiceCommands.set('save app', () => this.executeCommand('app', 'save'));
        this.voiceCommands.set('export app', () => this.executeCommand('app', 'export'));
        
        // Template commands
        this.voiceCommands.set('show templates', () => this.executeCommand('template', 'show'));
        this.voiceCommands.set('load template', () => this.executeCommand('template', 'load'));
        
        // Voice control commands
        this.voiceCommands.set('stop listening', () => this.stopListening());
        this.voiceCommands.set('start listening', () => this.startListening());
        this.voiceCommands.set('mute voice', () => this.toggleMute());
        this.voiceCommands.set('change voice', () => this.showVoiceSelector());
        
        // Accessibility commands
        this.voiceCommands.set('read page', () => this.readPageContent());
        this.voiceCommands.set('describe interface', () => this.describeInterface());
        this.voiceCommands.set('help me', () => this.provideVoiceHelp());
        
        // AI interaction commands
        this.voiceCommands.set('ask ai', () => this.startAIConversation());
        this.voiceCommands.set('explain this', () => this.explainCurrentContext());
        
        // System commands
        this.voiceCommands.set('show settings', () => this.executeCommand('system', 'settings'));
        this.voiceCommands.set('toggle dark mode', () => this.executeCommand('system', 'theme'));
    }

    setupVoiceProfiles() {
        // Define voice personality profiles
        this.voiceProfiles.set('assistant', {
            personality: 'helpful',
            tone: 'professional',
            speed: 1.0,
            pitch: 1.0,
            volume: 0.8
        });

        this.voiceProfiles.set('friend', {
            personality: 'casual',
            tone: 'friendly',
            speed: 1.1,
            pitch: 1.1,
            volume: 0.9
        });

        this.voiceProfiles.set('teacher', {
            personality: 'educational',
            tone: 'patient',
            speed: 0.9,
            pitch: 0.9,
            volume: 0.8
        });
    }

    createVoiceUI() {
        this.voiceUI = document.createElement('div');
        this.voiceUI.id = 'voice-ui';
        this.voiceUI.className = 'voice-ui';
        this.voiceUI.innerHTML = this.getVoiceUIHTML();

        const style = document.createElement('style');
        style.textContent = this.getVoiceStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.voiceUI);
        this.updateVoiceUI();
    }

    getVoiceUIHTML() {
        return `
            <div class="voice-control-panel">
                <div class="voice-main-controls">
                    <button id="voice-toggle" class="voice-btn primary" onclick="advancedVoice.toggleListening()">
                        <span class="voice-icon">🎤</span>
                        <span class="voice-text">Start Voice</span>
                    </button>
                    
                    <button id="voice-record" class="voice-btn secondary" onclick="advancedVoice.toggleRecording()">
                        <span class="voice-icon">⏺️</span>
                        <span class="voice-text">Record</span>
                    </button>
                    
                    <button id="voice-settings" class="voice-btn tertiary" onclick="advancedVoice.showVoiceSettings()">
                        <span class="voice-icon">⚙️</span>
                    </button>
                </div>
                
                <div class="voice-status" id="voice-status">
                    <div class="status-indicator" id="status-indicator"></div>
                    <span class="status-text" id="status-text">Voice Ready</span>
                </div>
                
                <div class="voice-visualizer" id="voice-visualizer">
                    <canvas id="voice-canvas" width="200" height="60"></canvas>
                </div>
                
                <div class="voice-transcript" id="voice-transcript">
                    <div class="transcript-content" id="transcript-content"></div>
                </div>
                
                <div class="voice-commands-hint" id="voice-commands-hint">
                    <div class="hint-toggle" onclick="advancedVoice.toggleCommandsHint()">
                        Voice Commands <span class="hint-arrow">▼</span>
                    </div>
                    <div class="commands-list" id="commands-list">
                        <div class="command-category">
                            <h4>Navigation</h4>
                            <span>"Go home", "Go back", "Refresh page"</span>
                        </div>
                        <div class="command-category">
                            <h4>App Creation</h4>
                            <span>"Create app", "Save app", "Export app"</span>
                        </div>
                        <div class="command-category">
                            <h4>Voice Control</h4>
                            <span>"Stop listening", "Change voice", "Help me"</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="voice-settings-modal" id="voice-settings-modal">
                <div class="modal-overlay" onclick="advancedVoice.hideVoiceSettings()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Voice Settings</h3>
                        <button class="modal-close" onclick="advancedVoice.hideVoiceSettings()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="setting-group">
                            <label>Voice</label>
                            <select id="voice-select" onchange="advancedVoice.changeVoice(this.value)">
                                <option value="">Select Voice...</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>Language</label>
                            <select id="language-select" onchange="advancedVoice.changeLanguage(this.value)">
                                <option value="en-US">English (US)</option>
                                <option value="en-GB">English (UK)</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                                <option value="de-DE">German</option>
                                <option value="it-IT">Italian</option>
                                <option value="pt-BR">Portuguese</option>
                                <option value="ja-JP">Japanese</option>
                                <option value="ko-KR">Korean</option>
                                <option value="zh-CN">Chinese</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>Speech Rate: <span id="rate-value">1.0</span></label>
                            <input type="range" id="rate-slider" min="0.5" max="2.0" step="0.1" value="1.0" 
                                   oninput="advancedVoice.updateVoiceSetting('rate', this.value)">
                        </div>
                        
                        <div class="setting-group">
                            <label>Pitch: <span id="pitch-value">1.0</span></label>
                            <input type="range" id="pitch-slider" min="0.5" max="2.0" step="0.1" value="1.0"
                                   oninput="advancedVoice.updateVoiceSetting('pitch', this.value)">
                        </div>
                        
                        <div class="setting-group">
                            <label>Volume: <span id="volume-value">0.8</span></label>
                            <input type="range" id="volume-slider" min="0.1" max="1.0" step="0.1" value="0.8"
                                   oninput="advancedVoice.updateVoiceSetting('volume', this.value)">
                        </div>
                        
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="auto-speak" onchange="advancedVoice.toggleAutoSpeak(this.checked)">
                                Auto-speak responses
                            </label>
                        </div>
                        
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="voice-feedback" onchange="advancedVoice.toggleVoiceFeedback(this.checked)">
                                Voice command feedback
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn secondary" onclick="advancedVoice.testVoice()">Test Voice</button>
                        <button class="btn primary" onclick="advancedVoice.saveVoiceSettings()">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
    }

    getVoiceStyles() {
        return `
            .voice-ui {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9998;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .voice-control-panel {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 20px;
                min-width: 280px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                color: #333;
                transition: all 0.3s ease;
            }

            .voice-main-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .voice-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 15px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                flex: 1;
            }

            .voice-btn.primary {
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: black;
            }

            .voice-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
            }

            .voice-btn.primary.active {
                background: linear-gradient(135deg, #ff4757, #ff3742);
                animation: pulse 2s infinite;
            }

            .voice-btn.secondary {
                background: rgba(0, 0, 0, 0.1);
                color: #333;
            }

            .voice-btn.secondary:hover {
                background: rgba(0, 0, 0, 0.15);
            }

            .voice-btn.tertiary {
                background: rgba(0, 0, 0, 0.05);
                color: #666;
                flex: 0 0 auto;
                padding: 10px;
            }

            .voice-btn.tertiary:hover {
                background: rgba(0, 0, 0, 0.1);
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .voice-status {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                font-size: 12px;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #95a5a6;
                transition: all 0.3s ease;
            }

            .status-indicator.listening {
                background: #00ff88;
                animation: pulse 1s infinite;
            }

            .status-indicator.speaking {
                background: #3498db;
                animation: pulse 1s infinite;
            }

            .status-indicator.error {
                background: #e74c3c;
            }

            .voice-visualizer {
                margin-bottom: 15px;
                text-align: center;
            }

            #voice-canvas {
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.05);
            }

            .voice-transcript {
                max-height: 100px;
                overflow-y: auto;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                font-size: 12px;
                line-height: 1.4;
            }

            .transcript-content {
                min-height: 20px;
            }

            .transcript-interim {
                color: #666;
                font-style: italic;
            }

            .transcript-final {
                color: #333;
                font-weight: 500;
            }

            .voice-commands-hint {
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                padding-top: 15px;
            }

            .hint-toggle {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                color: #666;
                padding: 5px 0;
            }

            .hint-arrow {
                transition: transform 0.3s ease;
            }

            .voice-commands-hint.open .hint-arrow {
                transform: rotate(180deg);
            }

            .commands-list {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .voice-commands-hint.open .commands-list {
                max-height: 200px;
                margin-top: 10px;
            }

            .command-category {
                margin-bottom: 10px;
            }

            .command-category h4 {
                margin: 0 0 5px 0;
                font-size: 11px;
                font-weight: 600;
                color: #333;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .command-category span {
                font-size: 10px;
                color: #666;
                line-height: 1.3;
            }

            /* Voice Settings Modal */
            .voice-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .voice-settings-modal.show {
                display: flex;
            }

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease;
            }

            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }

            .modal-close:hover {
                background: rgba(0, 0, 0, 0.1);
            }

            .modal-body {
                padding: 25px;
                max-height: 400px;
                overflow-y: auto;
            }

            .setting-group {
                margin-bottom: 20px;
            }

            .setting-group label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 500;
                color: #333;
            }

            .setting-group select,
            .setting-group input[type="range"] {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 6px;
                font-size: 14px;
                background: white;
            }

            .setting-group input[type="range"] {
                padding: 0;
                height: 6px;
                background: rgba(0, 0, 0, 0.1);
                outline: none;
                border-radius: 3px;
            }

            .setting-group input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                background: #00ff88;
                border-radius: 50%;
                cursor: pointer;
            }

            .setting-group input[type="checkbox"] {
                margin-right: 8px;
            }

            .modal-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px 25px;
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                background: rgba(0, 0, 0, 0.02);
            }

            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .btn.primary {
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: black;
            }

            .btn.primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
            }

            .btn.secondary {
                background: rgba(0, 0, 0, 0.1);
                color: #333;
            }

            .btn.secondary:hover {
                background: rgba(0, 0, 0, 0.15);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .voice-ui {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                }

                .voice-control-panel {
                    min-width: auto;
                    padding: 15px;
                }

                .voice-main-controls {
                    flex-direction: column;
                }

                .voice-btn {
                    justify-content: center;
                }

                .modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .modal-body {
                    padding: 20px;
                }
            }

            /* Dark theme support */
            [data-theme="dark"] .voice-control-panel {
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-color: rgba(255, 255, 255, 0.2);
            }

            [data-theme="dark"] .voice-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            [data-theme="dark"] .voice-btn.tertiary {
                background: rgba(255, 255, 255, 0.05);
                color: #ccc;
            }

            [data-theme="dark"] .voice-status,
            [data-theme="dark"] .voice-transcript,
            [data-theme="dark"] .voice-visualizer canvas {
                background: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .modal-content {
                background: #2c3e50;
                color: white;
            }

            [data-theme="dark"] .modal-header {
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .modal-footer {
                border-top-color: rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
            }

            [data-theme="dark"] .setting-group select,
            [data-theme="dark"] .setting-group input {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                color: white;
            }
        `;
    }

    loadVoiceSettings() {
        const settings = localStorage.getItem('talktoapp_voice_settings');
        if (settings) {
            this.voiceSettings = { ...this.getDefaultVoiceSettings(), ...JSON.parse(settings) };
        } else {
            this.voiceSettings = this.getDefaultVoiceSettings();
        }

        this.applyVoiceSettings();
    }

    getDefaultVoiceSettings() {
        return {
            rate: 1.0,
            pitch: 1.0,
            volume: 0.8,
            autoSpeak: false,
            voiceFeedback: true,
            language: 'en-US',
            voiceName: null
        };
    }

    applyVoiceSettings() {
        if (this.recognition) {
            this.recognition.lang = this.voiceSettings.language;
        }

        // Update UI elements
        const rateSlider = document.getElementById('rate-slider');
        const pitchSlider = document.getElementById('pitch-slider');
        const volumeSlider = document.getElementById('volume-slider');
        const autoSpeakCheck = document.getElementById('auto-speak');
        const voiceFeedbackCheck = document.getElementById('voice-feedback');
        const languageSelect = document.getElementById('language-select');

        if (rateSlider) {
            rateSlider.value = this.voiceSettings.rate;
            document.getElementById('rate-value').textContent = this.voiceSettings.rate;
        }
        if (pitchSlider) {
            pitchSlider.value = this.voiceSettings.pitch;
            document.getElementById('pitch-value').textContent = this.voiceSettings.pitch;
        }
        if (volumeSlider) {
            volumeSlider.value = this.voiceSettings.volume;
            document.getElementById('volume-value').textContent = this.voiceSettings.volume;
        }
        if (autoSpeakCheck) autoSpeakCheck.checked = this.voiceSettings.autoSpeak;
        if (voiceFeedbackCheck) voiceFeedbackCheck.checked = this.voiceSettings.voiceFeedback;
        if (languageSelect) languageSelect.value = this.voiceSettings.language;
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'm':
                        e.preventDefault();
                        this.toggleListening();
                        break;
                    case 'r':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleRecording();
                        }
                        break;
                }
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.pauseListening();
            } else if (!document.hidden && this.isListening) {
                this.resumeListening();
            }
        });
    }

    setupAccessibilityFeatures() {
        // Add ARIA labels and roles
        if (this.voiceUI) {
            this.voiceUI.setAttribute('role', 'region');
            this.voiceUI.setAttribute('aria-label', 'Voice Control Panel');
        }

        // Setup screen reader announcements
        this.createAriaLiveRegion();
    }

    createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'voice-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('voice-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    // Voice Control Methods
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.isSupported || this.isListening) return;

        try {
            this.recognition.start();
            this.announceToScreenReader('Voice recognition started');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.handleVoiceError('start_failed');
        }
    }

    stopListening() {
        if (!this.isListening) return;

        this.recognition.stop();
        this.announceToScreenReader('Voice recognition stopped');
    }

    pauseListening() {
        if (this.isListening) {
            this.recognition.abort();
        }
    }

    resumeListening() {
        if (!this.isListening) {
            this.startListening();
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        if (!navigator.mediaDevices || this.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.handleRecordingComplete(audioBlob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateVoiceUI();
            this.showVoiceStatus('Recording...', 'recording');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.handleVoiceError('recording_failed');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        this.updateVoiceUI();
        this.showVoiceStatus('Recording stopped', 'stopped');
    }

    handleRecordingComplete(audioBlob) {
        // Create download link for the recording
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-recording-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);

        this.speak('Recording saved successfully');
    }

    // Voice Recognition Handlers
    handleVoiceResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        this.updateTranscript(finalTranscript, interimTranscript);

        if (finalTranscript) {
            this.processVoiceCommand(finalTranscript.trim().toLowerCase());
            this.addToConversationHistory('user', finalTranscript);
        }
    }

    updateTranscript(finalText, interimText) {
        const transcriptContent = document.getElementById('transcript-content');
        if (!transcriptContent) return;

        let html = '';
        if (finalText) {
            html += `<div class="transcript-final">${finalText}</div>`;
        }
        if (interimText) {
            html += `<div class="transcript-interim">${interimText}</div>`;
        }

        transcriptContent.innerHTML = html;
        transcriptContent.scrollTop = transcriptContent.scrollHeight;
    }

    processVoiceCommand(command) {
        console.log('Processing voice command:', command);

        // Check for exact matches first
        if (this.voiceCommands.has(command)) {
            this.voiceCommands.get(command)();
            this.provideFeedback(`Executing: ${command}`);
            return;
        }

        // Check for partial matches
        for (const [commandText, handler] of this.voiceCommands) {
            if (command.includes(commandText) || this.fuzzyMatch(command, commandText)) {
                handler();
                this.provideFeedback(`Executing: ${commandText}`);
                return;
            }
        }

        // If no command match, treat as AI conversation
        this.handleAIConversation(command);
    }

    fuzzyMatch(input, command, threshold = 0.7) {
        const similarity = this.calculateSimilarity(input, command);
        return similarity >= threshold;
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Command Execution
    executeCommand(category, action, params = {}) {
        console.log(`Executing command: ${category}.${action}`, params);

        switch (category) {
            case 'navigation':
                this.handleNavigationCommand(action, params);
                break;
            case 'app':
                this.handleAppCommand(action, params);
                break;
            case 'template':
                this.handleTemplateCommand(action, params);
                break;
            case 'system':
                this.handleSystemCommand(action, params);
                break;
            default:
                this.speak('Unknown command category');
        }
    }

    handleNavigationCommand(action, params) {
        switch (action) {
            case 'home':
                window.location.href = '/';
                this.speak('Navigating to home page');
                break;
            case 'back':
                window.history.back();
                this.speak('Going back');
                break;
            case 'refresh':
                window.location.reload();
                this.speak('Refreshing page');
                break;
        }
    }

    handleAppCommand(action, params) {
        switch (action) {
            case 'create':
                if (window.appGenerator) {
                    window.appGenerator.showGenerator();
                    this.speak('Opening app generator');
                } else {
                    this.speak('App generator not available');
                }
                break;
            case 'save':
                // Trigger save functionality
                this.speak('Saving current app');
                break;
            case 'export':
                // Trigger export functionality
                this.speak('Exporting app');
                break;
        }
    }

    handleTemplateCommand(action, params) {
        switch (action) {
            case 'show':
                if (window.templateLibrary) {
                    window.templateLibrary.showLibrary();
                    this.speak('Opening template library');
                } else {
                    this.speak('Template library not available');
                }
                break;
            case 'load':
                this.speak('Please specify which template to load');
                break;
        }
    }

    handleSystemCommand(action, params) {
        switch (action) {
            case 'settings':
                this.showVoiceSettings();
                this.speak('Opening voice settings');
                break;
            case 'theme':
                this.toggleTheme();
                this.speak('Toggling theme');
                break;
        }
    }

    // AI Conversation
    handleAIConversation(input) {
        if (window.advancedChat) {
            window.advancedChat.processVoiceInput(input);
        } else {
            this.speak("I heard you say: " + input + ". How can I help you with that?");
        }
    }

    startAIConversation() {
        this.speak("I'm listening. What would you like to know or create?");
        this.provideFeedback("AI conversation mode activated");
    }

    explainCurrentContext() {
        const context = this.analyzeCurrentContext();
        this.speak(context);
    }

    analyzeCurrentContext() {
        const url = window.location.href;
        const title = document.title;
        const activeElement = document.activeElement;
        
        let context = `You are currently on ${title}. `;
        
        if (activeElement && activeElement.tagName !== 'BODY') {
            context += `The focus is on a ${activeElement.tagName.toLowerCase()} element. `;
        }
        
        // Add more context based on visible elements
        const visibleButtons = document.querySelectorAll('button:not([style*="display: none"])').length;
        const visibleInputs = document.querySelectorAll('input:not([style*="display: none"])').length;
        
        if (visibleButtons > 0) {
            context += `There are ${visibleButtons} buttons available. `;
        }
        
        if (visibleInputs > 0) {
            context += `There are ${visibleInputs} input fields on the page. `;
        }
        
        return context;
    }

    // Voice Synthesis
    speak(text, options = {}) {
        if (!this.synthesis || this.isSpeaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice settings
        utterance.rate = options.rate || this.voiceSettings.rate;
        utterance.pitch = options.pitch || this.voiceSettings.pitch;
        utterance.volume = options.volume || this.voiceSettings.volume;
        
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateVoiceUI();
            this.showVoiceStatus('Speaking...', 'speaking');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateVoiceUI();
            this.showVoiceStatus('Voice Ready', 'ready');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.updateVoiceUI();
        };

        this.synthesis.speak(utterance);
        this.addToConversationHistory('assistant', text);
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateVoiceUI();
        }
    }

    // Accessibility Features
    readPageContent() {
        const content = this.extractPageContent();
        this.speak(content);
    }

    extractPageContent() {
        // Extract meaningful content from the page
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).join('. ');
        const paragraphs = Array.from(document.querySelectorAll('p')).slice(0, 3).map(p => p.textContent).join('. ');
        
        return `Page headings: ${headings}. Content: ${paragraphs}`;
    }

    describeInterface() {
        const description = this.generateInterfaceDescription();
        this.speak(description);
    }

    generateInterfaceDescription() {
        const buttons = document.querySelectorAll('button').length;
        const links = document.querySelectorAll('a').length;
        const inputs = document.querySelectorAll('input').length;
        const forms = document.querySelectorAll('form').length;
        
        return `This page has ${buttons} buttons, ${links} links, ${inputs} input fields, and ${forms} forms. Use voice commands to interact with the interface.`;
    }

    provideVoiceHelp() {
        const helpText = `
            Voice commands available: 
            Say "create app" to start building a new application.
            Say "show templates" to browse available templates.
            Say "go home" to return to the main page.
            Say "read page" to hear the page content.
            Say "stop listening" to pause voice recognition.
            You can also have a natural conversation with the AI assistant.
        `;
        this.speak(helpText);
    }

    // UI Updates
    updateVoiceUI() {
        const toggleBtn = document.getElementById('voice-toggle');
        const recordBtn = document.getElementById('voice-record');
        
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.voice-icon');
            const text = toggleBtn.querySelector('.voice-text');
            
            if (this.isListening) {
                toggleBtn.classList.add('active');
                icon.textContent = '🔴';
                text.textContent = 'Stop Voice';
            } else {
                toggleBtn.classList.remove('active');
                icon.textContent = '🎤';
                text.textContent = 'Start Voice';
            }
        }
        
        if (recordBtn) {
            const icon = recordBtn.querySelector('.voice-icon');
            const text = recordBtn.querySelector('.voice-text');
            
            if (this.isRecording) {
                recordBtn.classList.add('active');
                icon.textContent = '⏹️';
                text.textContent = 'Stop Rec';
            } else {
                icon.textContent = '⏺️';
                text.textContent = 'Record';
            }
        }

        this.updateVoiceVisualizer();
    }

    updateVoiceVisualizer() {
        const canvas = document.getElementById('voice-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.isListening || this.isSpeaking) {
            // Draw animated waveform
            this.drawWaveform(ctx, width, height);
        } else {
            // Draw static line
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
        }
    }

    drawWaveform(ctx, width, height) {
        const centerY = height / 2;
        const amplitude = this.isListening ? 20 : 10;
        const frequency = 0.02;
        const time = Date.now() * 0.005;

        ctx.strokeStyle = this.isListening ? '#00ff88' : '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin(x * frequency + time) * amplitude * Math.random();
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Continue animation
        if (this.isListening || this.isSpeaking) {
            requestAnimationFrame(() => this.updateVoiceVisualizer());
        }
    }

    showVoiceStatus(message, type) {
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');
        
        if (statusText) statusText.textContent = message;
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${type}`;
        }
    }

    provideFeedback(message) {
        if (this.voiceSettings.voiceFeedback) {
            this.speak(message);
        }
        this.showVoiceStatus(message, 'info');
    }

    // Settings Management
    showVoiceSettings() {
        const modal = document.getElementById('voice-settings-modal');
        if (modal) {
            modal.classList.add('show');
            this.populateVoiceSelect();
        }
    }

    hideVoiceSettings() {
        const modal = document.getElementById('voice-settings-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    populateVoiceSelect() {
        const select = document.getElementById('voice-select');
        if (!select) return;

        select.innerHTML = '<option value="">Select Voice...</option>';
        
        this.voiceProfiles.forEach((profile, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${profile.name} (${profile.lang})`;
            if (this.currentVoice && this.currentVoice.name === name) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    changeVoice(voiceName) {
        const profile = this.voiceProfiles.get(voiceName);
        if (profile) {
            this.currentVoice = profile.voice;
            this.voiceSettings.voiceName = voiceName;
        }
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.voiceSettings.language = language;
        
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    updateVoiceSetting(setting, value) {
        this.voiceSettings[setting] = parseFloat(value);
        document.getElementById(`${setting}-value`).textContent = value;
    }

    toggleAutoSpeak(enabled) {
        this.voiceSettings.autoSpeak = enabled;
    }

    toggleVoiceFeedback(enabled) {
        this.voiceSettings.voiceFeedback = enabled;
    }

    testVoice() {
        this.speak("This is a test of the current voice settings. How does it sound?");
    }

    saveVoiceSettings() {
        localStorage.setItem('talktoapp_voice_settings', JSON.stringify(this.voiceSettings));
        this.hideVoiceSettings();
        this.speak("Voice settings saved successfully");
    }

    toggleCommandsHint() {
        const hint = document.getElementById('voice-commands-hint');
        if (hint) {
            hint.classList.toggle('open');
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
    }

    toggleMute() {
        if (this.isSpeaking) {
            this.stopSpeaking();
        }
        this.voiceSettings.volume = this.voiceSettings.volume > 0 ? 0 : 0.8;
        this.speak(this.voiceSettings.volume > 0 ? "Voice unmuted" : "Voice muted");
    }

    // Conversation History
    addToConversationHistory(role, content) {
        this.conversationHistory.push({
            role: role,
            content: content,
            timestamp: Date.now()
        });

        // Keep only last 50 entries
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }

        // Save to localStorage
        localStorage.setItem('talktoapp_voice_history', JSON.stringify(this.conversationHistory));
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    clearConversationHistory() {
        this.conversationHistory = [];
        localStorage.removeItem('talktoapp_voice_history');
    }

    // Error Handling
    handleVoiceError(error) {
        console.error('Voice error:', error);
        
        let message = 'Voice feature error occurred';
        
        switch (error) {
            case 'not-allowed':
                message = 'Microphone access denied. Please allow microphone access and try again.';
                break;
            case 'no-speech':
                message = 'No speech detected. Please try speaking again.';
                break;
            case 'network':
                message = 'Network error. Please check your connection.';
                break;
            case 'start_failed':
                message = 'Failed to start voice recognition. Please try again.';
                break;
            case 'recording_failed':
                message = 'Failed to start recording. Please check microphone permissions.';
                break;
        }
        
        this.showVoiceError(message);
        this.showVoiceStatus('Error occurred', 'error');
    }

    showVoiceError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10002;
            max-width: 400px;
            text-align: center;
            font-weight: 500;
            animation: slideInDown 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;

        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutUp 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }
}

// Global instance
window.advancedVoice = new AdvancedVoice();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedVoice;
}