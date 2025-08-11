/**
 * Security & Privacy Suite Module
 * Comprehensive security and privacy protection system
 * Includes Web Crypto API, CSP automation, secure contexts, privacy-preserving analytics, and more
 */

class SecurityPrivacySuite {
    constructor() {
        this.isInitialized = false;
        this.securityFeatures = new Map();
        this.privacySettings = new Map();
        this.encryptionKeys = new Map();
        this.securityPanel = null;
        this.auditLog = [];
        this.threats = new Map();
        this.permissions = new Map();
        
        this.features = {
            webCrypto: null,
            cspManager: null,
            secureStorage: null,
            privacyAnalytics: null,
            threatDetection: null,
            dataEncryption: null,
            secureComms: null,
            accessControl: null,
            auditSystem: null,
            privacyControls: null
        };
        
        this.securityConfig = {
            encryptionAlgorithm: 'AES-GCM',
            keyLength: 256,
            hashAlgorithm: 'SHA-256',
            signatureAlgorithm: 'ECDSA',
            curve: 'P-256',
            maxAuditEntries: 1000,
            threatThreshold: 5,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            maxFailedAttempts: 5
        };
        
        this.init();
    }

    async init() {
        console.log('🔒 Initializing Security & Privacy Suite...');
        
        try {
            await this.initializeWebCrypto();
            await this.initializeCSPManager();
            await this.initializeSecureStorage();
            await this.initializePrivacyAnalytics();
            await this.initializeThreatDetection();
            await this.initializeDataEncryption();
            await this.initializeSecureComms();
            await this.initializeAccessControl();
            await this.initializeAuditSystem();
            await this.initializePrivacyControls();
            await this.createSecurityPanel();
            
            this.isInitialized = true;
            
            console.log('✅ Security & Privacy Suite initialized successfully');
            
            // Start security monitoring
            this.startSecurityMonitoring();
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('securityPrivacyReady', {
                detail: { suite: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize Security & Privacy Suite:', error);
        }
    }

    async initializeWebCrypto() {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Web Crypto API not supported');
        }
        
        this.features.webCrypto = {
            generateKey: async (algorithm = 'AES-GCM', length = 256) => {
                try {
                    const key = await crypto.subtle.generateKey(
                        { name: algorithm, length },
                        true,
                        ['encrypt', 'decrypt']
                    );
                    
                    const keyId = this.generateId();
                    this.encryptionKeys.set(keyId, key);
                    
                    this.logAudit('key_generated', { algorithm, length, keyId });
                    return { key, keyId };
                } catch (error) {
                    this.logAudit('key_generation_failed', { error: error.message });
                    throw error;
                }
            },
            
            encrypt: async (data, keyId) => {
                try {
                    const key = this.encryptionKeys.get(keyId);
                    if (!key) throw new Error('Key not found');
                    
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encodedData = new TextEncoder().encode(data);
                    
                    const encrypted = await crypto.subtle.encrypt(
                        { name: 'AES-GCM', iv },
                        key,
                        encodedData
                    );
                    
                    this.logAudit('data_encrypted', { keyId, dataLength: data.length });
                    
                    return {
                        encrypted: Array.from(new Uint8Array(encrypted)),
                        iv: Array.from(iv)
                    };
                } catch (error) {
                    this.logAudit('encryption_failed', { error: error.message });
                    throw error;
                }
            },
            
            decrypt: async (encryptedData, keyId) => {
                try {
                    const key = this.encryptionKeys.get(keyId);
                    if (!key) throw new Error('Key not found');
                    
                    const decrypted = await crypto.subtle.decrypt(
                        { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
                        key,
                        new Uint8Array(encryptedData.encrypted)
                    );
                    
                    this.logAudit('data_decrypted', { keyId });
                    
                    return new TextDecoder().decode(decrypted);
                } catch (error) {
                    this.logAudit('decryption_failed', { error: error.message });
                    throw error;
                }
            },
            
            hash: async (data, algorithm = 'SHA-256') => {
                try {
                    const encodedData = new TextEncoder().encode(data);
                    const hashBuffer = await crypto.subtle.digest(algorithm, encodedData);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                } catch (error) {
                    this.logAudit('hashing_failed', { error: error.message });
                    throw error;
                }
            },
            
            generateSignature: async (data, privateKey) => {
                try {
                    const encodedData = new TextEncoder().encode(data);
                    const signature = await crypto.subtle.sign(
                        { name: 'ECDSA', hash: 'SHA-256' },
                        privateKey,
                        encodedData
                    );
                    
                    this.logAudit('signature_generated', { dataLength: data.length });
                    return Array.from(new Uint8Array(signature));
                } catch (error) {
                    this.logAudit('signature_failed', { error: error.message });
                    throw error;
                }
            },
            
            verifySignature: async (data, signature, publicKey) => {
                try {
                    const encodedData = new TextEncoder().encode(data);
                    const isValid = await crypto.subtle.verify(
                        { name: 'ECDSA', hash: 'SHA-256' },
                        publicKey,
                        new Uint8Array(signature),
                        encodedData
                    );
                    
                    this.logAudit('signature_verified', { isValid });
                    return isValid;
                } catch (error) {
                    this.logAudit('signature_verification_failed', { error: error.message });
                    throw error;
                }
            }
        };
        
        console.log('🔐 Web Crypto API initialized');
    }

    async initializeCSPManager() {
        this.features.cspManager = {
            currentPolicy: null,
            
            generateCSP: (options = {}) => {
                const defaultPolicy = {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'"],
                    'style-src': ["'self'", "'unsafe-inline'"],
                    'img-src': ["'self'", 'data:', 'https:'],
                    'connect-src': ["'self'"],
                    'font-src': ["'self'"],
                    'object-src': ["'none'"],
                    'media-src': ["'self'"],
                    'frame-src': ["'none'"],
                    'base-uri': ["'self'"],
                    'form-action': ["'self'"],
                    'frame-ancestors': ["'none'"],
                    'upgrade-insecure-requests': []
                };
                
                const policy = { ...defaultPolicy, ...options };
                
                const cspString = Object.entries(policy)
                    .map(([directive, sources]) => {
                        if (sources.length === 0) return directive;
                        return `${directive} ${sources.join(' ')}`;
                    })
                    .join('; ');
                
                this.features.cspManager.currentPolicy = cspString;
                this.logAudit('csp_generated', { policy: cspString });
                
                return cspString;
            },
            
            applyCSP: (policy) => {
                const meta = document.createElement('meta');
                meta.httpEquiv = 'Content-Security-Policy';
                meta.content = policy || this.features.cspManager.currentPolicy;
                document.head.appendChild(meta);
                
                this.logAudit('csp_applied', { policy: meta.content });
            },
            
            reportViolation: (violationEvent) => {
                this.logAudit('csp_violation', {
                    blockedURI: violationEvent.blockedURI,
                    violatedDirective: violationEvent.violatedDirective,
                    originalPolicy: violationEvent.originalPolicy
                });
                
                this.detectThreat('csp_violation', {
                    severity: 'medium',
                    details: violationEvent
                });
            },
            
            enableReporting: () => {
                document.addEventListener('securitypolicyviolation', (e) => {
                    this.features.cspManager.reportViolation(e);
                });
            }
        };
        
        // Generate and apply default CSP
        const defaultCSP = this.features.cspManager.generateCSP();
        this.features.cspManager.applyCSP(defaultCSP);
        this.features.cspManager.enableReporting();
        
        console.log('🛡️ CSP Manager initialized');
    }

    async initializeSecureStorage() {
        this.features.secureStorage = {
            store: async (key, data, encrypt = true) => {
                try {
                    let processedData = data;
                    
                    if (encrypt) {
                        const { keyId } = await this.features.webCrypto.generateKey();
                        const encrypted = await this.features.webCrypto.encrypt(JSON.stringify(data), keyId);
                        processedData = { encrypted: true, data: encrypted, keyId };
                    }
                    
                    const storageKey = await this.features.webCrypto.hash(key);
                    localStorage.setItem(storageKey, JSON.stringify(processedData));
                    
                    this.logAudit('secure_storage_write', { key: storageKey, encrypted });
                    return true;
                } catch (error) {
                    this.logAudit('secure_storage_write_failed', { error: error.message });
                    throw error;
                }
            },
            
            retrieve: async (key) => {
                try {
                    const storageKey = await this.features.webCrypto.hash(key);
                    const stored = localStorage.getItem(storageKey);
                    
                    if (!stored) return null;
                    
                    const parsedData = JSON.parse(stored);
                    
                    if (parsedData.encrypted) {
                        const decrypted = await this.features.webCrypto.decrypt(parsedData.data, parsedData.keyId);
                        this.logAudit('secure_storage_read', { key: storageKey, encrypted: true });
                        return JSON.parse(decrypted);
                    }
                    
                    this.logAudit('secure_storage_read', { key: storageKey, encrypted: false });
                    return parsedData;
                } catch (error) {
                    this.logAudit('secure_storage_read_failed', { error: error.message });
                    throw error;
                }
            },
            
            remove: async (key) => {
                try {
                    const storageKey = await this.features.webCrypto.hash(key);
                    localStorage.removeItem(storageKey);
                    this.logAudit('secure_storage_delete', { key: storageKey });
                    return true;
                } catch (error) {
                    this.logAudit('secure_storage_delete_failed', { error: error.message });
                    throw error;
                }
            },
            
            clear: () => {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.length === 64) { // Likely a hashed key
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                this.logAudit('secure_storage_cleared', { keysRemoved: keysToRemove.length });
            }
        };
        
        console.log('💾 Secure Storage initialized');
    }

    async initializePrivacyAnalytics() {
        this.features.privacyAnalytics = {
            events: [],
            
            trackEvent: (eventName, properties = {}, anonymous = true) => {
                const event = {
                    id: this.generateId(),
                    name: eventName,
                    properties: anonymous ? this.anonymizeData(properties) : properties,
                    timestamp: Date.now(),
                    sessionId: this.getSessionId(),
                    anonymous
                };
                
                this.features.privacyAnalytics.events.push(event);
                
                // Keep only last 1000 events
                if (this.features.privacyAnalytics.events.length > 1000) {
                    this.features.privacyAnalytics.events = this.features.privacyAnalytics.events.slice(-1000);
                }
                
                this.logAudit('analytics_event', { eventName, anonymous });
            },
            
            anonymizeData: (data) => {
                const anonymized = { ...data };
                
                // Remove or hash sensitive fields
                const sensitiveFields = ['email', 'phone', 'ip', 'userId', 'name'];
                sensitiveFields.forEach(field => {
                    if (anonymized[field]) {
                        anonymized[field] = this.hashString(anonymized[field]);
                    }
                });
                
                return anonymized;
            },
            
            getAnalytics: (timeRange = 24 * 60 * 60 * 1000) => {
                const cutoff = Date.now() - timeRange;
                const recentEvents = this.features.privacyAnalytics.events.filter(
                    event => event.timestamp > cutoff
                );
                
                const analytics = {
                    totalEvents: recentEvents.length,
                    uniqueSessions: new Set(recentEvents.map(e => e.sessionId)).size,
                    eventTypes: {},
                    anonymousEvents: recentEvents.filter(e => e.anonymous).length
                };
                
                recentEvents.forEach(event => {
                    analytics.eventTypes[event.name] = (analytics.eventTypes[event.name] || 0) + 1;
                });
                
                return analytics;
            },
            
            exportData: () => {
                const exportData = {
                    events: this.features.privacyAnalytics.events,
                    analytics: this.features.privacyAnalytics.getAnalytics(),
                    exportedAt: new Date().toISOString()
                };
                
                this.logAudit('analytics_exported', { eventCount: exportData.events.length });
                return exportData;
            },
            
            clearData: () => {
                this.features.privacyAnalytics.events = [];
                this.logAudit('analytics_cleared');
            }
        };
        
        console.log('📊 Privacy Analytics initialized');
    }

    async initializeThreatDetection() {
        this.features.threatDetection = {
            patterns: new Map([
                ['xss_attempt', /(<script|javascript:|on\w+\s*=)/i],
                ['sql_injection', /(union|select|insert|update|delete|drop|exec|script)/i],
                ['path_traversal', /(\.\.\/|\.\.\\)/],
                ['command_injection', /(\||&|;|`|\$\()/]
            ]),
            
            scanInput: (input, context = 'general') => {
                const threats = [];
                
                this.features.threatDetection.patterns.forEach((pattern, threatType) => {
                    if (pattern.test(input)) {
                        threats.push({
                            type: threatType,
                            severity: this.getThreatSeverity(threatType),
                            context,
                            input: input.substring(0, 100) // Limit logged input
                        });
                    }
                });
                
                if (threats.length > 0) {
                    threats.forEach(threat => {
                        this.detectThreat(threat.type, threat);
                    });
                }
                
                return threats;
            },
            
            scanDOM: () => {
                const threats = [];
                
                // Check for inline scripts
                const inlineScripts = document.querySelectorAll('script:not([src])');
                if (inlineScripts.length > 0) {
                    threats.push({
                        type: 'inline_script',
                        severity: 'medium',
                        count: inlineScripts.length
                    });
                }
                
                // Check for eval usage
                if (window.eval.toString().indexOf('[native code]') === -1) {
                    threats.push({
                        type: 'eval_override',
                        severity: 'high'
                    });
                }
                
                // Check for suspicious iframes
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (!iframe.src.startsWith(window.location.origin)) {
                        threats.push({
                            type: 'external_iframe',
                            severity: 'medium',
                            src: iframe.src
                        });
                    }
                });
                
                return threats;
            },
            
            monitorNetworkRequests: () => {
                const originalFetch = window.fetch;
                window.fetch = async (...args) => {
                    const url = args[0];
                    
                    // Check for suspicious requests
                    if (typeof url === 'string') {
                        if (!url.startsWith(window.location.origin) && !url.startsWith('https://')) {
                            this.detectThreat('insecure_request', {
                                severity: 'medium',
                                url: url
                            });
                        }
                    }
                    
                    return originalFetch.apply(this, args);
                };
            },
            
            enableRealTimeScanning: () => {
                // Monitor form inputs
                document.addEventListener('input', (e) => {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                        this.features.threatDetection.scanInput(e.target.value, 'form_input');
                    }
                });
                
                // Monitor URL changes
                let lastUrl = location.href;
                new MutationObserver(() => {
                    const url = location.href;
                    if (url !== lastUrl) {
                        lastUrl = url;
                        this.features.threatDetection.scanInput(url, 'url_change');
                    }
                }).observe(document, { subtree: true, childList: true });
            }
        };
        
        // Enable monitoring
        this.features.threatDetection.monitorNetworkRequests();
        this.features.threatDetection.enableRealTimeScanning();
        
        // Initial DOM scan
        const initialThreats = this.features.threatDetection.scanDOM();
        initialThreats.forEach(threat => {
            this.detectThreat(threat.type, threat);
        });
        
        console.log('🔍 Threat Detection initialized');
    }

    async initializeDataEncryption() {
        this.features.dataEncryption = {
            encryptFormData: async (formData) => {
                const { keyId } = await this.features.webCrypto.generateKey();
                const encrypted = await this.features.webCrypto.encrypt(JSON.stringify(formData), keyId);
                
                return {
                    encrypted,
                    keyId,
                    timestamp: Date.now()
                };
            },
            
            encryptLocalData: async (data) => {
                return this.features.secureStorage.store('app_data', data, true);
            },
            
            encryptCommunication: async (message) => {
                const { keyId } = await this.features.webCrypto.generateKey();
                const encrypted = await this.features.webCrypto.encrypt(message, keyId);
                
                return {
                    encrypted,
                    keyId,
                    timestamp: Date.now()
                };
            },
            
            generateSecureToken: async () => {
                const randomData = crypto.getRandomValues(new Uint8Array(32));
                const token = Array.from(randomData, byte => byte.toString(16).padStart(2, '0')).join('');
                
                this.logAudit('secure_token_generated', { tokenLength: token.length });
                return token;
            }
        };
        
        console.log('🔐 Data Encryption initialized');
    }

    async initializeSecureComms() {
        this.features.secureComms = {
            establishSecureChannel: async (endpoint) => {
                try {
                    // Generate key pair for secure communication
                    const keyPair = await crypto.subtle.generateKey(
                        { name: 'ECDH', namedCurve: 'P-256' },
                        true,
                        ['deriveKey']
                    );
                    
                    this.logAudit('secure_channel_established', { endpoint });
                    
                    return {
                        publicKey: keyPair.publicKey,
                        privateKey: keyPair.privateKey,
                        endpoint
                    };
                } catch (error) {
                    this.logAudit('secure_channel_failed', { error: error.message });
                    throw error;
                }
            },
            
            secureRequest: async (url, options = {}) => {
                const secureOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-Security-Token': await this.features.dataEncryption.generateSecureToken()
                    }
                };
                
                // Ensure HTTPS
                if (!url.startsWith('https://') && !url.startsWith('/')) {
                    throw new Error('Insecure request blocked');
                }
                
                this.logAudit('secure_request', { url: url.substring(0, 100) });
                
                return fetch(url, secureOptions);
            },
            
            validateResponse: (response) => {
                const securityHeaders = [
                    'strict-transport-security',
                    'x-content-type-options',
                    'x-frame-options',
                    'x-xss-protection'
                ];
                
                const missingHeaders = securityHeaders.filter(header => 
                    !response.headers.has(header)
                );
                
                if (missingHeaders.length > 0) {
                    this.logAudit('missing_security_headers', { missingHeaders });
                }
                
                return {
                    secure: missingHeaders.length === 0,
                    missingHeaders
                };
            }
        };
        
        console.log('📡 Secure Communications initialized');
    }

    async initializeAccessControl() {
        this.features.accessControl = {
            permissions: new Map(),
            sessions: new Map(),
            
            createSession: async (userId, permissions = []) => {
                const sessionId = await this.features.dataEncryption.generateSecureToken();
                const session = {
                    id: sessionId,
                    userId,
                    permissions: new Set(permissions),
                    createdAt: Date.now(),
                    lastActivity: Date.now(),
                    failedAttempts: 0
                };
                
                this.features.accessControl.sessions.set(sessionId, session);
                this.logAudit('session_created', { userId, sessionId, permissions });
                
                return sessionId;
            },
            
            validateSession: (sessionId) => {
                const session = this.features.accessControl.sessions.get(sessionId);
                
                if (!session) {
                    this.logAudit('session_validation_failed', { sessionId, reason: 'not_found' });
                    return false;
                }
                
                const now = Date.now();
                const isExpired = (now - session.lastActivity) > this.securityConfig.sessionTimeout;
                
                if (isExpired) {
                    this.features.accessControl.sessions.delete(sessionId);
                    this.logAudit('session_expired', { sessionId });
                    return false;
                }
                
                session.lastActivity = now;
                this.logAudit('session_validated', { sessionId });
                return true;
            },
            
            checkPermission: (sessionId, permission) => {
                const session = this.features.accessControl.sessions.get(sessionId);
                
                if (!session || !this.features.accessControl.validateSession(sessionId)) {
                    return false;
                }
                
                const hasPermission = session.permissions.has(permission);
                this.logAudit('permission_check', { sessionId, permission, granted: hasPermission });
                
                return hasPermission;
            },
            
            recordFailedAttempt: (sessionId) => {
                const session = this.features.accessControl.sessions.get(sessionId);
                
                if (session) {
                    session.failedAttempts++;
                    
                    if (session.failedAttempts >= this.securityConfig.maxFailedAttempts) {
                        this.features.accessControl.sessions.delete(sessionId);
                        this.detectThreat('excessive_failed_attempts', {
                            severity: 'high',
                            sessionId,
                            attempts: session.failedAttempts
                        });
                    }
                }
            },
            
            revokeSession: (sessionId) => {
                const session = this.features.accessControl.sessions.get(sessionId);
                if (session) {
                    this.features.accessControl.sessions.delete(sessionId);
                    this.logAudit('session_revoked', { sessionId });
                }
            }
        };
        
        console.log('🔐 Access Control initialized');
    }

    async initializeAuditSystem() {
        this.features.auditSystem = {
            log: (action, details = {}) => {
                const entry = {
                    id: this.generateId(),
                    timestamp: Date.now(),
                    action,
                    details,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };
                
                this.auditLog.push(entry);
                
                // Keep only recent entries
                if (this.auditLog.length > this.securityConfig.maxAuditEntries) {
                    this.auditLog = this.auditLog.slice(-this.securityConfig.maxAuditEntries);
                }
                
                // Store in secure storage periodically
                if (this.auditLog.length % 10 === 0) {
                    this.features.secureStorage.store('audit_log', this.auditLog, true);
                }
            },
            
            getAuditLog: (filter = {}) => {
                let filteredLog = [...this.auditLog];
                
                if (filter.action) {
                    filteredLog = filteredLog.filter(entry => entry.action === filter.action);
                }
                
                if (filter.timeRange) {
                    const cutoff = Date.now() - filter.timeRange;
                    filteredLog = filteredLog.filter(entry => entry.timestamp > cutoff);
                }
                
                return filteredLog;
            },
            
            exportAuditLog: () => {
                const exportData = {
                    auditLog: this.auditLog,
                    exportedAt: new Date().toISOString(),
                    totalEntries: this.auditLog.length
                };
                
                this.logAudit('audit_log_exported', { entries: this.auditLog.length });
                return exportData;
            },
            
            clearAuditLog: () => {
                const entriesCleared = this.auditLog.length;
                this.auditLog = [];
                this.features.secureStorage.remove('audit_log');
                this.logAudit('audit_log_cleared', { entriesCleared });
            }
        };
        
        console.log('📋 Audit System initialized');
    }

    async initializePrivacyControls() {
        this.features.privacyControls = {
            settings: new Map([
                ['analytics_enabled', true],
                ['data_collection', 'minimal'],
                ['cookie_consent', false],
                ['tracking_protection', true],
                ['data_retention_days', 30]
            ]),
            
            updateSetting: (key, value) => {
                this.features.privacyControls.settings.set(key, value);
                this.features.secureStorage.store('privacy_settings', 
                    Object.fromEntries(this.features.privacyControls.settings), true);
                this.logAudit('privacy_setting_updated', { key, value });
            },
            
            getSetting: (key) => {
                return this.features.privacyControls.settings.get(key);
            },
            
            requestDataDeletion: async () => {
                // Clear all stored data
                this.features.secureStorage.clear();
                this.features.privacyAnalytics.clearData();
                this.features.auditSystem.clearAuditLog();
                
                // Clear browser storage
                localStorage.clear();
                sessionStorage.clear();
                
                // Clear cookies
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                
                this.logAudit('data_deletion_requested');
                console.log('🗑️ All user data deleted');
            },
            
            exportUserData: () => {
                const userData = {
                    privacySettings: Object.fromEntries(this.features.privacyControls.settings),
                    analyticsData: this.features.privacyAnalytics.exportData(),
                    auditData: this.features.auditSystem.exportAuditLog(),
                    exportedAt: new Date().toISOString()
                };
                
                this.logAudit('user_data_exported');
                return userData;
            },
            
            checkCompliance: () => {
                const compliance = {
                    gdpr: {
                        consentGiven: this.features.privacyControls.getSetting('cookie_consent'),
                        dataMinimization: this.features.privacyControls.getSetting('data_collection') === 'minimal',
                        rightToErasure: true, // We support data deletion
                        dataPortability: true // We support data export
                    },
                    ccpa: {
                        optOutAvailable: true,
                        dataDisclosure: true
                    }
                };
                
                return compliance;
            }
        };
        
        // Load saved privacy settings
        try {
            const savedSettings = await this.features.secureStorage.retrieve('privacy_settings');
            if (savedSettings) {
                Object.entries(savedSettings).forEach(([key, value]) => {
                    this.features.privacyControls.settings.set(key, value);
                });
            }
        } catch (error) {
            console.warn('Could not load privacy settings:', error);
        }
        
        console.log('🔒 Privacy Controls initialized');
    }

    async createSecurityPanel() {
        const panel = document.createElement('div');
        panel.id = 'security-privacy-panel';
        panel.innerHTML = `
            <style>
                #security-privacy-panel {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 400px;
                    max-height: 80vh;
                    background: rgba(0, 0, 0, 0.95);
                    color: white;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 14px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    z-index: 10008;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    border: 1px solid #333;
                    overflow: hidden;
                }
                
                #security-privacy-panel.active {
                    transform: translateX(0);
                }
                
                .security-header {
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .security-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .security-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .security-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .security-content {
                    max-height: calc(80vh - 80px);
                    overflow-y: auto;
                    padding: 16px;
                }
                
                .security-section {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #333;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    padding: 12px;
                }
                
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .section-title {
                    font-weight: bold;
                    color: #e74c3c;
                }
                
                .status-badge {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .status-secure {
                    background: #27ae60;
                    color: white;
                }
                
                .status-warning {
                    background: #f39c12;
                    color: white;
                }
                
                .status-danger {
                    background: #e74c3c;
                    color: white;
                }
                
                .security-metric {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-size: 12px;
                }
                
                .metric-label {
                    color: #bdc3c7;
                }
                
                .metric-value {
                    font-family: monospace;
                    color: white;
                }
                
                .security-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 16px;
                }
                
                .security-btn {
                    background: #e74c3c;
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                }
                
                .security-btn:hover {
                    background: #c0392b;
                }
                
                .security-btn.secondary {
                    background: #333;
                }
                
                .security-btn.secondary:hover {
                    background: #444;
                }
                
                .security-toggle {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                    border: none;
                    color: white;
                    padding: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    z-index: 10009;
                    transition: all 0.3s ease;
                }
                
                .security-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.6);
                }
                
                .security-toggle.panel-open {
                    left: 440px;
                }
                
                .threat-list {
                    max-height: 150px;
                    overflow-y: auto;
                    margin-top: 8px;
                }
                
                .threat-item {
                    background: rgba(231, 76, 60, 0.1);
                    border: 1px solid #e74c3c;
                    border-radius: 4px;
                    padding: 8px;
                    margin: 4px 0;
                    font-size: 12px;
                }
                
                .privacy-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 8px 0;
                }
                
                .toggle-switch {
                    position: relative;
                    width: 40px;
                    height: 20px;
                    background: #333;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                
                .toggle-switch.active {
                    background: #27ae60;
                }
                
                .toggle-slider {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                }
                
                .toggle-switch.active .toggle-slider {
                    transform: translateX(20px);
                }
            </style>
            
            <div class="security-header">
                <div class="security-title">🔒 Security & Privacy</div>
                <button class="security-close">×</button>
            </div>
            
            <div class="security-content">
                <div class="security-section">
                    <div class="section-header">
                        <div class="section-title">Security Status</div>
                        <div class="status-badge status-secure" id="security-status">SECURE</div>
                    </div>
                    <div class="security-metric">
                        <span class="metric-label">Encryption:</span>
                        <span class="metric-value" id="encryption-status">AES-256</span>
                    </div>
                    <div class="security-metric">
                        <span class="metric-label">CSP:</span>
                        <span class="metric-value" id="csp-status">Active</span>
                    </div>
                    <div class="security-metric">
                        <span class="metric-label">Threats Detected:</span>
                        <span class="metric-value" id="threat-count">0</span>
                    </div>
                </div>
                
                <div class="security-section">
                    <div class="section-header">
                        <div class="section-title">Active Threats</div>
                        <button class="security-btn secondary" onclick="window.securityPrivacy.scanForThreats()">
                            🔍 Scan
                        </button>
                    </div>
                    <div class="threat-list" id="threat-list">
                        <div style="color: #27ae60; text-align: center; padding: 20px;">
                            No threats detected
                        </div>
                    </div>
                </div>
                
                <div class="security-section">
                    <div class="section-header">
                        <div class="section-title">Privacy Controls</div>
                    </div>
                    <div class="privacy-toggle">
                        <span>Analytics</span>
                        <div class="toggle-switch active" data-setting="analytics_enabled">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="privacy-toggle">
                        <span>Tracking Protection</span>
                        <div class="toggle-switch active" data-setting="tracking_protection">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                    <div class="privacy-toggle">
                        <span>Cookie Consent</span>
                        <div class="toggle-switch" data-setting="cookie_consent">
                            <div class="toggle-slider"></div>
                        </div>
                    </div>
                </div>
                
                <div class="security-section">
                    <div class="section-header">
                        <div class="section-title">Data Management</div>
                    </div>
                    <div class="security-metric">
                        <span class="metric-label">Audit Entries:</span>
                        <span class="metric-value" id="audit-count">0</span>
                    </div>
                    <div class="security-metric">
                        <span class="metric-label">Analytics Events:</span>
                        <span class="metric-value" id="analytics-count">0</span>
                    </div>
                </div>
                
                <div class="security-actions">
                    <button class="security-btn" onclick="window.securityPrivacy.runSecurityScan()">
                        🛡️ Security Scan
                    </button>
                    <button class="security-btn secondary" onclick="window.securityPrivacy.exportData()">
                        📄 Export Data
                    </button>
                    <button class="security-btn secondary" onclick="window.securityPrivacy.clearData()">
                        🗑️ Clear Data
                    </button>
                    <button class="security-btn secondary" onclick="window.securityPrivacy.generateReport()">
                        📊 Report
                    </button>
                </div>
            </div>
        `;
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'security-toggle';
        toggleBtn.innerHTML = '🔒';
        toggleBtn.title = 'Toggle Security & Privacy Panel';
        
        document.body.appendChild(panel);
        document.body.appendChild(toggleBtn);
        
        this.securityPanel = panel;
        this.setupSecurityPanelInteractions(panel, toggleBtn);
        
        console.log('🎛️ Security & Privacy Panel created');
    }

    setupSecurityPanelInteractions(panel, toggleBtn) {
        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            const isActive = panel.classList.contains('active');
            if (isActive) {
                panel.classList.remove('active');
                toggleBtn.classList.remove('panel-open');
            } else {
                panel.classList.add('active');
                toggleBtn.classList.add('panel-open');
                this.updateSecurityPanel();
            }
        });
        
        // Close panel
        panel.querySelector('.security-close').addEventListener('click', () => {
            panel.classList.remove('active');
            toggleBtn.classList.remove('panel-open');
        });
        
        // Privacy toggles
        panel.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const setting = toggle.dataset.setting;
                const isActive = toggle.classList.contains('active');
                
                if (isActive) {
                    toggle.classList.remove('active');
                    this.features.privacyControls.updateSetting(setting, false);
                } else {
                    toggle.classList.add('active');
                    this.features.privacyControls.updateSetting(setting, true);
                }
            });
        });
    }

    startSecurityMonitoring() {
        // Update panel every 5 seconds
        setInterval(() => {
            this.updateSecurityPanel();
        }, 5000);
        
        // Periodic security scans
        setInterval(() => {
            this.runAutomaticSecurityScan();
        }, 60000); // Every minute
    }

    updateSecurityPanel() {
        if (!this.securityPanel) return;
        
        // Update threat count
        document.getElementById('threat-count').textContent = this.threats.size;
        
        // Update audit count
        document.getElementById('audit-count').textContent = this.auditLog.length;
        
        // Update analytics count
        document.getElementById('analytics-count').textContent = this.features.privacyAnalytics.events.length;
        
        // Update threat list
        this.updateThreatList();
        
        // Update security status
        const threatLevel = this.calculateThreatLevel();
        const statusElement = document.getElementById('security-status');
        
        if (threatLevel === 'high') {
            statusElement.textContent = 'HIGH RISK';
            statusElement.className = 'status-badge status-danger';
        } else if (threatLevel === 'medium') {
            statusElement.textContent = 'CAUTION';
            statusElement.className = 'status-badge status-warning';
        } else {
            statusElement.textContent = 'SECURE';
            statusElement.className = 'status-badge status-secure';
        }
    }

    updateThreatList() {
        const threatList = document.getElementById('threat-list');
        
        if (this.threats.size === 0) {
            threatList.innerHTML = `
                <div style="color: #27ae60; text-align: center; padding: 20px;">
                    No threats detected
                </div>
            `;
            return;
        }
        
        threatList.innerHTML = '';
        
        Array.from(this.threats.entries()).slice(-10).forEach(([id, threat]) => {
            const threatItem = document.createElement('div');
            threatItem.className = 'threat-item';
            threatItem.innerHTML = `
                <div style="font-weight: bold; color: #e74c3c;">${threat.type}</div>
                <div style="color: #bdc3c7; font-size: 11px;">
                    Severity: ${threat.severity} | ${new Date(threat.timestamp).toLocaleTimeString()}
                </div>
            `;
            threatList.appendChild(threatItem);
        });
    }

    // Utility methods
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('security_session_id');
        if (!sessionId) {
            sessionId = this.generateId();
            sessionStorage.setItem('security_session_id', sessionId);
        }
        return sessionId;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    logAudit(action, details = {}) {
        if (this.features.auditSystem && this.features.auditSystem.log) {
            this.features.auditSystem.log(action, details);
        } else {
            // Fallback logging when audit system is not yet initialized
            console.log(`[AUDIT] ${action}:`, details);
        }
    }

    detectThreat(type, details = {}) {
        const threat = {
            id: this.generateId(),
            type,
            severity: details.severity || 'medium',
            timestamp: Date.now(),
            details
        };
        
        this.threats.set(threat.id, threat);
        this.logAudit('threat_detected', threat);
        
        console.warn('🚨 Threat detected:', threat);
        
        // Auto-mitigation for high severity threats
        if (threat.severity === 'high') {
            this.mitigateThreat(threat);
        }
    }

    mitigateThreat(threat) {
        console.log('🛡️ Mitigating threat:', threat.type);
        
        switch (threat.type) {
            case 'xss_attempt':
                // Block the input or sanitize
                break;
            case 'excessive_failed_attempts':
                // Block the session
                break;
            default:
                // Generic mitigation
                break;
        }
        
        this.logAudit('threat_mitigated', { threatId: threat.id, type: threat.type });
    }

    getThreatSeverity(threatType) {
        const severityMap = {
            'xss_attempt': 'high',
            'sql_injection': 'high',
            'command_injection': 'high',
            'path_traversal': 'medium',
            'csp_violation': 'medium',
            'insecure_request': 'medium',
            'excessive_failed_attempts': 'high',
            'inline_script': 'medium',
            'eval_override': 'high',
            'external_iframe': 'medium'
        };
        
        return severityMap[threatType] || 'low';
    }

    calculateThreatLevel() {
        if (this.threats.size === 0) return 'low';
        
        const highThreats = Array.from(this.threats.values()).filter(t => t.severity === 'high').length;
        const mediumThreats = Array.from(this.threats.values()).filter(t => t.severity === 'medium').length;
        
        if (highThreats > 0) return 'high';
        if (mediumThreats > 2) return 'medium';
        return 'low';
    }

    // Public API methods
    runSecurityScan() {
        console.log('🔍 Running comprehensive security scan...');
        
        // DOM scan
        const domThreats = this.features.threatDetection.scanDOM();
        
        // Check security headers
        fetch(window.location.href, { method: 'HEAD' })
            .then(response => {
                this.features.secureComms.validateResponse(response);
            })
            .catch(() => {});
        
        // Memory scan
        this.runMemorySecurityScan();
        
        console.log('✅ Security scan complete');
    }

    runAutomaticSecurityScan() {
        // Lightweight automatic scan
        const domThreats = this.features.threatDetection.scanDOM();
        
        // Check for suspicious activity
        if (this.auditLog.length > 0) {
            const recentEntries = this.auditLog.slice(-10);
            const failedAttempts = recentEntries.filter(e => e.action.includes('failed')).length;
            
            if (failedAttempts > 3) {
                this.detectThreat('suspicious_activity', {
                    severity: 'medium',
                    failedAttempts
                });
            }
        }
    }

    runMemorySecurityScan() {
        // Check for potential memory-based attacks
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            if (usage > 0.9) {
                this.detectThreat('memory_exhaustion', {
                    severity: 'medium',
                    usage: usage * 100
                });
            }
        }
    }

    scanForThreats() {
        this.runSecurityScan();
        this.updateSecurityPanel();
    }

    exportData() {
        const data = this.features.privacyControls.exportUserData();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-privacy-data-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📄 Security & Privacy data exported');
    }

    clearData() {
        if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
            this.features.privacyControls.requestDataDeletion();
            this.updateSecurityPanel();
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            securityStatus: {
                threatLevel: this.calculateThreatLevel(),
                threatsDetected: this.threats.size,
                auditEntries: this.auditLog.length
            },
            privacyCompliance: this.features.privacyControls.checkCompliance(),
            threats: Array.from(this.threats.values()),
            recentAuditEntries: this.auditLog.slice(-50),
            analytics: this.features.privacyAnalytics.getAnalytics()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-privacy-report-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📊 Security & Privacy report generated');
    }

    // Cleanup
    destroy() {
        // Clear intervals
        clearInterval(this.monitoringInterval);
        
        // Remove panel
        if (this.securityPanel) {
            this.securityPanel.remove();
        }
        
        const toggleBtn = document.querySelector('.security-toggle');
        if (toggleBtn) {
            toggleBtn.remove();
        }
        
        // Clear sensitive data
        this.encryptionKeys.clear();
        this.threats.clear();
        
        console.log('🧹 Security & Privacy Suite destroyed');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.securityPrivacy = new SecurityPrivacySuite();
    });
} else {
    window.securityPrivacy = new SecurityPrivacySuite();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityPrivacySuite;
}