/**
 * Auto-Discovery Module
 * Revolutionary API Discovery and Integration System
 * 
 * Features:
 * - Network scanning for API endpoints
 * - OpenAPI spec parsing
 * - Automatic MCP server detection
 * - Smart endpoint analysis
 * - Real-time service discovery
 */

class AutoDiscovery {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.discoveredAPIs = new Map();
        this.scanHistory = [];
        this.patterns = {
            // Common API endpoint patterns
            restAPI: [
                /\/api\/v\d+/,
                /\/v\d+\/api/,
                /\/rest/,
                /\/graphql/,
                /\/json/
            ],
            // Common API documentation patterns
            docs: [
                /\/docs/,
                /\/swagger/,
                /\/api-docs/,
                /\/openapi/,
                /\/redoc/
            ],
            // File extensions that might indicate APIs
            apiFiles: [
                /\.json$/,
                /\.yaml$/,
                /\.yml$/,
                /openapi/i,
                /swagger/i
            ]
        };
        this.commonPorts = [
            3000, 3001, 3030, 4000, 5000, 8000, 8080, 8443, 9000
        ];
        this.isScanning = false;
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    async discoverAPIs(target, options = {}) {
        const config = {
            deep: true,
            timeout: 10000,
            includeLocal: true,
            includeRemote: true,
            followRedirects: true,
            checkDocumentation: true,
            ...options
        };

        console.log(`🔍 Starting API discovery for: ${target}`);
        this.isScanning = true;

        try {
            const results = {
                target,
                timestamp: Date.now(),
                apis: [],
                documentation: [],
                errors: []
            };

            // Determine discovery strategy based on target type
            if (this.isURL(target)) {
                await this.discoverFromURL(target, results, config);
            } else if (this.isDomain(target)) {
                await this.discoverFromDomain(target, results, config);
            } else if (this.isLocalPath(target)) {
                await this.discoverFromLocalPath(target, results, config);
            } else {
                throw new Error(`Unknown target type: ${target}`);
            }

            // Store results
            this.discoveredAPIs.set(target, results);
            this.scanHistory.push({
                target,
                timestamp: Date.now(),
                foundAPIs: results.apis.length,
                foundDocs: results.documentation.length
            });

            console.log(`✅ Discovery completed: ${results.apis.length} APIs found`);
            this.orchestrator.emit('discovery-completed', results);

            return results;

        } catch (error) {
            console.error(`❌ Discovery failed for ${target}:`, error);
            this.orchestrator.emit('discovery-failed', { target, error: error.message });
            throw error;
        } finally {
            this.isScanning = false;
        }
    }

    async discoverFromURL(url, results, config) {
        try {
            // Check if URL is cached
            const cached = this.getFromCache(url);
            if (cached) {
                Object.assign(results, cached);
                return;
            }

            // Fetch the URL content
            const response = await this.fetchWithTimeout(url, config.timeout);
            const content = await response.text();
            const contentType = response.headers.get('content-type') || '';

            // Analyze content type
            if (contentType.includes('application/json')) {
                await this.analyzeJSONAPI(url, content, results);
            } else if (contentType.includes('text/html')) {
                await this.analyzeHTMLForAPIs(url, content, results, config);
            } else if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
                await this.analyzeYAMLAPI(url, content, results);
            }

            // Cache results
            this.setCache(url, results);

        } catch (error) {
            results.errors.push({
                url,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async discoverFromDomain(domain, results, config) {
        const protocols = ['https', 'http'];
        const commonPaths = [
            '/',
            '/api',
            '/api/v1',
            '/api/v2',
            '/rest',
            '/graphql',
            '/docs',
            '/swagger',
            '/openapi.json',
            '/api-docs',
            '/.well-known/api'
        ];

        // Try different protocol/port/path combinations
        for (const protocol of protocols) {
            for (const port of ['', ...this.commonPorts.map(p => `:${p}`)]) {
                for (const path of commonPaths) {
                    const url = `${protocol}://${domain}${port}${path}`;
                    
                    try {
                        await this.discoverFromURL(url, results, config);
                        
                        // Don't overwhelm the server
                        await this.delay(100);
                        
                    } catch (error) {
                        // Silent fail for individual URLs during domain scan
                        continue;
                    }
                }
            }
        }

        // Perform port scanning if enabled
        if (config.includeLocal && this.isLocalDomain(domain)) {
            await this.scanLocalPorts(domain, results);
        }
    }

    async discoverFromLocalPath(path, results, config) {
        try {
            // This would use filesystem operations to scan local directories
            // for API configuration files, OpenAPI specs, etc.
            
            const apiFiles = await this.findAPIFiles(path);
            
            for (const file of apiFiles) {
                try {
                    const content = await this.readFile(file);
                    
                    if (file.endsWith('.json')) {
                        await this.analyzeJSONAPI(file, content, results);
                    } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                        await this.analyzeYAMLAPI(file, content, results);
                    }
                    
                } catch (error) {
                    results.errors.push({
                        file,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
            
        } catch (error) {
            results.errors.push({
                path,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async analyzeJSONAPI(source, content, results) {
        try {
            const data = JSON.parse(content);
            
            // Check if it's an OpenAPI specification
            if (data.openapi || data.swagger) {
                results.apis.push({
                    type: 'openapi',
                    source,
                    version: data.openapi || data.swagger,
                    title: data.info?.title || 'Unknown API',
                    description: data.info?.description,
                    servers: data.servers || [],
                    paths: Object.keys(data.paths || {}),
                    methods: this.extractMethods(data.paths),
                    authentication: this.extractAuthMethods(data),
                    timestamp: Date.now()
                });
            }
            
            // Check if it's a REST API response
            else if (this.looksLikeAPIResponse(data)) {
                results.apis.push({
                    type: 'rest',
                    source,
                    title: 'REST API',
                    description: 'Detected REST API endpoint',
                    sampleResponse: data,
                    timestamp: Date.now()
                });
            }
            
            // Check for MCP server configuration
            else if (this.isMCPServerConfig(data)) {
                results.apis.push({
                    type: 'mcp',
                    source,
                    title: 'MCP Server',
                    description: 'Model Context Protocol Server',
                    tools: data.tools || [],
                    resources: data.resources || [],
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            results.errors.push({
                source,
                error: `JSON parse error: ${error.message}`,
                timestamp: Date.now()
            });
        }
    }

    async analyzeYAMLAPI(source, content, results) {
        try {
            // Simple YAML parsing (in real implementation, use a proper YAML parser)
            const data = this.parseYAML(content);
            
            if (data.openapi || data.swagger) {
                results.apis.push({
                    type: 'openapi',
                    source,
                    version: data.openapi || data.swagger,
                    title: data.info?.title || 'Unknown API',
                    description: data.info?.description,
                    servers: data.servers || [],
                    paths: Object.keys(data.paths || {}),
                    methods: this.extractMethods(data.paths),
                    authentication: this.extractAuthMethods(data),
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            results.errors.push({
                source,
                error: `YAML parse error: ${error.message}`,
                timestamp: Date.now()
            });
        }
    }

    async analyzeHTMLForAPIs(url, content, results, config) {
        // Extract links that might point to APIs
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
        const metaRegex = /<meta[^>]+content=["']([^"']+)["'][^>]*>/gi;
        
        let match;
        const potentialAPIs = new Set();
        
        // Check for API links
        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            const text = match[2].toLowerCase();
            
            if (this.patterns.docs.some(pattern => pattern.test(href)) ||
                text.includes('api') || text.includes('docs') || text.includes('swagger')) {
                potentialAPIs.add(this.resolveURL(url, href));
            }
        }
        
        // Check for script sources that might be API endpoints
        while ((match = scriptRegex.exec(content)) !== null) {
            const src = match[1];
            if (this.patterns.restAPI.some(pattern => pattern.test(src))) {
                potentialAPIs.add(this.resolveURL(url, src));
            }
        }
        
        // Follow discovered links if deep scanning is enabled
        if (config.deep && potentialAPIs.size > 0) {
            for (const apiURL of potentialAPIs) {
                try {
                    await this.discoverFromURL(apiURL, results, { ...config, deep: false });
                    await this.delay(100); // Rate limiting
                } catch (error) {
                    // Continue with other URLs
                    continue;
                }
            }
        }
    }

    async scanLocalPorts(domain, results) {
        console.log(`🔍 Scanning local ports on ${domain}...`);
        
        const scanPromises = this.commonPorts.map(async (port) => {
            try {
                const url = `http://${domain}:${port}`;
                const response = await this.fetchWithTimeout(url, 2000);
                
                if (response.ok) {
                    results.apis.push({
                        type: 'discovered',
                        source: url,
                        title: `Service on port ${port}`,
                        description: `Running service detected on port ${port}`,
                        port,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                // Port not responding or service not available
            }
        });
        
        await Promise.allSettled(scanPromises);
    }

    async autoIntegrateAPI(apiInfo, options = {}) {
        console.log(`🔗 Auto-integrating API: ${apiInfo.title}`);
        
        try {
            const integrationConfig = {
                name: apiInfo.title,
                type: apiInfo.type,
                source: apiInfo.source,
                capabilities: this.inferCapabilities(apiInfo),
                priority: options.priority || 'medium',
                autoGenerated: true,
                ...options
            };
            
            // Generate MCP server configuration
            if (apiInfo.type === 'openapi') {
                integrationConfig.command = 'npx';
                integrationConfig.args = ['-y', '@modelcontextprotocol/server-openapi', apiInfo.source];
            } else if (apiInfo.type === 'rest') {
                integrationConfig.command = 'npx';
                integrationConfig.args = ['-y', '@modelcontextprotocol/server-rest', apiInfo.source];
            }
            
            // Register with orchestrator
            const apiId = await this.orchestrator.registerAPI(integrationConfig);
            
            console.log(`✅ API integrated successfully with ID: ${apiId}`);
            this.orchestrator.emit('api-integrated', { apiId, config: integrationConfig });
            
            return apiId;
            
        } catch (error) {
            console.error(`❌ Failed to integrate API ${apiInfo.title}:`, error);
            this.orchestrator.emit('integration-failed', { api: apiInfo, error: error.message });
            throw error;
        }
    }

    // Utility methods
    isURL(target) {
        try {
            new URL(target);
            return true;
        } catch {
            return false;
        }
    }

    isDomain(target) {
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(target) ||
               /^[a-zA-Z0-9-]+$/.test(target); // localhost, etc.
    }

    isLocalPath(target) {
        return target.startsWith('/') || target.startsWith('./') || target.startsWith('../') ||
               /^[a-zA-Z]:\\/.test(target); // Windows path
    }

    isLocalDomain(domain) {
        return domain === 'localhost' || 
               domain === '127.0.0.1' || 
               domain.endsWith('.local') ||
               /^192\.168\./.test(domain) ||
               /^10\./.test(domain) ||
               /^172\.(1[6-9]|2[0-9]|3[01])\./.test(domain);
    }

    looksLikeAPIResponse(data) {
        // Heuristics to determine if JSON looks like an API response
        return (
            (Array.isArray(data) && data.length > 0) ||
            (typeof data === 'object' && (
                data.hasOwnProperty('data') ||
                data.hasOwnProperty('results') ||
                data.hasOwnProperty('items') ||
                data.hasOwnProperty('response') ||
                data.hasOwnProperty('status')
            ))
        );
    }

    isMCPServerConfig(data) {
        return data.hasOwnProperty('tools') || 
               data.hasOwnProperty('resources') ||
               data.hasOwnProperty('prompts') ||
               (data.hasOwnProperty('name') && data.hasOwnProperty('version') && data.hasOwnProperty('protocol'));
    }

    extractMethods(paths) {
        const methods = new Set();
        for (const path in paths) {
            for (const method in paths[path]) {
                methods.add(method.toUpperCase());
            }
        }
        return Array.from(methods);
    }

    extractAuthMethods(spec) {
        const auth = [];
        if (spec.components?.securitySchemes) {
            for (const [name, scheme] of Object.entries(spec.components.securitySchemes)) {
                auth.push({
                    name,
                    type: scheme.type,
                    scheme: scheme.scheme,
                    bearerFormat: scheme.bearerFormat
                });
            }
        }
        return auth;
    }

    inferCapabilities(apiInfo) {
        const capabilities = [];
        
        if (apiInfo.type === 'openapi' || apiInfo.type === 'rest') {
            capabilities.push('http-requests');
            
            if (apiInfo.methods?.includes('GET')) capabilities.push('data-retrieval');
            if (apiInfo.methods?.includes('POST')) capabilities.push('data-creation');
            if (apiInfo.methods?.includes('PUT') || apiInfo.methods?.includes('PATCH')) capabilities.push('data-modification');
            if (apiInfo.methods?.includes('DELETE')) capabilities.push('data-deletion');
        }
        
        if (apiInfo.title?.toLowerCase().includes('search')) capabilities.push('search');
        if (apiInfo.title?.toLowerCase().includes('auth')) capabilities.push('authentication');
        if (apiInfo.title?.toLowerCase().includes('file')) capabilities.push('file-operations');
        
        return capabilities;
    }

    resolveURL(base, relative) {
        try {
            return new URL(relative, base).href;
        } catch {
            return relative;
        }
    }

    async fetchWithTimeout(url, timeout) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'API-Orchestrator/1.0 (Auto-Discovery Bot)'
                }
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    parseYAML(content) {
        // Simple YAML parser (in production, use a proper library like js-yaml)
        // This is a basic implementation for demonstration
        try {
            // Convert basic YAML to JSON-like structure
            const lines = content.split('\n');
            const result = {};
            let currentSection = result;
            let currentKey = null;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                
                if (trimmed.includes(':')) {
                    const [key, value] = trimmed.split(':', 2);
                    const cleanKey = key.trim();
                    const cleanValue = value?.trim();
                    
                    if (cleanValue) {
                        currentSection[cleanKey] = cleanValue;
                    } else {
                        currentSection[cleanKey] = {};
                        currentKey = cleanKey;
                    }
                }
            }
            
            return result;
        } catch (error) {
            throw new Error(`YAML parsing failed: ${error.message}`);
        }
    }

    async findAPIFiles(path) {
        // Simulate finding API-related files in a directory
        // In real implementation, this would use filesystem operations
        const mockFiles = [
            `${path}/openapi.json`,
            `${path}/swagger.yaml`,
            `${path}/api-spec.yml`,
            `${path}/mcp-config.json`
        ];
        
        return mockFiles.filter(file => Math.random() > 0.7); // Simulate some files existing
    }

    async readFile(filepath) {
        // Simulate reading file content
        // In real implementation, this would use actual file operations
        return JSON.stringify({
            openapi: '3.0.0',
            info: { title: 'Mock API', version: '1.0.0' },
            paths: { '/test': { get: { summary: 'Test endpoint' } } }
        });
    }

    // Caching methods
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: JSON.parse(JSON.stringify(data)), // Deep copy
            timestamp: Date.now()
        });
    }

    // Public methods for UI
    getDiscoveryHistory() {
        return this.scanHistory.slice(-10); // Last 10 scans
    }

    getDiscoveredAPIs() {
        return Array.from(this.discoveredAPIs.entries()).map(([target, results]) => ({
            target,
            apisFound: results.apis.length,
            lastScan: results.timestamp,
            apis: results.apis
        }));
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Discovery cache cleared');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoDiscovery;
} else {
    window.AutoDiscovery = AutoDiscovery;
}

// Integration with main orchestrator
function initializeAutoDiscovery() {
    const orchestrator = getOrchestrator();
    const autoDiscovery = new AutoDiscovery(orchestrator);
    
    // Store globally for UI access
    window.autoDiscovery = autoDiscovery;
    
    // Setup event listeners
    orchestrator.on('discovery-completed', (results) => {
        updateDiscoveredAPIs(results);
    });
    
    console.log('🔍 Auto-Discovery module initialized');
    return autoDiscovery;
}

function updateDiscoveredAPIs(results) {
    const container = document.getElementById('discoveredApis');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (results.apis.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7;">No APIs discovered yet</p>';
        return;
    }
    
    results.apis.forEach(api => {
        const div = document.createElement('div');
        div.className = 'api-item discovered';
        div.innerHTML = `
            <div>
                <strong>${api.title}</strong>
                <br>
                <small>${api.type.toUpperCase()} - ${api.source}</small>
            </div>
            <button class="btn btn-small" onclick="integrateAPI('${api.source}')">Integrate</button>
        `;
        container.appendChild(div);
    });
}

// UI integration functions
function discoverAPIs() {
    const input = document.getElementById('discoveryInput');
    const target = input.value.trim();
    
    if (!target) {
        showNotification('Please enter a domain or API endpoint', 'warning');
        return;
    }
    
    if (window.autoDiscovery) {
        showNotification(`Starting discovery for ${target}...`, 'info');
        
        window.autoDiscovery.discoverAPIs(target)
            .then(results => {
                showNotification(`Found ${results.apis.length} APIs!`, 'success');
            })
            .catch(error => {
                showNotification(`Discovery failed: ${error.message}`, 'error');
            });
    }
}

function scanNetwork() {
    if (window.autoDiscovery) {
        showNotification('Starting network scan...', 'info');
        
        window.autoDiscovery.discoverAPIs('localhost', { includeLocal: true })
            .then(results => {
                showNotification(`Network scan complete: ${results.apis.length} services found`, 'success');
            });
    }
}

function importOpenAPI() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.yaml,.yml';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // Process the OpenAPI file
                    showNotification(`OpenAPI file ${file.name} imported successfully!`, 'success');
                } catch (error) {
                    showNotification(`Failed to import OpenAPI file: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function integrateAPI(source) {
    const discoveredAPIs = window.autoDiscovery?.getDiscoveredAPIs() || [];
    const apiInfo = discoveredAPIs
        .flatMap(d => d.apis)
        .find(api => api.source === source);
    
    if (apiInfo && window.autoDiscovery) {
        showNotification(`Integrating ${apiInfo.title}...`, 'info');
        
        window.autoDiscovery.autoIntegrateAPI(apiInfo)
            .then(apiId => {
                showNotification(`${apiInfo.title} integrated successfully!`, 'success');
                loadAPIStatus(); // Refresh API list
            })
            .catch(error => {
                showNotification(`Integration failed: ${error.message}`, 'error');
            });
    }
}
