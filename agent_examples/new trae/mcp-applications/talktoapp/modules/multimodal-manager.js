/**
 * Multi-Modal AI Manager
 * Orchestrates computer vision, voice, text, and multi-agent collaboration
 */

class MultiModalManager {
    constructor() {
        this.agents = new Map();
        this.voiceManager = null;
        this.visionManager = null;
        this.apiOrchestrator = null;
        this.browserManager = null;
        this.terminalManager = null;
        this.elevenLabsAPI = null;
        this.openRouterAPI = null;
        this.isInitialized = false;
        this.processingQueue = [];
        this.activeProcesses = new Set();
        this.conversationHistory = [];
        this.context = {
            user: {},
            session: {},
            preferences: {}
        };
    }

    async initialize() {
        console.log('🚀 Initializing Multi-Modal AI Manager...');

        try {
            // Initialize core components
            await this.initializeAPIs();
            await this.initializeAgents();
            await this.initializeVoiceSystem();
            await this.initializeVisionSystem();
            await this.initializeBrowserManager();
            await this.initializeTerminalManager();

            this.isInitialized = true;
            console.log('✅ Multi-Modal AI Manager initialized successfully!');

            // Start parallel processing
            this.startParallelProcessing();

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Multi-Modal AI Manager:', error);
            return false;
        }
    }

    async initializeAPIs() {
        // Initialize OpenRouter API
        this.openRouterAPI = new OpenRouterManager();
        await this.openRouterAPI.initialize();

        // Initialize ElevenLabs API
        this.elevenLabsAPI = new ElevenLabsManager();
        await this.elevenLabsAPI.initialize();

        console.log('🔗 APIs initialized');
    }

    async initializeAgents() {
        // Create specialized AI agents using MOA architecture
        const agentConfigs = [
            {
                id: 'manager',
                name: 'AI Manager',
                role: 'orchestrator',
                model: 'gpt-4-turbo',
                capabilities: ['coordination', 'decision-making', 'user-interface'],
                priority: 1
            },
            {
                id: 'developer',
                name: 'Code Developer',
                role: 'developer',
                model: 'claude-3-opus',
                capabilities: ['coding', 'debugging', 'architecture'],
                priority: 2
            },
            {
                id: 'designer',
                name: 'UI/UX Designer',
                role: 'designer',
                model: 'gpt-4-vision',
                capabilities: ['design', 'visual-analysis', 'creativity'],
                priority: 2
            },
            {
                id: 'analyst',
                name: 'Data Analyst',
                role: 'analyst',
                model: 'claude-3-sonnet',
                capabilities: ['analysis', 'research', 'optimization'],
                priority: 3
            },
            {
                id: 'tester',
                name: 'Quality Tester',
                role: 'tester',
                model: 'gpt-3.5-turbo',
                capabilities: ['testing', 'validation', 'debugging'],
                priority: 3
            },
            {
                id: 'specialist',
                name: 'Domain Specialist',
                role: 'specialist',
                model: 'mistral-large',
                capabilities: ['domain-expertise', 'specialized-knowledge'],
                priority: 3
            }
        ];

        for (const config of agentConfigs) {
            const agent = new AIAgent(config);
            await agent.initialize();
            this.agents.set(config.id, agent);
        }

        console.log(`🤖 Initialized ${this.agents.size} AI agents`);
    }

    async initializeVoiceSystem() {
        this.voiceManager = new AdvancedVoiceManager();
        await this.voiceManager.initialize(this.elevenLabsAPI);
        console.log('🎤 Voice system initialized');
    }

    async initializeVisionSystem() {
        this.visionManager = new ComputerVisionManager();
        await this.visionManager.initialize();
        console.log('👁️ Computer vision system initialized');
    }

    async initializeBrowserManager() {
        this.browserManager = new EnhancedBrowserManager();
        await this.browserManager.initialize();
        console.log('🌐 Browser manager initialized');
    }

    async initializeTerminalManager() {
        this.terminalManager = new TerminalManager();
        await this.terminalManager.initialize();
        console.log('💻 Terminal manager initialized');
    }

    async processMultiModalInput(input) {
        const processingId = `process_${Date.now()}`;
        this.activeProcesses.add(processingId);

        try {
            // Analyze input type and content
            const analysis = await this.analyzeInput(input);

            // Route to appropriate agents based on analysis
            const routingPlan = await this.createRoutingPlan(analysis);

            // Execute parallel processing
            const results = await this.executeParallelProcessing(routingPlan, input);

            // Synthesize results
            const finalResult = await this.synthesizeResults(results);

            // Update conversation history
            this.updateConversationHistory(input, finalResult);

            return finalResult;
        } catch (error) {
            console.error('❌ Multi-modal processing error:', error);
            throw error;
        } finally {
            this.activeProcesses.delete(processingId);
        }
    }

    async analyzeInput(input) {
        const analysis = {
            type: 'unknown',
            modalities: [],
            intent: null,
            complexity: 'medium',
            requiredAgents: [],
            metadata: {}
        };

        // Text analysis
        if (input.text) {
            analysis.modalities.push('text');
            analysis.intent = await this.detectIntent(input.text);
        }

        // Image analysis
        if (input.image) {
            analysis.modalities.push('vision');
            const visionAnalysis = await this.visionManager.analyzeImage(input.image);
            analysis.metadata.vision = visionAnalysis;
        }

        // Audio analysis
        if (input.audio) {
            analysis.modalities.push('audio');
            const audioAnalysis = await this.voiceManager.analyzeAudio(input.audio);
            analysis.metadata.audio = audioAnalysis;
        }

        // File analysis
        if (input.files) {
            analysis.modalities.push('files');
            analysis.metadata.files = await this.analyzeFiles(input.files);
        }

        // Determine required agents
        analysis.requiredAgents = this.determineRequiredAgents(analysis);

        return analysis;
    }

    async createRoutingPlan(analysis) {
        const plan = {
            primary: null,
            secondary: [],
            parallel: [],
            sequential: [],
            dependencies: new Map()
        };

        // Assign primary agent (manager for orchestration)
        plan.primary = this.agents.get('manager');

        // Determine processing strategy based on complexity and requirements
        if (analysis.intent === 'create_app') {
            plan.parallel = [
                this.agents.get('developer'),
                this.agents.get('designer'),
                this.agents.get('analyst')
            ];
            plan.sequential = [this.agents.get('tester')];
        } else if (analysis.intent === 'analyze_data') {
            plan.parallel = [
                this.agents.get('analyst'),
                this.agents.get('specialist')
            ];
        } else if (analysis.intent === 'debug_code') {
            plan.parallel = [
                this.agents.get('developer'),
                this.agents.get('tester')
            ];
        }

        return plan;
    }

    async executeParallelProcessing(plan, input) {
        const results = {
            primary: null,
            parallel: [],
            sequential: [],
            errors: []
        };

        try {
            // Execute primary agent
            if (plan.primary) {
                results.primary = await plan.primary.process(input, this.context);
            }

            // Execute parallel agents
            if (plan.parallel.length > 0) {
                const parallelPromises = plan.parallel.map(agent =>
                    agent.process(input, this.context).catch(error => ({ error, agent: agent.id }))
                );
                results.parallel = await Promise.all(parallelPromises);
            }

            // Execute sequential agents
            for (const agent of plan.sequential) {
                try {
                    const result = await agent.process(input, { ...this.context, previousResults: results });
                    results.sequential.push(result);
                } catch (error) {
                    results.errors.push({ error, agent: agent.id });
                }
            }

            return results;
        } catch (error) {
            console.error('❌ Parallel processing error:', error);
            results.errors.push({ error, stage: 'execution' });
            return results;
        }
    }

    async synthesizeResults(results) {
        // Use the manager agent to synthesize all results
        const managerAgent = this.agents.get('manager');
        const synthesized = await managerAgent.synthesize(results);

        return {
            success: true,
            result: synthesized,
            metadata: {
                processedAt: new Date().toISOString(),
                agentsUsed: this.getUsedAgents(results),
                processingTime: this.calculateProcessingTime(results)
            }
        };
    }

    startParallelProcessing() {
        // Start background processing for both terminal and web
        this.startTerminalProcessing();
        this.startWebProcessing();

        console.log('🔄 Parallel processing started');
    }

    startTerminalProcessing() {
        setInterval(async () => {
            if (this.terminalManager && this.terminalManager.hasQueuedCommands()) {
                const commands = this.terminalManager.getQueuedCommands();
                for (const command of commands) {
                    await this.processTerminalCommand(command);
                }
            }
        }, 1000);
    }

    startWebProcessing() {
        setInterval(async () => {
            if (this.browserManager && this.browserManager.hasQueuedActions()) {
                const actions = this.browserManager.getQueuedActions();
                for (const action of actions) {
                    await this.processBrowserAction(action);
                }
            }
        }, 500);
    }

    async processTerminalCommand(command) {
        try {
            const result = await this.terminalManager.executeCommand(command);
            await this.notifyAgents('terminal_result', result);
        } catch (error) {
            console.error('❌ Terminal command error:', error);
        }
    }

    async processBrowserAction(action) {
        try {
            const result = await this.browserManager.executeAction(action);
            await this.notifyAgents('browser_result', result);
        } catch (error) {
            console.error('❌ Browser action error:', error);
        }
    }

    async notifyAgents(eventType, data) {
        const notifications = Array.from(this.agents.values()).map(agent =>
            agent.notify(eventType, data).catch(error => console.error(`Agent ${agent.id} notification error:`, error))
        );
        await Promise.allSettled(notifications);
    }

    // Voice interface methods
    async handleVoiceCommand(audioData) {
        const transcription = await this.voiceManager.transcribe(audioData);
        const response = await this.processMultiModalInput({ text: transcription, audio: audioData });

        // Generate voice response
        const voiceResponse = await this.elevenLabsAPI.generateSpeech(response.result.text);
        await this.voiceManager.playAudio(voiceResponse);

        return response;
    }

    // Computer vision methods
    async handleImageInput(imageData) {
        const analysis = await this.visionManager.analyzeImage(imageData);
        const response = await this.processMultiModalInput({ image: imageData });
        return response;
    }

    // Browser automation methods
    async automateWebTask(task) {
        return await this.browserManager.executeTask(task);
    }

    // Terminal automation methods
    async executeTerminalTask(task) {
        return await this.terminalManager.executeTask(task);
    }

    // Utility methods
    detectIntent(text) {
        const intents = {
            create_app: ['create', 'build', 'make', 'develop', 'app', 'application'],
            analyze_data: ['analyze', 'data', 'examine', 'study'],
            debug_code: ['debug', 'fix', 'error', 'bug', 'issue'],
            search_web: ['search', 'find', 'lookup', 'browse'],
            help: ['help', 'how', 'what', 'explain']
        };

        const lowerText = text.toLowerCase();
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return intent;
            }
        }
        return 'general';
    }

    determineRequiredAgents(analysis) {
        const agents = ['manager']; // Always include manager

        if (analysis.intent === 'create_app') {
            agents.push('developer', 'designer', 'tester');
        }
        if (analysis.modalities.includes('vision')) {
            agents.push('designer');
        }
        if (analysis.complexity === 'high') {
            agents.push('specialist');
        }

        return agents;
    }

    getUsedAgents(results) {
        const used = new Set();
        if (results.primary) used.add(results.primary.agentId);
        results.parallel.forEach(result => {
            if (result.agentId) used.add(result.agentId);
        });
        results.sequential.forEach(result => {
            if (result.agentId) used.add(result.agentId);
        });
        return Array.from(used);
    }

    calculateProcessingTime(results) {
        // Implementation for calculating processing time
        return Date.now() - (results.startTime || Date.now());
    }

    updateConversationHistory(input, result) {
        this.conversationHistory.push({
            timestamp: new Date().toISOString(),
            input,
            result,
            agentsUsed: result.metadata?.agentsUsed || []
        });

        // Keep only last 100 interactions
        if (this.conversationHistory.length > 100) {
            this.conversationHistory = this.conversationHistory.slice(-100);
        }
    }

    async analyzeFiles(files) {
        const analysis = {};
        for (const file of files) {
            analysis[file.name] = await this.analyzeFile(file);
        }
        return analysis;
    }

    async analyzeFile(file) {
        // File analysis implementation
        return {
            type: file.type,
            size: file.size,
            content: file.type.startsWith('text/') ? await file.text() : null
        };
    }
}

// Initialize global instance
window.multiModalManager = new MultiModalManager();
