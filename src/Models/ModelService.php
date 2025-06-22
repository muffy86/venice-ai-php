<?php

namespace Venice\Models;

use Venice\VeniceAI;
use Venice\Hardware\HardwareOptimizer;
use Venice\Exceptions\ValidationException;

/**
 * Service for interacting with Venice AI's model endpoints
 * Enhanced with Minimax M1 support and hardware optimizations
 */
class ModelService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /** @var HardwareOptimizer Hardware optimizer instance */
    private ?HardwareOptimizer $hardwareOptimizer = null;

    /** @var array Supported models with their configurations */
    private const SUPPORTED_MODELS = [
        'minimax-m1' => [
            'name' => 'Minimax M1',
            'type' => 'text',
            'provider' => 'minimax',
            'context_length' => 32768,
            'max_tokens' => 8192,
            'supports_streaming' => true,
            'supports_function_calling' => true,
            'supports_vision' => false,
            'temperature_range' => [0.1, 2.0],
            'top_p_range' => [0.1, 1.0],
            'frequency_penalty_range' => [-2.0, 2.0],
            'presence_penalty_range' => [-2.0, 2.0],
            'hardware_requirements' => [
                'min_memory' => 8, // GB
                'recommended_memory' => 16, // GB
                'gpu_memory' => 4, // GB
                'cpu_cores' => 4,
                'recommended_cpu_cores' => 8,
            ],
            'optimizations' => [
                'nvidia_5080' => [
                    'tensor_parallelism' => true,
                    'pipeline_parallelism' => true,
                    'mixed_precision' => 'fp16',
                    'attention_optimization' => 'flash_attention_2',
                    'kv_cache_optimization' => true,
                    'dynamic_batching' => true,
                    'cuda_graphs' => true,
                ],
                'intel_i9' => [
                    'thread_pool_size' => 16,
                    'numa_binding' => true,
                    'cpu_affinity' => 'performance_cores',
                    'memory_prefetch' => true,
                    'vectorization' => 'avx512',
                    'cache_optimization' => true,
                ],
                '240hz_display' => [
                    'low_latency_mode' => true,
                    'frame_pacing' => true,
                    'response_time_optimization' => true,
                    'adaptive_sync' => true,
                    'buffer_optimization' => true,
                ]
            ]
        ],
        'gpt-4' => [
            'name' => 'GPT-4',
            'type' => 'text',
            'provider' => 'openai',
            'context_length' => 8192,
            'max_tokens' => 4096,
            'supports_streaming' => true,
            'supports_function_calling' => true,
            'supports_vision' => false,
        ],
        'gpt-3.5-turbo' => [
            'name' => 'GPT-3.5 Turbo',
            'type' => 'text',
            'provider' => 'openai',
            'context_length' => 4096,
            'max_tokens' => 2048,
            'supports_streaming' => true,
            'supports_function_calling' => true,
            'supports_vision' => false,
        ],
        'dall-e-3' => [
            'name' => 'DALL-E 3',
            'type' => 'image',
            'provider' => 'openai',
            'supports_streaming' => false,
            'supports_function_calling' => false,
            'supports_vision' => false,
        ]
    ];

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;

        // Initialize hardware optimizer if available
        try {
            $this->hardwareOptimizer = new HardwareOptimizer(
                $client->getLogger(),
                $client->config()->get('hardware', [])
            );
        } catch (\Exception $e) {
            $client->getLogger()->warning('Hardware optimizer initialization failed', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * List available models
     *
     * @param string|null $type Optional filter for model type ('text' or 'image')
     * @return array List of available models
     * @throws \InvalidArgumentException If type is invalid
     * @throws \Exception If the request fails
     */
    public function list(?string $type = null): array {
        $endpoint = '/models';
        if ($type !== null) {
            if (!in_array($type, ['text', 'image'])) {
                throw new \InvalidArgumentException("Type must be either 'text' or 'image'");
            }
            $endpoint .= '?type=' . urlencode($type);
        }

        try {
            $apiModels = $this->client->request('GET', $endpoint);
        } catch (\Exception $e) {
            // Fallback to local model definitions if API is unavailable
            $this->client->getLogger()->warning('API model list unavailable, using local definitions', [
                'error' => $e->getMessage()
            ]);
            $apiModels = [];
        }

        // Merge API models with local supported models
        $localModels = $this->getLocalModels($type);

        return array_merge($apiModels, $localModels);
    }

    /**
     * Get local model definitions
     */
    private function getLocalModels(?string $type = null): array {
        $models = [];

        foreach (self::SUPPORTED_MODELS as $modelId => $config) {
            if ($type === null || $config['type'] === $type) {
                $models[] = [
                    'id' => $modelId,
                    'object' => 'model',
                    'created' => time(),
                    'owned_by' => $config['provider'],
                    'name' => $config['name'],
                    'type' => $config['type'],
                    'context_length' => $config['context_length'] ?? null,
                    'max_tokens' => $config['max_tokens'] ?? null,
                    'supports_streaming' => $config['supports_streaming'] ?? false,
                    'supports_function_calling' => $config['supports_function_calling'] ?? false,
                    'supports_vision' => $config['supports_vision'] ?? false,
                    'hardware_optimized' => $modelId === 'minimax-m1',
                ];
            }
        }

        return $models;
    }

    /**
     * List available text models
     *
     * @return array List of available text models
     * @throws \Exception If the request fails
     */
    public function listTextModels(): array {
        return $this->list('text');
    }

    /**
     * List available image models
     *
     * @return array List of available image models
     * @throws \Exception If the request fails
     */
    public function listImageModels(): array {
        return $this->list('image');
    }

    /**
     * List available model traits
     *
     * @return array List of available model traits
     * @throws \Exception If the request fails
     */
    public function listTraits(): array {
        return $this->client->request('GET', '/models/traits');
    }

    /**
     * Get model information
     *
     * @param string $modelId Model identifier
     * @return array Model information
     * @throws ValidationException If model is not supported
     */
    public function getModelInfo(string $modelId): array {
        if (!isset(self::SUPPORTED_MODELS[$modelId])) {
            throw new ValidationException("Unsupported model: {$modelId}");
        }

        $modelInfo = self::SUPPORTED_MODELS[$modelId];

        // Add hardware optimization info for Minimax M1
        if ($modelId === 'minimax-m1' && $this->hardwareOptimizer) {
            $modelInfo['hardware_info'] = $this->hardwareOptimizer->getHardwareInfo();
            $modelInfo['optimization_config'] = $this->hardwareOptimizer->getMinimaxM1Config();
            $modelInfo['performance_profile'] = $this->hardwareOptimizer->getPerformanceProfile();
        }

        return $modelInfo;
    }

    /**
     * Get optimized configuration for Minimax M1
     *
     * @return array Optimized configuration
     */
    public function getMinimaxM1OptimizedConfig(): array {
        if (!$this->hardwareOptimizer) {
            return self::SUPPORTED_MODELS['minimax-m1'] ?? [];
        }

        return $this->hardwareOptimizer->getMinimaxM1Config();
    }

    /**
     * Validate model parameters
     *
     * @param string $modelId Model identifier
     * @param array $parameters Model parameters
     * @throws ValidationException If parameters are invalid
     */
    public function validateModelParameters(string $modelId, array $parameters): void {
        if (!isset(self::SUPPORTED_MODELS[$modelId])) {
            throw new ValidationException("Unsupported model: {$modelId}");
        }

        $modelConfig = self::SUPPORTED_MODELS[$modelId];

        // Validate temperature
        if (isset($parameters['temperature'])) {
            $temp = $parameters['temperature'];
            if (isset($modelConfig['temperature_range'])) {
                [$min, $max] = $modelConfig['temperature_range'];
                if ($temp < $min || $temp > $max) {
                    throw new ValidationException(
                        "Temperature must be between {$min} and {$max} for {$modelId}"
                    );
                }
            }
        }

        // Validate top_p
        if (isset($parameters['top_p'])) {
            $topP = $parameters['top_p'];
            if (isset($modelConfig['top_p_range'])) {
                [$min, $max] = $modelConfig['top_p_range'];
                if ($topP < $min || $topP > $max) {
                    throw new ValidationException(
                        "top_p must be between {$min} and {$max} for {$modelId}"
                    );
                }
            }
        }

        // Validate max_tokens
        if (isset($parameters['max_tokens'])) {
            $maxTokens = $parameters['max_tokens'];
            if (isset($modelConfig['max_tokens']) && $maxTokens > $modelConfig['max_tokens']) {
                throw new ValidationException(
                    "max_tokens cannot exceed {$modelConfig['max_tokens']} for {$modelId}"
                );
            }
        }

        // Validate frequency_penalty
        if (isset($parameters['frequency_penalty'])) {
            $penalty = $parameters['frequency_penalty'];
            if (isset($modelConfig['frequency_penalty_range'])) {
                [$min, $max] = $modelConfig['frequency_penalty_range'];
                if ($penalty < $min || $penalty > $max) {
                    throw new ValidationException(
                        "frequency_penalty must be between {$min} and {$max} for {$modelId}"
                    );
                }
            }
        }

        // Validate presence_penalty
        if (isset($parameters['presence_penalty'])) {
            $penalty = $parameters['presence_penalty'];
            if (isset($modelConfig['presence_penalty_range'])) {
                [$min, $max] = $modelConfig['presence_penalty_range'];
                if ($penalty < $min || $penalty > $max) {
                    throw new ValidationException(
                        "presence_penalty must be between {$min} and {$max} for {$modelId}"
                    );
                }
            }
        }
    }

    /**
     * Check if model supports feature
     *
     * @param string $modelId Model identifier
     * @param string $feature Feature name
     * @return bool True if feature is supported
     */
    public function supportsFeature(string $modelId, string $feature): bool {
        $modelConfig = self::SUPPORTED_MODELS[$modelId] ?? [];

        switch ($feature) {
            case 'streaming':
                return $modelConfig['supports_streaming'] ?? false;
            case 'function_calling':
                return $modelConfig['supports_function_calling'] ?? false;
            case 'vision':
                return $modelConfig['supports_vision'] ?? false;
            default:
                return false;
        }
    }

    /**
     * Get hardware requirements for model
     *
     * @param string $modelId Model identifier
     * @return array Hardware requirements
     */
    public function getHardwareRequirements(string $modelId): array {
        $modelConfig = self::SUPPORTED_MODELS[$modelId] ?? [];
        return $modelConfig['hardware_requirements'] ?? [];
    }

    /**
     * Check if current hardware meets model requirements
     *
     * @param string $modelId Model identifier
     * @return array Compatibility check results
     */
    public function checkHardwareCompatibility(string $modelId): array {
        $requirements = $this->getHardwareRequirements($modelId);

        if (empty($requirements) || !$this->hardwareOptimizer) {
            return ['compatible' => true, 'warnings' => []];
        }

        $hardware = $this->hardwareOptimizer->getHardwareInfo();
        $warnings = [];
        $compatible = true;

        // Check memory requirements
        if (isset($requirements['min_memory'])) {
            $systemMemoryGB = ($hardware['memory']['total'] ?? 0) / (1024 * 1024 * 1024);
            if ($systemMemoryGB < $requirements['min_memory']) {
                $compatible = false;
                $warnings[] = "Insufficient system memory: {$systemMemoryGB}GB available, {$requirements['min_memory']}GB required";
            } elseif ($systemMemoryGB < ($requirements['recommended_memory'] ?? $requirements['min_memory'])) {
                $warnings[] = "Below recommended memory: {$systemMemoryGB}GB available, {$requirements['recommended_memory']}GB recommended";
            }
        }

        // Check CPU requirements
        if (isset($requirements['cpu_cores'])) {
            $systemCores = $hardware['cpu']['cores'] ?? 1;
            if ($systemCores < $requirements['cpu_cores']) {
                $compatible = false;
                $warnings[] = "Insufficient CPU cores: {$systemCores} available, {$requirements['cpu_cores']} required";
            } elseif ($systemCores < ($requirements['recommended_cpu_cores'] ?? $requirements['cpu_cores'])) {
                $warnings[] = "Below recommended CPU cores: {$systemCores} available, {$requirements['recommended_cpu_cores']} recommended";
            }
        }

        // Check GPU memory requirements
        if (isset($requirements['gpu_memory'])) {
            $gpuMemoryGB = ($hardware['gpu']['memory'] ?? 0) / 1024;
            if ($gpuMemoryGB < $requirements['gpu_memory']) {
                $warnings[] = "Insufficient GPU memory: {$gpuMemoryGB}GB available, {$requirements['gpu_memory']}GB recommended";
            }
        }

        return [
            'compatible' => $compatible,
            'warnings' => $warnings,
            'hardware_info' => $hardware,
            'requirements' => $requirements
        ];
    }

    /**
     * Get supported models list
     *
     * @return array List of supported model IDs
     */
    public function getSupportedModels(): array {
        return array_keys(self::SUPPORTED_MODELS);
    }

    /**
     * Check if model is supported
     *
     * @param string $modelId Model identifier
     * @return bool True if model is supported
     */
    public function isModelSupported(string $modelId): bool {
        return isset(self::SUPPORTED_MODELS[$modelId]);
    }

    /**
     * Get hardware optimizer instance
     *
     * @return HardwareOptimizer|null Hardware optimizer instance
     */
    public function getHardwareOptimizer(): ?HardwareOptimizer {
        return $this->hardwareOptimizer;
    }
}
