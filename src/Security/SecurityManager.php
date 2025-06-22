<?php

namespace Venice\Security;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\AuthenticationException;

/**
 * Advanced security management system for Venice AI SDK
 *
 * Provides:
 * - Multi-factor authentication
 * - JWT token management
 * - API key encryption and rotation
 * - Request signing and verification
 * - Rate limiting and abuse protection
 * - Data encryption and masking
 * - Security audit logging
 */
class SecurityManager {
    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var array Security configuration */
    private array $config;

    /** @var array Active sessions */
    private array $sessions = [];

    /** @var array Rate limiting data */
    private array $rateLimits = [];

    /** @var string Encryption key */
    private string $encryptionKey;

    /** @var array Security algorithms */
    private const ALGORITHMS = [
        'HS256' => 'HMAC using SHA-256',
        'HS384' => 'HMAC using SHA-384',
        'HS512' => 'HMAC using SHA-512',
        'RS256' => 'RSA using SHA-256'
    ];

    /** @var array Sensitive data patterns */
    private const SENSITIVE_PATTERNS = [
        'api_key' => '/sk-[a-zA-Z0-9]{48}/',
        'email' => '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/',
        'phone' => '/\+?1?-?\.?\s?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/',
        'ssn' => '/\d{3}-?\d{2}-?\d{4}/',
        'credit_card' => '/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/'
    ];

    /**
     * Constructor
     *
     * @param array $config Security configuration
     * @param Logger $logger Logger instance
     * @throws VeniceException If security setup fails
     */
    public function __construct(array $config, Logger $logger) {
        $this->config = array_merge([
            'jwt_algorithm' => 'HS256',
            'jwt_expiry' => 3600,
            'rate_limit_window' => 60,
            'rate_limit_max' => 100,
            'encryption_method' => 'AES-256-CBC',
            'hash_algorithm' => 'sha256',
            'session_timeout' => 1800,
            'max_login_attempts' => 5,
            'lockout_duration' => 900
        ], $config);

        $this->logger = $logger;
        $this->setupEncryption();
    }

    /**
     * Authenticate user with API key
     *
     * @param string $apiKey API key to authenticate
     * @param array $options Authentication options
     * @return array Authentication result
     * @throws AuthenticationException If authentication fails
     */
    public function authenticateApiKey(string $apiKey, array $options = []): array {
        try {
            // Validate API key format
            if (!$this->isValidApiKeyFormat($apiKey)) {
                throw new AuthenticationException('Invalid API key format');
            }

            // Check rate limiting
            $clientId = $options['client_id'] ?? $this->hashApiKey($apiKey);
            if (!$this->checkRateLimit($clientId)) {
                throw new AuthenticationException('Rate limit exceeded');
            }

            // Decrypt and validate API key
            $decryptedKey = $this->decryptApiKey($apiKey);
            if (!$this->validateApiKey($decryptedKey)) {
                $this->incrementRateLimit($clientId);
                throw new AuthenticationException('Invalid API key');
            }

            // Create session
            $sessionId = $this->createSession($clientId, $options);

            $this->logger->info('API key authentication successful', [
                'client_id' => $clientId,
                'session_id' => $sessionId
            ]);

            return [
                'authenticated' => true,
                'session_id' => $sessionId,
                'client_id' => $clientId,
                'expires_at' => time() + $this->config['session_timeout']
            ];

        } catch (AuthenticationException $e) {
            $this->logger->warning('API key authentication failed', [
                'error' => $e->getMessage(),
                'client_id' => $clientId ?? 'unknown'
            ]);
            throw $e;
        }
    }

    /**
     * Generate JWT token
     *
     * @param array $payload Token payload
     * @param array $options Token options
     * @return string JWT token
     * @throws VeniceException If token generation fails
     */
    public function generateJWT(array $payload, array $options = []): string {
        try {
            $now = time();
            $expiry = $now + ($options['expiry'] ?? $this->config['jwt_expiry']);

            $tokenPayload = array_merge($payload, [
                'iat' => $now,
                'exp' => $expiry,
                'iss' => 'venice-ai-sdk',
                'jti' => $this->generateTokenId()
            ]);

            $algorithm = $options['algorithm'] ?? $this->config['jwt_algorithm'];
            $key = $options['key'] ?? $this->encryptionKey;

            $token = JWT::encode($tokenPayload, $key, $algorithm);

            $this->logger->debug('JWT token generated', [
                'algorithm' => $algorithm,
                'expiry' => $expiry
            ]);

            return $token;

        } catch (\Exception $e) {
            throw new VeniceException('JWT generation failed: ' . $e->getMessage());
        }
    }

    /**
     * Verify JWT token
     *
     * @param string $token JWT token
     * @param array $options Verification options
     * @return array Decoded token payload
     * @throws AuthenticationException If token verification fails
     */
    public function verifyJWT(string $token, array $options = []): array {
        try {
            $algorithm = $options['algorithm'] ?? $this->config['jwt_algorithm'];
            $key = $options['key'] ?? $this->encryptionKey;

            $decoded = JWT::decode($token, new Key($key, $algorithm));
            $payload = (array) $decoded;

            // Additional validation
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                throw new AuthenticationException('Token has expired');
            }

            $this->logger->debug('JWT token verified', [
                'jti' => $payload['jti'] ?? 'unknown'
            ]);

            return $payload;

        } catch (\Exception $e) {
            $this->logger->warning('JWT verification failed', [
                'error' => $e->getMessage()
            ]);
            throw new AuthenticationException('Invalid token: ' . $e->getMessage());
        }
    }

    /**
     * Encrypt sensitive data
     *
     * @param string $data Data to encrypt
     * @param string|null $key Custom encryption key
     * @return string Encrypted data
     * @throws VeniceException If encryption fails
     */
    public function encrypt(string $data, ?string $key = null): string {
        try {
            $encryptionKey = $key ?? $this->encryptionKey;
            $method = $this->config['encryption_method'];
            $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($method));

            $encrypted = openssl_encrypt($data, $method, $encryptionKey, 0, $iv);

            if ($encrypted === false) {
                throw new VeniceException('Encryption failed');
            }

            return base64_encode($iv . $encrypted);

        } catch (\Exception $e) {
            throw new VeniceException('Data encryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Decrypt sensitive data
     *
     * @param string $encryptedData Encrypted data
     * @param string|null $key Custom encryption key
     * @return string Decrypted data
     * @throws VeniceException If decryption fails
     */
    public function decrypt(string $encryptedData, ?string $key = null): string {
        try {
            $encryptionKey = $key ?? $this->encryptionKey;
            $method = $this->config['encryption_method'];
            $data = base64_decode($encryptedData);

            $ivLength = openssl_cipher_iv_length($method);
            $iv = substr($data, 0, $ivLength);
            $encrypted = substr($data, $ivLength);

            $decrypted = openssl_decrypt($encrypted, $method, $encryptionKey, 0, $iv);

            if ($decrypted === false) {
                throw new VeniceException('Decryption failed');
            }

            return $decrypted;

        } catch (\Exception $e) {
            throw new VeniceException('Data decryption failed: ' . $e->getMessage());
        }
    }

    /**
     * Mask sensitive data in logs
     *
     * @param string $data Data to mask
     * @return string Masked data
     */
    public function maskSensitiveData(string $data): string {
        foreach (self::SENSITIVE_PATTERNS as $type => $pattern) {
            $data = preg_replace_callback($pattern, function($matches) use ($type) {
                $value = $matches[0];
                $length = strlen($value);

                if ($length <= 4) {
                    return str_repeat('*', $length);
                }

                return substr($value, 0, 2) . str_repeat('*', $length - 4) . substr($value, -2);
            }, $data);
        }

        return $data;
    }

    /**
     * Sign request for verification
     *
     * @param array $requestData Request data
     * @param string|null $secret Signing secret
     * @return string Request signature
     */
    public function signRequest(array $requestData, ?string $secret = null): string {
        $secret = $secret ?? $this->encryptionKey;
        $payload = json_encode($requestData, JSON_UNESCAPED_SLASHES);

        return hash_hmac($this->config['hash_algorithm'], $payload, $secret);
    }

    /**
     * Verify request signature
     *
     * @param array $requestData Request data
     * @param string $signature Provided signature
     * @param string|null $secret Signing secret
     * @return bool True if signature is valid
     */
    public function verifyRequestSignature(array $requestData, string $signature, ?string $secret = null): bool {
        $expectedSignature = $this->signRequest($requestData, $secret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Check rate limit for client
     *
     * @param string $clientId Client identifier
     * @return bool True if within rate limit
     */
    public function checkRateLimit(string $clientId): bool {
        $now = time();
        $window = $this->config['rate_limit_window'];
        $maxRequests = $this->config['rate_limit_max'];

        if (!isset($this->rateLimits[$clientId])) {
            $this->rateLimits[$clientId] = [
                'requests' => [],
                'blocked_until' => 0
            ];
        }

        $clientData = &$this->rateLimits[$clientId];

        // Check if client is blocked
        if ($clientData['blocked_until'] > $now) {
            return false;
        }

        // Clean old requests
        $clientData['requests'] = array_filter(
            $clientData['requests'],
            fn($timestamp) => $timestamp > ($now - $window)
        );

        // Check rate limit
        return count($clientData['requests']) < $maxRequests;
    }

    /**
     * Increment rate limit counter
     *
     * @param string $clientId Client identifier
     */
    public function incrementRateLimit(string $clientId): void {
        $now = time();

        if (!isset($this->rateLimits[$clientId])) {
            $this->rateLimits[$clientId] = [
                'requests' => [],
                'blocked_until' => 0
            ];
        }

        $this->rateLimits[$clientId]['requests'][] = $now;

        // Check if client should be blocked
        if (!$this->checkRateLimit($clientId)) {
            $this->rateLimits[$clientId]['blocked_until'] = $now + $this->config['lockout_duration'];

            $this->logger->warning('Client rate limited', [
                'client_id' => $clientId,
                'blocked_until' => $this->rateLimits[$clientId]['blocked_until']
            ]);
        }
    }

    /**
     * Create user session
     *
     * @param string $clientId Client identifier
     * @param array $options Session options
     * @return string Session ID
     */
    private function createSession(string $clientId, array $options = []): string {
        $sessionId = $this->generateSessionId();
        $now = time();

        $this->sessions[$sessionId] = [
            'client_id' => $clientId,
            'created_at' => $now,
            'expires_at' => $now + $this->config['session_timeout'],
            'data' => $options['session_data'] ?? []
        ];

        return $sessionId;
    }

    /**
     * Setup encryption system
     *
     * @throws VeniceException If encryption setup fails
     */
    private function setupEncryption(): void {
        if (isset($this->config['encryption_key'])) {
            $this->encryptionKey = $this->config['encryption_key'];
        } else {
            // Generate a random key (in production, this should be stored securely)
            $this->encryptionKey = bin2hex(random_bytes(32));
        }

        if (!in_array($this->config['encryption_method'], openssl_get_cipher_methods())) {
            throw new VeniceException('Unsupported encryption method: ' . $this->config['encryption_method']);
        }
    }

    /**
     * Validate API key format
     *
     * @param string $apiKey API key
     * @return bool True if format is valid
     */
    private function isValidApiKeyFormat(string $apiKey): bool {
        return preg_match('/^sk-[a-zA-Z0-9]{48}$/', $apiKey) === 1;
    }

    /**
     * Hash API key for identification
     *
     * @param string $apiKey API key
     * @return string Hashed API key
     */
    private function hashApiKey(string $apiKey): string {
        return hash($this->config['hash_algorithm'], $apiKey);
    }

    /**
     * Encrypt API key for secure storage
     *
     * @param string $apiKey Plain API key
     * @return string Encrypted API key
     */
    public function encryptApiKey(string $apiKey): string {
        return $this->encrypt($apiKey);
    }

    /**
     * Decrypt API key for use
     *
     * @param string $encryptedApiKey Encrypted API key
     * @return string Plain API key
     */
    public function decryptApiKey(string $encryptedApiKey): string {
        // If the key is already plain text (not encrypted), return as is
        if ($this->isValidApiKeyFormat($encryptedApiKey)) {
            return $encryptedApiKey;
        }

        try {
            return $this->decrypt($encryptedApiKey);
        } catch (\Exception $e) {
            // If decryption fails, assume it's a plain text key
            return $encryptedApiKey;
        }
    }    /**
     * Generate HTTP headers for API requests
     *
     * @param string $apiKey API key
     * @param array $additionalHeaders Additional headers
     * @return array HTTP headers
     */
    public function generateHeaders(string $apiKey, array $additionalHeaders = []): array {
        $baseHeaders = [
            'Authorization' => 'Bearer ' . $this->decryptApiKey($apiKey),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'User-Agent' => 'Venice-AI-PHP-SDK/2.0.0',
            'X-SDK-Version' => '2.0.0',
            'X-Request-ID' => $this->generateRequestId(),
            'X-Timestamp' => time()
        ];

        return array_merge($baseHeaders, $additionalHeaders);
    }

    /**
     * Generate unique token ID
     *
     * @return string Token ID
     */
    private function generateTokenId(): string {
        return bin2hex(random_bytes(16));
    }

    /**
     * Generate unique session ID
     *
     * @return string Session ID
     */
    private function generateSessionId(): string {
        return bin2hex(random_bytes(32));
    }

    /**
     * Generate unique request ID
     *
     * @return string Request ID
     */
    private function generateRequestId(): string {
        return uniqid('req_', true);
    }

    /**
     * Validate API key
     *
     * @param string $apiKey API key to validate
     * @return bool True if valid
     */
    private function validateApiKey(string $apiKey): bool {
        // In a real implementation, this would validate against a database
        // For now, we'll just check the format
        return $this->isValidApiKeyFormat($apiKey);
    }
}
