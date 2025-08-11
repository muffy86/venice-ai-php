/**
 * Memory Assistant for TalkToApp
 * Provides natural language interaction with the advanced memory system.
 * Allows users to store, retrieve, and manage memories through conversational interface.
 */

class MemoryAssistant {
    constructor() {
        this.memorySystem = null;
        this.memoryDatabase = null;
        this.conversationHistory = [];
        this.userPreferences = {};
        this.activeContext = {};
        
        this.nlpProcessor = new NLPProcessor();
        this.intentClassifier = new IntentClassifier();
        this.responseGenerator = new ResponseGenerator();
        this.contextManager = new ContextManager();

        this.commands = {
            store: ['remember', 'save', 'store', 'keep', 'note'],
            retrieve: ['recall', 'find', 'search', 'get', 'show', 'what'],
            update: ['update', 'modify', 'change', 'edit', 'revise'],
            delete: ['forget', 'delete', 'remove', 'erase'],
            analyze: ['analyze', 'summarize', 'report', 'statistics'],
            relate: ['connect', 'link', 'associate', 'relate'],
            help: ['help', 'guide', 'how', 'what can you do']
        };

        this.initializeAssistant();
        this.createAssistantUI();
    }

    /**
     * Initialize the memory assistant
     */
    async initializeAssistant() {
        try {
            // Wait for memory system to be available
            await this.waitForMemorySystem();
            
            // Load user preferences
            await this.loadUserPreferences();
            
            // Initialize conversation context
            this.initializeContext();
            
            console.log('🤖 Memory Assistant initialized');
        } catch (error) {
            console.error('❌ Memory Assistant initialization failed:', error);
        }
    }

    /**
     * Wait for memory system to be available
     */
    async waitForMemorySystem() {
        return new Promise((resolve) => {
            const checkSystem = () => {
                if (window.memorySystem && window.MemoryDatabase) {
                    this.memorySystem = window.memorySystem;
                    this.memoryDatabase = new window.MemoryDatabase();
                    resolve();
                } else {
                    setTimeout(checkSystem, 100);
                }
            };
            checkSystem();
        });
    }

    /**
     * Process natural language input
     */
    async processInput(input) {
        try {
            // Add to conversation history
            this.conversationHistory.push({
                type: 'user',
                content: input,
                timestamp: new Date()
            });

            // Process with NLP
            const processed = await this.nlpProcessor.process(input);
            
            // Classify intent
            const intent = await this.intentClassifier.classify(processed);
            
            // Update context
            this.contextManager.updateContext(processed, intent);
            
            // Execute command
            const result = await this.executeCommand(intent, processed);
            
            // Generate response
            const response = await this.responseGenerator.generate(result, intent, processed);
            
            // Add response to history
            this.conversationHistory.push({
                type: 'assistant',
                content: response,
                timestamp: new Date(),
                intent: intent,
                result: result
            });

            return response;
        } catch (error) {
            console.error('❌ Failed to process input:', error);
            return "I'm sorry, I encountered an error processing your request. Please try again.";
        }
    }

    /**
     * Execute command based on intent
     */
    async executeCommand(intent, processed) {
        const { action, entities, confidence } = intent;

        switch (action) {
            case 'store':
                return await this.handleStoreCommand(entities, processed);
            
            case 'retrieve':
                return await this.handleRetrieveCommand(entities, processed);
            
            case 'update':
                return await this.handleUpdateCommand(entities, processed);
            
            case 'delete':
                return await this.handleDeleteCommand(entities, processed);
            
            case 'analyze':
                return await this.handleAnalyzeCommand(entities, processed);
            
            case 'relate':
                return await this.handleRelateCommand(entities, processed);
            
            case 'help':
                return await this.handleHelpCommand(entities, processed);
            
            default:
                return await this.handleUnknownCommand(processed);
        }
    }

    /**
     * Handle store command
     */
    async handleStoreCommand(entities, processed) {
        try {
            const data = entities.content || processed.text;
            const type = entities.type || this.inferType(data);
            const importance = entities.importance || this.inferImportance(data);
            const tags = entities.tags || this.extractTags(data);
            const context = this.activeContext;

            const memoryId = await this.memorySystem.store(data, {
                type,
                importance,
                tags,
                context
            });

            return {
                success: true,
                memoryId,
                message: `I've stored that information with ID ${memoryId}`,
                data: { type, importance, tags }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't store that information. Please try again."
            };
        }
    }

    /**
     * Handle retrieve command
     */
    async handleRetrieveCommand(entities, processed) {
        try {
            const query = entities.query || processed.text;
            const filters = {
                type: entities.type,
                importance: entities.importance,
                limit: entities.limit || 10
            };

            const memories = await this.memorySystem.retrieve(query, filters);

            return {
                success: true,
                memories,
                count: memories.length,
                message: `I found ${memories.length} relevant memories`,
                query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't retrieve that information. Please try again."
            };
        }
    }

    /**
     * Handle update command
     */
    async handleUpdateCommand(entities, processed) {
        try {
            const memoryId = entities.memoryId;
            const newData = entities.content || processed.text;

            if (!memoryId) {
                // Try to find memory based on context
                const contextMemories = await this.findContextualMemories(processed);
                if (contextMemories.length === 1) {
                    const updatedId = await this.memorySystem.buildUpon(contextMemories[0].id, newData);
                    return {
                        success: true,
                        memoryId: updatedId,
                        message: "I've updated that memory with the new information"
                    };
                } else {
                    return {
                        success: false,
                        message: "I need you to specify which memory to update"
                    };
                }
            }

            const updatedId = await this.memorySystem.buildUpon(memoryId, newData);
            return {
                success: true,
                memoryId: updatedId,
                message: "I've updated that memory with the new information"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't update that memory. Please try again."
            };
        }
    }

    /**
     * Handle delete command
     */
    async handleDeleteCommand(entities, processed) {
        try {
            const memoryId = entities.memoryId;
            
            if (!memoryId) {
                return {
                    success: false,
                    message: "I need you to specify which memory to delete"
                };
            }

            await this.memoryDatabase.deleteMemory(memoryId);
            return {
                success: true,
                message: "I've deleted that memory"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't delete that memory. Please try again."
            };
        }
    }

    /**
     * Handle analyze command
     */
    async handleAnalyzeCommand(entities, processed) {
        try {
            const stats = await this.memoryDatabase.getStatistics();
            const analysis = await this.generateAnalysis(stats);

            return {
                success: true,
                statistics: stats,
                analysis,
                message: "Here's an analysis of your memory system"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't analyze your memories. Please try again."
            };
        }
    }

    /**
     * Handle relate command
     */
    async handleRelateCommand(entities, processed) {
        try {
            const fromId = entities.fromMemoryId;
            const toId = entities.toMemoryId;
            const relationType = entities.relationType || 'related';

            if (!fromId || !toId) {
                return {
                    success: false,
                    message: "I need you to specify which memories to relate"
                };
            }

            const relationshipId = await this.memoryDatabase.createRelationship(fromId, toId, relationType);
            return {
                success: true,
                relationshipId,
                message: `I've created a ${relationType} relationship between those memories`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: "I couldn't create that relationship. Please try again."
            };
        }
    }

    /**
     * Handle help command
     */
    async handleHelpCommand(entities, processed) {
        const helpText = `
I'm your Memory Assistant! Here's what I can help you with:

**Storing Information:**
- "Remember that John's birthday is March 15th"
- "Save this as important: Meeting notes from today"
- "Store this code snippet with tags: javascript, function"

**Retrieving Information:**
- "What do you know about John?"
- "Find all my meeting notes"
- "Show me important memories from last week"

**Updating Information:**
- "Update John's birthday to March 16th"
- "Add to my meeting notes: Action items discussed"

**Analyzing Memories:**
- "Show me memory statistics"
- "Analyze my stored information"

**Creating Relationships:**
- "Connect John's birthday to my calendar events"
- "Relate this project to my work memories"

**Other Commands:**
- "Delete that memory"
- "Help" or "What can you do?"

I understand natural language, so feel free to ask in your own words!
        `;

        return {
            success: true,
            message: helpText.trim()
        };
    }

    /**
     * Handle unknown command
     */
    async handleUnknownCommand(processed) {
        // Try to infer what the user wants
        const suggestions = await this.generateSuggestions(processed);

        return {
            success: false,
            message: "I'm not sure what you want me to do. Here are some suggestions:",
            suggestions
        };
    }

    /**
     * Infer memory type from content
     */
    inferType(content) {
        const text = content.toLowerCase();
        
        if (text.includes('meeting') || text.includes('note')) return 'note';
        if (text.includes('birthday') || text.includes('anniversary')) return 'event';
        if (text.includes('code') || text.includes('function')) return 'code';
        if (text.includes('idea') || text.includes('thought')) return 'idea';
        if (text.includes('task') || text.includes('todo')) return 'task';
        if (text.includes('fact') || text.includes('information')) return 'fact';
        
        return 'general';
    }

    /**
     * Infer importance from content
     */
    inferImportance(content) {
        const text = content.toLowerCase();
        
        if (text.includes('important') || text.includes('critical') || text.includes('urgent')) return 9;
        if (text.includes('remember') || text.includes('don\'t forget')) return 7;
        if (text.includes('note') || text.includes('reminder')) return 6;
        if (text.includes('maybe') || text.includes('possibly')) return 3;
        
        return 5; // Default importance
    }

    /**
     * Extract tags from content
     */
    extractTags(content) {
        const text = content.toLowerCase();
        const tags = [];
        
        // Common tag patterns
        const tagPatterns = [
            /tags?:\s*([^.!?]+)/i,
            /tagged?\s+as\s+([^.!?]+)/i,
            /#(\w+)/g
        ];

        tagPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                if (pattern.global) {
                    matches.forEach(match => tags.push(match.substring(1)));
                } else {
                    tags.push(...matches[1].split(',').map(tag => tag.trim()));
                }
            }
        });

        // Auto-generate tags based on content
        if (tags.length === 0) {
            tags.push(...this.generateAutoTags(content));
        }

        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Generate automatic tags
     */
    generateAutoTags(content) {
        const text = content.toLowerCase();
        const autoTags = [];

        // Technology tags
        if (text.includes('javascript') || text.includes('js')) autoTags.push('javascript');
        if (text.includes('python')) autoTags.push('python');
        if (text.includes('react')) autoTags.push('react');
        if (text.includes('node')) autoTags.push('nodejs');

        // Category tags
        if (text.includes('meeting')) autoTags.push('meeting');
        if (text.includes('project')) autoTags.push('project');
        if (text.includes('personal')) autoTags.push('personal');
        if (text.includes('work')) autoTags.push('work');

        return autoTags;
    }

    /**
     * Find contextual memories
     */
    async findContextualMemories(processed) {
        // Look for memories related to current context
        const recentMemories = this.conversationHistory
            .filter(entry => entry.type === 'assistant' && entry.result?.memoryId)
            .slice(-5); // Last 5 memories mentioned

        const contextualMemories = [];
        for (const entry of recentMemories) {
            if (entry.result.memoryId) {
                const memory = await this.memoryDatabase.getMemory(entry.result.memoryId);
                if (memory) {
                    contextualMemories.push(memory);
                }
            }
        }

        return contextualMemories;
    }

    /**
     * Generate analysis of memory statistics
     */
    async generateAnalysis(stats) {
        const analysis = {
            summary: `You have ${stats.totalMemories} memories stored with ${stats.totalRelationships} relationships.`,
            insights: [],
            recommendations: []
        };

        // Generate insights
        if (stats.averageImportance > 7) {
            analysis.insights.push("You tend to store high-importance information.");
        }

        const topType = Object.keys(stats.memoryTypes).reduce((a, b) => 
            stats.memoryTypes[a] > stats.memoryTypes[b] ? a : b
        );
        analysis.insights.push(`Your most common memory type is "${topType}".`);

        // Generate recommendations
        if (stats.totalMemories > 100 && stats.totalRelationships < stats.totalMemories * 0.1) {
            analysis.recommendations.push("Consider creating more relationships between your memories to improve recall.");
        }

        if (stats.compressionRatio < 50) {
            analysis.recommendations.push("Your memories could benefit from compression to save storage space.");
        }

        return analysis;
    }

    /**
     * Generate suggestions for unknown commands
     */
    async generateSuggestions(processed) {
        const suggestions = [
            "Try: 'Remember that...' to store information",
            "Try: 'What do you know about...' to search",
            "Try: 'Show me statistics' to analyze your memories",
            "Say 'help' for a complete list of commands"
        ];

        return suggestions;
    }

    /**
     * Create assistant UI
     */
    createAssistantUI() {
        const assistantPanel = document.createElement('div');
        assistantPanel.id = 'memory-assistant-panel';
        assistantPanel.innerHTML = `
            <div class="assistant-panel">
                <div class="assistant-header">
                    <h3>🤖 Memory Assistant</h3>
                    <button class="assistant-toggle">Toggle</button>
                </div>
                <div class="assistant-content">
                    <div class="conversation-area" id="conversation-area">
                        <div class="welcome-message">
                            <p>👋 Hi! I'm your Memory Assistant. I can help you store, find, and manage your memories using natural language.</p>
                            <p>Try saying something like: "Remember that John's birthday is March 15th" or "What do you know about my projects?"</p>
                        </div>
                    </div>
                    
                    <div class="input-area">
                        <input type="text" id="assistant-input" placeholder="Ask me anything about your memories..." />
                        <button id="assistant-send">Send</button>
                    </div>

                    <div class="quick-actions">
                        <button class="quick-btn" onclick="window.memoryAssistant.quickAction('help')">
                            ❓ Help
                        </button>
                        <button class="quick-btn" onclick="window.memoryAssistant.quickAction('stats')">
                            📊 Statistics
                        </button>
                        <button class="quick-btn" onclick="window.memoryAssistant.quickAction('recent')">
                            🕒 Recent
                        </button>
                        <button class="quick-btn" onclick="window.memoryAssistant.quickAction('clear')">
                            🗑️ Clear
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                .assistant-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 400px;
                    height: 500px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
                    z-index: 10001;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                }

                .assistant-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }

                .assistant-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }

                .assistant-toggle {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .assistant-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    overflow: hidden;
                }

                .conversation-area {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    font-size: 14px;
                    line-height: 1.4;
                }

                .welcome-message {
                    opacity: 0.8;
                    font-size: 13px;
                }

                .message {
                    margin-bottom: 15px;
                    padding: 10px;
                    border-radius: 8px;
                    max-width: 90%;
                }

                .user-message {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    margin-left: auto;
                    text-align: right;
                }

                .assistant-message {
                    background: rgba(255, 255, 255, 0.1);
                    margin-right: auto;
                }

                .input-area {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .input-area input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 10px 12px;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .input-area input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .input-area button {
                    background: linear-gradient(135deg, #4facfe, #00f2fe);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }

                .quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .quick-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.3s ease;
                }

                .quick-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-1px);
                }

                .assistant-content.collapsed {
                    display: none;
                }

                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    opacity: 0.6;
                    font-style: italic;
                }

                .typing-dots {
                    display: flex;
                    gap: 2px;
                }

                .typing-dot {
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }

                .typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typing {
                    0%, 60%, 100% { opacity: 0.3; }
                    30% { opacity: 1; }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(assistantPanel);

        // Add event listeners
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for the UI
     */
    setupEventListeners() {
        const toggleBtn = document.querySelector('.assistant-toggle');
        const content = document.querySelector('.assistant-content');
        const input = document.getElementById('assistant-input');
        const sendBtn = document.getElementById('assistant-send');

        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            content.classList.toggle('collapsed');
            toggleBtn.textContent = content.classList.contains('collapsed') ? 'Show' : 'Hide';
        });

        // Send message
        const sendMessage = async () => {
            const message = input.value.trim();
            if (message) {
                input.value = '';
                await this.handleUserMessage(message);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    /**
     * Handle user message in UI
     */
    async handleUserMessage(message) {
        const conversationArea = document.getElementById('conversation-area');
        
        // Add user message
        this.addMessageToUI(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Process message
            const response = await this.processInput(message);
            
            // Remove typing indicator and add response
            this.hideTypingIndicator();
            this.addMessageToUI(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessageToUI("I'm sorry, I encountered an error. Please try again.", 'assistant');
        }
    }

    /**
     * Add message to UI
     */
    addMessageToUI(message, type) {
        const conversationArea = document.getElementById('conversation-area');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;
        
        conversationArea.appendChild(messageDiv);
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const conversationArea = document.getElementById('conversation-area');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            Assistant is typing
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        conversationArea.appendChild(typingDiv);
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    /**
     * Handle quick actions
     */
    async quickAction(action) {
        switch (action) {
            case 'help':
                await this.handleUserMessage('help');
                break;
            case 'stats':
                await this.handleUserMessage('show me statistics');
                break;
            case 'recent':
                await this.handleUserMessage('show me recent memories');
                break;
            case 'clear':
                this.clearConversation();
                break;
        }
    }

    /**
     * Clear conversation
     */
    clearConversation() {
        const conversationArea = document.getElementById('conversation-area');
        conversationArea.innerHTML = `
            <div class="welcome-message">
                <p>👋 Hi! I'm your Memory Assistant. I can help you store, find, and manage your memories using natural language.</p>
                <p>Try saying something like: "Remember that John's birthday is March 15th" or "What do you know about my projects?"</p>
            </div>
        `;
        this.conversationHistory = [];
    }

    /**
     * Load user preferences
     */
    async loadUserPreferences() {
        try {
            const stored = localStorage.getItem('memoryAssistantPreferences');
            if (stored) {
                this.userPreferences = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    }

    /**
     * Save user preferences
     */
    async saveUserPreferences() {
        try {
            localStorage.setItem('memoryAssistantPreferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    /**
     * Initialize context
     */
    initializeContext() {
        this.activeContext = {
            session: Date.now(),
            location: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date()
        };
    }
}

/**
 * Simple NLP Processor
 */
class NLPProcessor {
    async process(text) {
        return {
            text: text.trim(),
            tokens: this.tokenize(text),
            entities: this.extractEntities(text),
            sentiment: this.analyzeSentiment(text)
        };
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    extractEntities(text) {
        const entities = {};
        
        // Extract dates
        const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\w+\s+\d{1,2}(?:st|nd|rd|th)?\b/gi;
        const dates = text.match(datePattern);
        if (dates) entities.dates = dates;

        // Extract numbers
        const numberPattern = /\b\d+\b/g;
        const numbers = text.match(numberPattern);
        if (numbers) entities.numbers = numbers.map(n => parseInt(n));

        // Extract emails
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailPattern);
        if (emails) entities.emails = emails;

        return entities;
    }

    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });

        return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    }
}

/**
 * Intent Classifier
 */
class IntentClassifier {
    async classify(processed) {
        const { text, tokens } = processed;
        const textLower = text.toLowerCase();

        // Define intent patterns
        const patterns = {
            store: /\b(remember|save|store|keep|note)\b/i,
            retrieve: /\b(recall|find|search|get|show|what|tell me|do you know)\b/i,
            update: /\b(update|modify|change|edit|revise|add to)\b/i,
            delete: /\b(forget|delete|remove|erase)\b/i,
            analyze: /\b(analyze|summarize|report|statistics|stats)\b/i,
            relate: /\b(connect|link|associate|relate)\b/i,
            help: /\b(help|guide|how|what can you do)\b/i
        };

        // Find matching intent
        for (const [intent, pattern] of Object.entries(patterns)) {
            if (pattern.test(textLower)) {
                return {
                    action: intent,
                    confidence: 0.8,
                    entities: this.extractIntentEntities(text, intent)
                };
            }
        }

        return {
            action: 'unknown',
            confidence: 0.1,
            entities: {}
        };
    }

    extractIntentEntities(text, intent) {
        const entities = {};

        switch (intent) {
            case 'store':
                // Extract content after trigger words
                const storeMatch = text.match(/(?:remember|save|store|keep|note)\s+(?:that\s+)?(.+)/i);
                if (storeMatch) entities.content = storeMatch[1];
                break;

            case 'retrieve':
                // Extract query after trigger words
                const retrieveMatch = text.match(/(?:find|search|show|what|tell me about|do you know about)\s+(.+)/i);
                if (retrieveMatch) entities.query = retrieveMatch[1];
                break;

            case 'update':
                // Extract memory reference and new content
                const updateMatch = text.match(/(?:update|modify|change|edit)\s+(.+?)\s+(?:to|with)\s+(.+)/i);
                if (updateMatch) {
                    entities.target = updateMatch[1];
                    entities.content = updateMatch[2];
                }
                break;
        }

        return entities;
    }
}

/**
 * Response Generator
 */
class ResponseGenerator {
    async generate(result, intent, processed) {
        if (!result.success) {
            return result.message || "I couldn't complete that request.";
        }

        switch (intent.action) {
            case 'store':
                return this.generateStoreResponse(result);
            case 'retrieve':
                return this.generateRetrieveResponse(result);
            case 'update':
                return this.generateUpdateResponse(result);
            case 'delete':
                return this.generateDeleteResponse(result);
            case 'analyze':
                return this.generateAnalyzeResponse(result);
            case 'relate':
                return this.generateRelateResponse(result);
            case 'help':
                return result.message;
            default:
                return "I've processed your request.";
        }
    }

    generateStoreResponse(result) {
        const { data } = result;
        let response = `✅ I've stored that information`;
        
        if (data.type !== 'general') {
            response += ` as a ${data.type}`;
        }
        
        if (data.importance > 7) {
            response += ` with high importance`;
        }
        
        if (data.tags.length > 0) {
            response += ` and tagged it with: ${data.tags.join(', ')}`;
        }
        
        return response + '.';
    }

    generateRetrieveResponse(result) {
        const { memories, count, query } = result;
        
        if (count === 0) {
            return `❌ I couldn't find any memories matching "${query}".`;
        }
        
        let response = `📋 I found ${count} memory${count > 1 ? 'ies' : ''} about "${query}":\n\n`;
        
        memories.slice(0, 3).forEach((memory, index) => {
            const preview = JSON.stringify(memory.data).substring(0, 100);
            response += `${index + 1}. ${preview}${preview.length >= 100 ? '...' : ''}\n`;
            response += `   Type: ${memory.type}, Importance: ${memory.importance}/10\n\n`;
        });
        
        if (count > 3) {
            response += `... and ${count - 3} more memories.`;
        }
        
        return response;
    }

    generateUpdateResponse(result) {
        return `✅ I've successfully updated that memory with the new information.`;
    }

    generateDeleteResponse(result) {
        return `🗑️ I've deleted that memory from your collection.`;
    }

    generateAnalyzeResponse(result) {
        const { statistics, analysis } = result;
        
        let response = `📊 **Memory Analysis:**\n\n`;
        response += `${analysis.summary}\n\n`;
        
        if (analysis.insights.length > 0) {
            response += `**Insights:**\n`;
            analysis.insights.forEach(insight => {
                response += `• ${insight}\n`;
            });
            response += '\n';
        }
        
        if (analysis.recommendations.length > 0) {
            response += `**Recommendations:**\n`;
            analysis.recommendations.forEach(rec => {
                response += `• ${rec}\n`;
            });
        }
        
        return response;
    }

    generateRelateResponse(result) {
        return `🔗 I've created that relationship between the memories.`;
    }
}

/**
 * Context Manager
 */
class ContextManager {
    constructor() {
        this.context = {};
    }

    updateContext(processed, intent) {
        // Update context based on processed input and intent
        this.context.lastIntent = intent;
        this.context.lastProcessed = processed;
        this.context.timestamp = new Date();
    }

    getContext() {
        return this.context;
    }
}

// Initialize memory assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memoryAssistant = new MemoryAssistant();
    console.log('🤖 Memory Assistant ready');
});