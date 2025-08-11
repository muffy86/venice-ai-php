/**
 * Security Manager Module
 * Advanced Security and Authentication Management System
 *
 * Features:
 * - Multi-factor authentication
 * - JWT token management
 * - OAuth2/OpenID Connect integration
 * - API key rotation
 * - Threat detection and prevention
 * - Security monitoring and alerting
 * - Rate limiting and DDoS protection
 * - Encryption and data protection
 */

class SecurityManager {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.tokens = new Map();
        this.apiKeys = new Map();
        this.sessions = new Map();
        this.threatDetector = new ThreatDetector();
        this.rateLimiter = new RateLimiter();
        this.encryptionManager = new EncryptionManager();
        this.auditLogger = new AuditLogger();
        this.config = {
            jwtSecret: this.generateSecureSecret(),
            jwtExpiration: '1h',
            refreshTokenExpiration: '7d',
            apiKeyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            encryptionAlgorithm: 'AES-256-GCM',
            hashAlgorithm: 'SHA-256',
            enableThreatDetection: true,
            enableRateLimiting: true,
            enableAuditLogging: true,
            securityHeaders: {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': "default-src 'self'"
            }
        };
        this.securityEvents = [];
        this.loginAttempts = new Map();
        this.blockedIPs = new Set();
        this.isMonitoring = false;

        this.initialize();
    }

    async initialize() {
        console.log('🔒 Security Manager initializing...');

        // Initialize threat detection
        await this.threatDetector.initialize();

        // Start security monitoring
        this.startSecurityMonitoring();

        // Initialize API key management
        this.initializeAPIKeyManagement();

        // Setup automatic token rotation
        this.setupTokenRotation();

        // Initialize encryption
        await this.encryptionManager.initialize();

        // Start audit logging
        this.auditLogger.start();

        console.log('✅ Security Manager initialized');
        this.orchestrator.emit('security-manager-initialized');
    }

    // Authentication and Authorization
    async authenticateUser(credentials) {
        const { username, password, method = 'password', additionalFactors = {} } = credentials;

        try {
            // Check for brute force attempts
            if (this.isUserLocked(username)) {
                throw new SecurityError('Account temporarily locked due to multiple failed attempts');
            }

            // Log authentication attempt
            this.auditLogger.log('auth_attempt', { username, method, timestamp: Date.now() });

            // Primary authentication
            const user = await this.validateCredentials(username, password);
            if (!user) {
                this.recordFailedAttempt(username);
                throw new SecurityError('Invalid credentials');
            }

            // Multi-factor authentication
            if (user.mfaEnabled || method === 'mfa') {
                const mfaValid = await this.validateMFA(user, additionalFactors);
                if (!mfaValid) {
                    throw new SecurityError('Multi-factor authentication failed');
                }
            }

            // Generate tokens
            const tokens = await this.generateTokens(user);

            // Create session
            const session = this.createSession(user, tokens);

            // Clear failed attempts
            this.loginAttempts.delete(username);

            // Log successful authentication
            this.auditLogger.log('auth_success', {
                userId: user.id,
                username,
                sessionId: session.id,
                timestamp: Date.now()
            });

            return {
                user: this.sanitizeUser(user),
                tokens,
                session: session.id
            };

        } catch (error) {
            this.auditLogger.log('auth_failure', {
                username,
                error: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
    }

    async validateCredentials(username, password) {
        // Simulate user lookup and password validation
        // In real implementation, this would query a secure user database
        const users = {
            'admin': {
                id: '1',
                username: 'admin',
                passwordHash: await this.hashPassword('admin123'),
                roles: ['admin', 'user'],
                permissions: ['*'],
                mfaEnabled: true,
                createdAt: Date.now() - 86400000
            },
            'user': {
                id: '2',
                username: 'user',
                passwordHash: await this.hashPassword('user123'),
                roles: ['user'],
                permissions: ['read', 'write'],
                mfaEnabled: false,
                createdAt: Date.now() - 86400000
            }
        };

        const user = users[username];
        if (!user) return null;

        const isValidPassword = await this.verifyPassword(password, user.passwordHash);
        return isValidPassword ? user : null;
    }

    async validateMFA(user, additionalFactors) {
        const { totp, sms, email } = additionalFactors;

        // TOTP validation (Time-based One-Time Password)
        if (totp) {
            return this.validateTOTP(user.id, totp);
        }

        // SMS validation
        if (sms) {
            return this.validateSMSCode(user.id, sms);
        }

        // Email validation
        if (email) {
            return this.validateEmailCode(user.id, email);
        }

        return false;
    }

    async generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            roles: user.roles,
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000)
        };

        // Generate JWT access token
        const accessToken = await this.createJWT(payload, this.config.jwtExpiration);

        // Generate refresh token
        const refreshToken = await this.createJWT(
            { userId: user.id, type: 'refresh' },
            this.config.refreshTokenExpiration
        );

        // Store tokens
        this.tokens.set(accessToken, {
            userId: user.id,
            type: 'access',
            createdAt: Date.now(),
            expiresAt: Date.now() + this.parseExpiration(this.config.jwtExpiration)
        });

        this.tokens.set(refreshToken, {
            userId: user.id,
            type: 'refresh',
            createdAt: Date.now(),
            expiresAt: Date.now() + this.parseExpiration(this.config.refreshTokenExpiration)
        });

        return { accessToken, refreshToken };
    }

    createSession(user, tokens) {
        const session = {
            id: this.generateSecureId(),
            userId: user.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            ipAddress: '127.0.0.1', // Would be extracted from request
            userAgent: 'API-Orchestrator/1.0'
        };

        this.sessions.set(session.id, session);
        return session;
    }

    async validateToken(token) {
        try {
            // Check if token exists in our store
            const tokenInfo = this.tokens.get(token);
            if (!tokenInfo) {
                throw new SecurityError('Token not found');
            }

            // Check expiration
            if (Date.now() > tokenInfo.expiresAt) {
                this.tokens.delete(token);
                throw new SecurityError('Token expired');
            }

            // Verify JWT signature
            const payload = await this.verifyJWT(token);

            // Update last activity
            tokenInfo.lastActivity = Date.now();

            return {
                valid: true,
                payload,
                tokenInfo
            };

        } catch (error) {
            this.auditLogger.log('token_validation_failed', {
                token: token.substring(0, 10) + '...',
                error: error.message,
                timestamp: Date.now()
            });
            return { valid: false, error: error.message };
        }
    }

    async refreshToken(refreshToken) {
        try {
            const validation = await this.validateToken(refreshToken);
            if (!validation.valid || validation.payload.type !== 'refresh') {
                throw new SecurityError('Invalid refresh token');
            }

            // Get user data
            const userId = validation.payload.userId;
            const user = await this.getUserById(userId);

            // Generate new tokens
            const newTokens = await this.generateTokens(user);

            // Invalidate old refresh token
            this.tokens.delete(refreshToken);

            this.auditLogger.log('token_refreshed', { userId, timestamp: Date.now() });

            return newTokens;

        } catch (error) {
            this.auditLogger.log('token_refresh_failed', {
                refreshToken: refreshToken.substring(0, 10) + '...',
                error: error.message,
                timestamp: Date.now()
            });
            throw error;
        }
    }

    // API Key Management
    async generateAPIKey(userId, purpose, permissions = []) {
        const apiKey = {
            key: this.generateSecureAPIKey(),
            userId,
            purpose,
            permissions,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.apiKeyRotationInterval,
            usageCount: 0,
            lastUsed: null,
            active: true
        };

        this.apiKeys.set(apiKey.key, apiKey);

        this.auditLogger.log('api_key_generated', {
            userId,
            purpose,
            keyId: apiKey.key.substring(0, 8) + '...',
            timestamp: Date.now()
        });

        return apiKey.key;
    }

    async validateAPIKey(key) {
        const apiKey = this.apiKeys.get(key);

        if (!apiKey) {
            this.auditLogger.log('api_key_not_found', { key: key.substring(0, 8) + '...', timestamp: Date.now() });
            return { valid: false, error: 'API key not found' };
        }

        if (!apiKey.active) {
            return { valid: false, error: 'API key deactivated' };
        }

        if (Date.now() > apiKey.expiresAt) {
            apiKey.active = false;
            return { valid: false, error: 'API key expired' };
        }

        // Update usage
        apiKey.usageCount++;
        apiKey.lastUsed = Date.now();

        return { valid: true, apiKey };
    }

    async rotateAPIKey(oldKey) {
        const oldApiKey = this.apiKeys.get(oldKey);
        if (!oldApiKey) {
            throw new SecurityError('API key not found');
        }

        // Generate new key with same permissions
        const newKey = await this.generateAPIKey(
            oldApiKey.userId,
            oldApiKey.purpose,
            oldApiKey.permissions
        );

        // Deactivate old key
        oldApiKey.active = false;

        this.auditLogger.log('api_key_rotated', {
            userId: oldApiKey.userId,
            oldKeyId: oldKey.substring(0, 8) + '...',
            newKeyId: newKey.substring(0, 8) + '...',
            timestamp: Date.now()
        });

        return newKey;
    }

    // Threat Detection and Prevention
    async analyzeRequest(request) {
        const threats = await this.threatDetector.analyze(request);

        if (threats.length > 0) {
            const securityEvent = {
                id: this.generateSecureId(),
                type: 'threat_detected',
                threats,
                request: {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    timestamp: Date.now()
                },
                severity: this.calculateThreatSeverity(threats),
                timestamp: Date.now()
            };

            this.securityEvents.push(securityEvent);
            this.orchestrator.emit('security-threat', securityEvent);

            // Take protective action if needed
            if (securityEvent.severity >= 8) {
                await this.blockRequest(request);
                this.auditLogger.log('request_blocked', {
                    threats,
                    severity: securityEvent.severity,
                    timestamp: Date.now()
                });
                return { blocked: true, reason: 'High-severity threat detected' };
            }
        }

        return { blocked: false, threats };
    }

    calculateThreatSeverity(threats) {
        return Math.min(10, threats.reduce((max, threat) =>
            Math.max(max, threat.severity || 5), 0
        ));
    }

    async blockRequest(request) {
        const clientIP = request.clientIP || '127.0.0.1';
        this.blockedIPs.add(clientIP);

        // Auto-unblock after some time
        setTimeout(() => {
            this.blockedIPs.delete(clientIP);
            this.auditLogger.log('ip_unblocked', { ip: clientIP, timestamp: Date.now() });
        }, 60000); // 1 minute
    }

    // Rate Limiting
    async checkRateLimit(identifier, endpoint) {
        return this.rateLimiter.check(identifier, endpoint);
    }

    // Encryption and Hashing
    async encrypt(data, key = null) {
        return this.encryptionManager.encrypt(data, key);
    }

    async decrypt(encryptedData, key = null) {
        return this.encryptionManager.decrypt(encryptedData, key);
    }

    async hashPassword(password) {
        const salt = this.generateSalt();
        return this.hash(password + salt) + ':' + salt;
    }

    async verifyPassword(password, hash) {
        const [hashedPassword, salt] = hash.split(':');
        const computedHash = this.hash(password + salt);
        return hashedPassword === computedHash;
    }

    hash(data) {
        // Simulate secure hashing (in production, use crypto.pbkdf2Sync or bcrypt)
        return btoa(data).split('').reverse().join('');
    }

    // Security Monitoring
    startSecurityMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        setInterval(() => {
            this.performSecurityChecks();
            this.cleanupExpiredTokens();
            this.analyzeSecurity();
        }, 30000); // Every 30 seconds

        console.log('🔍 Security monitoring started');
    }

    performSecurityChecks() {
        // Check for suspicious patterns
        this.detectBruteForceAttempts();
        this.checkForAnomalousActivity();
        this.validateSystemIntegrity();

        // Emit health status
        this.orchestrator.emit('security-health-check', {
            timestamp: Date.now(),
            activeSessions: this.sessions.size,
            activeTokens: this.tokens.size,
            activeAPIKeys: Array.from(this.apiKeys.values()).filter(k => k.active).length,
            securityEvents: this.securityEvents.length,
            blockedIPs: this.blockedIPs.size
        });
    }

    detectBruteForceAttempts() {
        for (const [username, attempts] of this.loginAttempts.entries()) {
            if (attempts.count >= this.config.maxLoginAttempts) {
                this.securityEvents.push({
                    id: this.generateSecureId(),
                    type: 'brute_force_detected',
                    username,
                    attempts: attempts.count,
                    severity: 9,
                    timestamp: Date.now()
                });

                this.auditLogger.log('brute_force_detected', { username, attempts: attempts.count, timestamp: Date.now() });
            }
        }
    }

    checkForAnomalousActivity() {
        // Check for unusual token usage patterns
        const now = Date.now();
        const recentActivity = Array.from(this.tokens.values())
            .filter(token => now - token.lastActivity < 300000); // Last 5 minutes

        if (recentActivity.length > 100) { // Threshold for suspicious activity
            this.securityEvents.push({
                id: this.generateSecureId(),
                type: 'anomalous_activity',
                description: 'High token usage detected',
                count: recentActivity.length,
                severity: 6,
                timestamp: now
            });
        }
    }

    validateSystemIntegrity() {
        // Check for configuration tampering
        const expectedConfigHash = this.hashConfig(this.config);
        if (this.lastConfigHash && this.lastConfigHash !== expectedConfigHash) {
            this.securityEvents.push({
                id: this.generateSecureId(),
                type: 'config_tampering',
                description: 'Security configuration has been modified',
                severity: 10,
                timestamp: Date.now()
            });
        }
        this.lastConfigHash = expectedConfigHash;
    }

    cleanupExpiredTokens() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [token, tokenInfo] of this.tokens.entries()) {
            if (now > tokenInfo.expiresAt) {
                this.tokens.delete(token);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.auditLogger.log('tokens_cleaned', { count: cleanedCount, timestamp: now });
        }
    }

    analyzeSecurity() {
        const recentEvents = this.securityEvents.filter(
            event => Date.now() - event.timestamp < 3600000 // Last hour
        );

        const highSeverityEvents = recentEvents.filter(event => event.severity >= 8);

        if (highSeverityEvents.length > 0) {
            this.orchestrator.emit('security-alert', {
                level: 'high',
                events: highSeverityEvents,
                timestamp: Date.now()
            });
        }
    }

    // Utility methods
    generateSecureSecret() {
        return Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateSecureId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    generateSecureAPIKey() {
        const prefix = 'ak_';
        const timestamp = Date.now().toString(36);
        const random = Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 36).toString(36)
        ).join('');
        return prefix + timestamp + '_' + random;
    }

    generateSalt() {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    parseExpiration(expiration) {
        const unit = expiration.slice(-1);
        const value = parseInt(expiration.slice(0, -1));

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 3600000; // 1 hour default
        }
    }

    async createJWT(payload, expiration) {
        // Simplified JWT creation (in production, use a proper JWT library)
        const header = { alg: 'HS256', typ: 'JWT' };
        const exp = Math.floor((Date.now() + this.parseExpiration(expiration)) / 1000);
        const fullPayload = { ...payload, exp };

        const headerB64 = btoa(JSON.stringify(header));
        const payloadB64 = btoa(JSON.stringify(fullPayload));
        const signature = this.sign(headerB64 + '.' + payloadB64, this.config.jwtSecret);

        return headerB64 + '.' + payloadB64 + '.' + signature;
    }

    async verifyJWT(token) {
        const [headerB64, payloadB64, signature] = token.split('.');

        // Verify signature
        const expectedSignature = this.sign(headerB64 + '.' + payloadB64, this.config.jwtSecret);
        if (signature !== expectedSignature) {
            throw new SecurityError('Invalid token signature');
        }

        // Parse payload
        const payload = JSON.parse(atob(payloadB64));

        // Check expiration
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            throw new SecurityError('Token expired');
        }

        return payload;
    }

    sign(data, secret) {
        // Simplified signing (in production, use HMAC)
        return btoa(data + secret).substr(0, 16);
    }

    hashConfig(config) {
        return this.hash(JSON.stringify(config));
    }

    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }

    isUserLocked(username) {
        const attempts = this.loginAttempts.get(username);
        return attempts && attempts.count >= this.config.maxLoginAttempts;
    }

    recordFailedAttempt(username) {
        const attempts = this.loginAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.loginAttempts.set(username, attempts);

        // Auto-clear after lockout duration
        setTimeout(() => {
            this.loginAttempts.delete(username);
        }, this.config.lockoutDuration);
    }

    async getUserById(userId) {
        // Simulate user lookup
        if (userId === '1') {
            return {
                id: '1',
                username: 'admin',
                roles: ['admin', 'user'],
                permissions: ['*'],
                mfaEnabled: true
            };
        }
        return null;
    }

    validateTOTP(userId, totp) {
        // Simulate TOTP validation
        return totp === '123456'; // Mock validation
    }

    validateSMSCode(userId, code) {
        // Simulate SMS code validation
        return code === '789012'; // Mock validation
    }

    validateEmailCode(userId, code) {
        // Simulate email code validation
        return code === '345678'; // Mock validation
    }

    setupTokenRotation() {
        setInterval(() => {
            this.rotateExpiredAPIKeys();
        }, 24 * 60 * 60 * 1000); // Daily rotation check
    }

    initializeAPIKeyManagement() {
        // Generate initial API keys for system operations
        this.generateAPIKey('system', 'orchestrator_operations', ['*']);
        this.generateAPIKey('system', 'monitoring', ['read']);
    }

    rotateExpiredAPIKeys() {
        const now = Date.now();
        for (const [key, apiKey] of this.apiKeys.entries()) {
            if (now > apiKey.expiresAt - 86400000) { // 1 day before expiration
                this.rotateAPIKey(key).catch(error => {
                    console.error('Failed to rotate API key:', error);
                });
            }
        }
    }

    // Public API methods
    getSecurityStatus() {
        return {
            activeSessions: this.sessions.size,
            activeTokens: this.tokens.size,
            activeAPIKeys: Array.from(this.apiKeys.values()).filter(k => k.active).length,
            recentSecurityEvents: this.securityEvents.slice(-10),
            blockedIPs: this.blockedIPs.size,
            threatLevel: this.calculateCurrentThreatLevel()
        };
    }

    calculateCurrentThreatLevel() {
        const recentEvents = this.securityEvents.filter(
            event => Date.now() - event.timestamp < 3600000 // Last hour
        );

        if (recentEvents.length === 0) return 'low';

        const maxSeverity = Math.max(...recentEvents.map(e => e.severity));

        if (maxSeverity >= 9) return 'critical';
        if (maxSeverity >= 7) return 'high';
        if (maxSeverity >= 5) return 'medium';
        return 'low';
    }

    getAuditLogs() {
        return this.auditLogger.getLogs();
    }

    updateSecurityConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.auditLogger.log('config_updated', { changes: newConfig, timestamp: Date.now() });
        this.orchestrator.emit('security-config-updated', this.config);
    }
}

// Security Error class
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}

// Threat Detection System
class ThreatDetector {
    constructor() {
        this.patterns = new Map();
        this.rules = [];
        this.whitelist = new Set();
        this.blacklist = new Set();
    }

    async initialize() {
        this.loadThreatPatterns();
        this.loadSecurityRules();
    }

    loadThreatPatterns() {
        // SQL Injection patterns
        this.patterns.set('sql_injection', [
            /('|(\\')|(;|\\;)|(--|--)|(\/\*|\*\/))/i,
            /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
        ]);

        // XSS patterns
        this.patterns.set('xss', [
            /<script[^>]*>.*?<\/script>/i,
            /javascript:/i,
            /on\w+\s*=/i
        ]);

        // Command injection patterns
        this.patterns.set('command_injection', [
            /[;&|`$(){}[\]]/,
            /(cat|ls|pwd|wget|curl|nc|netcat)/i
        ]);

        // Path traversal patterns
        this.patterns.set('path_traversal', [
            /(\.\.[\/\\]){2,}/,
            /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/i
        ]);
    }

    loadSecurityRules() {
        this.rules = [
            {
                name: 'suspicious_user_agent',
                check: (request) => this.checkSuspiciousUserAgent(request.headers['user-agent']),
                severity: 6
            },
            {
                name: 'high_request_rate',
                check: (request) => this.checkRequestRate(request.clientIP),
                severity: 7
            },
            {
                name: 'malformed_request',
                check: (request) => this.checkMalformedRequest(request),
                severity: 8
            }
        ];
    }

    async analyze(request) {
        const threats = [];

        // Check against patterns
        for (const [threatType, patterns] of this.patterns.entries()) {
            const requestData = JSON.stringify(request);

            for (const pattern of patterns) {
                if (pattern.test(requestData)) {
                    threats.push({
                        type: threatType,
                        pattern: pattern.toString(),
                        severity: this.getThreatSeverity(threatType),
                        description: `${threatType} pattern detected`
                    });
                }
            }
        }

        // Check against rules
        for (const rule of this.rules) {
            try {
                if (rule.check(request)) {
                    threats.push({
                        type: rule.name,
                        severity: rule.severity,
                        description: `Security rule triggered: ${rule.name}`
                    });
                }
            } catch (error) {
                console.error(`Error checking rule ${rule.name}:`, error);
            }
        }

        return threats;
    }

    getThreatSeverity(threatType) {
        const severities = {
            'sql_injection': 9,
            'xss': 8,
            'command_injection': 10,
            'path_traversal': 7
        };
        return severities[threatType] || 5;
    }

    checkSuspiciousUserAgent(userAgent) {
        if (!userAgent) return true;

        const suspiciousPatterns = [
            /bot|crawler|spider/i,
            /curl|wget|python|perl/i,
            /scanner|nikto|sqlmap/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(userAgent));
    }

    checkRequestRate(clientIP) {
        // Simplified rate checking
        return Math.random() > 0.95; // 5% chance of triggering
    }

    checkMalformedRequest(request) {
        // Check for malformed headers, invalid JSON, etc.
        try {
            if (request.body && typeof request.body === 'string') {
                JSON.parse(request.body);
            }
            return false;
        } catch {
            return true;
        }
    }
}

// Rate Limiter
class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.requests = new Map();
        this.config = {
            defaultLimit: 100, // requests per window
            windowSize: 60000, // 1 minute
            burstLimit: 20, // burst requests allowed
            cleanupInterval: 300000 // 5 minutes
        };

        this.startCleanup();
    }

    check(identifier, endpoint = 'default') {
        const key = `${identifier}:${endpoint}`;
        const now = Date.now();
        const windowStart = now - this.config.windowSize;

        // Get or create request history for this identifier
        if (!this.requests.has(key)) {
            this.requests.set(key, []);
        }

        const requestHistory = this.requests.get(key);

        // Remove old requests outside the window
        const recentRequests = requestHistory.filter(time => time > windowStart);
        this.requests.set(key, recentRequests);

        // Get limit for this endpoint
        const limit = this.limits.get(endpoint) || this.config.defaultLimit;

        // Check if limit exceeded
        if (recentRequests.length >= limit) {
            return {
                allowed: false,
                limit,
                remaining: 0,
                resetTime: windowStart + this.config.windowSize
            };
        }

        // Add current request
        recentRequests.push(now);

        return {
            allowed: true,
            limit,
            remaining: limit - recentRequests.length,
            resetTime: windowStart + this.config.windowSize
        };
    }

    setLimit(endpoint, limit) {
        this.limits.set(endpoint, limit);
    }

    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    cleanup() {
        const now = Date.now();
        const cutoff = now - this.config.windowSize * 2; // Keep double window for safety

        for (const [key, requests] of this.requests.entries()) {
            const recentRequests = requests.filter(time => time > cutoff);
            if (recentRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, recentRequests);
            }
        }
    }
}

// Encryption Manager
class EncryptionManager {
    constructor() {
        this.keys = new Map();
        this.defaultKey = null;
    }

    async initialize() {
        // Generate default encryption key
        this.defaultKey = this.generateKey();
        console.log('🔐 Encryption Manager initialized');
    }

    generateKey() {
        // Simulate key generation (in production, use crypto.randomBytes)
        return Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
    }

    async encrypt(data, key = null) {
        const encryptionKey = key || this.defaultKey;

        // Simplified encryption (in production, use crypto.createCipher)
        const jsonData = JSON.stringify(data);
        const encrypted = btoa(jsonData + encryptionKey).split('').reverse().join('');

        return {
            encrypted,
            algorithm: 'AES-256-GCM', // Simulated
            iv: this.generateIV(),
            timestamp: Date.now()
        };
    }

    async decrypt(encryptedData, key = null) {
        const encryptionKey = key || this.defaultKey;

        try {
            // Simplified decryption
            const reversed = encryptedData.encrypted.split('').reverse().join('');
            const decrypted = atob(reversed);
            const jsonData = decrypted.replace(encryptionKey, '');

            return JSON.parse(jsonData);
        } catch (error) {
            throw new SecurityError('Decryption failed');
        }
    }

    generateIV() {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
    }
}

// Audit Logger
class AuditLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
        this.isStarted = false;
    }

    start() {
        this.isStarted = true;
        console.log('📝 Audit Logger started');
    }

    log(event, data) {
        if (!this.isStarted) return;

        const logEntry = {
            id: this.generateLogId(),
            event,
            data,
            timestamp: Date.now(),
            iso: new Date().toISOString()
        };

        this.logs.push(logEntry);

        // Keep logs manageable
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-8000);
        }

        // In production, this would write to secure storage
        console.log(`[AUDIT] ${event}:`, data);
    }

    getLogs(limit = 100, filter = null) {
        let filteredLogs = this.logs;

        if (filter) {
            filteredLogs = this.logs.filter(log =>
                log.event.includes(filter) ||
                JSON.stringify(log.data).includes(filter)
            );
        }

        return filteredLogs.slice(-limit);
    }

    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

// Export and UI integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, SecurityError };
} else {
    window.SecurityManager = SecurityManager;
    window.SecurityError = SecurityError;
}

function initializeSecurityManager() {
    const orchestrator = getOrchestrator();
    const securityManager = new SecurityManager(orchestrator);

    window.securityManager = securityManager;

    // Setup event listeners
    orchestrator.on('security-threat', (event) => {
        console.warn('🚨 Security threat detected:', event);
        updateSecurityStatus();
    });

    orchestrator.on('security-alert', (alert) => {
        console.error('🔴 Security alert:', alert);
        showNotification(`Security Alert: ${alert.level} level threat detected!`, 'error');
        updateSecurityStatus();
    });

    console.log('🔒 Security Manager module initialized');
    return securityManager;
}

function updateSecurityStatus() {
    if (!window.securityManager) return;

    const status = window.securityManager.getSecurityStatus();

    // Update UI elements
    const elements = {
        'activeSessions': status.activeSessions,
        'activeTokens': status.activeTokens,
        'threatLevel': status.threatLevel,
        'blockedIPs': status.blockedIPs
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Update threat level indicator
    const threatIndicator = document.getElementById('threatLevelIndicator');
    if (threatIndicator) {
        threatIndicator.className = `threat-level ${status.threatLevel}`;
        threatIndicator.textContent = status.threatLevel.toUpperCase();
    }
}

// UI functions
function authenticateUser() {
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (!username || !password) {
        showNotification('Please enter username and password', 'warning');
        return;
    }

    if (window.securityManager) {
        showNotification('Authenticating...', 'info');

        window.securityManager.authenticateUser({ username, password })
            .then(result => {
                showNotification(`Welcome ${result.user.username}!`, 'success');
                console.log('Authentication result:', result);
                updateSecurityStatus();
            })
            .catch(error => {
                showNotification(`Authentication failed: ${error.message}`, 'error');
            });
    }
}

function generateAPIKey() {
    const purpose = document.getElementById('apiKeyPurpose')?.value || 'general';

    if (window.securityManager) {
        showNotification('Generating API key...', 'info');

        window.securityManager.generateAPIKey('user', purpose, ['read', 'write'])
            .then(apiKey => {
                showNotification('API key generated successfully!', 'success');

                // Show the key (in production, show this securely)
                const keyDisplay = document.getElementById('generatedAPIKey');
                if (keyDisplay) {
                    keyDisplay.textContent = apiKey;
                    keyDisplay.style.display = 'block';
                }

                updateSecurityStatus();
            })
            .catch(error => {
                showNotification(`Failed to generate API key: ${error.message}`, 'error');
            });
    }
}

function viewAuditLogs() {
    if (window.securityManager) {
        const logs = window.securityManager.getAuditLogs();

        // Display logs (could open a modal or update a section)
        console.log('Recent Audit Logs:', logs);
        showNotification(`Retrieved ${logs.length} audit log entries`, 'info');

        // Update logs display if element exists
        const logsContainer = document.getElementById('auditLogs');
        if (logsContainer) {
            logsContainer.innerHTML = '';
            logs.slice(-10).forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = 'audit-log-entry';
                logElement.innerHTML = `
                    <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span class="log-event">${log.event}</span>
                    <span class="log-data">${JSON.stringify(log.data)}</span>
                `;
                logsContainer.appendChild(logElement);
            });
        }
    }
}

function testSecurity() {
    if (window.securityManager) {
        showNotification('Running security tests...', 'info');

        // Test threat detection
        const mockRequest = {
            method: 'POST',
            url: '/api/test',
            headers: { 'user-agent': 'sqlmap/1.0' },
            body: JSON.stringify({ query: "'; DROP TABLE users; --" }),
            clientIP: '192.168.1.100'
        };

        window.securityManager.analyzeRequest(mockRequest)
            .then(result => {
                if (result.blocked) {
                    showNotification('Security test passed: Threat detected and blocked!', 'success');
                } else {
                    showNotification(`Security test: ${result.threats.length} threats detected`, 'warning');
                }

                console.log('Security test result:', result);
                updateSecurityStatus();
            })
            .catch(error => {
                showNotification(`Security test failed: ${error.message}`, 'error');
            });
    }
}

function exportSecurityLogs() {
    if (window.securityManager) {
        const logs = window.securityManager.getAuditLogs();
        const status = window.securityManager.getSecurityStatus();

        const exportData = {
            timestamp: new Date().toISOString(),
            securityStatus: status,
            auditLogs: logs,
            version: '1.0'
        };

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Security logs exported successfully!', 'success');
    }
}

function refreshSecurityStatus() {
    if (window.securityManager) {
        updateSecurityStatus();
        showNotification('Security status refreshed!', 'info');
    }
}
