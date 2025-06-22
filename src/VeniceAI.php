<?php

namespace Venice;

use Venice\Chat\ChatService;
use Venice\Image\ImageService;
use Venice\Models\ModelService;
use Venice\Audio\AudioService;
use Venice\Embeddings\EmbeddingsService;
use Venice\Http\HttpClient;
use Venice\Utils\Logger;
use Venice\Cache\CacheManager;
use Venice\Events\EventManager;
use Venice\Events\Event;
use Venice\Security\SecurityManager;
use Venice\Async\AsyncProcessor;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\AuthenticationException;
use Venice\Monitoring\MetricsCollector;
use Venice\Plugins\PluginManager;
use Venice\Config\ConfigManager;

/**
 * Venice AI PHP SDK - Enterprise Edition
 *
 * Comprehensive PHP client for interacting with the Venice AI API.
 * Implements OpenAI API specification with extensive enhancements.
 *
 * The Venice AI API provides access to state-of-the-art AI models for:
 * - Text generation and chat completions
 * - Image generation, editing, and upscaling
 * - Audio transcription, translation, and generation
 * - Text embeddings and semantic search
 * - Advanced AI model management
 *
 * Advanced features:
 * - Multi-tier caching system (Memory, Redis, File)
 * - Event-driven architecture with hooks
 * - Advanced security and authentication
 * - Asynchronous processing and streaming
 * - Performance monitoring and metrics
 * - Plugin system and extensibility
 * - Comprehensive error handling and logging
 * - Request validation and retry mechanisms
 * - Rate limiting and abuse protection
 *
 * @link https://api.venice.ai/doc/api/swagger.yaml API Documentation
 * @version 2.0.0
 */
class VeniceAI {
    /** @var string The API key for authentication */
    private string $apiKey;

    /** @var string The base URL for the Venice AI API */
    private const BASE_URL = 'https://api.venice.ai/v2';

    /** @var array Default request headers */
    private array $headers;

    /** @var bool Enable debug mode */
    private bool $debug = false;

    /** @var resource|null Debug output handle */
    private $debugHandle = null;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var ChatService Chat service instance */
    private ChatService $chat;

    /** @var ImageService Image service instance */
    private ImageService $image;

    /** @var ModelService Model service instance */
    private ModelService $models;

    /** @var AudioService Audio service instance */
    private AudioService $audio;

    /** @var EmbeddingsService Embeddings service instance */
    private EmbeddingsService $embeddings;

    /** @var CacheManager Cache manager instance */
    private CacheManager $cache;

    /** @var EventManager Event manager instance */
    private EventManager $events;

    /** @var SecurityManager Security manager instance */
    private SecurityManager $security;

    /** @var AsyncProcessor Async processor instance */
    private AsyncProcessor $async;

    /** @var array Configuration options */
    private array $config = [];

    /** @var MetricsCollector Metrics collector instance */
    private MetricsCollector $metricsCollector;

    /** @var PluginManager Plugin manager instance */
    private PluginManager $pluginManager;

    /** @var ConfigManager Configuration manager instance */
    private ConfigManager $configManager;

    /** @var float Initialization timestamp */
    private float $initTime;

    /**
     * Constructor
     *
     * @param string|null $apiKey API key (can also be loaded from config file)
     * @param array $options Configuration options
     * @throws VeniceException If config file is missing or API key is not set
     */
    public function __construct(?string $apiKey = null, array $options = []) {
        // Set default options
        $this->config = array_merge([
            'debug' => false,
            'log_file' => null,
            'timeout' => 30,
            'max_retries' => 3,
            'base_delay' => 1000,
            'cache' => [
                'driver' => 'auto',
                'redis_dsn' => 'redis://localhost:6379',
                'file_cache_dir' => sys_get_temp_dir() . '/venice_cache'
            ],
            'security' => [
                'encryption_method' => 'AES-256-CBC',
                'rate_limit_window' => 60,
                'rate_limit_max' => 100
            ],
            'async' => [
                'max_workers' => 4,
                'enable_parallel' => true
            ]
        ], $options);

        // Initialize logger
        $this->logger = new Logger(
            $this->config['log_file'],
            $this->config['debug']
        );

        // Initialize core systems
        $this->initializeSystems();

        // Load API key through security manager
        $this->loadApiKey($apiKey);

        // Set debug mode
        $this->debug = $this->config['debug'] ?? (getenv('DEBUG') ? (bool)getenv('DEBUG') : false);

        // Set up headers with enhanced security
        $this->headers = $this->security->generateHeaders($this->apiKey);

        // Set up debug output
        if ($this->debug) {
            $this->debugHandle = fopen('php://stderr', 'w');
        }

        // Initialize services
        $this->initializeServices();

        $this->logger->info('Venice AI SDK initialized', [
            'version' => '2.0.0',
            'debug' => $this->debug,
            'base_url' => self::BASE_URL
        ]);

        // Dispatch initialization event
        $this->events->dispatch(new Event('venice.init', [
            'debug' => $this->debug,
            'config' => array_diff_key($this->config, ['api_key' => true])
        ]));
    }

    /**
     * Initialize core systems with lazy loading optimization
     */
    private function initializeSystems(): void {
        $this->initTime = microtime(true);

        // Initialize event manager first since other systems depend on it
        $this->events = new EventManager($this->logger);

        // Initialize configuration manager with lazy loading
        $this->configManager = new ConfigManager($this->logger, $this->events, $this->config['config'] ?? []);

        // Initialize cache manager early for performance
        $this->cache = new CacheManager($this->config['cache'], $this->logger, $this->events);

        // Initialize security manager
        $this->security = new SecurityManager($this->config['security'], $this->logger, $this->events);

        // Initialize metrics collector early for monitoring
        $this->metricsCollector = new MetricsCollector($this->logger, $this->events);

        // Defer async processor initialization if not needed immediately
        if ($this->config['async']['enable_parallel'] ?? true) {
            $this->async = new AsyncProcessor($this->config['async'], $this->logger, $this->events);
        }

        // Defer plugin manager initialization to reduce startup time
        if ($this->config['plugins']['enabled'] ?? true) {
            $this->pluginManager = new PluginManager($this, $this->logger, $this->events, $this->config['plugins'] ?? []);
        }

        // Configure HTTP client with optimized settings
        HttpClient::setLogger($this->logger);
        HttpClient::configure([
            'timeout' => $this->config['timeout'],
            'max_retries' => $this->config['max_retries'],
            'base_delay' => $this->config['base_delay'],
            'cache_manager' => $this->cache,
            'security_manager' => $this->security,
            'async_processor' => $this->async ?? null
        ]);
    }

    /**
     * Initialize service instances
     */
    private function initializeServices(): void {
        $this->chat = new ChatService($this);
        $this->image = new ImageService($this);
        $this->models = new ModelService($this);
        $this->audio = new AudioService($this);
        $this->embeddings = new EmbeddingsService($this);
    }

    /**
     * Load API key with enhanced security
     */
    private function loadApiKey(?string $apiKey): void {
        if ($apiKey !== null) {
            $this->apiKey = $this->security->encryptApiKey($apiKey);
            return;
        }

        $configFile = dirname(__DIR__) . '/config.php';
        if (!file_exists($configFile)) {
            throw new VeniceException(
                "Configuration file not found. Please copy config.example.php to config.php and set your API key."
            );
        }

        $config = require $configFile;
        if (!isset($config['api_key']) || empty($config['api_key'])) {
            throw new VeniceException("API key not found in configuration.");
        }

        $this->apiKey = $this->security->encryptApiKey($config['api_key']);
    }

    /**
     * Get service instances
     */
    public function chat(): ChatService { return $this->chat; }
    public function image(): ImageService { return $this->image; }
    public function models(): ModelService { return $this->models; }
    public function audio(): AudioService { return $this->audio; }
    public function embeddings(): EmbeddingsService { return $this->embeddings; }

    /**
     * Get system managers
     */
    public function cache(): CacheManager { return $this->cache; }
    public function events(): EventManager { return $this->events; }
    public function security(): SecurityManager { return $this->security; }
    public function async(): AsyncProcessor { return $this->async; }
    public function getLogger(): Logger { return $this->logger; }

    /**
     * Make an HTTP request to the Venice AI API with enhanced features
     */
    public function request(
        string $method,
        string $endpoint,
        array $data = [],
        array $headers = []
    ): array|string {
        $startTime = microtime(true);
        $this->metricsCollector->increment('api.requests');

        try {
            // Check rate limits
            if (!$this->security->checkRateLimit($this->apiKey)) {
                throw new VeniceException("Rate limit exceeded");
            }

            // Try cache first
            $cacheKey = $this->generateCacheKey($method, $endpoint, $data);
            $cachedResponse = $this->cache->get($cacheKey);

            if ($cachedResponse !== null) {
                $this->metricsCollector->increment('cache.hits');
                return $cachedResponse;
            }

            $this->metricsCollector->increment('cache.misses');

            // Merge and sign headers
            $requestHeaders = array_merge(
                $this->headers,
                $headers,
                ['X-Request-Signature' => $this->security->signRequest($data)]
            );

            // Dispatch pre-request event
            $this->events->dispatch(new Event('venice.api.request', [
                'method' => $method,
                'endpoint' => $endpoint,
                'data_size' => count($data)
            ]));

            // Make the request
            $response = HttpClient::request(
                self::BASE_URL . $endpoint,
                $method,
                $requestHeaders,
                $data,
                $this->debug,
                $this->debugHandle
            );

            // Cache successful response
            if (is_array($response)) {
                $this->cache->set($cacheKey, $response);
            }

            // Update metrics
            $duration = microtime(true) - $startTime;
            $this->metricsCollector->record('api.request_time', $duration);

            // Dispatch post-request event
            $this->events->dispatch(new Event('venice.api.response', [
                'duration' => $duration,
                'endpoint' => $endpoint,
                'status' => 'success'
            ]));

            return $response;

        } catch (\Exception $e) {
            $this->metricsCollector->increment('api.errors');

            $this->events->dispatch(new Event('venice.api.error', [
                'error' => $e->getMessage(),
                'endpoint' => $endpoint
            ]));

            throw $e;
        }
    }

    /**
     * Generate cache key for request
     */
    private function generateCacheKey(string $method, string $endpoint, array $data): string {
        return md5($method . $endpoint . json_encode($data));
    }

    /**
     * Get metrics collector instance
     */
    public function metrics(): MetricsCollector {
        return $this->metricsCollector;
    }

    /**
     * Get plugin manager instance
     */
    public function plugins(): PluginManager {
        return $this->pluginManager;
    }

    /**
     * Get configuration manager instance
     */
    public function config(): ConfigManager {
        return $this->configManager;
    }

    /**
     * Get comprehensive metrics
     */
    public function getMetrics(): array {
        return $this->metricsCollector->getMetrics();
    }

    /**
     * Reset metrics
     */
    public function resetMetrics(): void {
        $this->metricsCollector->reset();
    }

    /**
     * Get health status
     */
    public function getHealth(): array {
        return $this->metricsCollector->getHealthReport();
    }

    public function __destruct() {
        // Record shutdown metrics
        $this->metricsCollector->record('sdk.uptime', microtime(true) - $this->initTime);
        $this->metricsCollector->captureShutdownMetrics();

        // Dispatch shutdown event
        $this->events->dispatch(new Event('venice.shutdown', [
            'uptime' => microtime(true) - $this->initTime
        ]));

        // Cleanup resources
        $this->cache->cleanup();
        $this->async->shutdown();

        if ($this->debugHandle) {
            fclose($this->debugHandle);
        }

        $this->logger->info('Venice AI client shutdown completed');
    }
}
