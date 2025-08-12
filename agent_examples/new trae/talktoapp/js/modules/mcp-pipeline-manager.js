/**
 * MCP Pipeline Manager Module
 * Manages Model Context Protocol (MCP) operations and pipeline processing
 */

class MCPPipelineManager {
  constructor() {
    this.pipelines = new Map();
    this.activeConnections = new Map();
    this.messageQueue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.timeout = 30000; // 30 seconds
    this.batchSize = 10;
    
    // Pipeline states
    this.states = {
      IDLE: 'idle',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      PROCESSING: 'processing',
      ERROR: 'error',
      DISCONNECTED: 'disconnected'
    };

    // Message types
    this.messageTypes = {
      REQUEST: 'request',
      RESPONSE: 'response',
      NOTIFICATION: 'notification',
      ERROR: 'error',
      HEARTBEAT: 'heartbeat'
    };

    // Default configuration
    this.config = {
      enableBatching: true,
      enableRetry: true,
      enableHeartbeat: true,
      heartbeatInterval: 30000,
      maxConcurrentPipelines: 5,
      defaultTimeout: 30000,
      enableLogging: true
    };

    this.stats = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageResponseTime: 0,
      activePipelines: 0,
      totalPipelines: 0
    };

    this.eventListeners = new Map();
  }

  async init() {
    console.log('🔄 Initializing MCP Pipeline Manager...');
    
    try {
      // Load configuration
      await this.loadConfig();
      
      // Initialize core systems
      this.initializeEventSystem();
      this.initializeHeartbeat();
      this.initializeMessageProcessor();
      
      // Load saved pipelines
      await this.loadPipelines();
      
      console.log(`✅ MCP Pipeline Manager initialized with ${this.pipelines.size} pipelines`);
    } catch (error) {
      console.error('❌ Failed to initialize MCP Pipeline Manager:', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      const savedConfig = localStorage.getItem('mcp-pipeline-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.warn('Failed to load MCP config:', error);
    }
  }

  saveConfig() {
    try {
      localStorage.setItem('mcp-pipeline-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save MCP config:', error);
    }
  }

  async loadPipelines() {
    try {
      const savedPipelines = localStorage.getItem('mcp-pipelines');
      if (savedPipelines) {
        const pipelinesData = JSON.parse(savedPipelines);
        pipelinesData.forEach(pipelineData => {
          const pipeline = this.createPipelineFromData(pipelineData);
          this.pipelines.set(pipeline.id, pipeline);
        });
      }
    } catch (error) {
      console.warn('Failed to load pipelines:', error);
    }
  }

  savePipelines() {
    try {
      const pipelinesData = Array.from(this.pipelines.values()).map(pipeline => ({
        id: pipeline.id,
        name: pipeline.name,
        type: pipeline.type,
        config: pipeline.config,
        state: pipeline.state,
        created: pipeline.created,
        lastUsed: pipeline.lastUsed
      }));
      
      localStorage.setItem('mcp-pipelines', JSON.stringify(pipelinesData));
    } catch (error) {
      console.error('Failed to save pipelines:', error);
    }
  }

  // Pipeline Management

  async createPipeline(name, type, config = {}) {
    const pipeline = {
      id: this.generateId(),
      name,
      type,
      config: {
        timeout: this.config.defaultTimeout,
        retries: this.maxRetries,
        batchSize: this.batchSize,
        ...config
      },
      state: this.states.IDLE,
      created: Date.now(),
      lastUsed: Date.now(),
      stats: {
        messagesProcessed: 0,
        errors: 0,
        averageResponseTime: 0,
        lastError: null
      },
      messageHistory: [],
      connection: null
    };

    this.pipelines.set(pipeline.id, pipeline);
    this.stats.totalPipelines++;
    this.savePipelines();

    this.emit('pipelineCreated', { pipeline });
    console.log(`📋 Created pipeline: ${name} (${pipeline.id})`);

    return pipeline.id;
  }

  async deletePipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Disconnect if connected
    if (pipeline.connection) {
      await this.disconnectPipeline(pipelineId);
    }

    this.pipelines.delete(pipelineId);
    this.savePipelines();

    this.emit('pipelineDeleted', { pipelineId });
    console.log(`🗑️ Deleted pipeline: ${pipelineId}`);
  }

  async connectPipeline(pipelineId, endpoint) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    if (pipeline.state === this.states.CONNECTED) {
      console.log(`Pipeline ${pipelineId} already connected`);
      return;
    }

    pipeline.state = this.states.CONNECTING;
    this.emit('pipelineStateChanged', { pipelineId, state: pipeline.state });

    try {
      // Simulate connection (in real implementation, this would establish actual connection)
      const connection = await this.establishConnection(endpoint, pipeline.config);
      
      pipeline.connection = connection;
      pipeline.state = this.states.CONNECTED;
      pipeline.lastUsed = Date.now();
      
      this.activeConnections.set(pipelineId, connection);
      this.stats.activePipelines++;

      this.emit('pipelineConnected', { pipelineId, endpoint });
      console.log(`🔗 Connected pipeline: ${pipelineId} to ${endpoint}`);

    } catch (error) {
      pipeline.state = this.states.ERROR;
      pipeline.stats.lastError = error.message;
      
      this.emit('pipelineError', { pipelineId, error: error.message });
      console.error(`❌ Failed to connect pipeline ${pipelineId}:`, error);
      throw error;
    }
  }

  async disconnectPipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    if (pipeline.connection) {
      await this.closeConnection(pipeline.connection);
      pipeline.connection = null;
    }

    pipeline.state = this.states.DISCONNECTED;
    this.activeConnections.delete(pipelineId);
    this.stats.activePipelines = Math.max(0, this.stats.activePipelines - 1);

    this.emit('pipelineDisconnected', { pipelineId });
    console.log(`🔌 Disconnected pipeline: ${pipelineId}`);
  }

  // Message Processing

  async sendMessage(pipelineId, message, options = {}) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    if (pipeline.state !== this.states.CONNECTED) {
      throw new Error(`Pipeline ${pipelineId} is not connected`);
    }

    const messageId = this.generateId();
    const mcpMessage = {
      id: messageId,
      pipelineId,
      type: this.messageTypes.REQUEST,
      payload: message,
      timestamp: Date.now(),
      options: {
        timeout: pipeline.config.timeout,
        retries: pipeline.config.retries,
        ...options
      },
      attempts: 0
    };

    // Add to queue
    this.messageQueue.push(mcpMessage);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processMessageQueue();
    }

    return messageId;
  }

  async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const batch = this.config.enableBatching 
          ? this.messageQueue.splice(0, this.batchSize)
          : [this.messageQueue.shift()];

        await Promise.all(batch.map(message => this.processMessage(message)));
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processMessage(message) {
    const pipeline = this.pipelines.get(message.pipelineId);
    if (!pipeline) {
      this.handleMessageError(message, 'Pipeline not found');
      return;
    }

    const startTime = Date.now();
    message.attempts++;

    try {
      pipeline.state = this.states.PROCESSING;
      this.emit('messageProcessing', { message });

      // Simulate message processing (in real implementation, this would send via actual connection)
      const response = await this.sendMessageToConnection(pipeline.connection, message);
      
      const responseTime = Date.now() - startTime;
      
      // Update statistics
      this.updateMessageStats(pipeline, responseTime, true);
      
      // Store in history
      pipeline.messageHistory.push({
        id: message.id,
        request: message.payload,
        response: response,
        timestamp: message.timestamp,
        responseTime
      });

      // Limit history size
      if (pipeline.messageHistory.length > 100) {
        pipeline.messageHistory = pipeline.messageHistory.slice(-100);
      }

      pipeline.state = this.states.CONNECTED;
      pipeline.lastUsed = Date.now();

      this.emit('messageSuccess', { message, response, responseTime });
      
      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMessageStats(pipeline, responseTime, false);

      // Retry logic
      if (this.config.enableRetry && message.attempts < message.options.retries) {
        console.log(`🔄 Retrying message ${message.id} (attempt ${message.attempts + 1})`);
        
        // Add back to queue with delay
        setTimeout(() => {
          this.messageQueue.unshift(message);
          if (!this.isProcessing) {
            this.processMessageQueue();
          }
        }, 1000 * message.attempts); // Exponential backoff
        
        return;
      }

      this.handleMessageError(message, error.message);
      pipeline.state = this.states.CONNECTED; // Reset to connected state
    }
  }

  handleMessageError(message, errorMessage) {
    const pipeline = this.pipelines.get(message.pipelineId);
    if (pipeline) {
      pipeline.stats.errors++;
      pipeline.stats.lastError = errorMessage;
    }

    this.stats.failedMessages++;
    this.emit('messageError', { message, error: errorMessage });
    
    console.error(`❌ Message ${message.id} failed:`, errorMessage);
  }

  updateMessageStats(pipeline, responseTime, success) {
    pipeline.stats.messagesProcessed++;
    
    // Update average response time
    const totalTime = pipeline.stats.averageResponseTime * (pipeline.stats.messagesProcessed - 1) + responseTime;
    pipeline.stats.averageResponseTime = totalTime / pipeline.stats.messagesProcessed;

    // Update global stats
    this.stats.totalMessages++;
    if (success) {
      this.stats.successfulMessages++;
    }

    const globalTotalTime = this.stats.averageResponseTime * (this.stats.totalMessages - 1) + responseTime;
    this.stats.averageResponseTime = globalTotalTime / this.stats.totalMessages;
  }

  // Connection Management (Simulated)

  async establishConnection(endpoint, config) {
    // Simulate connection establishment
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            id: this.generateId(),
            endpoint,
            connected: true,
            lastHeartbeat: Date.now()
          });
        } else {
          reject(new Error('Connection failed'));
        }
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  }

  async closeConnection(connection) {
    // Simulate connection closure
    connection.connected = false;
    return Promise.resolve();
  }

  async sendMessageToConnection(connection, message) {
    // Simulate message sending
    return new Promise((resolve, reject) => {
      const delay = 500 + Math.random() * 2000; // 0.5-2.5 second delay
      
      setTimeout(() => {
        if (connection.connected && Math.random() > 0.05) { // 95% success rate
          resolve({
            id: this.generateId(),
            type: this.messageTypes.RESPONSE,
            payload: {
              status: 'success',
              data: `Processed: ${JSON.stringify(message.payload)}`,
              timestamp: Date.now()
            }
          });
        } else {
          reject(new Error('Message sending failed'));
        }
      }, delay);
    });
  }

  // Event System

  initializeEventSystem() {
    this.eventListeners = new Map();
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    if (this.config.enableLogging) {
      console.log(`📡 MCP Event: ${event}`, data);
    }
  }

  // Heartbeat System

  initializeHeartbeat() {
    if (this.config.enableHeartbeat) {
      setInterval(() => {
        this.sendHeartbeats();
      }, this.config.heartbeatInterval);
    }
  }

  async sendHeartbeats() {
    const promises = Array.from(this.activeConnections.entries()).map(async ([pipelineId, connection]) => {
      try {
        if (connection.connected) {
          connection.lastHeartbeat = Date.now();
          // In real implementation, send actual heartbeat message
          this.emit('heartbeatSent', { pipelineId });
        }
      } catch (error) {
        console.error(`Heartbeat failed for pipeline ${pipelineId}:`, error);
        await this.disconnectPipeline(pipelineId);
      }
    });

    await Promise.allSettled(promises);
  }

  // Public API Methods

  async getPipelines() {
    return Array.from(this.pipelines.values()).map(pipeline => ({
      id: pipeline.id,
      name: pipeline.name,
      type: pipeline.type,
      state: pipeline.state,
      created: pipeline.created,
      lastUsed: pipeline.lastUsed,
      stats: pipeline.stats
    }));
  }

  async getPipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    return {
      ...pipeline,
      messageHistory: pipeline.messageHistory.slice(-20) // Last 20 messages
    };
  }

  async getStats() {
    return {
      ...this.stats,
      pipelines: this.pipelines.size,
      activeConnections: this.activeConnections.size,
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing
    };
  }

  async updatePipelineConfig(pipelineId, config) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    pipeline.config = { ...pipeline.config, ...config };
    this.savePipelines();

    this.emit('pipelineConfigUpdated', { pipelineId, config });
  }

  async clearMessageHistory(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    pipeline.messageHistory = [];
    this.savePipelines();
  }

  async exportPipelines() {
    return {
      pipelines: Array.from(this.pipelines.values()),
      config: this.config,
      stats: this.stats,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  async importPipelines(data) {
    try {
      if (data.pipelines) {
        data.pipelines.forEach(pipelineData => {
          const pipeline = this.createPipelineFromData(pipelineData);
          this.pipelines.set(pipeline.id, pipeline);
        });
      }

      if (data.config) {
        this.config = { ...this.config, ...data.config };
        this.saveConfig();
      }

      this.savePipelines();
      console.log(`📥 Imported ${data.pipelines?.length || 0} pipelines`);
    } catch (error) {
      console.error('Failed to import pipelines:', error);
      throw error;
    }
  }

  // Utility Methods

  createPipelineFromData(data) {
    return {
      id: data.id || this.generateId(),
      name: data.name,
      type: data.type,
      config: data.config || {},
      state: this.states.IDLE,
      created: data.created || Date.now(),
      lastUsed: data.lastUsed || Date.now(),
      stats: data.stats || {
        messagesProcessed: 0,
        errors: 0,
        averageResponseTime: 0,
        lastError: null
      },
      messageHistory: data.messageHistory || [],
      connection: null
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async testConnection(endpoint, config = {}) {
    try {
      const connection = await this.establishConnection(endpoint, config);
      await this.closeConnection(connection);
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async resetStats() {
    this.stats = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageResponseTime: 0,
      activePipelines: this.activeConnections.size,
      totalPipelines: this.pipelines.size
    };

    // Reset pipeline stats
    this.pipelines.forEach(pipeline => {
      pipeline.stats = {
        messagesProcessed: 0,
        errors: 0,
        averageResponseTime: 0,
        lastError: null
      };
    });

    this.savePipelines();
  }

  async shutdown() {
    console.log('🔄 Shutting down MCP Pipeline Manager...');
    
    // Disconnect all pipelines
    const disconnectPromises = Array.from(this.pipelines.keys()).map(pipelineId => 
      this.disconnectPipeline(pipelineId).catch(error => 
        console.error(`Error disconnecting pipeline ${pipelineId}:`, error)
      )
    );

    await Promise.allSettled(disconnectPromises);

    // Clear message queue
    this.messageQueue = [];
    this.isProcessing = false;

    // Save final state
    this.savePipelines();
    this.saveConfig();

    console.log('✅ MCP Pipeline Manager shutdown complete');
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.MCPPipelineManager = MCPPipelineManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MCPPipelineManager;
}