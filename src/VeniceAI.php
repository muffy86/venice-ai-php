<?php

namespace Venice;

use Venice\Chat\ChatService;
use Venice\Image\ImageService;
use Venice\Models\ModelService;
use Venice\Http\HttpClient;

/**
 * Venice AI PHP SDK
 *
 * PHP client for interacting with the Venice AI API.
 * Implements OpenAI API specification for compatibility.
 *
 * The Venice AI API provides access to state-of-the-art AI models for text generation,
 * image generation, and more. This SDK provides a simple interface for accessing 
 * the API endpoints.
 *
 * Key features:
 * - OpenAI API compatibility
 * - Support for chat completions
 * - Support for image generation and upscaling
 * - Access to available models and model traits
 *
 * @link https://api.venice.ai/doc/api/swagger.yaml API Documentation
 */
class VeniceAI {
    /** @var string The API key for authentication */
    private string $apiKey;
    
    /** @var string The base URL for the Venice AI API */
    private const BASE_URL = 'https://api.venice.ai/api/v1';
    
    /** @var array Default request headers */
    private array $headers;

    /** @var bool Enable debug mode */
    private bool $debug = false;

    /** @var resource|null Debug output handle */
    private $debugHandle = null;

    /** @var ChatService Chat service instance */
    private ChatService $chat;

    /** @var ImageService Image service instance */
    private ImageService $image;

    /** @var ModelService Model service instance */
    private ModelService $models;

    /**
     * Constructor
     * 
     * @param string|null $apiKey API key (can also be loaded from config file)
     * @param bool $debug Enable debug mode (shows HTTP output)
     * @throws \Exception If config file is missing or API key is not set
     */
    public function __construct(?string $apiKey = null, bool $debug = false) {
        // If API key is provided directly, use it
        if ($apiKey !== null) {
            $this->apiKey = $apiKey;
        } else {
            // Otherwise try to load from config file
            $configFile = dirname(__DIR__) . '/config.php';
            
            if (!file_exists($configFile)) {
                throw new \Exception(
                    "Configuration file not found. Please copy config.example.php to config.php and set your API key or provide API key directly."
                );
            }

            $config = require $configFile;
            
            if (!is_array($config) || !isset($config['api_key']) || empty($config['api_key'])) {
                throw new \Exception(
                    "Invalid configuration. Please ensure config.php returns an array with 'api_key' set."
                );
            }

            if ($config['api_key'] === 'your-api-key-here') {
                throw new \Exception(
                    "Please set your API key in config.php. The default value is still in use."
                );
            }

            $this->apiKey = $config['api_key'];
        }

        // Set debug mode
        $this->debug = $debug ?? (getenv('DEBUG') ? (bool)getenv('DEBUG') : false);
        
        // Set up headers
        $this->headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];

        // Set up debug output
        if ($this->debug) {
            $this->debugHandle = fopen('php://stderr', 'w');
        }

        // Initialize services
        $this->chat = new ChatService($this);
        $this->image = new ImageService($this);
        $this->models = new ModelService($this);
    }

    /**
     * Destructor
     */
    public function __destruct() {
        if ($this->debugHandle) {
            fclose($this->debugHandle);
        }
    }

    /**
     * Get the Chat service
     *
     * @return ChatService
     */
    public function chat(): ChatService {
        return $this->chat;
    }

    /**
     * Get the Image service
     *
     * @return ImageService
     */
    public function image(): ImageService {
        return $this->image;
    }

    /**
     * Get the Models service
     *
     * @return ModelService
     */
    public function models(): ModelService {
        return $this->models;
    }

    /**
     * Validate the API key by making a simple request to the models endpoint
     *
     * @return bool True if the API key is valid
     */
    public function validateApiKey(): bool {
        try {
            $this->models()->list();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Make an HTTP request to the Venice AI API
     * 
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $endpoint API endpoint
     * @param array $data Request data (optional)
     * @param array $headers Additional headers (optional)
     * @return array|string The API response (array for JSON, string for binary)
     * @throws \Exception If the request fails
     */
    public function request(
        string $method, 
        string $endpoint, 
        array $data = [], 
        array $headers = []
    ): array|string {
        // Merge headers
        $requestHeaders = $this->headers;
        if (!empty($headers)) {
            $requestHeaders = array_merge($requestHeaders, $headers);
        }

        // Make the request
        return HttpClient::request(
            self::BASE_URL . $endpoint,
            $method,
            $requestHeaders,
            $data,
            $this->debug,
            $this->debugHandle
        );
    }

    /**
     * Get the base URL for the API
     * 
     * @return string
     */
    public function getBaseUrl(): string {
        return self::BASE_URL;
    }
}