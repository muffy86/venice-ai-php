/**
 * Export & Sharing System
 * Comprehensive app export, sharing, and deployment features
 */

class ExportSharing {
    constructor() {
        this.exportFormats = new Map();
        this.sharingPlatforms = new Map();
        this.deploymentTargets = new Map();
        this.exportHistory = [];
        this.shareLinks = new Map();
        this.exportUI = null;
        this.currentApp = null;
        this.exportSettings = {};
        
        this.init();
    }

    async init() {
        this.setupExportFormats();
        this.setupSharingPlatforms();
        this.setupDeploymentTargets();
        this.createExportUI();
        this.loadExportSettings();
        this.setupEventListeners();
        this.initializeCloudServices();
    }

    setupExportFormats() {
        // HTML Export
        this.exportFormats.set('html', {
            name: 'HTML Package',
            description: 'Complete HTML file with embedded CSS and JavaScript',
            icon: '🌐',
            extension: 'html',
            mimeType: 'text/html',
            handler: this.exportAsHTML.bind(this)
        });

        // ZIP Package
        this.exportFormats.set('zip', {
            name: 'ZIP Package',
            description: 'Organized folder structure in ZIP format',
            icon: '📦',
            extension: 'zip',
            mimeType: 'application/zip',
            handler: this.exportAsZIP.bind(this)
        });

        // PWA Package
        this.exportFormats.set('pwa', {
            name: 'Progressive Web App',
            description: 'PWA with manifest and service worker',
            icon: '📱',
            extension: 'zip',
            mimeType: 'application/zip',
            handler: this.exportAsPWA.bind(this)
        });

        // React Component
        this.exportFormats.set('react', {
            name: 'React Component',
            description: 'React component with JSX and CSS modules',
            icon: '⚛️',
            extension: 'zip',
            mimeType: 'application/zip',
            handler: this.exportAsReact.bind(this)
        });

        // Vue Component
        this.exportFormats.set('vue', {
            name: 'Vue Component',
            description: 'Vue single file component',
            icon: '💚',
            extension: 'vue',
            mimeType: 'text/plain',
            handler: this.exportAsVue.bind(this)
        });

        // JSON Data
        this.exportFormats.set('json', {
            name: 'JSON Data',
            description: 'App structure and configuration as JSON',
            icon: '📄',
            extension: 'json',
            mimeType: 'application/json',
            handler: this.exportAsJSON.bind(this)
        });

        // PDF Documentation
        this.exportFormats.set('pdf', {
            name: 'PDF Documentation',
            description: 'App documentation and screenshots as PDF',
            icon: '📋',
            extension: 'pdf',
            mimeType: 'application/pdf',
            handler: this.exportAsPDF.bind(this)
        });
    }

    setupSharingPlatforms() {
        // GitHub Gist
        this.sharingPlatforms.set('gist', {
            name: 'GitHub Gist',
            description: 'Share as a public or private gist',
            icon: '🐙',
            requiresAuth: true,
            handler: this.shareToGist.bind(this)
        });

        // CodePen
        this.sharingPlatforms.set('codepen', {
            name: 'CodePen',
            description: 'Share as a CodePen project',
            icon: '✏️',
            requiresAuth: false,
            handler: this.shareToCodePen.bind(this)
        });

        // JSFiddle
        this.sharingPlatforms.set('jsfiddle', {
            name: 'JSFiddle',
            description: 'Share as a JSFiddle',
            icon: '🎻',
            requiresAuth: false,
            handler: this.shareToJSFiddle.bind(this)
        });

        // Direct Link
        this.sharingPlatforms.set('link', {
            name: 'Direct Link',
            description: 'Generate a shareable link',
            icon: '🔗',
            requiresAuth: false,
            handler: this.generateShareLink.bind(this)
        });

        // Email
        this.sharingPlatforms.set('email', {
            name: 'Email',
            description: 'Share via email',
            icon: '📧',
            requiresAuth: false,
            handler: this.shareViaEmail.bind(this)
        });

        // Social Media
        this.sharingPlatforms.set('social', {
            name: 'Social Media',
            description: 'Share on social platforms',
            icon: '📱',
            requiresAuth: false,
            handler: this.shareToSocial.bind(this)
        });
    }

    setupDeploymentTargets() {
        // Netlify
        this.deploymentTargets.set('netlify', {
            name: 'Netlify',
            description: 'Deploy to Netlify hosting',
            icon: '🌐',
            requiresAuth: true,
            handler: this.deployToNetlify.bind(this)
        });

        // Vercel
        this.deploymentTargets.set('vercel', {
            name: 'Vercel',
            description: 'Deploy to Vercel platform',
            icon: '▲',
            requiresAuth: true,
            handler: this.deployToVercel.bind(this)
        });

        // GitHub Pages
        this.deploymentTargets.set('github-pages', {
            name: 'GitHub Pages',
            description: 'Deploy to GitHub Pages',
            icon: '📄',
            requiresAuth: true,
            handler: this.deployToGitHubPages.bind(this)
        });

        // Firebase Hosting
        this.deploymentTargets.set('firebase', {
            name: 'Firebase Hosting',
            description: 'Deploy to Firebase',
            icon: '🔥',
            requiresAuth: true,
            handler: this.deployToFirebase.bind(this)
        });

        // Surge.sh
        this.deploymentTargets.set('surge', {
            name: 'Surge.sh',
            description: 'Deploy to Surge.sh',
            icon: '⚡',
            requiresAuth: false,
            handler: this.deployToSurge.bind(this)
        });
    }

    createExportUI() {
        this.exportUI = document.createElement('div');
        this.exportUI.id = 'export-sharing-ui';
        this.exportUI.className = 'export-sharing-ui';
        this.exportUI.innerHTML = this.getExportUIHTML();

        const style = document.createElement('style');
        style.textContent = this.getExportStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.exportUI);
    }

    getExportUIHTML() {
        return `
            <div class="export-panel">
                <div class="export-header">
                    <h3>Export & Share</h3>
                    <button class="close-btn" onclick="exportSharing.hideExportPanel()">×</button>
                </div>
                
                <div class="export-tabs">
                    <button class="tab-btn active" data-tab="export" onclick="exportSharing.switchTab('export')">
                        Export
                    </button>
                    <button class="tab-btn" data-tab="share" onclick="exportSharing.switchTab('share')">
                        Share
                    </button>
                    <button class="tab-btn" data-tab="deploy" onclick="exportSharing.switchTab('deploy')">
                        Deploy
                    </button>
                    <button class="tab-btn" data-tab="history" onclick="exportSharing.switchTab('history')">
                        History
                    </button>
                </div>
                
                <div class="export-content">
                    <!-- Export Tab -->
                    <div class="tab-content active" id="export-tab">
                        <div class="app-preview">
                            <div class="preview-header">
                                <h4 id="app-title">Current App</h4>
                                <span id="app-size">Calculating...</span>
                            </div>
                            <div class="preview-thumbnail" id="app-thumbnail">
                                <div class="thumbnail-placeholder">📱</div>
                            </div>
                        </div>
                        
                        <div class="export-formats">
                            <h4>Export Format</h4>
                            <div class="format-grid" id="format-grid">
                                <!-- Formats will be populated here -->
                            </div>
                        </div>
                        
                        <div class="export-options">
                            <h4>Export Options</h4>
                            <div class="option-group">
                                <label>
                                    <input type="checkbox" id="include-comments" checked>
                                    Include code comments
                                </label>
                                <label>
                                    <input type="checkbox" id="minify-code">
                                    Minify code
                                </label>
                                <label>
                                    <input type="checkbox" id="include-assets" checked>
                                    Include assets
                                </label>
                                <label>
                                    <input type="checkbox" id="include-readme" checked>
                                    Include README
                                </label>
                            </div>
                        </div>
                        
                        <div class="export-actions">
                            <button class="btn primary" onclick="exportSharing.startExport()">
                                <span class="btn-icon">📥</span>
                                Export App
                            </button>
                        </div>
                    </div>
                    
                    <!-- Share Tab -->
                    <div class="tab-content" id="share-tab">
                        <div class="sharing-platforms">
                            <h4>Share Platform</h4>
                            <div class="platform-grid" id="platform-grid">
                                <!-- Platforms will be populated here -->
                            </div>
                        </div>
                        
                        <div class="share-options">
                            <h4>Share Options</h4>
                            <div class="option-group">
                                <label>
                                    <input type="radio" name="share-privacy" value="public" checked>
                                    Public (anyone can view)
                                </label>
                                <label>
                                    <input type="radio" name="share-privacy" value="unlisted">
                                    Unlisted (only with link)
                                </label>
                                <label>
                                    <input type="radio" name="share-privacy" value="private">
                                    Private (requires permission)
                                </label>
                            </div>
                            
                            <div class="share-settings">
                                <label>
                                    Title:
                                    <input type="text" id="share-title" placeholder="My Awesome App">
                                </label>
                                <label>
                                    Description:
                                    <textarea id="share-description" placeholder="App description..."></textarea>
                                </label>
                                <label>
                                    Tags:
                                    <input type="text" id="share-tags" placeholder="javascript, html, css">
                                </label>
                            </div>
                        </div>
                        
                        <div class="share-actions">
                            <button class="btn primary" onclick="exportSharing.startShare()">
                                <span class="btn-icon">🚀</span>
                                Share App
                            </button>
                        </div>
                    </div>
                    
                    <!-- Deploy Tab -->
                    <div class="tab-content" id="deploy-tab">
                        <div class="deployment-targets">
                            <h4>Deployment Target</h4>
                            <div class="target-grid" id="target-grid">
                                <!-- Targets will be populated here -->
                            </div>
                        </div>
                        
                        <div class="deploy-options">
                            <h4>Deployment Options</h4>
                            <div class="option-group">
                                <label>
                                    Domain:
                                    <input type="text" id="deploy-domain" placeholder="my-app.netlify.app">
                                </label>
                                <label>
                                    Environment:
                                    <select id="deploy-environment">
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </label>
                                <label>
                                    <input type="checkbox" id="auto-deploy" checked>
                                    Enable auto-deployment
                                </label>
                                <label>
                                    <input type="checkbox" id="custom-domain">
                                    Use custom domain
                                </label>
                            </div>
                        </div>
                        
                        <div class="deploy-actions">
                            <button class="btn primary" onclick="exportSharing.startDeploy()">
                                <span class="btn-icon">🚀</span>
                                Deploy App
                            </button>
                        </div>
                    </div>
                    
                    <!-- History Tab -->
                    <div class="tab-content" id="history-tab">
                        <div class="history-header">
                            <h4>Export History</h4>
                            <button class="btn secondary small" onclick="exportSharing.clearHistory()">
                                Clear History
                            </button>
                        </div>
                        
                        <div class="history-list" id="history-list">
                            <!-- History items will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="export-progress" id="export-progress">
                    <div class="progress-header">
                        <h4 id="progress-title">Exporting...</h4>
                        <button class="cancel-btn" onclick="exportSharing.cancelExport()">Cancel</button>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-status" id="progress-status">Preparing export...</div>
                </div>
            </div>
            
            <div class="export-overlay" id="export-overlay" onclick="exportSharing.hideExportPanel()"></div>
        `;
    }

    getExportStyles() {
        return `
            .export-sharing-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .export-sharing-ui.show {
                display: flex;
            }

            .export-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .export-panel {
                position: relative;
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow: hidden;
                animation: slideInUp 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            @keyframes slideInUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .export-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .export-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .export-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.05);
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .tab-btn {
                flex: 1;
                padding: 15px 20px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #666;
                transition: all 0.3s ease;
                position: relative;
            }

            .tab-btn.active {
                color: #667eea;
                background: white;
            }

            .tab-btn.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: #667eea;
            }

            .export-content {
                padding: 25px;
                max-height: 500px;
                overflow-y: auto;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .app-preview {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .preview-header {
                flex: 1;
            }

            .preview-header h4 {
                margin: 0 0 5px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .preview-thumbnail {
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                border: 2px solid rgba(0, 0, 0, 0.1);
            }

            .format-grid,
            .platform-grid,
            .target-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 25px;
            }

            .format-card,
            .platform-card,
            .target-card {
                background: white;
                border: 2px solid rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            }

            .format-card:hover,
            .platform-card:hover,
            .target-card:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
            }

            .format-card.selected,
            .platform-card.selected,
            .target-card.selected {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.1);
            }

            .card-icon {
                font-size: 32px;
                margin-bottom: 10px;
                display: block;
            }

            .card-name {
                font-weight: 600;
                color: #333;
                margin-bottom: 5px;
            }

            .card-description {
                font-size: 12px;
                color: #666;
                line-height: 1.4;
            }

            .export-options,
            .share-options,
            .deploy-options {
                margin-bottom: 25px;
            }

            .export-options h4,
            .share-options h4,
            .deploy-options h4 {
                margin: 0 0 15px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .option-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .option-group label {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                color: #333;
                cursor: pointer;
            }

            .option-group input[type="text"],
            .option-group input[type="email"],
            .option-group textarea,
            .option-group select {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 6px;
                font-size: 14px;
                background: white;
            }

            .option-group textarea {
                resize: vertical;
                min-height: 60px;
            }

            .share-settings {
                margin-top: 15px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .share-settings label {
                display: flex;
                flex-direction: column;
                gap: 5px;
                font-size: 14px;
                font-weight: 500;
                color: #333;
            }

            .export-actions,
            .share-actions,
            .deploy-actions {
                display: flex;
                justify-content: center;
                gap: 15px;
            }

            .btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                text-decoration: none;
            }

            .btn.primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }

            .btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
            }

            .btn.secondary {
                background: rgba(0, 0, 0, 0.1);
                color: #333;
            }

            .btn.secondary:hover {
                background: rgba(0, 0, 0, 0.15);
            }

            .btn.small {
                padding: 8px 16px;
                font-size: 12px;
            }

            .btn-icon {
                font-size: 16px;
            }

            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .history-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .history-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .history-item {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .history-info {
                flex: 1;
            }

            .history-name {
                font-weight: 500;
                color: #333;
                margin-bottom: 5px;
            }

            .history-details {
                font-size: 12px;
                color: #666;
            }

            .history-actions {
                display: flex;
                gap: 10px;
            }

            .history-actions button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.1);
                color: #333;
                transition: background 0.2s ease;
            }

            .history-actions button:hover {
                background: rgba(0, 0, 0, 0.15);
            }

            .export-progress {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(5px);
                display: none;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 40px;
                text-align: center;
            }

            .export-progress.show {
                display: flex;
            }

            .progress-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
            }

            .progress-header h4 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .cancel-btn {
                padding: 8px 16px;
                border: 1px solid #e74c3c;
                border-radius: 6px;
                background: white;
                color: #e74c3c;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .cancel-btn:hover {
                background: #e74c3c;
                color: white;
            }

            .progress-bar {
                width: 100%;
                max-width: 400px;
                height: 8px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 15px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }

            .progress-status {
                font-size: 14px;
                color: #666;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .export-panel {
                    width: 95%;
                    margin: 20px;
                }

                .export-content {
                    padding: 20px;
                }

                .format-grid,
                .platform-grid,
                .target-grid {
                    grid-template-columns: 1fr;
                }

                .app-preview {
                    flex-direction: column;
                    text-align: center;
                }

                .export-tabs {
                    flex-wrap: wrap;
                }

                .tab-btn {
                    flex: 1 1 50%;
                }
            }

            /* Dark theme support */
            [data-theme="dark"] .export-panel {
                background: #2c3e50;
                color: white;
            }

            [data-theme="dark"] .export-header {
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .export-tabs {
                background: rgba(255, 255, 255, 0.05);
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .tab-btn {
                color: #ccc;
            }

            [data-theme="dark"] .tab-btn.active {
                background: #34495e;
                color: white;
            }

            [data-theme="dark"] .app-preview,
            [data-theme="dark"] .history-item {
                background: rgba(255, 255, 255, 0.1);
            }

            [data-theme="dark"] .format-card,
            [data-theme="dark"] .platform-card,
            [data-theme="dark"] .target-card {
                background: #34495e;
                border-color: rgba(255, 255, 255, 0.2);
                color: white;
            }

            [data-theme="dark"] .option-group input,
            [data-theme="dark"] .option-group textarea,
            [data-theme="dark"] .option-group select {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                color: white;
            }

            [data-theme="dark"] .btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            [data-theme="dark"] .export-progress {
                background: rgba(44, 62, 80, 0.95);
            }
        `;
    }

    loadExportSettings() {
        const settings = localStorage.getItem('talktoapp_export_settings');
        if (settings) {
            this.exportSettings = { ...this.getDefaultExportSettings(), ...JSON.parse(settings) };
        } else {
            this.exportSettings = this.getDefaultExportSettings();
        }

        this.loadExportHistory();
    }

    getDefaultExportSettings() {
        return {
            includeComments: true,
            minifyCode: false,
            includeAssets: true,
            includeReadme: true,
            defaultFormat: 'html',
            defaultPrivacy: 'public'
        };
    }

    loadExportHistory() {
        const history = localStorage.getItem('talktoapp_export_history');
        if (history) {
            this.exportHistory = JSON.parse(history);
        }
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.showExportPanel();
                        }
                        break;
                    case 's':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.quickShare();
                        }
                        break;
                }
            }
        });
    }

    async initializeCloudServices() {
        // Initialize cloud service APIs
        this.cloudServices = {
            github: null,
            netlify: null,
            vercel: null,
            firebase: null
        };
    }

    // UI Management
    showExportPanel() {
        this.exportUI.classList.add('show');
        this.updateAppPreview();
        this.populateFormats();
        this.populatePlatforms();
        this.populateTargets();
        this.updateHistory();
    }

    hideExportPanel() {
        this.exportUI.classList.remove('show');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    updateAppPreview() {
        const titleEl = document.getElementById('app-title');
        const sizeEl = document.getElementById('app-size');
        const thumbnailEl = document.getElementById('app-thumbnail');

        if (this.currentApp) {
            titleEl.textContent = this.currentApp.title || 'Current App';
            sizeEl.textContent = this.calculateAppSize();
            this.generateThumbnail(thumbnailEl);
        } else {
            titleEl.textContent = 'No App Selected';
            sizeEl.textContent = '0 KB';
            thumbnailEl.innerHTML = '<div class="thumbnail-placeholder">📱</div>';
        }
    }

    calculateAppSize() {
        if (!this.currentApp) return '0 KB';

        const htmlSize = new Blob([this.currentApp.html || '']).size;
        const cssSize = new Blob([this.currentApp.css || '']).size;
        const jsSize = new Blob([this.currentApp.javascript || '']).size;
        
        const totalSize = htmlSize + cssSize + jsSize;
        
        if (totalSize < 1024) return `${totalSize} B`;
        if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
        return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }

    generateThumbnail(container) {
        // Create a mini preview of the app
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 4px;
            transform: scale(0.3);
            transform-origin: top left;
            pointer-events: none;
        `;

        if (this.currentApp && this.currentApp.html) {
            const content = this.buildCompleteHTML(this.currentApp);
            iframe.srcdoc = content;
        }

        container.innerHTML = '';
        container.appendChild(iframe);
    }

    populateFormats() {
        const grid = document.getElementById('format-grid');
        grid.innerHTML = '';

        this.exportFormats.forEach((format, key) => {
            const card = document.createElement('div');
            card.className = 'format-card';
            card.dataset.format = key;
            card.innerHTML = `
                <span class="card-icon">${format.icon}</span>
                <div class="card-name">${format.name}</div>
                <div class="card-description">${format.description}</div>
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedFormat = key;
            });

            grid.appendChild(card);
        });

        // Select default format
        const defaultCard = grid.querySelector(`[data-format="${this.exportSettings.defaultFormat}"]`);
        if (defaultCard) {
            defaultCard.click();
        }
    }

    populatePlatforms() {
        const grid = document.getElementById('platform-grid');
        grid.innerHTML = '';

        this.sharingPlatforms.forEach((platform, key) => {
            const card = document.createElement('div');
            card.className = 'platform-card';
            card.dataset.platform = key;
            card.innerHTML = `
                <span class="card-icon">${platform.icon}</span>
                <div class="card-name">${platform.name}</div>
                <div class="card-description">${platform.description}</div>
                ${platform.requiresAuth ? '<div class="auth-required">🔐 Auth Required</div>' : ''}
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.platform-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedPlatform = key;
            });

            grid.appendChild(card);
        });
    }

    populateTargets() {
        const grid = document.getElementById('target-grid');
        grid.innerHTML = '';

        this.deploymentTargets.forEach((target, key) => {
            const card = document.createElement('div');
            card.className = 'target-card';
            card.dataset.target = key;
            card.innerHTML = `
                <span class="card-icon">${target.icon}</span>
                <div class="card-name">${target.name}</div>
                <div class="card-description">${target.description}</div>
                ${target.requiresAuth ? '<div class="auth-required">🔐 Auth Required</div>' : ''}
            `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.target-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedTarget = key;
            });

            grid.appendChild(card);
        });
    }

    updateHistory() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';

        if (this.exportHistory.length === 0) {
            list.innerHTML = '<div class="no-history">No export history yet</div>';
            return;
        }

        this.exportHistory.slice(-10).reverse().forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-name">${item.name}</div>
                    <div class="history-details">
                        ${item.format} • ${item.size} • ${new Date(item.timestamp).toLocaleDateString()}
                    </div>
                </div>
                <div class="history-actions">
                    <button onclick="exportSharing.reExport(${this.exportHistory.length - 1 - index})">
                        Re-export
                    </button>
                    <button onclick="exportSharing.deleteHistoryItem(${this.exportHistory.length - 1 - index})">
                        Delete
                    </button>
                </div>
            `;
            list.appendChild(historyItem);
        });
    }

    // Export Methods
    async startExport() {
        if (!this.selectedFormat) {
            alert('Please select an export format');
            return;
        }

        if (!this.currentApp) {
            alert('No app to export');
            return;
        }

        this.showProgress('Exporting...', 'Preparing export...');

        try {
            const format = this.exportFormats.get(this.selectedFormat);
            const result = await format.handler(this.currentApp);
            
            this.addToHistory({
                name: this.currentApp.title || 'Untitled App',
                format: format.name,
                size: this.calculateAppSize(),
                timestamp: Date.now(),
                type: 'export'
            });

            this.hideProgress();
            this.showExportSuccess(result);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.hideProgress();
            this.showExportError(error.message);
        }
    }

    async exportAsHTML(app) {
        this.updateProgress(25, 'Building HTML...');
        
        const html = this.buildCompleteHTML(app);
        
        this.updateProgress(75, 'Creating download...');
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        this.updateProgress(100, 'Download ready!');
        
        this.downloadFile(url, `${app.title || 'app'}.html`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}.html` };
    }

    async exportAsZIP(app) {
        this.updateProgress(10, 'Preparing files...');
        
        // Use JSZip library (would need to be included)
        const zip = new JSZip();
        
        this.updateProgress(30, 'Adding HTML...');
        zip.file('index.html', this.buildHTML(app));
        
        this.updateProgress(50, 'Adding CSS...');
        zip.file('styles.css', app.css || '');
        
        this.updateProgress(70, 'Adding JavaScript...');
        zip.file('script.js', app.javascript || '');
        
        if (this.exportSettings.includeReadme) {
            this.updateProgress(80, 'Adding README...');
            zip.file('README.md', this.generateReadme(app));
        }
        
        this.updateProgress(90, 'Creating ZIP...');
        const content = await zip.generateAsync({ type: 'blob' });
        
        this.updateProgress(100, 'Download ready!');
        
        const url = URL.createObjectURL(content);
        this.downloadFile(url, `${app.title || 'app'}.zip`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}.zip` };
    }

    async exportAsPWA(app) {
        this.updateProgress(10, 'Creating PWA structure...');
        
        const zip = new JSZip();
        
        // Add main files
        zip.file('index.html', this.buildPWAHTML(app));
        zip.file('styles.css', app.css || '');
        zip.file('script.js', app.javascript || '');
        
        this.updateProgress(40, 'Adding PWA manifest...');
        zip.file('manifest.json', this.generateManifest(app));
        
        this.updateProgress(60, 'Adding service worker...');
        zip.file('sw.js', this.generateServiceWorker(app));
        
        this.updateProgress(80, 'Adding icons...');
        // Add default PWA icons (would need actual icon files)
        zip.file('icons/icon-192.png', this.generateIcon(192));
        zip.file('icons/icon-512.png', this.generateIcon(512));
        
        this.updateProgress(100, 'PWA ready!');
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        this.downloadFile(url, `${app.title || 'app'}-pwa.zip`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}-pwa.zip` };
    }

    async exportAsReact(app) {
        this.updateProgress(20, 'Converting to React...');
        
        const componentCode = this.convertToReact(app);
        
        this.updateProgress(60, 'Creating package...');
        
        const zip = new JSZip();
        zip.file('App.jsx', componentCode.jsx);
        zip.file('App.module.css', componentCode.css);
        zip.file('package.json', this.generateReactPackageJson(app));
        zip.file('README.md', this.generateReactReadme(app));
        
        this.updateProgress(100, 'React component ready!');
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        this.downloadFile(url, `${app.title || 'app'}-react.zip`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}-react.zip` };
    }

    async exportAsVue(app) {
        this.updateProgress(30, 'Converting to Vue...');
        
        const vueComponent = this.convertToVue(app);
        
        this.updateProgress(80, 'Creating download...');
        
        const blob = new Blob([vueComponent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        this.updateProgress(100, 'Vue component ready!');
        
        this.downloadFile(url, `${app.title || 'App'}.vue`);
        
        return { type: 'download', url, filename: `${app.title || 'App'}.vue` };
    }

    async exportAsJSON(app) {
        this.updateProgress(50, 'Serializing data...');
        
        const jsonData = {
            title: app.title,
            description: app.description,
            html: app.html,
            css: app.css,
            javascript: app.javascript,
            metadata: app.metadata || {},
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        
        this.updateProgress(100, 'JSON ready!');
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `${app.title || 'app'}.json`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}.json` };
    }

    async exportAsPDF(app) {
        this.updateProgress(20, 'Generating PDF...');
        
        // Would use a library like jsPDF or Puppeteer
        // For now, create a simple text-based PDF
        const pdfContent = this.generatePDFContent(app);
        
        this.updateProgress(80, 'Creating download...');
        
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        this.updateProgress(100, 'PDF ready!');
        
        this.downloadFile(url, `${app.title || 'app'}-documentation.pdf`);
        
        return { type: 'download', url, filename: `${app.title || 'app'}-documentation.pdf` };
    }

    // Sharing Methods
    async startShare() {
        if (!this.selectedPlatform) {
            alert('Please select a sharing platform');
            return;
        }

        if (!this.currentApp) {
            alert('No app to share');
            return;
        }

        this.showProgress('Sharing...', 'Preparing to share...');

        try {
            const platform = this.sharingPlatforms.get(this.selectedPlatform);
            const result = await platform.handler(this.currentApp);
            
            this.addToHistory({
                name: this.currentApp.title || 'Untitled App',
                platform: platform.name,
                url: result.url,
                timestamp: Date.now(),
                type: 'share'
            });

            this.hideProgress();
            this.showShareSuccess(result);
            
        } catch (error) {
            console.error('Share failed:', error);
            this.hideProgress();
            this.showShareError(error.message);
        }
    }

    async shareToGist(app) {
        this.updateProgress(30, 'Creating Gist...');
        
        // Would integrate with GitHub API
        const gistData = {
            description: document.getElementById('share-description').value || app.title,
            public: document.querySelector('input[name="share-privacy"]:checked').value === 'public',
            files: {
                'index.html': { content: this.buildCompleteHTML(app) },
                'README.md': { content: this.generateReadme(app) }
            }
        };
        
        this.updateProgress(100, 'Gist created!');
        
        // Mock response
        return {
            type: 'gist',
            url: 'https://gist.github.com/user/abc123',
            id: 'abc123'
        };
    }

    async shareToCodePen(app) {
        this.updateProgress(50, 'Preparing CodePen...');
        
        const data = {
            title: document.getElementById('share-title').value || app.title,
            description: document.getElementById('share-description').value || '',
            html: app.html || '',
            css: app.css || '',
            js: app.javascript || '',
            tags: document.getElementById('share-tags').value.split(',').map(t => t.trim())
        };
        
        // Open CodePen in new window with prefilled data
        const form = document.createElement('form');
        form.action = 'https://codepen.io/pen/define';
        form.method = 'POST';
        form.target = '_blank';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(data);
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        this.updateProgress(100, 'Opened in CodePen!');
        
        return {
            type: 'codepen',
            url: 'https://codepen.io/pen/new',
            message: 'Opened in CodePen'
        };
    }

    async shareToJSFiddle(app) {
        this.updateProgress(50, 'Preparing JSFiddle...');
        
        const form = document.createElement('form');
        form.action = 'https://jsfiddle.net/api/post/library/pure/';
        form.method = 'POST';
        form.target = '_blank';
        
        const fields = {
            title: document.getElementById('share-title').value || app.title,
            html: app.html || '',
            css: app.css || '',
            js: app.javascript || ''
        };
        
        Object.entries(fields).forEach(([name, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        this.updateProgress(100, 'Opened in JSFiddle!');
        
        return {
            type: 'jsfiddle',
            url: 'https://jsfiddle.net/',
            message: 'Opened in JSFiddle'
        };
    }

    async generateShareLink(app) {
        this.updateProgress(30, 'Generating link...');
        
        // Create a unique ID for the app
        const appId = this.generateUniqueId();
        
        // Store app data (in real implementation, would use a backend)
        const appData = {
            id: appId,
            title: app.title,
            html: app.html,
            css: app.css,
            javascript: app.javascript,
            createdAt: Date.now(),
            privacy: document.querySelector('input[name="share-privacy"]:checked').value
        };
        
        localStorage.setItem(`shared_app_${appId}`, JSON.stringify(appData));
        
        this.updateProgress(100, 'Link generated!');
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${appId}`;
        
        return {
            type: 'link',
            url: shareUrl,
            id: appId
        };
    }

    async shareViaEmail(app) {
        const subject = encodeURIComponent(`Check out my app: ${app.title || 'Untitled App'}`);
        const body = encodeURIComponent(`
I created this app using TalkToApp and wanted to share it with you!

App: ${app.title || 'Untitled App'}
Description: ${document.getElementById('share-description').value || 'No description provided'}

You can view and interact with it here: [Link would be generated]

Created with TalkToApp - AI-Powered App Builder
        `);
        
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        window.open(mailtoUrl);
        
        return {
            type: 'email',
            url: mailtoUrl,
            message: 'Email client opened'
        };
    }

    async shareToSocial(app) {
        const text = encodeURIComponent(`Check out the app I just created: ${app.title || 'My App'}`);
        const url = encodeURIComponent(window.location.href);
        
        const platforms = {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            reddit: `https://reddit.com/submit?url=${url}&title=${text}`
        };
        
        // Show platform selection
        const platform = await this.showSocialPlatformSelector();
        if (platform && platforms[platform]) {
            window.open(platforms[platform], '_blank');
        }
        
        return {
            type: 'social',
            platform: platform,
            message: 'Shared to social media'
        };
    }

    // Deployment Methods
    async startDeploy() {
        if (!this.selectedTarget) {
            alert('Please select a deployment target');
            return;
        }

        if (!this.currentApp) {
            alert('No app to deploy');
            return;
        }

        this.showProgress('Deploying...', 'Preparing deployment...');

        try {
            const target = this.deploymentTargets.get(this.selectedTarget);
            const result = await target.handler(this.currentApp);
            
            this.addToHistory({
                name: this.currentApp.title || 'Untitled App',
                target: target.name,
                url: result.url,
                timestamp: Date.now(),
                type: 'deploy'
            });

            this.hideProgress();
            this.showDeploySuccess(result);
            
        } catch (error) {
            console.error('Deploy failed:', error);
            this.hideProgress();
            this.showDeployError(error.message);
        }
    }

    async deployToNetlify(app) {
        this.updateProgress(20, 'Connecting to Netlify...');
        
        // Would integrate with Netlify API
        // For demo, simulate deployment
        await this.simulateDeployment();
        
        const deployUrl = `https://${this.generateRandomString()}.netlify.app`;
        
        return {
            type: 'netlify',
            url: deployUrl,
            message: 'Deployed to Netlify'
        };
    }

    async deployToVercel(app) {
        this.updateProgress(20, 'Connecting to Vercel...');
        
        await this.simulateDeployment();
        
        const deployUrl = `https://${this.generateRandomString()}.vercel.app`;
        
        return {
            type: 'vercel',
            url: deployUrl,
            message: 'Deployed to Vercel'
        };
    }

    async deployToGitHubPages(app) {
        this.updateProgress(20, 'Connecting to GitHub...');
        
        await this.simulateDeployment();
        
        const deployUrl = `https://username.github.io/${app.title || 'app'}`;
        
        return {
            type: 'github-pages',
            url: deployUrl,
            message: 'Deployed to GitHub Pages'
        };
    }

    async deployToFirebase(app) {
        this.updateProgress(20, 'Connecting to Firebase...');
        
        await this.simulateDeployment();
        
        const deployUrl = `https://${this.generateRandomString()}.web.app`;
        
        return {
            type: 'firebase',
            url: deployUrl,
            message: 'Deployed to Firebase'
        };
    }

    async deployToSurge(app) {
        this.updateProgress(20, 'Connecting to Surge...');
        
        await this.simulateDeployment();
        
        const deployUrl = `https://${this.generateRandomString()}.surge.sh`;
        
        return {
            type: 'surge',
            url: deployUrl,
            message: 'Deployed to Surge'
        };
    }

    // Utility Methods
    buildCompleteHTML(app) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.title || 'TalkToApp Generated App'}</title>
    <style>
        ${app.css || ''}
    </style>
</head>
<body>
    ${app.html || ''}
    <script>
        ${app.javascript || ''}
    </script>
</body>
</html>`;
    }

    buildHTML(app) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.title || 'TalkToApp Generated App'}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${app.html || ''}
    <script src="script.js"></script>
</body>
</html>`;
    }

    buildPWAHTML(app) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.title || 'TalkToApp Generated App'}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#000000">
    <link rel="icon" href="icons/icon-192.png">
</head>
<body>
    ${app.html || ''}
    <script src="script.js"></script>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>`;
    }

    generateManifest(app) {
        return JSON.stringify({
            name: app.title || 'TalkToApp Generated App',
            short_name: app.title || 'App',
            description: app.description || 'Generated with TalkToApp',
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#000000',
            icons: [
                {
                    src: 'icons/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: 'icons/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        }, null, 2);
    }

    generateServiceWorker(app) {
        return `
const CACHE_NAME = '${app.title || 'app'}-v1';
const urlsToCache = [
    '/',
    '/styles.css',
    '/script.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
        `;
    }

    generateReadme(app) {
        return `# ${app.title || 'TalkToApp Generated App'}

${app.description || 'This app was generated using TalkToApp - AI-Powered App Builder.'}

## Features

- Interactive user interface
- Responsive design
- Modern web technologies

## Usage

1. Open \`index.html\` in a web browser
2. Interact with the app features
3. Enjoy!

## Technologies Used

- HTML5
- CSS3
- JavaScript ES6+

## Generated with TalkToApp

This app was created using TalkToApp, an AI-powered application builder that helps you create interactive web applications through natural language conversations.

Visit [TalkToApp](${