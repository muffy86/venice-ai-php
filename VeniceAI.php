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

    /** @var resource|null Debug output handle */
    private $debugHandle = null;

    /** @var array Valid image sizes with descriptive keys */
    private const VALID_SIZES = [
        'square' => [1024, 1024],
        'portrait' => [1024, 1280],
        'landscape' => [1280, 1024]
    ];

    /** @var array Valid style presets */
    private const VALID_STYLES = [
        // Artistic
        "3D Model", "Analog Film", "Anime", "Comic Book", "Digital Art",
        "Enhance", "Fantasy Art", "Isometric Style", "Line Art", "Lowpoly",
        "Neon Punk", "Origami", "Pixel Art", "Texture",
        // Commercial
        "Advertising", "Food Photography", "Real Estate",
        // Fine Art
        "Abstract", "Cubist", "Graffiti", "Hyperrealism", "Impressionist",
        "Pointillism", "Pop Art", "Psychedelic", "Renaissance", "Steampunk",
        "Surrealist", "Typography", "Watercolor",
        // Gaming
        "Fighting Game", "GTA", "Super Mario", "Minecraft", "Pokemon",
        "Retro Arcade", "Retro Game", "RPG Fantasy Game", "Strategy Game",
        "Street Fighter", "Legend of Zelda",
        // Aesthetic
        "Architectural", "Disco", "Dreamscape", "Dystopian", "Fairy Tale",
        "Gothic", "Grunge", "Horror", "Minimalist", "Monochrome", "Nautical",
        "Space", "Stained Glass", "Techwear Fashion", "Tribal", "Zentangle",
        // Paper Art
        "Collage", "Flat Papercut", "Kirigami", "Paper Mache", "Paper Quilling",
        "Papercut Collage", "Papercut Shadow Box", "Stacked Papercut",
        "Thick Layered Papercut",
        // Photography
        "Alien", "Film Noir", "HDR", "Long Exposure", "Neon Noir",
        "Silhouette", "Tilt-Shift"
    ];

    /**
     * Constructor
     * 
     * @param bool $debug Enable debug mode (shows HTTP output)
     * @throws Exception If config file is missing or API key is not set
     */
    public function __construct(bool $debug = null) {
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
        // Check environment variable first, then constructor parameter, default to false
        $this->debug = $debug ?? (getenv('DEBUG') ? (bool)getenv('DEBUG') : false);
        $this->headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];

        // Set up debug output
        if ($this->debug) {
            $this->debugHandle = fopen('php://stderr', 'w');
        }
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
     * List available models
     * 
     * @param string|null $type Optional filter for model type ('text' or 'image')
     * @return array List of available models
     * @throws InvalidArgumentException If type is invalid
     * @throws Exception If the request fails
     */
    public function listModels(?string $type = null): array {
        $endpoint = '/models';
        if ($type !== null) {
            if (!in_array($type, ['text', 'image'])) {
                throw new InvalidArgumentException("Type must be either 'text' or 'image'");
            }
            $endpoint .= '?type=' . urlencode($type);
        }
        return $this->request('GET', $endpoint);
    }

    /**
     * List available text models
     * 
     * @return array List of available text models
     * @throws Exception If the request fails
     */
    public function listTextModels(): array {
        return $this->listModels('text');
    }

    /**
     * List available image models
     * 
     * @return array List of available image models
     * @throws Exception If the request fails
     */
    public function listImageModels(): array {
        return $this->listModels('image');
    }

    /**
     * Create a chat completion
     * 
     * @param array $messages Array of message objects
     * @param string $model Model to use (e.g., 'qwen-2.5-vl' for vision)
     * @param array $options Additional options
     * @return array The API response
     * @throws InvalidArgumentException If parameters are invalid
     * @throws Exception If the request fails
     */
    public function createChatCompletion(array $messages, string $model = 'qwen-2.5-vl', array $options = []): array {
        if (empty($messages)) {
            throw new InvalidArgumentException('messages array is required');
        }

        // Validate each message
        foreach ($messages as $message) {
            if (!isset($message['role'])) {
                throw new InvalidArgumentException('Each message must have a role');
            }
            if (!in_array($message['role'], ['system', 'user', 'assistant'])) {
                throw new InvalidArgumentException('Invalid role: ' . $message['role']);
            }
            if (!isset($message['content'])) {
                throw new InvalidArgumentException('Each message must have content');
            }
        }

        // Build request data
        $data = [
            'model' => $model,
            'messages' => $messages
        ];

        // Add optional parameters
        $optionalParams = [
            'temperature',
            'top_p',
            'n',
            'stream',
            'stop',
            'max_tokens',
            'presence_penalty',
            'frequency_penalty',
            'logit_bias',
            'user'
        ];

        foreach ($optionalParams as $param) {
            if (isset($options[$param])) {
                $data[$param] = $options[$param];
            }
        }

        // Make the request
        return $this->request('POST', '/chat/completions', $data);
    }

    /**
     * Generate an image
     * 
     * @param array $options Image generation options
     * @return array The API response
     * @throws InvalidArgumentException If required options are missing or invalid
     * @throws Exception If the request fails
     */
    public function generateImage(array $options): array {
        // Validate required parameters
        if (empty($options['prompt'])) {
            throw new InvalidArgumentException('prompt is required for image generation');
        }
        if (strlen($options['prompt']) > 1500) {
            throw new InvalidArgumentException('prompt must not exceed 1500 characters');
        }

        // Convert width and height to numbers
        if (isset($options['width'])) {
            $options['width'] = (int)$options['width'];
        }
        if (isset($options['height'])) {
            $options['height'] = (int)$options['height'];
        }

        // Validate size if both width and height are provided
        if (isset($options['width']) && isset($options['height'])) {
            $size = [$options['width'], $options['height']];
            $validSizes = array_map(function($s) { return implode('x', $s); }, self::VALID_SIZES);
            $requestedSize = $size[0] . 'x' . $size[1];
            
            if (!in_array($requestedSize, $validSizes)) {
                $sizeDescriptions = array_map(function($name, $dimensions) {
                    return "$name (" . implode('x', $dimensions) . ")";
                }, array_keys(self::VALID_SIZES), self::VALID_SIZES);
                
                throw new InvalidArgumentException(
                    "Invalid image size: $requestedSize. Available sizes: " . implode(', ', $sizeDescriptions)
                );
            }
        }

        // Validate steps if provided
        if (isset($options['steps'])) {
            $steps = (int)$options['steps'];
            if ($steps < 1 || $steps > 50) {
                throw new InvalidArgumentException('steps must be between 1 and 50');
            }
            $options['steps'] = $steps;
        }

        // Validate style preset if provided
        if (isset($options['style_preset'])) {
            if (!in_array($options['style_preset'], self::VALID_STYLES)) {
                throw new InvalidArgumentException(
                    'Invalid style_preset. Must be one of: ' . implode(' ', self::VALID_STYLES)
                );
            }
        }

        // Validate negative prompt if provided
        if (isset($options['negative_prompt'])) {
            if (strlen($options['negative_prompt']) > 1500) {
                throw new InvalidArgumentException('negative_prompt must not exceed 1500 characters');
            }
        }

        // Convert numeric parameters to numbers
        if (isset($options['seed'])) {
            $options['seed'] = (int)$options['seed'];
        }
        if (isset($options['cfg_scale'])) {
            $options['cfg_scale'] = (float)$options['cfg_scale'];
            if ($options['cfg_scale'] < 0) {
                throw new InvalidArgumentException('cfg_scale must be a positive number');
            }
        }

        // Build request data
        $data = [
            'model' => $options['model'] ?? 'fluently-xl',
            'prompt' => $options['prompt']
        ];

        // Add optional parameters
        $optionalParams = [
            'width',
            'height',
            'steps',
            'hide_watermark',
            'return_binary',
            'seed',
            'cfg_scale',
            'style_preset',
            'negative_prompt',
            'safe_mode'
        ];

        foreach ($optionalParams as $param) {
            if (isset($options[$param])) {
                $data[$param] = $options[$param];
            }
        }

        // Set Accept header for binary response if requested
        $originalHeaders = $this->headers;
        if (isset($data['return_binary']) && $data['return_binary']) {
            $this->headers['Accept'] = 'image/*';
        }

        try {
            // Make the request
            $response = $this->request('POST', '/image/generate', $data);

            // Handle binary response
            if (isset($data['return_binary']) && $data['return_binary']) {
                return [
                    'data' => base64_encode($response)
                ];
            }

            // Debug response
            if ($this->debug) {
                echo "\nResponse type: " . gettype($response) . "\n";
                if (is_array($response)) {
                    echo "Array keys: " . implode(', ', array_keys($response)) . "\n";
                    if (isset($response['images'])) {
                        echo "Images type: " . gettype($response['images']) . "\n";
                    }
                }
            }

            // Handle response
            if (is_array($response) && isset($response['images']) &&
                is_array($response['images']) && !empty($response['images'])) {
                // The images array contains the base64 strings directly
                return [
                    'data' => [
                        [
                            'b64_json' => $response['images'][0]
                        ]
                    ]
                ];
            }

            // If we get here, the response wasn't in the expected format
            if ($this->debug) {
                echo "\nUnexpected API Response Structure:\n";
                if (is_array($response)) {
                    echo "Response structure:\n";
                    $structure = array_map(function($val) {
                        if (is_string($val) && (
                            strpos($val, 'base64') !== false ||
                            strlen($val) > 100
                        )) {
                            return '[long string/base64 data]';
                        }
                        return $val;
                    }, $response);
                    var_export($structure);
                } else {
                    echo "Response type: " . gettype($response) . "\n";
                }
            }
            throw new Exception('Response missing expected image data. Check debug output for details.');
        } finally {
            $this->headers = $originalHeaders;
        }
    }

    /**
     * Upscale an image
     * 
     * @param array $options Image upscaling options
     * @return array The API response
     * @throws InvalidArgumentException If required options are missing or invalid
     * @throws Exception If the request fails
     */
    public function upscaleImage(array $options): array {
        if (empty($options['image'])) {
            throw new InvalidArgumentException('image is required for upscaling');
        }

        if (!isset($options['scale'])) {
            throw new InvalidArgumentException('scale is required for upscaling');
        }

        // Convert scale to string and validate
        $scale = (string)$options['scale'];
        if (!in_array($scale, ['2', '4'], true)) {
            throw new InvalidArgumentException('scale must be "2" or "4"');
        }

        // Validate image file exists
        if (is_string($options['image']) && !file_exists($options['image'])) {
            throw new InvalidArgumentException('image file not found: ' . $options['image']);
        }

        // Prepare request data
        $data = [
            'scale' => $scale,
            'return_binary' => true
        ];

        // Add image file
        if (is_string($options['image'])) {
            $data['image'] = $options['image'];
        } else {
            throw new InvalidArgumentException('image must be a file path');
        }

        // Set headers for multipart form data and binary response
        $originalHeaders = $this->headers;
        $this->headers = array_filter($this->headers, function($key) {
            return strtolower($key) !== 'content-type' && strtolower($key) !== 'accept';
        }, ARRAY_FILTER_USE_KEY);
        $this->headers['Accept'] = 'image/*';
        
        try {
            $response = $this->request('POST', '/image/upscale', $data);
            
            // For upscaling, we get back raw PNG data
            if (empty($response)) {
                throw new Exception('No image data received from upscaling request');
            }

            // Convert raw image data to expected format
            return [
                'data' => [
                    [
                        'b64_json' => base64_encode($response)
                    ]
                ]
            ];
        } finally {
            $this->headers = $originalHeaders;
        }
    }

    /**
     * Make an HTTP request to the Venice AI API
     * 
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $endpoint API endpoint
     * @param array $data Request data (optional)
     * @return array|string The API response (array for JSON, string for binary)
     * @throws Exception If the request fails
     */
    private function request(string $method, string $endpoint, array $data = []): array|string {
        require_once __DIR__ . '/examples/HttpClient.php';
        return HttpClient::request(
            self::BASE_URL . $endpoint,
            $method,
            $this->headers,
            $data,
            $this->debug,
            $this->debugHandle
        );
    }

}