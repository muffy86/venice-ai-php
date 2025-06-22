<?php

namespace Venice\Http;

use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\AuthenticationException;
use Venice\Exceptions\RateLimitException;

/**
 * Optimized HTTP client with connection pooling, caching, and performance enhancements
 */
class HttpClient {
    /** @var Logger|null Logger instance */
    private static ?Logger $logger = null;

    /** @var array Configuration options */
    private static array $config = [
        'timeout' => 30,
        'connect_timeout' => 5,
        'max_retries' => 3,
        'base_delay' => 1000,
        'user_agent' => 'Venice-AI-PHP-SDK/2.0.0',
        'keep_alive' => true,
        'connection_pool_size' => 10,
        'dns_cache_timeout' => 300,
        'buffer_size' => 65536, // 64KB
        'hardware_optimizations' => [
            'nvidia_5080' => false,
            'intel_i9' => false,
            'display_240hz' => false,
        ]
    ];
=======
    /** @var array Configuration options */
    private static array $config = [
        'timeout' => 30,
        'connect_timeout' => 5,
        'max_retries' => 3,
        'base_delay' => 1000,
        'user_agent' => 'Venice-AI-PHP-SDK/2.0.0',
        'keep_alive' => true,
        'connection_pool_size' => 10,
        'dns_cache_timeout' => 300,
        'buffer_size' => 65536, // 64KB
        'hardware_optimizations' => [
            'nvidia_5080' => false,
            'intel_i9' => false,
            'display_240hz' => false,
        ]
    ];

    /** @var array Request statistics */
    private static array $stats = [
        'requests' => 0,
        'retries' => 0,
        'errors' => 0,
        'total_time' => 0,
        'cache_hits' => 0,
        'connection_reuses' => 0
    ];

    /** @var array Connection pool */
    private static array $connectionPool = [];

    /** @var array Response cache */
    private static array $responseCache = [];

    /** @var int Maximum cache size */
    private static int $maxCacheSize = 1000;

    /**
     * Set logger instance
     */
    public static function setLogger(Logger $logger): void {
        self::$logger = $logger;
    }

    /**
     * Configure HTTP client
     */
    public static function configure(array $config): void {
        self::$config = array_merge(self::$config, $config);
    }

    /**
     * Make HTTP request with enhanced performance optimizations
     */
    public static function request(
        string $url,
        string $method = 'GET',
        array $headers = [],
        array $data = [],
        bool $debug = false,
        $debugHandle = null
    ): array|string {
        $startTime = microtime(true);
        self::$stats['requests']++;

        // Check cache for GET requests
        if ($method === 'GET' && empty($data)) {
            $cacheKey = self::getCacheKey($url, $headers);
            if (isset(self::$responseCache[$cacheKey])) {
                self::$stats['cache_hits']++;
                return self::$responseCache[$cacheKey];
            }
        }

        $attempt = 0;
        $lastException = null;

        while ($attempt < self::$config['max_retries']) {
            try {
                $response = self::makeOptimizedRequest($url, $method, $headers, $data, $debug, $debugHandle);

                // Cache successful GET responses
                if ($method === 'GET' && empty($data)) {
                    self::cacheResponse($url, $headers, $response);
                }

                // Record successful request time
                self::$stats['total_time'] += microtime(true) - $startTime;

                return $response;
            } catch (VeniceException $e) {
                $lastException = $e;
                $attempt++;

                if ($attempt < self::$config['max_retries'] && self::isRetryableError($e)) {
                    self::$stats['retries']++;
                    $delay = self::calculateDelay($attempt);

                    if (self::$logger) {
                        self::$logger->warning("Request failed, retrying in {$delay}ms", [
                            'attempt' => $attempt,
                            'error' => $e->getMessage(),
                            'url' => $url
                        ]);
                    }

                    usleep($delay * 1000); // Convert to microseconds
                } else {
                    self::$stats['errors']++;
                    if (self::$logger) {
                        self::$logger->error("Request failed after {$attempt} attempts", [
                            'error' => $e->getMessage(),
                            'url' => $url
                        ]);
                    }
                    break;
                }
            }
        }

        throw $lastException ?? new VeniceException('Request failed after maximum retries');
    }

    /**
     * Make optimized HTTP request with connection pooling
     */
    private static function makeOptimizedRequest(
        string $url,
        string $method,
        array $headers,
        array $data,
        bool $debug,
        $debugHandle
    ): array|string {
        $ch = self::getConnection($url);

        // Optimized cURL options
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => self::$config['timeout'],
            CURLOPT_CONNECTTIMEOUT => self::$config['connect_timeout'],
            CURLOPT_USERAGENT => self::$config['user_agent'],
            CURLOPT_HTTPHEADER => self::formatHeaders($headers),
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_ENCODING => '', // Enable compression
            CURLOPT_TCP_NODELAY => true, // Disable Nagle's algorithm
            CURLOPT_TCP_KEEPALIVE => self::$config['keep_alive'] ? 1 : 0,
            CURLOPT_TCP_KEEPIDLE => 120,
            CURLOPT_TCP_KEEPINTVL => 60,
            CURLOPT_FRESH_CONNECT => false, // Reuse connections
            CURLOPT_FORBID_REUSE => false,
            CURLOPT_DNS_CACHE_TIMEOUT => self::$config['dns_cache_timeout'],
            CURLOPT_BUFFERSIZE => self::$config['buffer_size'],
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0, // Use HTTP/2 when available
            CURLOPT_ACCEPT_ENCODING => 'gzip, deflate, br', // Support modern compression
            CURLOPT_PIPEWAIT => 1, // Enable HTTP/2 pipelining
        ]);

        // Set method-specific options
        self::setMethodOptions($ch, $method, $data);

        // Debug output
        if ($debug && $debugHandle) {
            curl_setopt($ch, CURLOPT_VERBOSE, true);
            curl_setopt($ch, CURLOPT_STDERR, $debugHandle);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        // Don't close connection if using connection pooling
        if (!self::$config['keep_alive']) {
            curl_close($ch);
        }

        if ($response === false) {
            throw new VeniceException("cURL error: $error");
        }

        return self::handleResponse($response, $httpCode, $url);
    }

    /**
     * Get or create connection from pool
     */
    private static function getConnection(string $url): \CurlHandle {
        $host = parse_url($url, PHP_URL_HOST);

        if (self::$config['keep_alive'] && isset(self::$connectionPool[$host])) {
            self::$stats['connection_reuses']++;
            return self::$connectionPool[$host];
        }

        $ch = curl_init();

        if (self::$config['keep_alive']) {
            // Manage pool size with LRU eviction
            if (count(self::$connectionPool) >= self::$config['connection_pool_size']) {
                $oldestHost = array_key_first(self::$connectionPool);
                curl_close(self::$connectionPool[$oldestHost]);
                unset(self::$connectionPool[$oldestHost]);
            }

            self::$connectionPool[$host] = $ch;
        }

        return $ch;
    }

    /**
     * Set method-specific cURL options
     */
    private static function setMethodOptions($ch, string $method, array $data): void {
        switch (strtoupper($method)) {
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                if (!empty($data)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                if (!empty($data)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
            case 'PATCH':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
                if (!empty($data)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
                break;
            default:
                curl_setopt($ch, CURLOPT_HTTPGET, true);
        }
    }

    /**
     * Handle HTTP response with optimized error handling
     */
    private static function handleResponse(string $response, int $httpCode, string $url): array|string {
        // Handle different HTTP status codes
        switch ($httpCode) {
            case 200:
            case 201:
                break;
            case 401:
                throw new AuthenticationException('Invalid API key or authentication failed');
            case 429:
                throw new RateLimitException('Rate limit exceeded');
            case 400:
                $decoded = json_decode($response, true);
                $message = $decoded['error']['message'] ?? 'Bad request';
                throw new VeniceException("Bad request: $message");
            case 404:
                throw new VeniceException('Endpoint not found');
            case 500:
            case 502:
            case 503:
            case 504:
                throw new VeniceException("Server error (HTTP $httpCode)");
            default:
                throw new VeniceException("Unexpected HTTP status code: $httpCode");
        }

        // Optimized JSON decoding
        if (str_starts_with(trim($response), ['{', '['])) {
            try {
                return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                // Fallback to raw response if JSON decoding fails
                return $response;
            }
        }

        return $response;
    }

    /**
     * Generate cache key for response caching
     */
    private static function getCacheKey(string $url, array $headers): string {
        return md5($url . serialize($headers));
    }

    /**
     * Cache response with LRU eviction
     */
    private static function cacheResponse(string $url, array $headers, $response): void {
        $cacheKey = self::getCacheKey($url, $headers);

        // Implement LRU eviction
        if (count(self::$responseCache) >= self::$maxCacheSize) {
            array_shift(self::$responseCache); // Remove oldest entry
        }

        self::$responseCache[$cacheKey] = $response;
    }

    /**
     * Check if error is retryable
     */
    private static function isRetryableError(VeniceException $e): bool {
        return !($e instanceof AuthenticationException) &&
               !($e instanceof RateLimitException) &&
               !str_contains($e->getMessage(), 'Bad request');
    }

    /**
     * Format headers for cURL
     */
    private static function formatHeaders(array $headers): array {
        $formatted = [];
        foreach ($headers as $key => $value) {
            $formatted[] = "$key: $value";
        }
        return $formatted;
    }

    /**
     * Calculate exponential backoff delay with jitter
     */
    private static function calculateDelay(int $attempt): int {
        $baseDelay = self::$config['base_delay'] * pow(2, $attempt - 1);
        $jitter = mt_rand(0, (int)($baseDelay * 0.1)); // Add up to 10% jitter
        return min($baseDelay + $jitter, 30000); // Max 30 seconds
    }

    /**
     * Get request statistics
     */
    public static function getStats(): array {
        return array_merge(self::$stats, [
            'cache_size' => count(self::$responseCache),
            'connection_pool_size' => count(self::$connectionPool),
            'avg_request_time' => self::$stats['requests'] > 0
                ? self::$stats['total_time'] / self::$stats['requests']
                : 0
        ]);
    }

    /**
     * Reset statistics
     */
    public static function resetStats(): void {
        self::$stats = [
            'requests' => 0,
            'retries' => 0,
            'errors' => 0,
            'total_time' => 0,
            'cache_hits' => 0,
            'connection_reuses' => 0
        ];
    }

    /**
     * Clear response cache
     */
    public static function clearCache(): void {
        self::$responseCache = [];
    }

    /**
     * Close all connections in pool
     */
    public static function closeConnections(): void {
        foreach (self::$connectionPool as $ch) {
            curl_close($ch);
        }
        self::$connectionPool = [];
    }

    /**
     * Cleanup resources
     */
    public static function cleanup(): void {
        self::clearCache();
        self::closeConnections();
        self::resetStats();
    }
}
