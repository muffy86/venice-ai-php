/**
 * ElevenLabs API Manager
 * Handles voice synthesis, cloning, and advanced audio features
 */

class ElevenLabsManager {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.voices = new Map();
        this.models = new Map();
        this.voiceSettings = {
            stability: 0.5,
            similarityBoost: 0.8,
            style: 0.0,
            useSpeakerBoost: true
        };
        this.audioCache = new Map();
        this.isInitialized = false;
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru',
            'nl', 'cs', 'ar', 'zh', 'ja', 'hu', 'ko'
        ];
        this.metrics = {
            charactersGenerated: 0,
            audioFilesCreated: 0,
            averageProcessingTime: 0,
            voiceUsage: new Map()
        };
    }

    async initialize() {
        try {
            // Load API key
            this.apiKey = await this.loadApiKey();

            if (!this.apiKey) {
                console.warn('⚠️ ElevenLabs API key not found. Voice features will be limited.');
                return false;
            }

            // Load available voices and models
            await this.loadVoices();
            await this.loadModels();

            this.isInitialized = true;
            console.log('🎤 ElevenLabs API Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize ElevenLabs API Manager:', error);
            return false;
        }
    }

    async loadApiKey() {
        const sources = [
            () => localStorage.getItem('elevenlabs_api_key'),
            () => process?.env?.ELEVENLABS_API_KEY,
            () => window.ELEVENLABS_API_KEY,
            () => this.promptUserForApiKey()
        ];

        for (const source of sources) {
            try {
                const key = await source();
                if (key && key.trim()) {
                    return key.trim();
                }
            } catch (error) {
                console.warn('Failed to load ElevenLabs API key from source:', error);
            }
        }

        return null;
    }

    async promptUserForApiKey() {
        return new Promise((resolve) => {
            const modal = this.createApiKeyModal();
            document.body.appendChild(modal);

            const input = modal.querySelector('#elevenlabs-api-key-input');
            const submitBtn = modal.querySelector('#submit-elevenlabs-key');
            const skipBtn = modal.querySelector('#skip-elevenlabs-key');

            submitBtn.addEventListener('click', () => {
                const key = input.value.trim();
                if (key) {
                    localStorage.setItem('elevenlabs_api_key', key);
                    document.body.removeChild(modal);
                    resolve(key);
                } else {
                    alert('Please enter a valid API key');
                }
            });

            skipBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    createApiKeyModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                text-align: center;
            ">
                <h3 style="margin-bottom: 20px;">🎤 ElevenLabs API Key Required</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    To enable advanced voice features, please enter your ElevenLabs API key.
                    You can get one at <a href="https://elevenlabs.io" target="_blank">elevenlabs.io</a>
                </p>
                <input type="password" id="elevenlabs-api-key-input" placeholder="Enter your API key..." style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 16px;
                ">
                <div>
                    <button id="submit-elevenlabs-key" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">Save & Continue</button>
                    <button id="skip-elevenlabs-key" style="
                        background: #ccc;
                        color: #666;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Skip for Now</button>
                </div>
            </div>
        `;

        return modal;
    }

    async loadVoices() {
        // Load default voices
        const defaultVoices = [
            {
                voice_id: 'EXAVITQu4vr4xnSDxMaL',
                name: 'Bella',
                category: 'premade',
                description: 'American, Young Adult, Female',
                accent: 'American',
                age: 'Young Adult',
                gender: 'Female',
                use_case: 'Narration'
            },
            {
                voice_id: 'ErXwobaYiN019PkySvjV',
                name: 'Antoni',
                category: 'premade',
                description: 'American, Young Adult, Male',
                accent: 'American',
                age: 'Young Adult',
                gender: 'Male',
                use_case: 'Narration'
            },
            {
                voice_id: 'VR6AewLTigWG4xSOukaG',
                name: 'Arnold',
                category: 'premade',
                description: 'American, Middle Aged, Male',
                accent: 'American',
                age: 'Middle Aged',
                gender: 'Male',
                use_case: 'Narration'
            },
            {
                voice_id: 'pNInz6obpgDQGcFmaJgB',
                name: 'Adam',
                category: 'premade',
                description: 'American, Middle Aged, Male',
                accent: 'American',
                age: 'Middle Aged',
                gender: 'Male',
                use_case: 'Narration'
            },
            {
                voice_id: 'yoZ06aMxZJJ28mfd3POQ',
                name: 'Sam',
                category: 'premade',
                description: 'American, Young Adult, Male',
                accent: 'American',
                age: 'Young Adult',
                gender: 'Male',
                use_case: 'Narration'
            }
        ];

        defaultVoices.forEach(voice => {
            this.voices.set(voice.voice_id, voice);
            this.metrics.voiceUsage.set(voice.voice_id, 0);
        });

        // Try to fetch latest voices from API
        if (this.apiKey) {
            try {
                await this.fetchVoicesFromAPI();
            } catch (error) {
                console.warn('Failed to fetch voices from API, using defaults:', error);
            }
        }
    }

    async fetchVoicesFromAPI() {
        const response = await fetch(`${this.baseUrl}/voices`, {
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            data.voices?.forEach(voice => {
                this.voices.set(voice.voice_id, voice);
                if (!this.metrics.voiceUsage.has(voice.voice_id)) {
                    this.metrics.voiceUsage.set(voice.voice_id, 0);
                }
            });
        }
    }

    async loadModels() {
        // Default models available
        const defaultModels = [
            {
                model_id: 'eleven_monolingual_v1',
                name: 'Eleven Monolingual v1',
                description: 'High quality English model',
                languages: ['en'],
                max_characters: 5000
            },
            {
                model_id: 'eleven_multilingual_v1',
                name: 'Eleven Multilingual v1',
                description: 'Supports multiple languages',
                languages: this.supportedLanguages,
                max_characters: 5000
            },
            {
                model_id: 'eleven_multilingual_v2',
                name: 'Eleven Multilingual v2',
                description: 'Latest multilingual model with improved quality',
                languages: this.supportedLanguages,
                max_characters: 5000
            }
        ];

        defaultModels.forEach(model => {
            this.models.set(model.model_id, model);
        });

        // Try to fetch latest models from API
        if (this.apiKey) {
            try {
                await this.fetchModelsFromAPI();
            } catch (error) {
                console.warn('Failed to fetch models from API, using defaults:', error);
            }
        }
    }

    async fetchModelsFromAPI() {
        const response = await fetch(`${this.baseUrl}/models`, {
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            data.forEach(model => {
                this.models.set(model.model_id, model);
            });
        }
    }

    async generateSpeech(text, options = {}) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs manager not initialized');
        }

        const startTime = Date.now();

        try {
            // Select voice and model
            const voiceId = options.voiceId || this.selectBestVoice(options);
            const modelId = options.modelId || this.selectBestModel(options);

            // Check cache first
            const cacheKey = this.createCacheKey(text, voiceId, modelId, options);
            if (this.audioCache.has(cacheKey) && !options.skipCache) {
                return this.audioCache.get(cacheKey);
            }

            // Prepare request
            const requestData = this.prepareTextToSpeechRequest(text, voiceId, modelId, options);

            // Make API call
            const audioBlob = await this.makeTextToSpeechRequest(requestData, voiceId);

            // Cache result
            if (!options.skipCache) {
                this.audioCache.set(cacheKey, audioBlob);
                // Clean cache if it gets too large
                if (this.audioCache.size > 100) {
                    this.cleanAudioCache();
                }
            }

            // Update metrics
            this.updateMetrics(text, voiceId, startTime);

            return audioBlob;

        } catch (error) {
            console.error('❌ ElevenLabs speech generation error:', error);
            throw error;
        }
    }

    selectBestVoice(options) {
        const {
            gender = 'any',
            age = 'any',
            accent = 'any',
            useCase = 'narration'
        } = options;

        // Filter voices based on criteria
        let candidates = Array.from(this.voices.values());

        if (gender !== 'any') {
            candidates = candidates.filter(voice =>
                voice.gender?.toLowerCase() === gender.toLowerCase()
            );
        }

        if (age !== 'any') {
            candidates = candidates.filter(voice =>
                voice.age?.toLowerCase().includes(age.toLowerCase())
            );
        }

        if (accent !== 'any') {
            candidates = candidates.filter(voice =>
                voice.accent?.toLowerCase().includes(accent.toLowerCase())
            );
        }

        // Select most suitable voice
        if (candidates.length === 0) {
            // Fallback to default voice
            return 'EXAVITQu4vr4xnSDxMaL'; // Bella
        }

        // Prefer less used voices for variety
        candidates.sort((a, b) => {
            const usageA = this.metrics.voiceUsage.get(a.voice_id) || 0;
            const usageB = this.metrics.voiceUsage.get(b.voice_id) || 0;
            return usageA - usageB;
        });

        return candidates[0].voice_id;
    }

    selectBestModel(options) {
        const { language = 'en', quality = 'high' } = options;

        // Select model based on language support
        if (language === 'en') {
            return 'eleven_monolingual_v1'; // Best for English
        }

        // For other languages, use multilingual model
        return 'eleven_multilingual_v2'; // Latest multilingual
    }

    prepareTextToSpeechRequest(text, voiceId, modelId, options) {
        const settings = {
            ...this.voiceSettings,
            ...options.voiceSettings
        };

        return {
            text: this.preprocessText(text),
            model_id: modelId,
            voice_settings: settings,
            output_format: options.outputFormat || 'mp3_44100_128'
        };
    }

    preprocessText(text) {
        // Clean and optimize text for speech synthesis
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special characters
            .trim();
    }

    async makeTextToSpeechRequest(requestData, voiceId) {
        const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API Error: ${error}`);
        }

        return await response.blob();
    }

    async playAudio(audioBlob) {
        return new Promise((resolve, reject) => {
            try {
                const audio = new Audio();
                const url = URL.createObjectURL(audioBlob);

                audio.src = url;
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };
                audio.onerror = (error) => {
                    URL.revokeObjectURL(url);
                    reject(error);
                };

                audio.play();
            } catch (error) {
                reject(error);
            }
        });
    }

    async generateAndPlay(text, options = {}) {
        try {
            const audioBlob = await this.generateSpeech(text, options);
            await this.playAudio(audioBlob);
            return audioBlob;
        } catch (error) {
            console.error('❌ Error generating and playing audio:', error);
            throw error;
        }
    }

    async cloneVoice(audioFiles, name, description) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs manager not initialized');
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);

            // Add audio files
            audioFiles.forEach((file, index) => {
                formData.append(`files`, file, `sample_${index}.wav`);
            });

            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Voice cloning failed: ${error.detail || response.statusText}`);
            }

            const result = await response.json();

            // Add new voice to our collection
            const newVoice = {
                voice_id: result.voice_id,
                name: name,
                category: 'cloned',
                description: description
            };

            this.voices.set(result.voice_id, newVoice);
            this.metrics.voiceUsage.set(result.voice_id, 0);

            return result;

        } catch (error) {
            console.error('❌ Voice cloning error:', error);
            throw error;
        }
    }

    async deleteVoice(voiceId) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs manager not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
                method: 'DELETE',
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete voice: ${response.statusText}`);
            }

            // Remove from our collection
            this.voices.delete(voiceId);
            this.metrics.voiceUsage.delete(voiceId);

            return true;

        } catch (error) {
            console.error('❌ Voice deletion error:', error);
            throw error;
        }
    }

    async editVoiceSettings(voiceId, settings) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs manager not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}/settings/edit`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error(`Failed to edit voice settings: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Voice settings edit error:', error);
            throw error;
        }
    }

    async getVoiceHistory(voiceId) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs manager not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/history`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get voice history: ${response.statusText}`);
            }

            const data = await response.json();

            // Filter by voice ID if specified
            if (voiceId) {
                return data.history.filter(item => item.voice_id === voiceId);
            }

            return data.history;

        } catch (error) {
            console.error('❌ Voice history error:', error);
            throw error;
        }
    }

    createCacheKey(text, voiceId, modelId, options) {
        const key = JSON.stringify({
            text: text.substring(0, 100), // First 100 chars for cache key
            voiceId,
            modelId,
            settings: options.voiceSettings || {}
        });

        return btoa(key).substring(0, 64);
    }

    cleanAudioCache() {
        // Remove oldest entries
        const entries = Array.from(this.audioCache.entries());
        const toRemove = entries.slice(0, Math.floor(entries.length / 2));
        toRemove.forEach(([key]) => this.audioCache.delete(key));
    }

    updateMetrics(text, voiceId, startTime) {
        this.metrics.charactersGenerated += text.length;
        this.metrics.audioFilesCreated++;

        const processingTime = Date.now() - startTime;
        this.metrics.averageProcessingTime =
            (this.metrics.averageProcessingTime + processingTime) / 2;

        const currentUsage = this.metrics.voiceUsage.get(voiceId) || 0;
        this.metrics.voiceUsage.set(voiceId, currentUsage + 1);
    }

    // Public API methods
    getVoices() {
        return Array.from(this.voices.values());
    }

    getModels() {
        return Array.from(this.models.values());
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('elevenlabs_api_key', apiKey);
    }

    setVoiceSettings(settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
    }

    clearCache() {
        this.audioCache.clear();
    }

    // Utility methods for different voice styles
    async speakNarration(text, options = {}) {
        return this.generateSpeech(text, {
            useCase: 'narration',
            voiceSettings: {
                stability: 0.7,
                similarityBoost: 0.8,
                style: 0.1
            },
            ...options
        });
    }

    async speakConversation(text, options = {}) {
        return this.generateSpeech(text, {
            useCase: 'conversation',
            voiceSettings: {
                stability: 0.5,
                similarityBoost: 0.7,
                style: 0.3
            },
            ...options
        });
    }

    async speakEmotional(text, emotion = 'neutral', options = {}) {
        const emotionSettings = {
            happy: { stability: 0.4, similarityBoost: 0.6, style: 0.5 },
            sad: { stability: 0.8, similarityBoost: 0.9, style: 0.2 },
            angry: { stability: 0.3, similarityBoost: 0.5, style: 0.7 },
            excited: { stability: 0.2, similarityBoost: 0.4, style: 0.8 },
            calm: { stability: 0.9, similarityBoost: 0.8, style: 0.1 },
            neutral: { stability: 0.5, similarityBoost: 0.8, style: 0.0 }
        };

        return this.generateSpeech(text, {
            voiceSettings: emotionSettings[emotion] || emotionSettings.neutral,
            ...options
        });
    }
}

// Export for use in other modules
window.ElevenLabsManager = ElevenLabsManager;
