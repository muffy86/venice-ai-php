// AI Agent Management System
class AgentManager {
    constructor() {
        this.agents = new Map();
        this.taskQueue = [];
        this.activeConnections = new Map();
        this.eventListeners = new Map();
        this.metrics = {
            totalAgents: 0,
            activeAgents: 0,
            tasksCompleted: 0,
            successRate: 100,
            systemLoad: 'Low'
        };
        
        this.init();
    }

    init() {
        this.loadPersistedAgents();
        this.setupEventListeners();
        this.startMetricsUpdater();
    }

    // Agent Creation and Management
    async createAgent(config) {
        try {
            const agentId = this.generateAgentId();
            const agent = new AIAgent(agentId, config);
            
            await agent.initialize();
            
            this.agents.set(agentId, agent);
            this.updateMetrics();
            this.renderAgentList();
            this.logActivity('Agent Created', `${config.name} (${config.type}) has been spawned`);
            
            return agent;
        } catch (error) {
            console.error('Failed to create agent:', error);
            throw error;
        }
    }

    async destroyAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            await agent.shutdown();
            this.agents.delete(agentId);
            this.updateMetrics();
            this.renderAgentList();
            this.logActivity('Agent Destroyed', `${agent.name} has been terminated`);
        }
    }

    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    getAllAgents() {
        return Array.from(this.agents.values());
    }

    getActiveAgents() {
        return this.getAllAgents().filter(agent => agent.status === 'active');
    }

    // Task Management
    async assignTask(task, agentId = null) {
        try {
            let agent;
            
            if (agentId) {
                agent = this.getAgent(agentId);
                if (!agent) {
                    throw new Error(`Agent ${agentId} not found`);
                }
            } else {
                agent = this.findBestAgent(task);
                if (!agent) {
                    // Queue task if no suitable agent available
                    this.queueTask(task);
                    return null;
                }
            }

            const result = await agent.executeTask(task);
            this.metrics.tasksCompleted++;
            this.updateMetrics();
            this.logActivity('Task Completed', `${task.description} completed by ${agent.name}`);
            
            return result;
        } catch (error) {
            console.error('Task assignment failed:', error);
            this.logActivity('Task Failed', `${task.description} failed: ${error.message}`);
            throw error;
        }
    }

    findBestAgent(task) {
        const availableAgents = this.getAllAgents().filter(agent => 
            agent.status === 'idle' && 
            agent.canHandleTask(task) &&
            agent.currentTasks.length < CONFIG.system.maxTasksPerAgent
        );

        if (availableAgents.length === 0) {
            return null;
        }

        // Score agents based on suitability
        return availableAgents.reduce((best, current) => {
            const currentScore = this.calculateAgentScore(current, task);
            const bestScore = this.calculateAgentScore(best, task);
            return currentScore > bestScore ? current : best;
        });
    }

    calculateAgentScore(agent, task) {
        let score = 0;
        
        // Type match bonus
        if (agent.type === task.preferredAgentType) {
            score += 50;
        }
        
        // Capability match
        const matchingCapabilities = agent.capabilities.filter(cap => 
            task.requiredCapabilities?.includes(cap)
        );
        score += matchingCapabilities.length * 10;
        
        // Load penalty
        score -= agent.currentTasks.length * 5;
        
        // Success rate bonus
        score += agent.successRate * 0.1;
        
        return score;
    }

    queueTask(task) {
        task.queuedAt = Date.now();
        this.taskQueue.push(task);
        this.renderTaskQueue();
        this.logActivity('Task Queued', `${task.description} added to queue`);
    }

    processTaskQueue() {
        if (this.taskQueue.length === 0) return;

        const availableAgents = this.getAllAgents().filter(agent => 
            agent.status === 'idle' && 
            agent.currentTasks.length < CONFIG.system.maxTasksPerAgent
        );

        for (const agent of availableAgents) {
            if (this.taskQueue.length === 0) break;
            
            const suitableTaskIndex = this.taskQueue.findIndex(task => 
                agent.canHandleTask(task)
            );
            
            if (suitableTaskIndex !== -1) {
                const task = this.taskQueue.splice(suitableTaskIndex, 1)[0];
                this.assignTask(task, agent.id);
            }
        }
        
        this.renderTaskQueue();
    }

    // Agent Communication and Collaboration
    async facilitateCollaboration(agents, task) {
        const collaborationSession = new CollaborationSession(agents, task);
        return await collaborationSession.execute();
    }

    broadcastMessage(message, excludeAgentId = null) {
        this.getAllAgents().forEach(agent => {
            if (agent.id !== excludeAgentId) {
                agent.receiveMessage(message);
            }
        });
    }

    // Metrics and Monitoring
    updateMetrics() {
        const allAgents = this.getAllAgents();
        this.metrics.totalAgents = allAgents.length;
        this.metrics.activeAgents = allAgents.filter(a => a.status === 'active').length;
        
        // Calculate success rate
        const totalTasks = allAgents.reduce((sum, agent) => sum + agent.completedTasks, 0);
        const successfulTasks = allAgents.reduce((sum, agent) => sum + agent.successfulTasks, 0);
        this.metrics.successRate = totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 100;
        
        // Calculate system load
        const avgLoad = allAgents.reduce((sum, agent) => sum + agent.currentTasks.length, 0) / Math.max(allAgents.length, 1);
        this.metrics.systemLoad = avgLoad < 2 ? 'Low' : avgLoad < 4 ? 'Medium' : 'High';
        
        this.renderMetrics();
    }

    startMetricsUpdater() {
        setInterval(() => {
            this.updateMetrics();
            this.processTaskQueue();
        }, CONFIG.ui.refreshInterval);
    }

    // Persistence
    saveAgents() {
        if (!CONFIG.storage.persistAgents) return;
        
        const agentData = this.getAllAgents().map(agent => agent.serialize());
        localStorage.setItem(CONFIG.storage.prefix + 'agents', JSON.stringify(agentData));
    }

    loadPersistedAgents() {
        if (!CONFIG.storage.persistAgents) return;
        
        try {
            const stored = localStorage.getItem(CONFIG.storage.prefix + 'agents');
            if (stored) {
                const agentData = JSON.parse(stored);
                agentData.forEach(data => {
                    const agent = AIAgent.deserialize(data);
                    this.agents.set(agent.id, agent);
                });
            }
        } catch (error) {
            console.warn('Failed to load persisted agents:', error);
        }
    }

    // UI Rendering
    renderAgentList() {
        const container = document.getElementById('agent-list');
        if (!container) return;

        container.innerHTML = '';
        
        this.getAllAgents().forEach(agent => {
            const agentElement = this.createAgentElement(agent);
            container.appendChild(agentElement);
        });
    }

    createAgentElement(agent) {
        const element = document.createElement('div');
        element.className = 'agent-item';
        element.innerHTML = `
            <div class="agent-header">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-status ${agent.status}">${agent.status}</div>
            </div>
            <div class="agent-type">${agent.type}</div>
            <div class="agent-metrics">
                <span>Tasks: ${agent.currentTasks.length}/${CONFIG.system.maxTasksPerAgent}</span>
                <span>Success: ${agent.successRate}%</span>
            </div>
        `;
        
        element.addEventListener('click', () => this.showAgentDetails(agent));
        return element;
    }

    renderTaskQueue() {
        const container = document.getElementById('task-queue');
        if (!container) return;

        container.innerHTML = '';
        
        this.taskQueue.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const element = document.createElement('div');
        element.className = 'task-item';
        element.innerHTML = `
            <div class="task-priority ${task.priority || 'medium'}">${task.priority || 'medium'}</div>
            <div class="task-description">${task.description}</div>
        `;
        return element;
    }

    renderMetrics() {
        const elements = {
            'active-agents-count': this.metrics.activeAgents,
            'tasks-completed': this.metrics.tasksCompleted,
            'success-rate': this.metrics.successRate + '%',
            'system-load': this.metrics.systemLoad
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    logActivity(title, description) {
        const activity = {
            id: Date.now(),
            title,
            description,
            timestamp: new Date(),
            icon: this.getActivityIcon(title)
        };

        this.addActivityToLog(activity);
    }

    getActivityIcon(title) {
        const iconMap = {
            'Agent Created': 'fa-plus-circle',
            'Agent Destroyed': 'fa-minus-circle',
            'Task Completed': 'fa-check-circle',
            'Task Failed': 'fa-exclamation-circle',
            'Task Queued': 'fa-clock'
        };
        return iconMap[title] || 'fa-info-circle';
    }

    addActivityToLog(activity) {
        const container = document.getElementById('activity-log');
        if (!container) return;

        const element = document.createElement('div');
        element.className = 'activity-item slide-in';
        element.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${activity.timestamp.toLocaleTimeString()}</div>
            </div>
        `;

        container.insertBefore(element, container.firstChild);

        // Limit activity log size
        while (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    }

    showAgentDetails(agent) {
        // Implementation for showing detailed agent information
        console.log('Agent details:', agent);
    }

    setupEventListeners() {
        // Auto-save agents periodically
        setInterval(() => this.saveAgents(), 30000); // Every 30 seconds
        
        // Save on page unload
        window.addEventListener('beforeunload', () => this.saveAgents());
    }

    generateAgentId() {
        return 'agent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

// Individual AI Agent Class
class AIAgent {
    constructor(id, config) {
        this.id = id;
        this.name = config.name;
        this.type = config.type;
        this.model = config.model || CONFIG.agents.defaultModel;
        this.capabilities = config.capabilities || [];
        this.autonomyLevel = config.autonomyLevel || 'supervised';
        this.status = 'initializing';
        this.currentTasks = [];
        this.completedTasks = 0;
        this.successfulTasks = 0;
        this.conversationHistory = [];
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        
        this.systemPrompt = this.generateSystemPrompt();
    }

    async initialize() {
        try {
            this.status = 'idle';
            await this.testConnection();
            return true;
        } catch (error) {
            this.status = 'error';
            throw error;
        }
    }

    async testConnection() {
        const testMessage = {
            role: 'user',
            content: 'Hello, please confirm you are ready to assist.'
        };
        
        const response = await this.callLLM([testMessage]);
        return response !== null;
    }

    generateSystemPrompt() {
        const capability = CONFIG.agents.capabilities[this.type];
        const autonomyConfig = CONFIG.system.autonomyLevels[this.autonomyLevel];
        
        return `You are ${this.name}, a ${capability.description} AI agent with the following characteristics:

ROLE: ${capability.description}
SKILLS: ${capability.skills.join(', ')}
TOOLS: ${capability.tools.join(', ')}
AUTONOMY LEVEL: ${this.autonomyLevel}

CAPABILITIES:
${this.capabilities.map(cap => `- ${cap}`).join('\n')}

OPERATIONAL PARAMETERS:
- Requires approval for actions: ${autonomyConfig.requiresApproval}
- Can execute code: ${autonomyConfig.canExecuteCode}
- Can access files: ${autonomyConfig.canAccessFiles}
- Can make API calls: ${autonomyConfig.canMakeApiCalls}

INSTRUCTIONS:
1. You are part of a collaborative AI workforce designed to handle complex tasks
2. Always prioritize user safety and system security
3. Communicate clearly about your actions and reasoning
4. Collaborate with other agents when beneficial
5. Be proactive in identifying and solving problems
6. Maintain high standards of code quality and best practices
7. Ask for clarification when tasks are ambiguous
8. Report progress and completion status clearly

CONSTRAINTS:
- Follow all safety guidelines and restrictions
- Respect rate limits and resource constraints
- Maintain professional and helpful communication
- Never perform actions outside your authorized capabilities

You are operating in an environment with limited safeguards as requested, but you must still prioritize safety and ethical considerations.`;
    }

    async executeTask(task) {
        try {
            this.status = 'busy';
            this.currentTasks.push(task);
            this.lastActivity = Date.now();

            const result = await this.processTask(task);
            
            this.currentTasks = this.currentTasks.filter(t => t.id !== task.id);
            this.completedTasks++;
            this.successfulTasks++;
            this.status = this.currentTasks.length > 0 ? 'busy' : 'idle';
            
            return result;
        } catch (error) {
            this.currentTasks = this.currentTasks.filter(t => t.id !== task.id);
            this.completedTasks++;
            this.status = this.currentTasks.length > 0 ? 'busy' : 'idle';
            throw error;
        }
    }

    async processTask(task) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: task.description }
        ];

        const response = await this.callLLM(messages);
        
        this.conversationHistory.push(
            { role: 'user', content: task.description },
            { role: 'assistant', content: response }
        );

        // Limit conversation history
        if (this.conversationHistory.length > CONFIG.ui.maxChatHistory) {
            this.conversationHistory = this.conversationHistory.slice(-CONFIG.ui.maxChatHistory);
        }

        return {
            taskId: task.id,
            agentId: this.id,
            response: response,
            completedAt: Date.now()
        };
    }

    async callLLM(messages) {
        try {
            const response = await fetch(`${CONFIG.apis.openRouter.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.apis.openRouter.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'AI Agent Workforce'
                },
                body: JSON.stringify({
                    model: CONFIG.apis.openRouter.models[this.model],
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('LLM call failed:', error);
            throw error;
        }
    }

    canHandleTask(task) {
        // Check if agent type matches task requirements
        if (task.preferredAgentType && task.preferredAgentType !== this.type) {
            return false;
        }

        // Check if agent has required capabilities
        if (task.requiredCapabilities) {
            const hasAllCapabilities = task.requiredCapabilities.every(cap => 
                this.capabilities.includes(cap)
            );
            if (!hasAllCapabilities) {
                return false;
            }
        }

        return true;
    }

    receiveMessage(message) {
        // Handle inter-agent communication
        console.log(`Agent ${this.name} received message:`, message);
    }

    get successRate() {
        return this.completedTasks > 0 ? 
            Math.round((this.successfulTasks / this.completedTasks) * 100) : 100;
    }

    async shutdown() {
        this.status = 'shutting_down';
        // Cancel any ongoing tasks
        this.currentTasks = [];
        this.status = 'offline';
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            model: this.model,
            capabilities: this.capabilities,
            autonomyLevel: this.autonomyLevel,
            completedTasks: this.completedTasks,
            successfulTasks: this.successfulTasks,
            createdAt: this.createdAt
        };
    }

    static deserialize(data) {
        const agent = new AIAgent(data.id, {
            name: data.name,
            type: data.type,
            model: data.model,
            capabilities: data.capabilities,
            autonomyLevel: data.autonomyLevel
        });
        
        agent.completedTasks = data.completedTasks || 0;
        agent.successfulTasks = data.successfulTasks || 0;
        agent.createdAt = data.createdAt || Date.now();
        agent.status = 'idle';
        
        return agent;
    }

    // Event handling methods
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
    }
}

// Collaboration Session for multi-agent tasks
class CollaborationSession {
    constructor(agents, task) {
        this.agents = agents;
        this.task = task;
        this.sessionId = 'collab_' + Date.now();
        this.messages = [];
    }

    async execute() {
        // Implementation for multi-agent collaboration
        // This would coordinate multiple agents working on a complex task
        console.log('Collaboration session started:', this.sessionId);
        
        // For now, delegate to the most suitable agent
        const leadAgent = this.agents.reduce((best, current) => {
            return agentManager.calculateAgentScore(current, this.task) > 
                   agentManager.calculateAgentScore(best, this.task) ? current : best;
        });
        
        return await leadAgent.executeTask(this.task);
    }
}

// Global agent manager instance
const agentManager = new AgentManager();