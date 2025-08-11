// Enhanced Security Module for AI Agent Workforce
class SecurityManager {
    constructor() {
        this.encryptionKey = null;
        this.rateLimiter = new Map();
        this.securityPolicies = new Map();
        this.auditLog = [];
        this.sessionManager = new SessionManager();
        this.inputValidator = new InputValidator();
        
        this.init();
    }

    async init() {
        await this.generateEncryptionKey();
        this.setupCSP();
        this.setupRateLimiting();
        this.setupSecurityPolicies();
        this.startSecurityMonitoring();
    }

    // Encryption and Key Management
    async generateEncryptionKey() {
        if (window.crypto && window.crypto.subtle) {
            this.encryptionKey = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
        } else {
            console.warn('Web Crypto API not available, using fallback encryption');
            this.encryptionKey = this.generateFallbackKey();
        }
    }

    async encryptData(data) {
        try {
            if (!this.encryptionKey) {
                throw new Error('Encryption key not available');
            }

            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );
            
            return {
                data: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv)
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return this.fallbackEncrypt(data);
        }
    }

    async decryptData(encryptedData) {
        try {
            if (!this.encryptionKey || !encryptedData.data || !encryptedData.iv) {
                throw new Error('Invalid encrypted data or key');
            }

            const dataBuffer = new Uint8Array(encryptedData.data);
            const iv = new Uint8Array(encryptedData.iv);
            
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return this.fallbackDecrypt(encryptedData);
        }
    }

    // Secure API Key Management
    async storeAPIKey(service, apiKey) {
        const encrypted = await this.encryptData(apiKey);
        const keyData = {
            encrypted,
            timestamp: Date.now(),
            service
        };
        
        localStorage.setItem(`secure_api_${service}`, JSON.stringify(keyData));
        this.auditLog.push({
            action: 'api_key_stored',
            service,
            timestamp: Date.now(),
            ip: await this.getClientIP()
        });
    }

    async retrieveAPIKey(service) {
        try {
            const stored = localStorage.getItem(`secure_api_${service}`);
            if (!stored) return null;
            
            const keyData = JSON.parse(stored);
            const decrypted = await this.decryptData(keyData.encrypted);
            
            this.auditLog.push({
                action: 'api_key_retrieved',
                service,
                timestamp: Date.now()
            });
            
            return decrypted;
        } catch (error) {
            console.error('Failed to retrieve API key:', error);
            return null;
        }
    }

    // Rate Limiting
    setupRateLimiting() {
        this.rateLimits = {
            api_calls: { limit: 100, window: 60000 }, // 100 calls per minute
            agent_creation: { limit: 10, window: 300000 }, // 10 agents per 5 minutes
            file_uploads: { limit: 20, window: 3600000 }, // 20 uploads per hour
            chat_messages: { limit: 200, window: 60000 } // 200 messages per minute
        };
    }

    checkRateLimit(action, identifier = 'default') {
        const key = `${action}_${identifier}`;
        const now = Date.now();
        const limit = this.rateLimits[action];
        
        if (!limit) return true;
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }
        
        const requests = this.rateLimiter.get(key);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < limit.window);
        
        if (validRequests.length >= limit.limit) {
            this.auditLog.push({
                action: 'rate_limit_exceeded',
                type: action,
                identifier,
                timestamp: now
            });
            return false;
        }
        
        validRequests.push(now);
        this.rateLimiter.set(key, validRequests);
        return true;
    }

    // Content Security Policy
    setupCSP() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://api.openrouter.ai https://api.elevenlabs.io",
            "media-src 'self' blob:",
            "worker-src 'self' blob:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'"
        ].join('; ');
        
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = csp;
        document.head.appendChild(meta);
    }

    // Input Validation and Sanitization
    validateInput(input, type = 'general') {
        return this.inputValidator.validate(input, type);
    }

    sanitizeInput(input) {
        return this.inputValidator.sanitize(input);
    }

    // Security Monitoring
    startSecurityMonitoring() {
        // Monitor for suspicious activity
        setInterval(() => {
            this.checkForAnomalies();
            this.cleanupAuditLog();
        }, 60000); // Check every minute
        
        // Monitor for XSS attempts
        this.setupXSSDetection();
        
        // Monitor for CSRF attempts
        this.setupCSRFProtection();
    }

    checkForAnomalies() {
        const recentLogs = this.auditLog.filter(log => 
            Date.now() - log.timestamp < 300000 // Last 5 minutes
        );
        
        // Check for rapid API key access
        const apiKeyAccess = recentLogs.filter(log => 
            log.action === 'api_key_retrieved'
        );
        
        if (apiKeyAccess.length > 10) {
            this.triggerSecurityAlert('Suspicious API key access pattern detected');
        }
        
        // Check for rate limit violations
        const rateLimitViolations = recentLogs.filter(log => 
            log.action === 'rate_limit_exceeded'
        );
        
        if (rateLimitViolations.length > 5) {
            this.triggerSecurityAlert('Multiple rate limit violations detected');
        }
    }

    triggerSecurityAlert(message) {
        console.warn('🚨 Security Alert:', message);
        this.auditLog.push({
            action: 'security_alert',
            message,
            timestamp: Date.now()
        });
        
        // Could integrate with external security services here
        if (CONFIG.security?.alertWebhook) {
            this.sendSecurityAlert(message);
        }
    }

    // Utility Methods
    generateFallbackKey() {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(32)));
    }

    fallbackEncrypt(data) {
        // Simple XOR encryption as fallback
        const key = this.encryptionKey || this.generateFallbackKey();
        const dataStr = JSON.stringify(data);
        const encrypted = [];
        
        for (let i = 0; i < dataStr.length; i++) {
            encrypted.push(dataStr.charCodeAt(i) ^ key[i % key.length]);
        }
        
        return { data: encrypted, iv: key.slice(0, 12) };
    }

    fallbackDecrypt(encryptedData) {
        const key = encryptedData.iv;
        const decrypted = [];
        
        for (let i = 0; i < encryptedData.data.length; i++) {
            decrypted.push(String.fromCharCode(encryptedData.data[i] ^ key[i % key.length]));
        }
        
        return JSON.parse(decrypted.join(''));
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    cleanupAuditLog() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.auditLog = this.auditLog.filter(log => log.timestamp > oneWeekAgo);
    }

    setupXSSDetection() {
        const originalInnerHTML = Element.prototype.innerHTML;
        Element.prototype.innerHTML = function(value) {
            if (typeof value === 'string' && this.detectXSS(value)) {
                console.warn('Potential XSS attempt blocked');
                return;
            }
            return originalInnerHTML.call(this, value);
        };
    }

    detectXSS(input) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi
        ];
        
        return xssPatterns.some(pattern => pattern.test(input));
    }

    setupCSRFProtection() {
        this.csrfToken = this.generateCSRFToken();
        
        // Add CSRF token to all forms
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrf_token';
                tokenInput.value = this.csrfToken;
                form.appendChild(tokenInput);
            }
        });
    }

    generateCSRFToken() {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Session Management
class SessionManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionData = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.lastActivity = Date.now();
        
        this.startSessionMonitoring();
    }

    generateSessionId() {
        return 'session_' + Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    isSessionValid() {
        return Date.now() - this.lastActivity < this.sessionTimeout;
    }

    startSessionMonitoring() {
        setInterval(() => {
            if (!this.isSessionValid()) {
                this.expireSession();
            }
        }, 60000); // Check every minute
        
        // Update activity on user interactions
        ['click', 'keypress', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), { passive: true });
        });
    }

    expireSession() {
        this.sessionData.clear();
        console.log('Session expired due to inactivity');
        
        // Could redirect to login or show session expired message
        if (window.app && window.app.handleSessionExpiry) {
            window.app.handleSessionExpiry();
        }
    }
}

// Input Validator
class InputValidator {
    constructor() {
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            url: /^https?:\/\/.+/,
            apiKey: /^[a-zA-Z0-9_-]+$/,
            filename: /^[a-zA-Z0-9._-]+$/,
            json: /^[\s]*[{\[]/
        };
        
        this.maxLengths = {
            general: 10000,
            apiKey: 200,
            filename: 255,
            message: 5000,
            code: 50000
        };
    }

    validate(input, type = 'general') {
        if (typeof input !== 'string') {
            return { valid: false, error: 'Input must be a string' };
        }
        
        // Check length
        const maxLength = this.maxLengths[type] || this.maxLengths.general;
        if (input.length > maxLength) {
            return { valid: false, error: `Input too long (max ${maxLength} characters)` };
        }
        
        // Check for null bytes
        if (input.includes('\0')) {
            return { valid: false, error: 'Null bytes not allowed' };
        }
        
        // Type-specific validation
        if (type === 'email' && !this.patterns.email.test(input)) {
            return { valid: false, error: 'Invalid email format' };
        }
        
        if (type === 'url' && !this.patterns.url.test(input)) {
            return { valid: false, error: 'Invalid URL format' };
        }
        
        if (type === 'apiKey' && !this.patterns.apiKey.test(input)) {
            return { valid: false, error: 'Invalid API key format' };
        }
        
        if (type === 'json') {
            try {
                JSON.parse(input);
            } catch (error) {
                return { valid: false, error: 'Invalid JSON format' };
            }
        }
        
        return { valid: true };
    }

    sanitize(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }
}

// Export for global use
window.SecurityManager = SecurityManager;
window.SessionManager = SessionManager;
window.InputValidator = InputValidator;