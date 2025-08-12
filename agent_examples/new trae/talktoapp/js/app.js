/**
 * TalkToApp - Main Application
 * A context-aware AI assistant that learns from your web activity
 */

class TalkToApp {
  constructor() {
    this.version = '2.0.0';
    this.modules = {};
    this.isInitialized = false;
    this.currentConversation = [];
    this.eventListeners = new Map();
    this.loadingStates = new Map();
    
    // Application state
    this.state = {
      isOnline: navigator.onLine,
      activeProvider: null,
      conversationId: null,
      lastActivity: Date.now()
    };
    
    // Configuration with enhanced settings
    this.config = {
      apiKeys: {},
      settings: {
        theme: 'auto',
        enableWebTracking: true,
        enableBehavioralLearning: true,
        enableContextLearning: true,
        maxHistorySize: 1000,
        autoSave: true,
        notifications: true,
        showWelcomeMessage: true
      }
    };
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing TalkToApp...');
    
    try {
      this.state.status = 'initializing';
      
      // Phase 1: Core modules
      await this.initializeCoreModules();
      
      // Phase 2: Configuration
      await this.loadConfiguration();
      
      // Phase 3: Feature modules
      await this.initializeFeatureModules();
      
      // Phase 4: UI setup
      await this.setupUI();
      
      // Phase 5: Health checks
      await this.performHealthChecks();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.state.status = 'ready';
      console.log('✅ TalkToApp initialized successfully');
      
      // Show welcome message if first time
      if (this.modules.settings.get('app.firstRun', true)) {
        this.showWelcomeMessage();
        this.modules.settings.set('app.firstRun', false);
      }
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.state.status = 'error';
      this.showError('Failed to initialize application', error);
    }
  }

  async setupUI() {
    console.log('🎨 Setting up UI...');
    
    try {
      // Setup chat interface
      this.setupChatInterface();
      
      // Setup modals
      this.setupModals();
      
      // Setup sidebar
      this.setupSidebar();
      
      // Setup status indicators
      this.updateStatusIndicators();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Apply user preferences
      this.applyUserPreferences();
      
      console.log('✅ UI setup complete');
    } catch (error) {
      console.error('❌ UI setup failed:', error);
      throw error;
    }
  }

  async performHealthChecks() {
    console.log('🔍 Performing health checks...');
    
    const checks = [];
    
    // Check module availability
    Object.entries(this.modules).forEach(([name, module]) => {
      if (module && typeof module.healthCheck === 'function') {
        checks.push(
          module.healthCheck()
            .then(result => ({ module: name, status: 'healthy', result }))
            .catch(error => ({ module: name, status: 'unhealthy', error }))
        );
      }
    });
    
    // Check API connectivity
    if (this.modules.api) {
      checks.push(
        this.modules.api.healthCheck()
          .then(result => ({ module: 'api', status: 'healthy', result }))
          .catch(error => ({ module: 'api', status: 'unhealthy', error }))
      );
    }
    
    const results = await Promise.allSettled(checks);
    const healthReport = results.map(result => result.value || result.reason);
    
    console.log('🏥 Health check results:', healthReport);
    
    // Store health status
    this.state.health = healthReport;
    
    return healthReport;
  }

  showWelcomeMessage() {
    if (this.modules.ui) {
      this.modules.ui.showNotification({
        type: 'info',
        title: 'Welcome to TalkToApp!',
        message: 'Your intelligent assistant is ready. Start by configuring your API keys in Settings.',
        duration: 8000,
        actions: [
          {
            label: 'Open Settings',
            action: () => this.openSettingsModal()
          }
        ]
      });
    }
  }

  applyUserPreferences() {
    // Apply theme
    if (this.modules.settings) {
      const theme = this.modules.settings.get('appearance.theme', 'auto');
      document.documentElement.setAttribute('data-theme', theme);
      
      // Apply font size
      const fontSize = this.modules.settings.get('accessibility.fontSize', 'medium');
      document.documentElement.setAttribute('data-font-size', fontSize);
      
      // Apply reduced motion
      const reducedMotion = this.modules.settings.get('accessibility.reducedMotion', false);
      if (reducedMotion) {
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      }
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 300);
      }, 1000); // Show loading for at least 1 second for better UX
    }
  }

  async initializeCoreModules() {
    console.log('🔧 Initializing core modules...');
    
    try {
      // Initialize Settings Manager first
      this.modules.settings = new SettingsManager();
      await this.modules.settings.init();
      
      // Initialize UI Components
      this.modules.ui = new UIComponents();
      await this.modules.ui.init();
      
      // Initialize API Integration
      this.modules.api = new APIIntegration();
      await this.modules.api.init();
      
      console.log('✅ Core modules initialized');
    } catch (error) {
      console.error('❌ Core module initialization failed:', error);
      throw error;
    }
  }

  async loadConfiguration() {
    console.log('⚙️ Loading configuration...');
    
    try {
      // Settings are now managed by SettingsManager
      // Apply theme and accessibility settings
      this.modules.settings.applyTheme();
      this.modules.settings.applyAccessibilitySettings();
      
      // Load API keys from settings
      const apiKeys = this.modules.settings.get('api.keys', {});
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key) {
          this.modules.api.setAPIKey(provider, key);
        }
      });
      
      console.log('✅ Configuration loaded');
    } catch (error) {
      console.error('❌ Configuration loading failed:', error);
      throw error;
    }
  }

  async initializeFeatureModules() {
    console.log('📦 Initializing feature modules...');
    
    try {
      // Initialize Web History Tracker
      if (this.modules.settings.get('privacy.enableWebTracking')) {
        this.modules.webHistory = new WebHistoryTracker();
        await this.modules.webHistory.init();
      }
      
      // Initialize Enhanced Knowledge Database
      this.modules.knowledgeDB = new EnhancedKnowledgeDatabase();
      await this.modules.knowledgeDB.init();
      
      // Initialize MCP Pipeline Manager
      this.modules.mcpPipeline = new MCPPipelineManager();
      await this.modules.mcpPipeline.init();
      
      // Initialize Context Learning Engine
      if (this.modules.settings.get('chat.enableContextLearning')) {
        this.modules.contextLearning = new ContextLearningEngine();
        await this.modules.contextLearning.init();
      }
      
      // Initialize Behavioral Learning Engine
      if (this.modules.settings.get('privacy.enableBehavioralLearning')) {
        this.modules.behavioralLearning = new BehavioralLearningEngine();
        await this.modules.behavioralLearning.init();
      }
      
      console.log('✅ Feature modules initialized');
    } catch (error) {
      console.error('❌ Feature module initialization failed:', error);
      throw error;
    }
  }

  async initModule(name, ModuleClass) {
    try {
      this.modules[name] = new ModuleClass();
      if (this.modules[name].init) {
        await this.modules[name].init();
      }
      console.log(`✅ ${name} module initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${name} module:`, error);
    }
  }

  setupChatInterface() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    if (chatForm && chatInput && sendButton) {
      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      });
      
      // Handle Enter key (Shift+Enter for new line)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleChatSubmit(e);
        }
      });
      
      // Update send button state
      chatInput.addEventListener('input', () => {
        sendButton.disabled = !chatInput.value.trim();
      });
    }
  }

  setupModals() {
    // Setup modal close handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });
    
    // Setup modal overlay close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          const modal = overlay.querySelector('.modal');
          if (modal) {
            this.closeModal(modal.id);
          }
        }
      });
    });
    
    // Setup API key form
    const apiKeyForm = document.getElementById('api-key-form');
    if (apiKeyForm) {
      apiKeyForm.addEventListener('submit', (e) => this.handleAPIKeySubmit(e));
    }
    
    // Setup settings form
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    }
  }

  setupSidebar() {
    // Setup sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        this.modules.settings?.set('ui.sidebarCollapsed', sidebar.classList.contains('collapsed'));
      });
      
      // Restore sidebar state
      const isCollapsed = this.modules.settings?.get('ui.sidebarCollapsed', false);
      if (isCollapsed) {
        sidebar.classList.add('collapsed');
      }
    }
    
    // Setup clear history button
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearWebHistory());
    }
  }

  setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }
    
    // API key button
    const apiKeyBtn = document.getElementById('api-key-btn');
    if (apiKeyBtn) {
      apiKeyBtn.addEventListener('click', () => this.openAPIKeyModal());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K to focus chat input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.focus();
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
          const modal = openModal.querySelector('.modal');
          if (modal) {
            this.closeModal(modal.id);
          }
        }
      }
    });
    
    // Window events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Theme change detection
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.modules.settings?.get('appearance.theme') === 'auto') {
          this.applyUserPreferences();
        }
      });
    }
    
    // Suggestion clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.suggestion-item')) {
        const suggestion = e.target.closest('.suggestion-item');
        const title = suggestion.querySelector('.suggestion-title')?.textContent;
        if (title) {
          this.applySuggestion(title);
        }
      }
    });
  }

  initializeUI() {
    // Update status indicators
    this.updateStatusIndicators();
    
    // Load recent activity
    this.loadRecentActivity();
    
    // Load suggestions
    this.loadSuggestions();
    
    // Apply theme
    this.applyTheme();
  }

  updateStatusIndicators() {
    const indicators = {
      'api-status': this.hasValidApiKeys() ? 'connected' : 'disconnected',
      'learning-status': this.config.settings.contextLearning ? 'active' : 'inactive',
      'tracking-status': this.config.settings.webTracking ? 'active' : 'inactive'
    };

    Object.entries(indicators).forEach(([id, status]) => {
      const element = document.getElementById(id);
      if (element) {
        element.className = `status-indicator ${status}`;
        element.title = `${id.replace('-', ' ')}: ${status}`;
      }
    });
  }

  hasValidApiKeys() {
    return Object.keys(this.config.apiKeys).some(key => this.config.apiKeys[key]?.trim());
  }

  async handleChatSubmit(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const message = chatInput.value.trim();
    
    if (!message) return;

    // Disable input during processing
    chatInput.disabled = true;
    if (sendButton) sendButton.disabled = true;

    // Clear input
    chatInput.value = '';
    this.autoResizeTextarea(chatInput);

    try {
      // Add user message to chat
      this.addMessageToChat(message, 'user');

      // Show typing indicator
      this.showTypingIndicator();

      // Track user activity
      if (this.modules.behavioralLearning) {
        this.modules.behavioralLearning.trackActivity('chat_message', {
          messageLength: message.length,
          timestamp: Date.now()
        });
      }

      // Process message through modules
      const context = await this.gatherContext(message);
      const response = await this.processMessage(message, context);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add AI response to chat
      this.addMessageToChat(response, 'assistant');
      
      // Update learning engines
      this.updateLearningEngines(message, response, context);
      
      // Update suggestions
      this.updateSuggestions();
      
    } catch (error) {
      console.error('Error processing message:', error);
      this.hideTypingIndicator();
      this.addMessageToChat('I apologize, but I encountered an error processing your request. Please check your API configuration and try again.', 'assistant', 'error');
      
      if (this.modules.ui) {
        this.modules.ui.showNotification({
          type: 'error',
          title: 'Chat Error',
          message: error.message || 'Failed to process message',
          duration: 5000
        });
      }
    } finally {
      // Re-enable input
      chatInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      chatInput.focus();
    }
  }

  addMessageToChat(content, role, type = 'normal') {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} ${type}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMessage(content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Animate message appearance
    requestAnimationFrame(() => {
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translateY(0)';
    });
  }

  formatMessage(content) {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async gatherContext(message) {
    const context = {
      message,
      timestamp: Date.now(),
      webHistory: null,
      knowledgeEntries: [],
      userContext: null,
      behavioralInsights: null,
      previousMessages: this.getRecentMessages()
    };

    try {
      // Get web history context
      if (this.modules.webHistory) {
        context.webHistory = await this.modules.webHistory.getRecentActivity(10);
      }

      // Search knowledge database
      if (this.modules.knowledgeDB) {
        context.knowledgeEntries = await this.modules.knowledgeDB.search(message, { limit: 5 });
      }

      // Get user context
      if (this.modules.contextLearning) {
        context.userContext = await this.modules.contextLearning.getCurrentContext();
      }

      // Get behavioral insights
      if (this.modules.behavioralLearning) {
        context.behavioralInsights = await this.modules.behavioralLearning.getInsights();
      }

    } catch (error) {
      console.warn('Error gathering context:', error);
    }

    return context;
  }

  getRecentMessages(limit = 10) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return [];

    const messages = Array.from(chatMessages.querySelectorAll('.message:not(.typing)'))
      .slice(-limit)
      .map(msg => ({
        role: msg.classList.contains('user') ? 'user' : 'assistant',
        content: msg.querySelector('.message-text')?.textContent || '',
        timestamp: msg.querySelector('.message-time')?.textContent || ''
      }));

    return messages;
  }

  async processMessage(message, context) {
    try {
      // Show processing indicator
      this.showProcessingIndicator();
      
      if (!this.modules.api) {
        throw new Error('API module not available');
      }

      // Check if API keys are configured
      if (!this.hasValidApiKeys()) {
        throw new Error('No API keys configured. Please set up your API keys in Settings.');
      }

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Prepare messages
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Add recent chat history
      const chatHistory = this.getChatHistory(5);
      messages.splice(-1, 0, ...chatHistory);

      // Generate response using API integration
      const response = await this.modules.api.chat(messages, {
        temperature: 0.7,
        maxTokens: 1000
      });

      // Hide processing indicator
      this.hideProcessingIndicator();
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      
      // Hide processing indicator
      this.hideProcessingIndicator();
      
      // Fallback to a helpful error message
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your API configuration in Settings.');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error('API quota exceeded. Please check your API usage or try again later.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Connection error. Please check your internet connection and try again.');
      } else {
        throw new Error('Failed to generate response. Please try again.');
      }
    }
  }

  showProcessingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'processing-indicator';
    indicator.className = 'processing-indicator';
    indicator.innerHTML = `
      <div class="processing-spinner"></div>
      <span>Processing your request...</span>
    `;
    
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.appendChild(indicator);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  hideProcessingIndicator() {
    const indicator = document.getElementById('processing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are TalkToApp, an intelligent assistant that helps users with various tasks. You have access to the user's context and can provide personalized assistance.

Current time: ${new Date().toLocaleString()}`;

    if (context.webHistory && context.webHistory.length > 0) {
      prompt += `\n\nRecent web activity:\n${context.webHistory.map(item => `- ${item.title} (${item.url})`).join('\n')}`;
    }

    if (context.knowledgeEntries && context.knowledgeEntries.length > 0) {
      prompt += `\n\nRelevant knowledge:\n${context.knowledgeEntries.map(entry => `- ${entry.title}: ${entry.content.substring(0, 200)}...`).join('\n')}`;
    }

    if (context.userContext) {
      prompt += `\n\nUser context: ${context.userContext.description || 'General assistance'}`;
    }

    if (context.behavioralInsights) {
      prompt += `\n\nUser preferences: ${JSON.stringify(context.behavioralInsights.preferences || {})}`;
    }

    prompt += `\n\nPlease provide helpful, accurate, and contextually relevant responses. Be concise but thorough.`;

    return prompt;
  }

  getChatHistory(limit = 5) {
    const messages = this.getRecentMessages(limit * 2); // Get more to filter properly
    return messages
      .filter(msg => msg.role && msg.content)
      .slice(-limit)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  async updateLearningEngines(message, response, context) {
    try {
      // Add to knowledge database
      if (this.modules.knowledgeDB) {
        await this.modules.knowledgeDB.extractKnowledgeFromInteraction(message, response);
      }

      // Update context learning
      if (this.modules.contextLearning) {
        await this.modules.contextLearning.learnFromInteraction(message, response, context);
      }

      // Track behavioral patterns
      if (this.modules.behavioralLearning) {
        this.modules.behavioralLearning.trackActivity('assistant_response', {
          responseLength: response.length,
          userMessageLength: message.length,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.warn('Error updating learning engines:', error);
    }
  }

  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  openApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    if (modal) {
      modal.classList.add('active');
      this.populateApiKeyModal();
    }
  }

  populateApiKeyModal() {
    const services = [
      { name: 'OpenAI', key: 'openai', placeholder: 'sk-...' },
      { name: 'Anthropic', key: 'anthropic', placeholder: 'sk-ant-...' },
      { name: 'Google AI', key: 'google', placeholder: 'AIza...' },
      { name: 'Cohere', key: 'cohere', placeholder: 'co-...' }
    ];

    const container = document.querySelector('.api-services');
    if (!container) return;

    container.innerHTML = services.map(service => `
      <div class="service-item">
        <div class="service-info">
          <span class="service-name">${service.name}</span>
          <span class="service-status ${this.config.apiKeys[service.key] ? 'connected' : ''}">
            ${this.config.apiKeys[service.key] ? 'Connected' : 'Not configured'}
          </span>
        </div>
        <input 
          type="password" 
          class="api-input" 
          data-service="${service.key}"
          placeholder="${service.placeholder}"
          value="${this.config.apiKeys[service.key] || ''}"
        >
      </div>
    `).join('');
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('active');
      this.populateSettingsModal();
    }
  }

  populateSettingsModal() {
    const settingsContent = document.querySelector('#settings-modal .modal-content');
    if (!settingsContent) return;

    settingsContent.innerHTML = `
      <div class="settings-section">
        <h3>Appearance</h3>
        <div class="setting-item">
          <input type="checkbox" id="dark-mode" ${this.config.settings.darkMode ? 'checked' : ''}>
          <label for="dark-mode">Dark Mode</label>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Features</h3>
        <div class="setting-item">
          <input type="checkbox" id="notifications" ${this.config.settings.notifications ? 'checked' : ''}>
          <label for="notifications">Enable Notifications</label>
        </div>
        <div class="setting-item">
          <input type="checkbox" id="auto-save" ${this.config.settings.autoSave ? 'checked' : ''}>
          <label for="auto-save">Auto-save Conversations</label>
        </div>
        <div class="setting-item">
          <input type="checkbox" id="context-learning" ${this.config.settings.contextLearning ? 'checked' : ''}>
          <label for="context-learning">Context Learning</label>
        </div>
        <div class="setting-item">
          <input type="checkbox" id="web-tracking" ${this.config.settings.webTracking ? 'checked' : ''}>
          <label for="web-tracking">Web Activity Tracking</label>
        </div>
      </div>
    `;
  }

  closeModal() {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      
      // Save API keys if closing API modal
      if (activeModal.id === 'api-key-modal') {
        this.saveApiKeys();
      }
      
      // Save settings if closing settings modal
      if (activeModal.id === 'settings-modal') {
        this.saveSettings();
      }
    }
  }

  saveApiKeys() {
    const inputs = document.querySelectorAll('.api-input');
    inputs.forEach(input => {
      const service = input.dataset.service;
      const value = input.value.trim();
      if (value) {
        this.config.apiKeys[service] = value;
      } else {
        delete this.config.apiKeys[service];
      }
    });
    
    this.saveConfig();
    this.updateStatusIndicators();
    this.showNotification('API Keys Updated', 'Your API keys have been saved securely.', 'success');
  }

  saveSettings() {
    const checkboxes = document.querySelectorAll('#settings-modal input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const setting = checkbox.id.replace('-', '');
      this.config.settings[setting] = checkbox.checked;
    });
    
    this.saveConfig();
    this.updateStatusIndicators();
    this.applyTheme();
    this.showNotification('Settings Updated', 'Your preferences have been saved.', 'success');
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.config.settings.darkMode ? 'dark' : 'light');
  }

  loadRecentActivity() {
    const activityContainer = document.querySelector('.recent-activity');
    if (!activityContainer) return;

    // Placeholder activity data
    const activities = [
      { title: 'Visited GitHub Repository', time: '2 min ago', icon: '🔗' },
      { title: 'Searched for "React hooks"', time: '5 min ago', icon: '🔍' },
      { title: 'Opened VS Code', time: '10 min ago', icon: '💻' },
      { title: 'Read documentation', time: '15 min ago', icon: '📚' }
    ];

    activityContainer.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-details">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  loadSuggestions() {
    const suggestionsContainer = document.querySelector('.suggestions-list');
    if (!suggestionsContainer) return;

    const suggestions = [
      {
        title: 'Explain this code',
        description: 'Get detailed explanations of code snippets',
        confidence: '95%'
      },
      {
        title: 'Debug my application',
        description: 'Help identify and fix issues in your code',
        confidence: '90%'
      },
      {
        title: 'Optimize performance',
        description: 'Suggestions for improving app performance',
        confidence: '85%'
      },
      {
        title: 'Write documentation',
        description: 'Generate comprehensive documentation',
        confidence: '92%'
      }
    ];

    suggestionsContainer.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-item">
        <div class="suggestion-confidence">${suggestion.confidence}</div>
        <div class="suggestion-title">${suggestion.title}</div>
        <div class="suggestion-description">${suggestion.description}</div>
      </div>
    `).join('');
  }

  applySuggestion(title) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = title;
      chatInput.focus();
      this.autoResizeTextarea(chatInput);
    }
  }

  showNotification(title, message, type = 'info', duration = 5000) {
    if (!this.config.settings.notifications) return;

    const container = document.querySelector('.notification-container') || this.createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const id = Date.now().toString();
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">${title}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="notification-message">${message}</div>
      <div class="notification-progress"></div>
    `;

    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto-remove after duration
    if (duration > 0) {
      const progress = notification.querySelector('.notification-progress');
      progress.style.width = '100%';
      progress.style.transition = `width ${duration}ms linear`;
      
      setTimeout(() => {
        progress.style.width = '0%';
      }, 100);

      setTimeout(() => {
        notification.remove();
      }, duration);
    }
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.talkToApp = new TalkToApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TalkToApp;
}