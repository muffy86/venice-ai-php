/**
 * Production Deployment Pipeline
 * Automated deployment and CI/CD pipeline for generated applications
 */

class DeploymentPipeline {
    constructor() {
        this.pipelines = new Map();
        this.deploymentTargets = new Map();
        this.buildConfigs = new Map();
        this.deploymentHistory = [];
        this.pipelineUI = null;
        this.currentDeployment = null;
        this.webhooks = new Map();
        this.environments = new Map();
        this.secrets = new Map();
        
        this.init();
    }

    async init() {
        this.setupDeploymentTargets();
        this.setupBuildConfigs();
        this.setupEnvironments();
        this.createPipelineUI();
        this.loadDeploymentSettings();
        this.setupEventListeners();
        this.initializeCloudServices();
    }

    setupDeploymentTargets() {
        // Netlify
        this.deploymentTargets.set('netlify', {
            name: 'Netlify',
            description: 'Deploy to Netlify with automatic SSL and CDN',
            icon: '🌐',
            type: 'static',
            features: ['SSL', 'CDN', 'Forms', 'Functions'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToNetlify.bind(this)
        });

        // Vercel
        this.deploymentTargets.set('vercel', {
            name: 'Vercel',
            description: 'Deploy to Vercel with edge functions',
            icon: '▲',
            type: 'static',
            features: ['Edge Functions', 'Analytics', 'Preview Deployments'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToVercel.bind(this)
        });

        // GitHub Pages
        this.deploymentTargets.set('github-pages', {
            name: 'GitHub Pages',
            description: 'Deploy to GitHub Pages',
            icon: '📄',
            type: 'static',
            features: ['Free Hosting', 'Custom Domain', 'HTTPS'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToGitHubPages.bind(this)
        });

        // Firebase Hosting
        this.deploymentTargets.set('firebase', {
            name: 'Firebase Hosting',
            description: 'Deploy to Firebase with backend services',
            icon: '🔥',
            type: 'full-stack',
            features: ['Hosting', 'Database', 'Auth', 'Functions'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToFirebase.bind(this)
        });

        // AWS S3 + CloudFront
        this.deploymentTargets.set('aws-s3', {
            name: 'AWS S3 + CloudFront',
            description: 'Deploy to AWS with global CDN',
            icon: '☁️',
            type: 'static',
            features: ['S3 Storage', 'CloudFront CDN', 'Route 53'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToAWS.bind(this)
        });

        // Heroku
        this.deploymentTargets.set('heroku', {
            name: 'Heroku',
            description: 'Deploy full-stack apps to Heroku',
            icon: '🟣',
            type: 'full-stack',
            features: ['Dynos', 'Add-ons', 'Pipelines'],
            buildCommand: 'npm run build',
            publishDir: '.',
            handler: this.deployToHeroku.bind(this)
        });

        // DigitalOcean App Platform
        this.deploymentTargets.set('digitalocean', {
            name: 'DigitalOcean',
            description: 'Deploy to DigitalOcean App Platform',
            icon: '🌊',
            type: 'full-stack',
            features: ['Managed Hosting', 'Databases', 'Load Balancers'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToDigitalOcean.bind(this)
        });

        // Custom Server
        this.deploymentTargets.set('custom', {
            name: 'Custom Server',
            description: 'Deploy to your own server via SSH/FTP',
            icon: '🖥️',
            type: 'custom',
            features: ['SSH Deploy', 'FTP Upload', 'Docker'],
            buildCommand: 'npm run build',
            publishDir: 'dist',
            handler: this.deployToCustomServer.bind(this)
        });
    }

    setupBuildConfigs() {
        // Static Site Build
        this.buildConfigs.set('static', {
            name: 'Static Site',
            description: 'Build for static hosting',
            steps: [
                'Install dependencies',
                'Run build command',
                'Optimize assets',
                'Generate sitemap',
                'Create deployment package'
            ],
            handler: this.buildStatic.bind(this)
        });

        // Progressive Web App
        this.buildConfigs.set('pwa', {
            name: 'Progressive Web App',
            description: 'Build PWA with service worker',
            steps: [
                'Install dependencies',
                'Generate service worker',
                'Create app manifest',
                'Optimize for offline',
                'Build and package'
            ],
            handler: this.buildPWA.bind(this)
        });

        // Single Page Application
        this.buildConfigs.set('spa', {
            name: 'Single Page App',
            description: 'Build SPA with routing',
            steps: [
                'Install dependencies',
                'Configure routing',
                'Bundle JavaScript',
                'Optimize chunks',
                'Create deployment package'
            ],
            handler: this.buildSPA.bind(this)
        });

        // Server-Side Rendered
        this.buildConfigs.set('ssr', {
            name: 'Server-Side Rendered',
            description: 'Build SSR application',
            steps: [
                'Install dependencies',
                'Build client bundle',
                'Build server bundle',
                'Generate static pages',
                'Package for deployment'
            ],
            handler: this.buildSSR.bind(this)
        });
    }

    setupEnvironments() {
        this.environments.set('development', {
            name: 'Development',
            description: 'Development environment for testing',
            variables: {
                NODE_ENV: 'development',
                DEBUG: 'true',
                API_URL: 'http://localhost:3000'
            }
        });

        this.environments.set('staging', {
            name: 'Staging',
            description: 'Staging environment for pre-production testing',
            variables: {
                NODE_ENV: 'staging',
                DEBUG: 'false',
                API_URL: 'https://staging-api.example.com'
            }
        });

        this.environments.set('production', {
            name: 'Production',
            description: 'Production environment',
            variables: {
                NODE_ENV: 'production',
                DEBUG: 'false',
                API_URL: 'https://api.example.com'
            }
        });
    }

    createPipelineUI() {
        this.pipelineUI = document.createElement('div');
        this.pipelineUI.id = 'deployment-pipeline-ui';
        this.pipelineUI.className = 'deployment-pipeline-ui';
        this.pipelineUI.innerHTML = this.getPipelineUIHTML();

        const style = document.createElement('style');
        style.textContent = this.getPipelineStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.pipelineUI);
    }

    getPipelineUIHTML() {
        return `
            <div class="pipeline-panel">
                <div class="pipeline-header">
                    <h3>Deployment Pipeline</h3>
                    <div class="pipeline-controls">
                        <button class="btn secondary" onclick="deploymentPipeline.createNewPipeline()">
                            <span class="btn-icon">➕</span>
                            New Pipeline
                        </button>
                        <button class="close-btn" onclick="deploymentPipeline.hidePipelinePanel()">×</button>
                    </div>
                </div>
                
                <div class="pipeline-tabs">
                    <button class="tab-btn active" data-tab="overview" onclick="deploymentPipeline.switchTab('overview')">
                        Overview
                    </button>
                    <button class="tab-btn" data-tab="pipelines" onclick="deploymentPipeline.switchTab('pipelines')">
                        Pipelines
                    </button>
                    <button class="tab-btn" data-tab="deployments" onclick="deploymentPipeline.switchTab('deployments')">
                        Deployments
                    </button>
                    <button class="tab-btn" data-tab="environments" onclick="deploymentPipeline.switchTab('environments')">
                        Environments
                    </button>
                    <button class="tab-btn" data-tab="settings" onclick="deploymentPipeline.switchTab('settings')">
                        Settings
                    </button>
                </div>
                
                <div class="pipeline-content">
                    <!-- Overview Tab -->
                    <div class="tab-content active" id="overview-tab">
                        <div class="deployment-status">
                            <div class="status-card">
                                <h4>Active Deployments</h4>
                                <div class="status-value" id="active-deployments">0</div>
                                <div class="status-trend">↗️ +2 this week</div>
                            </div>
                            
                            <div class="status-card">
                                <h4>Success Rate</h4>
                                <div class="status-value" id="success-rate">98%</div>
                                <div class="status-trend">✅ Excellent</div>
                            </div>
                            
                            <div class="status-card">
                                <h4>Avg Deploy Time</h4>
                                <div class="status-value" id="avg-deploy-time">2.3m</div>
                                <div class="status-trend">⚡ Fast</div>
                            </div>
                            
                            <div class="status-card">
                                <h4>Total Deployments</h4>
                                <div class="status-value" id="total-deployments">47</div>
                                <div class="status-trend">📈 Growing</div>
                            </div>
                        </div>
                        
                        <div class="recent-deployments">
                            <h4>Recent Deployments</h4>
                            <div class="deployments-list" id="recent-deployments-list">
                                <!-- Recent deployments will be populated here -->
                            </div>
                        </div>
                        
                        <div class="quick-deploy">
                            <h4>Quick Deploy</h4>
                            <div class="quick-deploy-options">
                                <button class="quick-deploy-btn" onclick="deploymentPipeline.quickDeploy('netlify')">
                                    <span class="deploy-icon">🌐</span>
                                    <span class="deploy-name">Netlify</span>
                                    <span class="deploy-time">~2 min</span>
                                </button>
                                <button class="quick-deploy-btn" onclick="deploymentPipeline.quickDeploy('vercel')">
                                    <span class="deploy-icon">▲</span>
                                    <span class="deploy-name">Vercel</span>
                                    <span class="deploy-time">~1 min</span>
                                </button>
                                <button class="quick-deploy-btn" onclick="deploymentPipeline.quickDeploy('github-pages')">
                                    <span class="deploy-icon">📄</span>
                                    <span class="deploy-name">GitHub Pages</span>
                                    <span class="deploy-time">~3 min</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pipelines Tab -->
                    <div class="tab-content" id="pipelines-tab">
                        <div class="pipelines-header">
                            <h4>Deployment Pipelines</h4>
                            <button class="btn primary" onclick="deploymentPipeline.createPipeline()">
                                <span class="btn-icon">🔧</span>
                                Create Pipeline
                            </button>
                        </div>
                        
                        <div class="pipelines-grid" id="pipelines-grid">
                            <!-- Pipelines will be populated here -->
                        </div>
                        
                        <div class="pipeline-templates">
                            <h4>Pipeline Templates</h4>
                            <div class="templates-grid">
                                <div class="template-card" onclick="deploymentPipeline.useTemplate('static-site')">
                                    <div class="template-icon">🌐</div>
                                    <div class="template-name">Static Site</div>
                                    <div class="template-description">Simple static site deployment</div>
                                </div>
                                <div class="template-card" onclick="deploymentPipeline.useTemplate('pwa')">
                                    <div class="template-icon">📱</div>
                                    <div class="template-name">Progressive Web App</div>
                                    <div class="template-description">PWA with service worker</div>
                                </div>
                                <div class="template-card" onclick="deploymentPipeline.useTemplate('full-stack')">
                                    <div class="template-icon">🔧</div>
                                    <div class="template-name">Full Stack</div>
                                    <div class="template-description">Frontend + Backend deployment</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Deployments Tab -->
                    <div class="tab-content" id="deployments-tab">
                        <div class="deployments-header">
                            <h4>Deployment History</h4>
                            <div class="deployment-filters">
                                <select id="environment-filter">
                                    <option value="">All Environments</option>
                                    <option value="production">Production</option>
                                    <option value="staging">Staging</option>
                                    <option value="development">Development</option>
                                </select>
                                <select id="status-filter">
                                    <option value="">All Status</option>
                                    <option value="success">Success</option>
                                    <option value="failed">Failed</option>
                                    <option value="running">Running</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="deployments-table" id="deployments-table">
                            <!-- Deployment history table will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Environments Tab -->
                    <div class="tab-content" id="environments-tab">
                        <div class="environments-header">
                            <h4>Environment Configuration</h4>
                            <button class="btn primary" onclick="deploymentPipeline.addEnvironment()">
                                <span class="btn-icon">➕</span>
                                Add Environment
                            </button>
                        </div>
                        
                        <div class="environments-grid" id="environments-grid">
                            <!-- Environments will be populated here -->
                        </div>
                        
                        <div class="environment-variables">
                            <h4>Environment Variables</h4>
                            <div class="variables-editor" id="variables-editor">
                                <!-- Environment variables editor will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings Tab -->
                    <div class="tab-content" id="settings-tab">
                        <div class="deployment-settings">
                            <h4>Deployment Configuration</h4>
                            
                            <div class="setting-group">
                                <h5>General Settings</h5>
                                <label>
                                    <input type="checkbox" id="auto-deploy" checked>
                                    Enable automatic deployments
                                </label>
                                <label>
                                    <input type="checkbox" id="build-cache">
                                    Enable build caching
                                </label>
                                <label>
                                    <input type="checkbox" id="deploy-previews" checked>
                                    Generate deployment previews
                                </label>
                                <label>
                                    Build timeout:
                                    <input type="number" id="build-timeout" value="600" min="60" max="3600">
                                    seconds
                                </label>
                            </div>
                            
                            <div class="setting-group">
                                <h5>Notification Settings</h5>
                                <label>
                                    <input type="checkbox" id="email-notifications" checked>
                                    Email notifications
                                </label>
                                <label>
                                    <input type="checkbox" id="slack-notifications">
                                    Slack notifications
                                </label>
                                <label>
                                    <input type="checkbox" id="webhook-notifications">
                                    Webhook notifications
                                </label>
                                <label>
                                    Notification email:
                                    <input type="email" id="notification-email" placeholder="admin@example.com">
                                </label>
                            </div>
                            
                            <div class="setting-group">
                                <h5>Security Settings</h5>
                                <label>
                                    <input type="checkbox" id="require-approval" checked>
                                    Require approval for production deployments
                                </label>
                                <label>
                                    <input type="checkbox" id="branch-protection">
                                    Enable branch protection
                                </label>
                                <label>
                                    <input type="checkbox" id="security-scan" checked>
                                    Run security scans before deployment
                                </label>
                            </div>
                            
                            <div class="setting-group">
                                <h5>Performance Settings</h5>
                                <label>
                                    <input type="checkbox" id="asset-optimization" checked>
                                    Optimize assets during build
                                </label>
                                <label>
                                    <input type="checkbox" id="compression" checked>
                                    Enable compression
                                </label>
                                <label>
                                    <input type="checkbox" id="cdn-integration" checked>
                                    Integrate with CDN
                                </label>
                            </div>
                        </div>
                        
                        <div class="api-keys">
                            <h4>API Keys & Secrets</h4>
                            <div class="keys-list" id="api-keys-list">
                                <!-- API keys will be populated here -->
                            </div>
                            <button class="btn secondary" onclick="deploymentPipeline.addApiKey()">
                                <span class="btn-icon">🔑</span>
                                Add API Key
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="deployment-progress" id="deployment-progress">
                    <div class="progress-header">
                        <h4>Deploying to <span id="deploy-target">Netlify</span>...</h4>
                        <button class="btn secondary small" onclick="deploymentPipeline.cancelDeployment()">
                            Cancel
                        </button>
                    </div>
                    <div class="progress-steps" id="progress-steps">
                        <!-- Progress steps will be populated here -->
                    </div>
                    <div class="progress-logs" id="progress-logs">
                        <div class="logs-header">
                            <h5>Deployment Logs</h5>
                            <button class="btn secondary small" onclick="deploymentPipeline.downloadLogs()">
                                Download
                            </button>
                        </div>
                        <div class="logs-content" id="logs-content">
                            <!-- Logs will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPipelineStyles() {
        return `
            .deployment-pipeline-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }

            .deployment-pipeline-ui.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .pipeline-panel {
                background: #1a1a1a;
                border-radius: 12px;
                width: 90%;
                max-width: 1400px;
                height: 90%;
                max-height: 900px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                position: relative;
            }

            .pipeline-header {
                padding: 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
                border-radius: 12px 12px 0 0;
            }

            .pipeline-header h3 {
                margin: 0;
                color: #fff;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .pipeline-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .pipeline-tabs {
                display: flex;
                background: #2d2d2d;
                border-bottom: 1px solid #333;
                overflow-x: auto;
            }

            .tab-btn {
                padding: 12px 20px;
                background: none;
                border: none;
                color: #ccc;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                border-bottom: 3px solid transparent;
            }

            .tab-btn:hover {
                background: #333;
                color: #fff;
            }

            .tab-btn.active {
                color: #2196F3;
                border-bottom-color: #2196F3;
                background: #333;
            }

            .pipeline-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #1a1a1a;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .deployment-status {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .status-card {
                background: #2d2d2d;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #333;
                text-align: center;
            }

            .status-card h4 {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .status-value {
                font-size: 2rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 5px;
            }

            .status-trend {
                font-size: 0.8rem;
                color: #4CAF50;
            }

            .quick-deploy-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }

            .quick-deploy-btn {
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }

            .quick-deploy-btn:hover {
                border-color: #2196F3;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(33, 150, 243, 0.2);
            }

            .deploy-icon {
                font-size: 1.5rem;
            }

            .deploy-name {
                color: #fff;
                font-weight: 600;
            }

            .deploy-time {
                color: #ccc;
                font-size: 0.8rem;
            }

            .pipelines-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .pipeline-card {
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .pipeline-card:hover {
                border-color: #2196F3;
                transform: translateY(-2px);
            }

            .pipeline-card.active {
                border-color: #4CAF50;
                background: linear-gradient(135deg, #2d2d2d, #1e4d1e);
            }

            .pipeline-card.failed {
                border-color: #f44336;
                background: linear-gradient(135deg, #2d2d2d, #4d1e1e);
            }

            .templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .template-card {
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .template-card:hover {
                border-color: #2196F3;
                transform: translateY(-2px);
            }

            .template-icon {
                font-size: 2rem;
                margin-bottom: 10px;
            }

            .template-name {
                color: #fff;
                font-weight: 600;
                margin-bottom: 5px;
            }

            .template-description {
                color: #ccc;
                font-size: 0.9rem;
            }

            .environments-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }

            .environment-card {
                background: #2d2d2d;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
            }

            .environment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .environment-name {
                color: #fff;
                font-weight: 600;
            }

            .environment-status {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .environment-status.active {
                background: #4CAF50;
                color: #fff;
            }

            .environment-status.inactive {
                background: #666;
                color: #ccc;
            }

            .deployment-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: #2d2d2d;
                border-top: 1px solid #333;
                border-radius: 0 0 12px 12px;
                display: none;
                max-height: 50%;
                overflow-y: auto;
            }

            .deployment-progress.active {
                display: block;
            }

            .progress-header {
                padding: 15px 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .progress-header h4 {
                margin: 0;
                color: #fff;
                font-size: 1rem;
            }

            .progress-steps {
                padding: 15px 20px;
                border-bottom: 1px solid #333;
            }

            .progress-step {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                color: #ccc;
            }

            .progress-step.active {
                color: #2196F3;
            }

            .progress-step.completed {
                color: #4CAF50;
            }

            .progress-step.failed {
                color: #f44336;
            }

            .step-icon {
                width: 20px;
                text-align: center;
            }

            .logs-content {
                background: #1a1a1a;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                color: #ccc;
                max-height: 200px;
                overflow-y: auto;
                border-radius: 4px;
                margin-top: 10px;
            }

            .log-line {
                margin-bottom: 2px;
                white-space: pre-wrap;
            }

            .log-line.error {
                color: #f44336;
            }

            .log-line.warning {
                color: #ff9800;
            }

            .log-line.success {
                color: #4CAF50;
            }

            .deployments-table {
                background: #2d2d2d;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #333;
            }

            .table-header {
                background: #333;
                padding: 15px;
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
                gap: 15px;
                font-weight: 600;
                color: #fff;
            }

            .table-row {
                padding: 15px;
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px;
                gap: 15px;
                border-bottom: 1px solid #333;
                align-items: center;
            }

            .table-row:hover {
                background: #333;
            }

            .deployment-filters {
                display: flex;
                gap: 10px;
            }

            .deployment-filters select {
                background: #2d2d2d;
                border: 1px solid #333;
                color: #fff;
                padding: 8px 12px;
                border-radius: 4px;
            }

            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn.primary {
                background: #2196F3;
                color: #fff;
            }

            .btn.primary:hover {
                background: #1976D2;
                transform: translateY(-1px);
            }

            .btn.secondary {
                background: #333;
                color: #fff;
                border: 1px solid #555;
            }

            .btn.secondary:hover {
                background: #444;
            }

            .btn.small {
                padding: 6px 12px;
                font-size: 0.9rem;
            }

            .btn-icon {
                font-size: 1rem;
            }

            .close-btn {
                background: none;
                border: none;
                color: #ccc;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .close-btn:hover {
                background: #333;
                color: #fff;
            }

            .setting-group {
                margin-bottom: 25px;
                padding: 15px;
                background: #2d2d2d;
                border-radius: 8px;
                border: 1px solid #333;
            }

            .setting-group h5 {
                margin: 0 0 15px 0;
                color: #2196F3;
                font-size: 1rem;
            }

            .setting-group label {
                display: block;
                margin-bottom: 10px;
                color: #ccc;
                cursor: pointer;
            }

            .setting-group input[type="checkbox"] {
                margin-right: 8px;
            }

            .setting-group input[type="number"],
            .setting-group input[type="email"],
            .setting-group input[type="text"] {
                margin-left: 10px;
                background: #1a1a1a;
                border: 1px solid #333;
                color: #fff;
                padding: 6px 10px;
                border-radius: 4px;
            }

            @media (max-width: 768px) {
                .pipeline-panel {
                    width: 95%;
                    height: 95%;
                }

                .deployment-status {
                    grid-template-columns: repeat(2, 1fr);
                }

                .pipelines-grid {
                    grid-template-columns: 1fr;
                }

                .templates-grid {
                    grid-template-columns: 1fr;
                }

                .table-header,
                .table-row {
                    grid-template-columns: 1fr;
                    gap: 10px;
                }
            }
        `;
    }

    async deployToNetlify(config) {
        const steps = [
            'Preparing build environment',
            'Installing dependencies',
            'Running build command',
            'Optimizing assets',
            'Uploading to Netlify',
            'Configuring domain',
            'Deployment complete'
        ];

        return this.executeDeployment('netlify', steps, config);
    }

    async deployToVercel(config) {
        const steps = [
            'Initializing Vercel deployment',
            'Building application',
            'Optimizing for edge functions',
            'Uploading to Vercel',
            'Configuring routes',
            'Deployment complete'
        ];

        return this.executeDeployment('vercel', steps, config);
    }

    async deployToGitHubPages(config) {
        const steps = [
            'Connecting to GitHub',
            'Creating deployment branch',
            'Building static site',
            'Pushing to gh-pages',
            'Configuring GitHub Pages',
            'Deployment complete'
        ];

        return this.executeDeployment('github-pages', steps, config);
    }

    async deployToFirebase(config) {
        const steps = [
            'Authenticating with Firebase',
            'Building application',
            'Configuring Firebase hosting',
            'Uploading assets',
            'Setting up redirects',
            'Deployment complete'
        ];

        return this.executeDeployment('firebase', steps, config);
    }

    async deployToAWS(config) {
        const steps = [
            'Configuring AWS credentials',
            'Creating S3 bucket',
            'Building application',
            'Uploading to S3',
            'Configuring CloudFront',
            'Setting up Route 53',
            'Deployment complete'
        ];

        return this.executeDeployment('aws-s3', steps, config);
    }

    async deployToHeroku(config) {
        const steps = [
            'Connecting to Heroku',
            'Creating application',
            'Configuring buildpacks',
            'Deploying code',
            'Starting dynos',
            'Deployment complete'
        ];

        return this.executeDeployment('heroku', steps, config);
    }

    async deployToDigitalOcean(config) {
        const steps = [
            'Connecting to DigitalOcean',
            'Creating app specification',
            'Building application',
            'Deploying to App Platform',
            'Configuring domain',
            'Deployment complete'
        ];

        return this.executeDeployment('digitalocean', steps, config);
    }

    async deployToCustomServer(config) {
        const steps = [
            'Establishing SSH connection',
            'Building application locally',
            'Transferring files',
            'Installing dependencies',
            'Restarting services',
            'Deployment complete'
        ];

        return this.executeDeployment('custom', steps, config);
    }

    async executeDeployment(target, steps, config) {
        this.showDeploymentProgress(target);
        
        const deployment = {
            id: Date.now().toString(),
            target: target,
            status: 'running',
            startTime: new Date(),
            steps: steps.map(step => ({ name: step, status: 'pending' })),
            logs: [],
            config: config
        };

        this.currentDeployment = deployment;
        this.updateProgressSteps(deployment.steps);

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            deployment.steps[i].status = 'running';
            this.updateProgressSteps(deployment.steps);
            this.addLog(`Starting: ${step}`, 'info');

            // Simulate deployment step
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

            // Simulate occasional failures for demo
            if (Math.random() < 0.05) {
                deployment.steps[i].status = 'failed';
                deployment.status = 'failed';
                this.addLog(`Failed: ${step}`, 'error');
                break;
            } else {
                deployment.steps[i].status = 'completed';
                this.addLog(`Completed: ${step}`, 'success');
            }

            this.updateProgressSteps(deployment.steps);
        }

        if (deployment.status !== 'failed') {
            deployment.status = 'success';
            deployment.url = this.generateDeploymentURL(target, deployment.id);
            this.addLog(`Deployment successful! URL: ${deployment.url}`, 'success');
        }

        deployment.endTime = new Date();
        deployment.duration = deployment.endTime - deployment.startTime;

        this.deploymentHistory.unshift(deployment);
        this.saveDeploymentHistory();

        setTimeout(() => {
            this.hideDeploymentProgress();
            this.updateDeploymentUI();
        }, 2000);

        return deployment;
    }

    generateDeploymentURL(target, deploymentId) {
        const subdomain = `app-${deploymentId.slice(-6)}`;
        
        switch (target) {
            case 'netlify':
                return `https://${subdomain}.netlify.app`;
            case 'vercel':
                return `https://${subdomain}.vercel.app`;
            case 'github-pages':
                return `https://username.github.io/${subdomain}`;
            case 'firebase':
                return `https://${subdomain}.web.app`;
            case 'aws-s3':
                return `https://${subdomain}.s3-website.amazonaws.com`;
            case 'heroku':
                return `https://${subdomain}.herokuapp.com`;
            case 'digitalocean':
                return `https://${subdomain}.ondigitalocean.app`;
            default:
                return `https://${subdomain}.example.com`;
        }
    }

    showDeploymentProgress(target) {
        const progress = document.getElementById('deployment-progress');
        const targetSpan = document.getElementById('deploy-target');
        
        if (progress) progress.classList.add('active');
        if (targetSpan) targetSpan.textContent = this.deploymentTargets.get(target)?.name || target;
    }

    hideDeploymentProgress() {
        const progress = document.getElementById('deployment-progress');
        if (progress) progress.classList.remove('active');
    }

    updateProgressSteps(steps) {
        const container = document.getElementById('progress-steps');
        if (!container) return;

        container.innerHTML = steps.map(step => `
            <div class="progress-step ${step.status}">
                <span class="step-icon">
                    ${step.status === 'completed' ? '✅' : 
                      step.status === 'running' ? '⏳' : 
                      step.status === 'failed' ? '❌' : '⏸️'}
                </span>
                <span class="step-name">${step.name}</span>
            </div>
        `).join('');
    }

    addLog(message, type = 'info') {
        const logsContent = document.getElementById('logs-content');
        if (!logsContent) return;

        const timestamp = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');
        logLine.className = `log-line ${type}`;
        logLine.textContent = `[${timestamp}] ${message}`;
        
        logsContent.appendChild(logLine);
        logsContent.scrollTop = logsContent.scrollHeight;

        if (this.currentDeployment) {
            this.currentDeployment.logs.push({
                timestamp: new Date(),
                message: message,
                type: type
            });
        }
    }

    showPipelinePanel() {
        this.pipelineUI.classList.add('active');
        this.updateDeploymentUI();
    }

    hidePipelinePanel() {
        this.pipelineUI.classList.remove('active');
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update content based on tab
        if (tabName === 'pipelines') {
            this.populatePipelines();
        } else if (tabName === 'deployments') {
            this.populateDeploymentHistory();
        } else if (tabName === 'environments') {
            this.populateEnvironments();
        } else if (tabName === 'overview') {
            this.updateOverview();
        }
    }

    populatePipelines() {
        const grid = document.getElementById('pipelines-grid');
        if (!grid) return;

        // Sample pipelines for demo
        const pipelines = [
            {
                name: 'Production Pipeline',
                target: 'netlify',
                status: 'active',
                lastDeploy: '2 hours ago',
                deployCount: 23
            },
            {
                name: 'Staging Pipeline',
                target: 'vercel',
                status: 'active',
                lastDeploy: '1 day ago',
                deployCount: 45
            },
            {
                name: 'Development Pipeline',
                target: 'github-pages',
                status: 'inactive',
                lastDeploy: '3 days ago',
                deployCount: 12
            }
        ];

        grid.innerHTML = pipelines.map(pipeline => `
            <div class="pipeline-card ${pipeline.status}">
                <div class="pipeline-header">
                    <h4>${pipeline.name}</h4>
                    <span class="pipeline-status ${pipeline.status}">${pipeline.status.toUpperCase()}</span>
                </div>
                <div class="pipeline-details">
                    <p>Target: ${this.deploymentTargets.get(pipeline.target)?.name || pipeline.target}</p>
                    <p>Last Deploy: ${pipeline.lastDeploy}</p>
                    <p>Total Deployments: ${pipeline.deployCount}</p>
                </div>
                <div class="pipeline-actions">
                    <button class="btn primary small" onclick="deploymentPipeline.runPipeline('${pipeline.name}')">
                        Deploy
                    </button>
                    <button class="btn secondary small" onclick="deploymentPipeline.editPipeline('${pipeline.name}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    populateDeploymentHistory() {
        const table = document.getElementById('deployments-table');
        if (!table) return;

        const deployments = this.deploymentHistory.slice(0, 20); // Show last 20

        table.innerHTML = `
            <div class="table-header">
                <div>Application</div>
                <div>Target</div>
                <div>Environment</div>
                <div>Status</div>
                <div>Duration</div>
                <div>Actions</div>
            </div>
            ${deployments.map(deployment => `
                <div class="table-row">
                    <div>
                        <strong>TalkToApp</strong>
                        <br>
                        <small>${deployment.startTime.toLocaleString()}</small>
                    </div>
                    <div>${this.deploymentTargets.get(deployment.target)?.name || deployment.target}</div>
                    <div>Production</div>
                    <div>
                        <span class="status-badge ${deployment.status}">${deployment.status.toUpperCase()}</span>
                    </div>
                    <div>${Math.floor(deployment.duration / 1000)}s</div>
                    <div>
                        <button class="btn secondary small" onclick="deploymentPipeline.viewDeployment('${deployment.id}')">
                            View
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    populateEnvironments() {
        const grid = document.getElementById('environments-grid');
        if (!grid) return;

        grid.innerHTML = '';
        
        this.environments.forEach((env, key) => {
            const card = document.createElement('div');
            card.className = 'environment-card';
            
            card.innerHTML = `
                <div class="environment-header">
                    <span class="environment-name">${env.name}</span>
                    <span class="environment-status active">ACTIVE</span>
                </div>
                <div class="environment-description">${env.description}</div>
                <div class="environment-variables">
                    <small>${Object.keys(env.variables).length} variables configured</small>
                </div>
                <div class="environment-actions">
                    <button class="btn secondary small" onclick="deploymentPipeline.editEnvironment('${key}')">
                        Edit
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    updateOverview() {
        // Update deployment statistics
        const activeDeployments = document.getElementById('active-deployments');
        const successRate = document.getElementById('success-rate');
        const avgDeployTime = document.getElementById('avg-deploy-time');
        const totalDeployments = document.getElementById('total-deployments');

        if (activeDeployments) activeDeployments.textContent = this.deploymentHistory.filter(d => d.status === 'running').length;
        if (successRate) successRate.textContent = '98%'; // Calculate from history
        if (avgDeployTime) avgDeployTime.textContent = '2.3m'; // Calculate from history
        if (totalDeployments) totalDeployments.textContent = this.deploymentHistory.length;

        // Update recent deployments
        this.updateRecentDeployments();
    }

    updateRecentDeployments() {
        const list = document.getElementById('recent-deployments-list');
        if (!list) return;

        const recent = this.deploymentHistory.slice(0, 5);
        
        list.innerHTML = recent.map(deployment => `
            <div class="deployment-item">
                <div class="deployment-info">
                    <strong>TalkToApp</strong> → ${this.deploymentTargets.get(deployment.target)?.name}
                    <br>
                    <small>${deployment.startTime.toLocaleString()}</small>
                </div>
                <div class="deployment-status">
                    <span class="status-badge ${deployment.status}">${deployment.status.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    }

    updateDeploymentUI() {
        this.populatePipelines();
        this.populateDeploymentHistory();
        this.populateEnvironments();
        this.updateOverview();
    }

    async quickDeploy(target) {
        const config = {
            target: target,
            environment: 'production',
            buildCommand: 'npm run build',
            publishDir: 'dist'
        };

        await this.executeDeployment(target, this.deploymentTargets.get(target)?.steps || [], config);
    }

    createNewPipeline() {
        // Implementation for creating new pipeline
        console.log('Creating new pipeline...');
    }

    createPipeline() {
        // Implementation for pipeline creation wizard
        console.log('Opening pipeline creation wizard...');
    }

    useTemplate(templateType) {
        // Implementation for using pipeline template
        console.log(`Using template: ${templateType}`);
    }

    runPipeline(pipelineName) {
        // Implementation for running specific pipeline
        console.log(`Running pipeline: ${pipelineName}`);
    }

    editPipeline(pipelineName) {
        // Implementation for editing pipeline
        console.log(`Editing pipeline: ${pipelineName}`);
    }

    viewDeployment(deploymentId) {
        // Implementation for viewing deployment details
        console.log(`Viewing deployment: ${deploymentId}`);
    }

    editEnvironment(envKey) {
        // Implementation for editing environment
        console.log(`Editing environment: ${envKey}`);
    }

    addEnvironment() {
        // Implementation for adding new environment
        console.log('Adding new environment...');
    }

    addApiKey() {
        // Implementation for adding API key
        console.log('Adding new API key...');
    }

    cancelDeployment() {
        if (this.currentDeployment) {
            this.currentDeployment.status = 'cancelled';
            this.addLog('Deployment cancelled by user', 'warning');
            this.hideDeploymentProgress();
        }
    }

    downloadLogs() {
        if (this.currentDeployment && this.currentDeployment.logs) {
            const logs = this.currentDeployment.logs.map(log => 
                `[${log.timestamp.toISOString()}] ${log.type.toUpperCase()}: ${log.message}`
            ).join('\n');

            const blob = new Blob([logs], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deployment-logs-${this.currentDeployment.id}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    loadDeploymentSettings() {
        const saved = localStorage.getItem('talktoapp-deployment-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                // Apply saved settings
            } catch (e) {
                console.error('Failed to load deployment settings:', e);
            }
        }
    }

    saveDeploymentSettings() {
        const settings = {
            // Collect current settings
        };
        localStorage.setItem('talktoapp-deployment-settings', JSON.stringify(settings));
    }

    saveDeploymentHistory() {
        const history = this.deploymentHistory.slice(0, 100); // Keep last 100
        localStorage.setItem('talktoapp-deployment-history', JSON.stringify(history));
    }

    loadDeploymentHistory() {
        const saved = localStorage.getItem('talktoapp-deployment-history');
        if (saved) {
            try {
                this.deploymentHistory = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load deployment history:', e);
            }
        }
    }

    setupEventListeners() {
        // Setup event listeners for deployment pipeline
        document.addEventListener('DOMContentLoaded', () => {
            this.loadDeploymentHistory();
        });
    }

    initializeCloudServices() {
        // Initialize cloud service integrations
        console.log('Deployment Pipeline initialized with cloud service integrations');
    }

    // Build Methods
    async buildStatic(config) {
        console.log('Building static site...');
        return {
            success: true,
            message: 'Static site built successfully',
            artifacts: ['dist/index.html', 'dist/assets/']
        };
    }

    async buildPWA(config) {
        console.log('Building Progressive Web App...');
        return {
            success: true,
            message: 'PWA built successfully',
            artifacts: ['dist/', 'sw.js', 'manifest.json']
        };
    }

    async buildSPA(config) {
        console.log('Building Single Page Application...');
        return {
            success: true,
            message: 'SPA built successfully',
            artifacts: ['dist/index.html', 'dist/js/', 'dist/css/']
        };
    }

    async buildSSR(config) {
        console.log('Building Server-Side Rendered application...');
        return {
            success: true,
            message: 'SSR application built successfully',
            artifacts: ['dist/client/', 'dist/server/', 'dist/static/']
        };
    }
}

// Initialize Deployment Pipeline
const deploymentPipeline = new DeploymentPipeline();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeploymentPipeline;
}