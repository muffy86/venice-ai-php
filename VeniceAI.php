<?php

/**
 * VeniceAI PHP API Client
 * 
 * A PHP client for interacting with the Venice AI API.
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
     * @param string $apiKey Your Venice AI API key
     * @param bool $debug Enable debug mode
     * @throws InvalidArgumentException If API key is empty
     */
    public function __construct(string $apiKey, bool $debug = false) {
        if (empty($apiKey)) {
            throw new InvalidArgumentException('API key cannot be empty');
        }

        $this->apiKey = $apiKey;
        $this->debug = $debug;
        $this->headers = [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ];
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
        $query = [];
        if ($type !== null) {
            if (!in_array($type, ['text', 'image'])) {
                throw new InvalidArgumentException("Type must be either 'text' or 'image'");
            }
            $query['type'] = $type;
        }

        return $this->request('GET', '/models' . ($query ? '?' . http_build_query($query) : ''));
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
     * @param array $messages Array of message objects with role and content
     * @param string $model Model to use (default: "default")
     * @param array $options Additional options including venice_parameters
     * @return array The API response
     * @throws InvalidArgumentException If messages array is empty or invalid
     * @throws Exception If the request fails
     */
    public function createChatCompletion(
        array $messages,
        string $model = 'default',
        array $options = []
    ): array {
        if (empty($messages)) {
            throw new InvalidArgumentException('Messages array cannot be empty');
        }

        foreach ($messages as $message) {
            if (!isset($message['role']) || !isset($message['content'])) {
                throw new InvalidArgumentException('Each message must have a role and content');
            }
            if (!in_array($message['role'], ['system', 'user', 'assistant'])) {
                throw new InvalidArgumentException('Invalid message role. Must be system, user, or assistant');
            }
        }

        $data = array_merge([
            'model' => $model,
            'messages' => $messages
        ], $options);

        return $this->request('POST', '/chat/completions', $data);
    }

    /**
     * Create a chat completion with Venice system prompts disabled
     * 
     * @param array $messages Array of message objects with role and content
     * @param string $model Model to use (default: "default")
     * @param array $options Additional options
     * @return array The API response
     * @throws InvalidArgumentException If messages array is empty or invalid
     * @throws Exception If the request fails
     */
    public function createChatCompletionWithoutSystemPrompts(
        array $messages,
        string $model = 'default',
        array $options = []
    ): array {
        $options['venice_parameters'] = array_merge(
            $options['venice_parameters'] ?? [],
            ['include_venice_system_prompt' => false]
        );

        return $this->createChatCompletion($messages, $model, $options);
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
        if (empty($options['prompt'])) {
            throw new InvalidArgumentException('Prompt is required for image generation');
        }

        $data = [
            'model' => $options['model'] ?? 'fluently-xl',
            'prompt' => $options['prompt'],
            'return_binary' => true
        ];

        // Set Accept header for binary response
        $originalHeaders = $this->headers;
        $this->headers['Accept'] = 'image/*';
        
        try {
            return $this->request('POST', '/image/generate', $data);
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
            throw new InvalidArgumentException('Image is required for upscaling');
        }

        if (!empty($options['scale']) && !is_numeric($options['scale'])) {
            throw new InvalidArgumentException('Scale must be a number');
        }

        // Validate image file exists
        if (is_string($options['image']) && !file_exists($options['image'])) {
            throw new InvalidArgumentException('Image file not found: ' . $options['image']);
        }

        // Prepare request data
        $data = [
            'return_binary' => true
        ];

        // Add scale if provided
        if (isset($options['scale'])) {
            $data['scale'] = $options['scale'];
        }

        // Add image file
        if (is_string($options['image'])) {
            $data['image'] = $options['image'];
        } else {
            throw new InvalidArgumentException('Image must be a file path');
        }

        // Set headers for multipart form data and binary response
        $originalHeaders = $this->headers;
        $this->headers = array_filter($this->headers, function($key) {
            return strtolower($key) !== 'content-type' && strtolower($key) !== 'accept';
        }, ARRAY_FILTER_USE_KEY);
        $this->headers['Accept'] = 'image/*';
        
        try {
            $response = $this->request('POST', '/image/upscale', $data);
            
            // Ensure we have binary data in the response
            if (!isset($response['data']) || empty($response['data'])) {
                throw new Exception('No image data received from upscaling request');
            }
            
            return $response;
        } finally {
            $this->headers = $originalHeaders;
        }
    }

    /**
     * Get available image styles
     * 
     * @return array List of available image styles
     * @throws Exception If the request fails
     */
    public function getImageStyles(): array {
        return $this->request('GET', '/image/styles');
    }

    /**
     * Make an HTTP request to the Venice AI API
     * 
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $endpoint API endpoint
     * @param array $data Request data (optional)
     * @return array The API response
     * @throws Exception If the request fails
     */
    private function request(string $method, string $endpoint, array $data = []): array {
        $url = self::BASE_URL . $endpoint;
        
        // Check Accept header of the request to determine expected response type
        $acceptJson = true;
        foreach ($this->headers as $key => $value) {
            if (strtolower($key) === 'accept' && strpos(strtolower($value), 'application/json') === false) {
                $acceptJson = false;
                break;
            }
        }
        
        if ($this->debug && $acceptJson) {
            echo "\nRequest URL: " . $url . "\n";
            echo "Method: " . $method . "\n";
            echo "Headers: " . json_encode($this->headers, JSON_PRETTY_PRINT) . "\n";
            if (!empty($data)) {
                echo "Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
            }
        }

        $ch = curl_init($url);
        
        $headers = [];
        foreach ($this->headers as $key => $value) {
            $headers[] = "$key: $value";
        }

        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_VERBOSE => $this->debug
        ];

        if (!empty($data)) {
            // If we're sending an image file, use multipart form data
            if (isset($data['image']) && file_exists($data['image'])) {
                $postFields = [];
                
                // Add image file
                $postFields['image'] = new \CURLFile(
                    $data['image'],
                    'image/png',
                    basename($data['image'])
                );
                
                // Add all other fields except 'image'
                foreach ($data as $key => $value) {
                    if ($key !== 'image') {
                        $postFields[$key] = (string)$value;  // Convert all values to string for form data
                    }
                }
                
                $options[CURLOPT_POSTFIELDS] = $postFields;
                
                // Update headers for multipart form data
                $headers = array_filter($headers, function($header) {
                    return !preg_match('/^(Content-Type:|Accept:)/i', $header);
                });
                $headers[] = 'Content-Type: multipart/form-data';
                if (strpos($endpoint, '/image/') === 0) {
                    $headers[] = 'Accept: image/*';
                }
                $options[CURLOPT_HTTPHEADER] = $headers;
            } else {
                $options[CURLOPT_POSTFIELDS] = json_encode($data);
            }
        }

        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('Request failed: ' . $error);
        }
        
        curl_close($ch);

        if (!$response) {
            throw new Exception('Empty response received from API');
        }

        if ($statusCode >= 400) {
            throw new Exception('API request failed with status ' . $statusCode);
        }

        // Handle binary responses (images)
        if (!$acceptJson) {
            // Verify we got image data
            if (empty($response)) {
                throw new Exception('No data received from API');
            }
            
            // Check if response starts with PNG or JPEG magic numbers
            $isPNG = substr($response, 0, 8) === "\x89PNG\r\n\x1a\n";
            $isJPEG = substr($response, 0, 2) === "\xFF\xD8";
            
            if (!$isPNG && !$isJPEG) {
                // If not an image, try to parse as JSON error response
                $errorData = json_decode($response, true);
                if ($errorData && isset($errorData['error'])) {
                    throw new Exception($errorData['error']);
                }
                throw new Exception('Invalid image data received');
            }
            
            // Return binary image data in expected format
            return [
                'data' => base64_encode($response)
            ];
        }

        // Handle JSON responses
        $responseData = json_decode($response, true);
        if ($responseData === null) {
            throw new Exception('Failed to parse JSON response: ' . json_last_error_msg());
        }

        return $responseData;
    }
}