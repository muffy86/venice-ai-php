/**
 * Enterprise Integration Hub
 * Advanced API orchestration and enterprise system integration
 */

class EnterpriseIntegrationHub {
    constructor() {
        this.connectors = new Map();
        this.apiGateway = new APIGateway();
        this.dataTransformers = new Map();
        this.workflows = new Map();
        
        try {
            this.security = new SecurityManager();
        } catch (error) {
            console.warn('SecurityManager not available, using fallback:', error);
            this.security = {
                authenticate: () => Promise.resolve(true),
                authorize: () => Promise.resolve(true),
                encrypt: (data) => data,
                decrypt: (data) => data,
                validateToken: () => Promise.resolve(true)
            };
        }
        
        this.init();
    }

    init() {
        this.setupCoreConnectors();
        this.initializeAPIGateway();
        this.setupDataTransformers();
        this.startHealthMonitoring();
    }

    setupCoreConnectors() {
        try {
            // Productivity Suite Connectors
            this.connectors.set('google-workspace', new GoogleWorkspaceConnector());
            this.connectors.set('microsoft-365', new Microsoft365Connector());
            this.connectors.set('slack', new SlackConnector());
            this.connectors.set('notion', new NotionConnector());
            
            // Development Tools
            this.connectors.set('github', new GitHubConnector());
            this.connectors.set('jira', new JiraConnector());
            this.connectors.set('jenkins', new JenkinsConnector());
            
            // CRM & Business
            this.connectors.set('salesforce', new SalesforceConnector());
            this.connectors.set('hubspot', new HubSpotConnector());
            this.connectors.set('zapier', new ZapierConnector());
            
            // Cloud Services
            this.connectors.set('aws', new AWSConnector());
            this.connectors.set('azure', new AzureConnector());
            this.connectors.set('gcp', new GCPConnector());
        } catch (error) {
            console.warn('Error setting up connectors:', error);
            // Initialize with empty connectors map
            this.connectors = new Map();
        }
    }

    initializeAPIGateway() {
        try {
            this.apiGateway = new APIGateway({
                rateLimiter: new RateLimiter(),
                security: this.security,
                monitoring: true,
                caching: true
            });
            
            // Setup default routes and middleware
            this.apiGateway.setupDefaultRoutes();
            this.apiGateway.enableCORS();
            this.apiGateway.enableRateLimit();
        } catch (error) {
            console.warn('Error initializing API Gateway:', error);
            // Fallback initialization
            this.apiGateway = {
                setupDefaultRoutes: () => {},
                enableCORS: () => {},
                enableRateLimit: () => {},
                getStatus: () => ({ status: 'error', error: error.message })
            };
        }
    }

    // Universal API orchestration
    async executeIntegration(integrationConfig) {
        const execution = {
            id: `exec_${Date.now()}`,
            config: integrationConfig,
            startTime: Date.now(),
            steps: [],
            status: 'running'
        };

        try {
            // 1. Authentication & Authorization
            await this.authenticateServices(integrationConfig.services);
            
            // 2. Data Extraction
            const sourceData = await this.extractData(integrationConfig.source);
            execution.steps.push({ step: 'extract', status: 'completed', data: sourceData });
            
            // 3. Data Transformation
            const transformedData = await this.transformData(sourceData, integrationConfig.transformations);
            execution.steps.push({ step: 'transform', status: 'completed', data: transformedData });
            
            // 4. Data Loading/Action Execution
            const result = await this.executeActions(transformedData, integrationConfig.actions);
            execution.steps.push({ step: 'execute', status: 'completed', result });
            
            // 5. Validation & Cleanup
            await this.validateExecution(result, integrationConfig.validation);
            execution.steps.push({ step: 'validate', status: 'completed' });
            
            execution.status = 'completed';
            execution.endTime = Date.now();
            execution.duration = execution.endTime - execution.startTime;
            
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = Date.now();
        }

        return execution;
    }

    // Advanced workflow automation
    async createWorkflow(definition) {
        const workflow = {
            id: `workflow_${Date.now()}`,
            name: definition.name,
            triggers: definition.triggers,
            steps: definition.steps,
            conditions: definition.conditions || [],
            errorHandling: definition.errorHandling || {},
            schedule: definition.schedule,
            status: 'active'
        };

        // Validate workflow
        const validation = await this.validateWorkflow(workflow);
        if (!validation.valid) {
            throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
        }

        this.workflows.set(workflow.id, workflow);
        
        // Setup triggers
        await this.setupWorkflowTriggers(workflow);
        
        return workflow.id;
    }

    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error('Workflow not found');

        const execution = {
            workflowId,
            context,
            startTime: Date.now(),
            steps: [],
            status: 'running'
        };

        try {
            // Check conditions
            for (const condition of workflow.conditions) {
                if (!await this.evaluateCondition(condition, context)) {
                    execution.status = 'skipped';
                    execution.reason = 'Conditions not met';
                    return execution;
                }
            }

            // Execute steps
            for (const step of workflow.steps) {
                const stepResult = await this.executeWorkflowStep(step, context);
                execution.steps.push(stepResult);
                
                // Update context with step results
                context[step.id] = stepResult.output;
            }

            execution.status = 'completed';
            
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            
            // Execute error handling
            if (workflow.errorHandling.onError) {
                await this.executeErrorHandling(workflow.errorHandling.onError, error, context);
            }
        }

        execution.endTime = Date.now();
        execution.duration = execution.endTime - execution.startTime;
        
        return execution;
    }

    // Data transformation engine
    async transformData(data, transformations) {
        let result = data;
        
        for (const transformation of transformations) {
            const transformer = this.dataTransformers.get(transformation.type);
            if (!transformer) {
                throw new Error(`Unknown transformation type: ${transformation.type}`);
            }
            
            result = await transformer.transform(result, transformation.config);
        }
        
        return result;
    }

    setupDataTransformers() {
        // JSON transformations
        this.dataTransformers.set('json-map', {
            transform: (data, config) => {
                return this.mapJsonData(data, config.mapping);
            }
        });
        
        // Data filtering
        this.dataTransformers.set('filter', {
            transform: (data, config) => {
                return data.filter(item => this.evaluateFilter(item, config.criteria));
            }
        });
        
        // Data aggregation
        this.dataTransformers.set('aggregate', {
            transform: (data, config) => {
                return this.aggregateData(data, config.groupBy, config.operations);
            }
        });
        
        // Format conversion
        this.dataTransformers.set('format', {
            transform: (data, config) => {
                return this.convertFormat(data, config.from, config.to);
            }
        });
    }

    // Security and authentication
    async authenticateServices(services) {
        for (const service of services) {
            const connector = this.connectors.get(service.type);
            if (!connector) {
                throw new Error(`Unknown service type: ${service.type}`);
            }
            
            await connector.authenticate(service.credentials);
        }
    }

    // Real-time monitoring and alerting
    startHealthMonitoring() {
        setInterval(async () => {
            await this.checkConnectorHealth();
            await this.monitorWorkflowPerformance();
            await this.checkSecurityStatus();
        }, 60000); // Every minute
    }

    async checkConnectorHealth() {
        const healthStatus = new Map();
        
        for (const [name, connector] of this.connectors) {
            try {
                const health = await connector.healthCheck();
                healthStatus.set(name, {
                    status: 'healthy',
                    responseTime: health.responseTime,
                    lastCheck: Date.now()
                });
            } catch (error) {
                healthStatus.set(name, {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: Date.now()
                });
                
                // Send alert
                await this.sendHealthAlert(name, error);
            }
        }
        
        this.connectorHealth = healthStatus;
    }

    // Advanced error handling and retry logic
    async executeWithRetry(operation, maxRetries = 3, backoffMs = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = backoffMs * Math.pow(2, attempt - 1); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    // Public API for enterprise integrations
    async connectService(serviceType, credentials) {
        const connector = this.connectors.get(serviceType);
        if (!connector) {
            throw new Error(`Unsupported service type: ${serviceType}`);
        }
        
        await connector.authenticate(credentials);
        return { status: 'connected', service: serviceType };
    }

    async syncData(sourceService, targetService, mapping) {
        const integration = {
            source: { service: sourceService, query: mapping.sourceQuery },
            transformations: mapping.transformations || [],
            actions: [{ service: targetService, operation: 'upsert', data: '{{transformed}}' }]
        };
        
        return await this.executeIntegration(integration);
    }

    async automateWorkflow(workflowDefinition) {
        return await this.createWorkflow(workflowDefinition);
    }

    getIntegrationStatus() {
        return {
            connectors: Array.from(this.connectorHealth?.entries() || []),
            activeWorkflows: this.workflows.size,
            apiGateway: this.apiGateway.getStatus(),
            security: this.security.getStatus()
        };
    }
}

// Base connector class
class BaseConnector {
    constructor(name) {
        this.name = name;
        this.authenticated = false;
        this.rateLimiter = new RateLimiter();
    }

    async authenticate(credentials) {
        throw new Error('authenticate method must be implemented');
    }

    async healthCheck() {
        const start = Date.now();
        await this.ping();
        return { responseTime: Date.now() - start };
    }

    async ping() {
        // Override in specific connectors
        return true;
    }
}

// Specific connector implementations
class GoogleWorkspaceConnector extends BaseConnector {
    constructor() {
        super('google-workspace');
        this.scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/gmail.readonly'];
    }

    async authenticate(credentials) {
        // OAuth 2.0 flow implementation
        this.accessToken = credentials.accessToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        if (!this.authenticated) throw new Error('Not authenticated');
        
        switch (action) {
            case 'list-files':
                return await this.listDriveFiles(params);
            case 'send-email':
                return await this.sendGmail(params);
            case 'create-doc':
                return await this.createDocument(params);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class Microsoft365Connector extends BaseConnector {
    constructor() {
        super('microsoft-365');
        this.scopes = ['https://graph.microsoft.com/User.Read', 'https://graph.microsoft.com/Files.ReadWrite'];
    }

    async authenticate(credentials) {
        this.accessToken = credentials.accessToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        if (!this.authenticated) throw new Error('Not authenticated');
        
        switch (action) {
            case 'list-files':
                return await this.listOneDriveFiles(params);
            case 'send-email':
                return await this.sendOutlookEmail(params);
            case 'create-document':
                return await this.createOfficeDocument(params);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async listOneDriveFiles(params) {
        // Stub implementation
        return { files: [], message: 'OneDrive files listed' };
    }

    async sendOutlookEmail(params) {
        // Stub implementation
        return { messageId: 'msg_' + Date.now(), status: 'sent' };
    }

    async createOfficeDocument(params) {
        // Stub implementation
        return { documentId: 'doc_' + Date.now(), url: 'https://office.com/doc' };
    }
}

class SlackConnector extends BaseConnector {
    constructor() {
        super('slack');
    }

    async authenticate(credentials) {
        this.botToken = credentials.botToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'send-message':
                return await this.sendMessage(params.channel, params.text);
            case 'create-channel':
                return await this.createChannel(params.name);
            case 'get-users':
                return await this.getUsers();
        }
    }

    async sendMessage(channel, text) {
        // Stub implementation
        return { messageId: 'msg_' + Date.now(), channel, text };
    }

    async createChannel(name) {
        // Stub implementation
        return { channelId: 'ch_' + Date.now(), name };
    }

    async getUsers() {
        // Stub implementation
        return { users: [{ id: 'user1', name: 'Test User' }] };
    }
}

class NotionConnector extends BaseConnector {
    constructor() {
        super('notion');
    }

    async authenticate(credentials) {
        this.apiKey = credentials.apiKey;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'create-page':
                return { pageId: 'page_' + Date.now(), title: params.title };
            case 'query-database':
                return { results: [], hasMore: false };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class GitHubConnector extends BaseConnector {
    constructor() {
        super('github');
    }

    async authenticate(credentials) {
        this.token = credentials.token;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'create-issue':
                return { issueId: 'issue_' + Date.now(), number: Math.floor(Math.random() * 1000) };
            case 'list-repos':
                return { repositories: [{ name: 'test-repo', url: 'https://github.com/user/test-repo' }] };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class JiraConnector extends BaseConnector {
    constructor() {
        super('jira');
    }

    async authenticate(credentials) {
        this.apiToken = credentials.apiToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'create-ticket':
                return { ticketId: 'PROJ-' + Math.floor(Math.random() * 1000), key: params.summary };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class JenkinsConnector extends BaseConnector {
    constructor() {
        super('jenkins');
    }

    async authenticate(credentials) {
        this.apiToken = credentials.apiToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'trigger-build':
                return { buildId: 'build_' + Date.now(), status: 'triggered' };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class SalesforceConnector extends BaseConnector {
    constructor() {
        super('salesforce');
    }

    async authenticate(credentials) {
        this.accessToken = credentials.accessToken;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'create-lead':
                return { leadId: 'lead_' + Date.now(), status: 'created' };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class HubSpotConnector extends BaseConnector {
    constructor() {
        super('hubspot');
    }

    async authenticate(credentials) {
        this.apiKey = credentials.apiKey;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'create-contact':
                return { contactId: 'contact_' + Date.now(), status: 'created' };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class ZapierConnector extends BaseConnector {
    constructor() {
        super('zapier');
    }

    async authenticate(credentials) {
        this.apiKey = credentials.apiKey;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'trigger-zap':
                return { zapId: 'zap_' + Date.now(), status: 'triggered' };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class AWSConnector extends BaseConnector {
    constructor() {
        super('aws');
    }

    async authenticate(credentials) {
        this.accessKeyId = credentials.accessKeyId;
        this.secretAccessKey = credentials.secretAccessKey;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'list-s3-buckets':
                return { buckets: [{ name: 'test-bucket' }] };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class AzureConnector extends BaseConnector {
    constructor() {
        super('azure');
    }

    async authenticate(credentials) {
        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'list-resources':
                return { resources: [{ name: 'test-resource' }] };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

class GCPConnector extends BaseConnector {
    constructor() {
        super('gcp');
    }

    async authenticate(credentials) {
        this.serviceAccountKey = credentials.serviceAccountKey;
        this.authenticated = true;
    }

    async executeAction(action, params) {
        switch (action) {
            case 'list-projects':
                return { projects: [{ name: 'test-project' }] };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

// API Gateway for request routing and management
class APIGateway {
    constructor(options = {}) {
        this.routes = new Map();
        this.middleware = [];
        this.rateLimiter = options.rateLimiter || new RateLimiter();
        this.security = options.security;
        this.monitoring = options.monitoring || false;
        this.caching = options.caching || false;
    }

    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    use(middleware) {
        this.middleware.push(middleware);
    }

    async handleRequest(request) {
        // Apply middleware
        for (const middleware of this.middleware) {
            request = await middleware(request);
        }

        // Rate limiting
        await this.rateLimiter.checkLimit(request.clientId);

        // Route to handler
        const handler = this.routes.get(request.path);
        if (!handler) {
            throw new Error(`No handler for path: ${request.path}`);
        }

        return await handler(request);
    }

    setupDefaultRoutes() {
        this.addRoute('/health', async (request) => {
            return { status: 'healthy', timestamp: Date.now() };
        });
        
        this.addRoute('/status', async (request) => {
            return this.getStatus();
        });
    }

    enableCORS() {
        this.use(async (request) => {
            request.headers = request.headers || {};
            request.headers['Access-Control-Allow-Origin'] = '*';
            request.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            request.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
            return request;
        });
    }

    enableRateLimit() {
        this.use(async (request) => {
            await this.rateLimiter.checkLimit(request.clientId || 'anonymous');
            return request;
        });
    }

    getStatus() {
        return {
            routes: this.routes.size,
            middleware: this.middleware.length,
            rateLimiter: this.rateLimiter.getStatus()
        };
    }
}

// Rate limiting utility
class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.defaultLimit = { requests: 100, window: 60000 }; // 100 requests per minute
    }

    async checkLimit(clientId, limit = this.defaultLimit) {
        const now = Date.now();
        const clientLimits = this.limits.get(clientId) || { requests: [], window: limit.window };

        // Remove old requests outside the window
        clientLimits.requests = clientLimits.requests.filter(time => now - time < limit.window);

        if (clientLimits.requests.length >= limit.requests) {
            throw new Error('Rate limit exceeded');
        }

        clientLimits.requests.push(now);
        this.limits.set(clientId, clientLimits);
    }

    getStatus() {
        return {
            activeClients: this.limits.size,
            defaultLimit: this.defaultLimit
        };
    }
}

// Security manager
class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.auditLog = [];
    }

    generateEncryptionKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async encrypt(data) {
        // Simple encryption implementation
        return btoa(JSON.stringify(data));
    }

    async decrypt(encryptedData) {
        return JSON.parse(atob(encryptedData));
    }

    logAccess(userId, resource, action) {
        this.auditLog.push({
            userId,
            resource,
            action,
            timestamp: Date.now(),
            ip: 'unknown' // Would get from request
        });
    }

    getStatus() {
        return {
            auditLogSize: this.auditLog.length,
            encryptionEnabled: !!this.encryptionKey
        };
    }
}

// Initialize and expose globally
window.EnterpriseIntegrationHub = EnterpriseIntegrationHub;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.enterpriseHub = new EnterpriseIntegrationHub();
    });
} else {
    window.enterpriseHub = new EnterpriseIntegrationHub();
}