<?php

/**
 * Venice AI PHP Examples
 * 
 * Example PHP client for interacting with the Venice AI API.
 * Implements OpenAI API specification for compatibility.
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

    /**
     * Constructor
     * 
     * @param bool $debug Enable debug mode
     * @throws Exception If config file is missing or API key is not set
     */
    public function __construct(bool $debug = false) {
        $configFile = __DIR__ . '/config.php';
        
        if (!file_exists($configFile)) {
            throw new Exception(
                "Configuration file not found. Please copy config.example.php to config.php and set your API key."
            );
        }

        $config = require $configFile;
        
        if (!is_array($config) || !isset($config['api_key']) || empty($config['api_key'])) {
            throw new Exception(
                "Invalid configuration. Please ensure config.php returns an array with 'api_key' set."
            );
        }

        if ($config['api_key'] === 'your-api-key-here') {
            throw new Exception(
                "Please set your API key in config.php. The default value is still in use."
            );
        }

        $this->apiKey = $config['api_key'];
        $this->debug = $debug;
        $this->headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
    }

    // Rest of the class implementation remains unchanged...
    
    /**
     * List available models
     * 
     * @param string|null $type Optional filter for model type ('text' or 'image')
     * @return array List of available models
     * @throws InvalidArgumentException If type is invalid
     * @throws Exception If the request fails
     */
    public function listModels(?string $type = null): array {
        $query = [];
        if ($type !== null) {
            if (!in_array($type, ['text', 'image'])) {
                throw new InvalidArgumentException("Type must be either 'text' or 'image'");
            }
            $query['type'] = $type;
        }

        return $this->request('GET', '/models' . ($query ? '?' . http_build_query($query) : ''));
    }

    // ... (rest of the methods remain the same)
}