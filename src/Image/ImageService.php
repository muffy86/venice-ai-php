<?php

namespace Venice\Image;

use Venice\VeniceAI;

/**
 * Service for interacting with Venice AI's image endpoints
 */
class ImageService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /** @var array Valid image sizes with descriptive keys */
    private const VALID_SIZES = [
        'square' => [1024, 1024],
        'portrait' => [1024, 1280],
        'landscape' => [1280, 1024]
    ];

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;
    }

    /**
     * Generate an image
     * 
     * @param array $options Image generation options
     * @return array The API response
     * @throws \InvalidArgumentException If required options are missing or invalid
     * @throws \Exception If the request fails
     */
    public function generate(array $options): array {
        // Validate required parameters
        if (empty($options['prompt'])) {
            throw new \InvalidArgumentException('prompt is required for image generation');
        }
        if (strlen($options['prompt']) > 1500) {
            throw new \InvalidArgumentException('prompt must not exceed 1500 characters');
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
                
                throw new \InvalidArgumentException(
                    "Invalid image size: $requestedSize. Available sizes: " . implode(', ', $sizeDescriptions)
                );
            }
        }

        // Validate steps if provided
        if (isset($options['steps'])) {
            $steps = (int)$options['steps'];
            if ($steps < 1 || $steps > 50) {
                throw new \InvalidArgumentException('steps must be between 1 and 50');
            }
            $options['steps'] = $steps;
        }

        // Validate style preset if provided
        if (isset($options['style_preset'])) {
            $styles = $this->listStyles();
            $validStyles = [];
            
            if (isset($styles['styles']) && is_array($styles['styles'])) {
                $validStyles = array_column($styles['styles'], 'name');
            }
            
            if (!empty($validStyles) && !in_array($options['style_preset'], $validStyles)) {
                throw new \InvalidArgumentException(
                    'Invalid style_preset. Use listStyles() method to get available styles.'
                );
            }
        }

        // Validate negative prompt if provided
        if (isset($options['negative_prompt'])) {
            if (strlen($options['negative_prompt']) > 1500) {
                throw new \InvalidArgumentException('negative_prompt must not exceed 1500 characters');
            }
        }

        // Convert numeric parameters to numbers
        if (isset($options['seed'])) {
            $options['seed'] = (int)$options['seed'];
        }
        if (isset($options['cfg_scale'])) {
            $options['cfg_scale'] = (float)$options['cfg_scale'];
            if ($options['cfg_scale'] < 0) {
                throw new \InvalidArgumentException('cfg_scale must be a positive number');
            }
        }

        // Build request data
        $data = [
            'model' => $options['model'] ?? 'default',
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
        $headers = [];
        if (isset($data['return_binary']) && $data['return_binary']) {
            $headers['Accept'] = 'image/*';
        }

        // Make the request
        $response = $this->client->request('POST', '/image/generate', $data, $headers);

        // Handle binary response
        if (isset($data['return_binary']) && $data['return_binary'] && is_string($response)) {
            return [
                'data' => [
                    [
                        'b64_json' => base64_encode($response)
                    ]
                ]
            ];
        }

        // Handle JSON response
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
        throw new \Exception('Response missing expected image data');
    }

    /**
     * Upscale an image
     * 
     * @param array $options Image upscaling options
     * @return array The API response
     * @throws \InvalidArgumentException If required options are missing or invalid
     * @throws \Exception If the request fails
     */
    public function upscale(array $options): array {
        if (empty($options['image'])) {
            throw new \InvalidArgumentException('image is required for upscaling');
        }

        if (!isset($options['scale'])) {
            throw new \InvalidArgumentException('scale is required for upscaling');
        }

        // Convert scale to string and validate
        $scale = (string)$options['scale'];
        if (!in_array($scale, ['2', '4'], true)) {
            throw new \InvalidArgumentException('scale must be "2" or "4"');
        }

        // Validate image file exists
        if (is_string($options['image']) && !file_exists($options['image'])) {
            throw new \InvalidArgumentException('image file not found: ' . $options['image']);
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
            throw new \InvalidArgumentException('image must be a file path');
        }

        // Set headers for binary response
        $headers = [
            'Accept' => 'image/*'
        ];
        
        // Make the request (HttpClient will handle multipart form data)
        $response = $this->client->request(
            'POST', 
            '/image/upscale', 
            $data, 
            $headers
        );
        
        // For upscaling, we get back raw PNG data
        if (empty($response)) {
            throw new \Exception('No image data received from upscaling request');
        }

        // Convert raw image data to expected format
        return [
            'data' => [
                [
                    'b64_json' => base64_encode($response)
                ]
            ]
        ];
    }
    
    /**
     * List available image style presets
     *
     * @return array List of available image style presets
     * @throws \Exception If the request fails
     */
    public function listStyles(): array {
        return $this->client->request('GET', '/image/styles');
    }
    
    /**
     * Get valid image sizes
     *
     * @return array Valid image sizes
     */
    public function getValidSizes(): array {
        return self::VALID_SIZES;
    }
}