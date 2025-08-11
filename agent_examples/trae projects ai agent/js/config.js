// Configuration for AI Agent Workforce System
const CONFIG = {
    // API Configuration
    apis: {
        openRouter: {
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('openrouter_api_key') : '') || '', // Load from localStorage
            models: [
                'anthropic/claude-3.5-sonnet',
                'openai/gpt-4-turbo',
                'openai/gpt-4',
                'openai/gpt-3.5-turbo',
                'meta-llama/llama-3.1-8b-instruct',
                'google/gemini-pro',
                'mistralai/mistral-7b-instruct'
            ]
        },
        elevenLabs: {
            baseUrl: 'https://api.elevenlabs.io/v1',
            apiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('elevenlabs_api_key') : '') || '', // Load from localStorage
            voices: {
                'default': '21m00Tcm4TlvDq8ikWAM', // Rachel voice
                'male': 'VR6AewLTigWG4xSOukaG', // Josh voice
                'female': 'EXAVITQu4vr4xnSDxMaL' // Bella voice
            }
        },
        vision: {
            // Computer vision APIs
            openai: 'https://api.openai.com/v1/chat/completions',
            google: 'https://vision.googleapis.com/v1/images:annotate'
        }
    },

    // Agent Configuration
    agents: {
        maxConcurrent: 10,
        defaultModel: 'anthropic/claude-3.5-sonnet', // Updated to match available models
        capabilities: {
            'coding': {
                description: '300 IQ Coding Expert',
                skills: ['programming', 'debugging', 'architecture', 'optimization'],
                tools: ['code-execution', 'file-operations', 'git', 'testing']
            },
            'research': {
                description: 'Research Specialist',
                skills: ['web-search', 'data-analysis', 'fact-checking', 'summarization'],
                tools: ['web-browsing', 'api-calls', 'data-processing']
            },
            'automation': {
                description: 'Automation Engineer',
                skills: ['workflow-automation', 'scripting', 'monitoring', 'scheduling'],
                tools: ['browser-automation', 'api-integration', 'task-scheduling']
            },
            'vision': {
                description: 'Computer Vision Expert',
                skills: ['image-analysis', 'object-detection', 'ocr', 'pattern-recognition'],
                tools: ['image-processing', 'ml-models', 'data-extraction']
            },
            'data': {
                description: 'Data Scientist',
                skills: ['data-analysis', 'machine-learning', 'statistics', 'visualization'],
                tools: ['data-processing', 'ml-frameworks', 'visualization-tools']
            },
            'security': {
                description: 'Security Analyst',
                skills: ['vulnerability-assessment', 'penetration-testing', 'compliance', 'monitoring'],
                tools: ['security-scanners', 'monitoring-tools', 'compliance-checks']
            },
            'design': {
                description: 'UI/UX Designer',
                skills: ['user-interface', 'user-experience', 'prototyping', 'accessibility'],
                tools: ['design-tools', 'prototyping', 'user-testing']
            },
            'devops': {
                description: 'DevOps Engineer',
                skills: ['deployment', 'infrastructure', 'monitoring', 'scaling'],
                tools: ['containerization', 'orchestration', 'ci-cd', 'monitoring']
            },
            'qa': {
                description: 'Quality Assurance',
                skills: ['testing', 'quality-control', 'bug-tracking', 'automation-testing'],
                tools: ['testing-frameworks', 'bug-tracking', 'performance-testing']
            },
            'general': {
                description: 'General Assistant',
                skills: ['task-management', 'communication', 'coordination', 'support'],
                tools: ['general-tools', 'communication', 'task-tracking']
            }
        }
    },

    // System Configuration
    system: {
        maxTasksPerAgent: 5,
        taskTimeout: 300000, // 5 minutes
        autoSpawnAgents: true,
        healthCheckInterval: 30000, // 30 seconds
        maxMemoryUsage: 80, // percentage
        maxErrorCount: 10,
        performanceThreshold: 1000, // milliseconds
        debug: false,
        autonomyLevels: {
            'supervised': {
                requiresApproval: true,
                canExecuteCode: false,
                canAccessFiles: false,
                canMakeApiCalls: false
            },
            'semi-autonomous': {
                requiresApproval: true,
                canExecuteCode: true,
                canAccessFiles: true,
                canMakeApiCalls: true
            },
            'fully-autonomous': {
                requiresApproval: false,
                canExecuteCode: true,
                canAccessFiles: true,
                canMakeApiCalls: true
            }
        },
        safeguards: {
            enabled: true,
            restrictedDomains: [],
            allowedFileTypes: ['.txt', '.js', '.html', '.css', '.json', '.md', '.py', '.php'],
            maxFileSize: 10485760, // 10MB
            rateLimits: {
                apiCalls: 100, // per minute
                fileOperations: 50, // per minute
                codeExecutions: 20 // per minute
            }
        }
    },

    // UI Configuration
    ui: {
        theme: 'dark',
        animations: true,
        notifications: true,
        autoScroll: true,
        maxChatHistory: 1000,
        refreshInterval: 5000 // 5 seconds
    },

    // Voice Configuration
    voice: {
        enabled: false,
        autoSpeak: false,
        useElevenLabs: false,
        enableTTS: true,
        voice: 'default',
        speed: 1.0,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 0.8,
        volume: 0.8,
        language: 'en-US'
    },

    // Storage Configuration
    storage: {
        prefix: 'ai_workforce_',
        persistAgents: true,
        persistTasks: true,
        persistHistory: true,
        persistState: true,
        maxStorageSize: 52428800 // 50MB
    }
};

// Environment Detection
CONFIG.environment = {
    isBrowser: typeof window !== 'undefined',
    isSecure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    hasWebGL: typeof WebGLRenderingContext !== 'undefined',
    hasWebRTC: typeof RTCPeerConnection !== 'undefined',
    hasWebAssembly: typeof WebAssembly !== 'undefined',
    hasServiceWorker: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasGeolocation: 'geolocation' in navigator,
    hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
    hasMicrophone: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
};

// Feature Detection
CONFIG.features = {
    voiceInput: CONFIG.environment.hasMicrophone && CONFIG.environment.isSecure,
    voiceOutput: 'speechSynthesis' in window || CONFIG.apis.elevenLabs.apiKey,
    computerVision: CONFIG.environment.hasCamera || CONFIG.apis.vision.openai,
    fileAccess: 'showOpenFilePicker' in window,
    notifications: CONFIG.environment.hasNotifications,
    offlineMode: CONFIG.environment.hasServiceWorker,
    webAssembly: CONFIG.environment.hasWebAssembly,
    webGL: CONFIG.environment.hasWebGL
};

// Validation
CONFIG.validate = function() {
    const errors = [];
    
    if (!CONFIG.apis.openRouter.apiKey) {
        errors.push('OpenRouter API key is required');
    }
    
    if (CONFIG.voice.enabled && !CONFIG.apis.elevenLabs.apiKey && !('speechSynthesis' in window)) {
        errors.push('ElevenLabs API key is required for voice features or browser speech synthesis not available');
    }
    
    if (CONFIG.agents.maxConcurrent < 1 || CONFIG.agents.maxConcurrent > 50) {
        errors.push('Max concurrent agents must be between 1 and 50');
    }
    
    return errors;
};

// Initialize configuration
CONFIG.init = function() {
    // Load from localStorage if available
    if (CONFIG.environment.isBrowser && localStorage) {
        const stored = localStorage.getItem(CONFIG.storage.prefix + 'config');
        if (stored) {
            try {
                const storedConfig = JSON.parse(stored);
                Object.assign(CONFIG, storedConfig);
            } catch (e) {
                console.warn('Failed to load stored configuration:', e);
            }
        }
        
        // Always reload API keys from localStorage (for security)
        CONFIG.apis.openRouter.apiKey = localStorage.getItem('openrouter_api_key') || '';
        CONFIG.apis.elevenLabs.apiKey = localStorage.getItem('elevenlabs_api_key') || '';
    }
    
    // Validate configuration
    const errors = CONFIG.validate();
    if (errors.length > 0) {
        console.warn('Configuration validation errors:', errors);
    }
    
    return CONFIG;
};

// Save configuration
CONFIG.save = function() {
    if (CONFIG.environment.isBrowser && localStorage) {
        try {
            localStorage.setItem(CONFIG.storage.prefix + 'config', JSON.stringify(CONFIG));
        } catch (e) {
            console.warn('Failed to save configuration:', e);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// Initialize configuration when loaded
if (typeof window !== 'undefined') {
    CONFIG.init();
}