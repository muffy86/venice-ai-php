/**
 * Advanced AI Chat Features
 * Enhanced conversation system with history, context awareness, and smart suggestions
 */

class AdvancedChat {
    constructor() {
        this.conversationHistory = [];
        this.contextMemory = new Map();
        this.userPreferences = {};
        this.smartSuggestions = [];
        this.isTyping = false;
        this.maxHistoryLength = 100;
        
        this.init();
    }

    init() {
        this.loadConversationHistory();
        this.loadUserPreferences();
        this.setupChatEnhancements();
        this.initializeSmartSuggestions();
        this.setupContextAnalysis();
    }

    loadConversationHistory() {
        const saved = localStorage.getItem('talktoapp_chat_history');
        if (saved) {
            try {
                this.conversationHistory = JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to load chat history:', e);
                this.conversationHistory = [];
            }
        }
    }

    saveConversationHistory() {
        try {
            // Keep only the last maxHistoryLength messages
            const trimmed = this.conversationHistory.slice(-this.maxHistoryLength);
            localStorage.setItem('talktoapp_chat_history', JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }

    loadUserPreferences() {
        const saved = localStorage.getItem('talktoapp_user_preferences');
        if (saved) {
            try {
                this.userPreferences = JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to load user preferences:', e);
                this.userPreferences = {};
            }
        }
        
        // Set defaults
        this.userPreferences = {
            preferredAppTypes: [],
            communicationStyle: 'friendly',
            complexityLevel: 'intermediate',
            showSuggestions: true,
            autoSave: true,
            ...this.userPreferences
        };
    }

    saveUserPreferences() {
        try {
            localStorage.setItem('talktoapp_user_preferences', JSON.stringify(this.userPreferences));
        } catch (e) {
            console.warn('Failed to save user preferences:', e);
        }
    }

    addMessage(message, isUser = true, metadata = {}) {
        const messageObj = {
            id: Date.now() + Math.random(),
            content: message,
            isUser,
            timestamp: new Date().toISOString(),
            metadata: {
                appType: metadata.appType,
                intent: metadata.intent,
                confidence: metadata.confidence,
                ...metadata
            }
        };

        this.conversationHistory.push(messageObj);
        this.analyzeContext(messageObj);
        this.updateSmartSuggestions();
        
        if (this.userPreferences.autoSave) {
            this.saveConversationHistory();
        }

        // Track user preferences
        if (isUser && metadata.appType) {
            this.trackAppTypePreference(metadata.appType);
        }

        return messageObj;
    }

    analyzeContext(message) {
        const content = message.content.toLowerCase();
        
        // Extract app types mentioned
        const appTypes = ['calculator', 'todo', 'gallery', 'game', 'quiz', 'weather', 'notes', 'timer'];
        appTypes.forEach(type => {
            if (content.includes(type)) {
                this.contextMemory.set('lastMentionedApp', type);
                this.contextMemory.set('lastMentionTime', Date.now());
            }
        });

        // Extract user intents
        const intents = {
            create: ['create', 'make', 'build', 'generate'],
            modify: ['change', 'update', 'edit', 'modify'],
            help: ['help', 'how', 'what', 'explain'],
            delete: ['delete', 'remove', 'clear']
        };

        Object.entries(intents).forEach(([intent, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
                this.contextMemory.set('lastIntent', intent);
            }
        });

        // Track complexity preferences
        if (content.includes('simple') || content.includes('basic')) {
            this.userPreferences.complexityLevel = 'beginner';
        } else if (content.includes('advanced') || content.includes('complex')) {
            this.userPreferences.complexityLevel = 'advanced';
        }
    }

    trackAppTypePreference(appType) {
        if (!this.userPreferences.preferredAppTypes.includes(appType)) {
            this.userPreferences.preferredAppTypes.push(appType);
        }
        
        // Move to front (most recent)
        const index = this.userPreferences.preferredAppTypes.indexOf(appType);
        this.userPreferences.preferredAppTypes.splice(index, 1);
        this.userPreferences.preferredAppTypes.unshift(appType);
        
        // Keep only top 5 preferences
        this.userPreferences.preferredAppTypes = this.userPreferences.preferredAppTypes.slice(0, 5);
        
        this.saveUserPreferences();
    }

    generateContextualResponse(userMessage) {
        const context = this.getConversationContext();
        const lastIntent = this.contextMemory.get('lastIntent');
        const lastApp = this.contextMemory.get('lastMentionedApp');
        
        let response = '';
        
        // Context-aware responses
        if (lastIntent === 'create' && lastApp) {
            response = `I'll help you create a ${lastApp} app. Based on your previous preferences, I'll make it ${this.userPreferences.complexityLevel}-level.`;
        } else if (lastIntent === 'help') {
            response = `I'm here to help! Based on our conversation, you seem interested in ${this.userPreferences.preferredAppTypes.slice(0, 3).join(', ')} apps.`;
        } else if (context.recentAppCreations.length > 0) {
            const recent = context.recentAppCreations[0];
            response = `Great! I see you recently created a ${recent}. Would you like to create something similar or try a different type of app?`;
        }
        
        return response;
    }

    getConversationContext() {
        const recent = this.conversationHistory.slice(-10);
        const recentAppCreations = recent
            .filter(msg => msg.metadata.appType)
            .map(msg => msg.metadata.appType);
        
        const userMessages = recent.filter(msg => msg.isUser);
        const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length || 0;
        
        return {
            recentMessages: recent,
            recentAppCreations,
            userPreferences: this.userPreferences,
            avgMessageLength,
            conversationLength: this.conversationHistory.length,
            lastActivity: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp
        };
    }

    updateSmartSuggestions() {
        this.smartSuggestions = [];
        
        const context = this.getConversationContext();
        const lastIntent = this.contextMemory.get('lastIntent');
        
        // Suggest based on preferences
        if (this.userPreferences.preferredAppTypes.length > 0) {
            const preferred = this.userPreferences.preferredAppTypes[0];
            this.smartSuggestions.push({
                text: `Create another ${preferred} app`,
                type: 'preference',
                confidence: 0.8
            });
        }
        
        // Suggest based on recent activity
        if (context.recentAppCreations.length === 0) {
            this.smartSuggestions.push({
                text: 'Create your first app',
                type: 'onboarding',
                confidence: 0.9
            });
        }
        
        // Suggest based on intent
        if (lastIntent === 'help') {
            this.smartSuggestions.push({
                text: 'Show me app templates',
                type: 'help',
                confidence: 0.7
            });
        }
        
        // Popular suggestions
        this.smartSuggestions.push(
            { text: 'Create a calculator app', type: 'popular', confidence: 0.6 },
            { text: 'Build a to-do list', type: 'popular', confidence: 0.6 },
            { text: 'Make a photo gallery', type: 'popular', confidence: 0.5 }
        );
        
        // Sort by confidence
        this.smartSuggestions.sort((a, b) => b.confidence - a.confidence);
        this.smartSuggestions = this.smartSuggestions.slice(0, 5);
        
        this.displaySuggestions();
    }

    setupChatEnhancements() {
        // Add chat history panel
        this.createChatHistoryPanel();
        
        // Add typing indicator
        this.createTypingIndicator();
        
        // Add suggestion chips
        this.createSuggestionChips();
        
        // Enhance existing chat input
        this.enhanceChatInput();
    }

    createChatHistoryPanel() {
        const historyPanel = document.createElement('div');
        historyPanel.id = 'chat-history-panel';
        historyPanel.innerHTML = `
            <div class="history-header">
                <h3>💬 Chat History</h3>
                <button id="toggle-history" class="history-toggle">Hide</button>
                <button id="clear-history" class="clear-btn">Clear</button>
            </div>
            <div class="history-content" id="history-content">
                <!-- History items will be populated here -->
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #chat-history-panel {
                position: fixed;
                left: 20px;
                top: 20px;
                width: 300px;
                max-height: 400px;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 15px;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px;
                z-index: 9999;
                transition: all 0.3s ease;
            }

            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 8px;
            }

            .history-header h3 {
                margin: 0;
                font-size: 14px;
                color: #00ff88;
            }

            .history-toggle, .clear-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
                margin-left: 5px;
            }

            .history-toggle:hover, .clear-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .history-content {
                max-height: 300px;
                overflow-y: auto;
            }

            .history-item {
                padding: 8px;
                margin: 5px 0;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .history-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .history-item.user {
                background: rgba(0, 255, 136, 0.1);
                border-left: 3px solid #00ff88;
            }

            .history-item.assistant {
                background: rgba(100, 149, 237, 0.1);
                border-left: 3px solid #6495ed;
            }

            .history-timestamp {
                font-size: 10px;
                color: #888;
                margin-bottom: 4px;
            }

            .history-hidden {
                transform: translateX(-280px);
            }

            .history-hidden .history-content {
                display: none;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(historyPanel);

        // Setup event listeners
        document.getElementById('toggle-history').addEventListener('click', () => {
            historyPanel.classList.toggle('history-hidden');
            const button = document.getElementById('toggle-history');
            button.textContent = historyPanel.classList.contains('history-hidden') ? 'Show' : 'Hide';
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            if (confirm('Clear all chat history?')) {
                this.clearHistory();
            }
        });

        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const content = document.getElementById('history-content');
        if (!content) return;

        content.innerHTML = '';
        
        const recent = this.conversationHistory.slice(-20).reverse();
        
        recent.forEach(message => {
            const item = document.createElement('div');
            item.className = `history-item ${message.isUser ? 'user' : 'assistant'}`;
            
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            const preview = message.content.length > 50 ? 
                message.content.substring(0, 50) + '...' : 
                message.content;
            
            item.innerHTML = `
                <div class="history-timestamp">${timestamp}</div>
                <div class="history-preview">${preview}</div>
            `;
            
            item.addEventListener('click', () => {
                this.restoreMessage(message);
            });
            
            content.appendChild(item);
        });
    }

    createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">AI is thinking...</span>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #typing-indicator {
                display: none;
                align-items: center;
                padding: 10px 15px;
                background: rgba(100, 149, 237, 0.1);
                border-radius: 20px;
                margin: 10px 0;
                border-left: 3px solid #6495ed;
            }

            .typing-dots {
                display: flex;
                margin-right: 10px;
            }

            .typing-dots span {
                width: 6px;
                height: 6px;
                background: #6495ed;
                border-radius: 50%;
                margin: 0 2px;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }

            .typing-text {
                color: #6495ed;
                font-style: italic;
                font-size: 14px;
            }
        `;

        document.head.appendChild(style);
        
        // Insert before chat input
        const chatContainer = document.querySelector('.chat-messages') || document.body;
        chatContainer.appendChild(indicator);
    }

    createSuggestionChips() {
        const container = document.createElement('div');
        container.id = 'suggestion-chips';
        container.innerHTML = `
            <div class="chips-header">💡 Suggestions</div>
            <div class="chips-container" id="chips-container">
                <!-- Suggestion chips will be populated here -->
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #suggestion-chips {
                margin: 15px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .chips-header {
                color: #00ff88;
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 14px;
            }

            .chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .suggestion-chip {
                background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(100, 149, 237, 0.2));
                border: 1px solid rgba(0, 255, 136, 0.3);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .suggestion-chip:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
                border-color: #00ff88;
            }

            .suggestion-chip:active {
                transform: translateY(0);
            }

            .chip-confidence {
                font-size: 10px;
                opacity: 0.7;
                margin-left: 5px;
            }
        `;

        document.head.appendChild(style);
        
        // Insert before chat input
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            inputContainer.parentNode.insertBefore(container, inputContainer);
        }
    }

    displaySuggestions() {
        const container = document.getElementById('chips-container');
        if (!container || !this.userPreferences.showSuggestions) return;

        container.innerHTML = '';
        
        this.smartSuggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.innerHTML = `
                ${suggestion.text}
                <span class="chip-confidence">${Math.round(suggestion.confidence * 100)}%</span>
            `;
            
            chip.addEventListener('click', () => {
                this.applySuggestion(suggestion);
            });
            
            container.appendChild(chip);
        });
    }

    applySuggestion(suggestion) {
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.value = suggestion.text;
            textInput.focus();
            
            // Trigger input event to update UI
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    enhanceChatInput() {
        const textInput = document.getElementById('text-input');
        if (!textInput) return;

        // Add autocomplete functionality
        textInput.addEventListener('input', (e) => {
            this.handleAutoComplete(e.target.value);
        });

        // Add keyboard shortcuts
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && this.smartSuggestions.length > 0) {
                e.preventDefault();
                this.applySuggestion(this.smartSuggestions[0]);
            }
        });
    }

    handleAutoComplete(input) {
        // Simple autocomplete for common app types
        const appTypes = ['calculator', 'todo list', 'photo gallery', 'quiz game', 'timer'];
        const matches = appTypes.filter(type => 
            type.toLowerCase().includes(input.toLowerCase()) && input.length > 2
        );
        
        if (matches.length > 0) {
            // Update suggestions with autocomplete matches
            const autoSuggestions = matches.map(match => ({
                text: `Create a ${match}`,
                type: 'autocomplete',
                confidence: 0.9
            }));
            
            this.smartSuggestions = [...autoSuggestions, ...this.smartSuggestions.slice(0, 3)];
            this.displaySuggestions();
        }
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            this.isTyping = true;
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
            this.isTyping = false;
        }
    }

    restoreMessage(message) {
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.value = message.content;
            textInput.focus();
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.contextMemory.clear();
        this.saveConversationHistory();
        this.updateHistoryDisplay();
        this.updateSmartSuggestions();
    }

    exportConversation() {
        const data = {
            history: this.conversationHistory,
            preferences: this.userPreferences,
            context: Object.fromEntries(this.contextMemory),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `talktoapp-conversation-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    initializeSmartSuggestions() {
        // Initial suggestions for new users
        if (this.conversationHistory.length === 0) {
            this.smartSuggestions = [
                { text: 'Create my first app', type: 'onboarding', confidence: 1.0 },
                { text: 'Show me what you can do', type: 'help', confidence: 0.9 },
                { text: 'Build a calculator', type: 'popular', confidence: 0.8 }
            ];
            this.displaySuggestions();
        }
    }

    setupContextAnalysis() {
        // Analyze conversation patterns every 5 messages
        setInterval(() => {
            if (this.conversationHistory.length % 5 === 0 && this.conversationHistory.length > 0) {
                this.analyzeConversationPatterns();
            }
        }, 1000);
    }

    analyzeConversationPatterns() {
        const recent = this.conversationHistory.slice(-10);
        const userMessages = recent.filter(msg => msg.isUser);
        
        // Analyze communication style
        const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
        
        if (avgLength < 20) {
            this.userPreferences.communicationStyle = 'concise';
        } else if (avgLength > 100) {
            this.userPreferences.communicationStyle = 'detailed';
        } else {
            this.userPreferences.communicationStyle = 'balanced';
        }
        
        this.saveUserPreferences();
    }
}

// Global instance
window.advancedChat = new AdvancedChat();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedChat;
}