<?php

namespace Venice\Chat;

use Venice\VeniceAI;
use Venice\Utils\Validator;
use Venice\Exceptions\ValidationException;

/**
 * Service for interacting with Venice AI's chat endpoints
 */
class ChatService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;
    }

    /**
     * Create a chat completion
     *
     * @param array $messages Array of message objects
     * @param string $model Model to use (defaults to 'default' which maps to Venice's recommended model)
     * @param array $options Additional options
     * @return array|string The API response (array for regular responses, string for streaming)
     * @throws ValidationException If parameters are invalid
     * @throws \Exception If the request fails
     */
    public function createCompletion(array $messages, string $model = 'default', array $options = []): array|string {
        // Validate input parameters
        Validator::validateChatCompletion($messages, $model, $options);

        $this->client->getLogger()->info('Creating chat completion', [
            'model' => $model,
            'message_count' => count($messages),
            'options' => array_keys($options)
        ]);

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

        // Add Venice-specific parameters
        if (isset($options['venice_parameters'])) {
            $data['venice_parameters'] = $options['venice_parameters'];
        }

        // Handle include_venice_system_prompt parameter separately for convenience
        if (isset($options['include_venice_system_prompt'])) {
            if (!isset($data['venice_parameters'])) {
                $data['venice_parameters'] = [];
            }
            $data['venice_parameters']['include_venice_system_prompt'] =
                (bool)$options['include_venice_system_prompt'];
        }

        // Apply Minimax M1 optimizations if applicable
        if ($model === 'minimax-m1') {
            $this->applyMinimaxM1Optimizations($data, $options);
        }

        // Make the request
        $response = $this->client->request('POST', '/chat/completions', $data);

        $this->client->getLogger()->info('Chat completion successful', [
            'model' => $model,
            'response_type' => is_array($response) ? 'json' : 'stream'
        ]);

        return $response;
    }

    /**
     * Create a streaming chat completion
     *
     * @param array $messages Array of message objects
     * @param string $model Model to use
     * @param array $options Additional options
     * @return \Generator Generator yielding streaming response chunks
     * @throws ValidationException If parameters are invalid
     */
    public function createStreamingCompletion(array $messages, string $model = 'default', array $options = []): \Generator {
        // Force streaming mode
        $options['stream'] = true;

        $response = $this->createCompletion($messages, $model, $options);

        // Parse streaming response
        $lines = explode("\n", $response);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || !str_starts_with($line, 'data: ')) {
                continue;
            }

            $data = substr($line, 6); // Remove "data: " prefix
            if ($data === '[DONE]') {
                break;
            }

            $chunk = json_decode($data, true);
            if ($chunk !== null) {
                yield $chunk;
            }
        }
    }

    /**
     * Count tokens in messages (approximate)
     *
     * @param array $messages
     * @return int Approximate token count
     */
    public function countTokens(array $messages): int {
        $totalTokens = 0;

        foreach ($messages as $message) {
            if (isset($message['content'])) {
                // Rough approximation: 1 token ≈ 4 characters
                $totalTokens += ceil(strlen($message['content']) / 4);

                // Add overhead for role and formatting
                $totalTokens += 4;
            }
        }

        return $totalTokens;
    }

    /**
     * Validate message format
     *
     * @param array $message
     * @return bool
     */
    public function isValidMessage(array $message): bool {
        return isset($message['role']) &&
               isset($message['content']) &&
               in_array($message['role'], ['system', 'user', 'assistant']) &&
               is_string($message['content']) &&
               !empty(trim($message['content']));
    }

    /**
     * Create a system message
     *
     * @param string $content
     * @return array
     */
    public function createSystemMessage(string $content): array {
        return [
            'role' => 'system',
            'content' => $content
        ];
    }

    /**
     * Create a user message
     *
     * @param string $content
     * @return array
     */
    public function createUserMessage(string $content): array {
        return [
            'role' => 'user',
            'content' => $content
        ];
    }

    /**
     * Create an assistant message
     *
     * @param string $content
     * @return array
     */
    public function createAssistantMessage(string $content): array {
        return [
            'role' => 'assistant',
            'content' => $content
        ];
    }

    /**
     * Alias for createCompletion() - provides OpenAI-compatible API
     *
     * @param array $params Chat completion parameters
     * @return array|string The API response
     */
    public function create(array $params): array|string {
        $messages = $params['messages'] ?? [];
        $model = $params['model'] ?? 'default';
        unset($params['messages'], $params['model']);

        return $this->createCompletion($messages, $model, $params);
    }

    /**
     * Stream chat completion with callback
     *
     * @param array $params Chat completion parameters
     * @param callable|null $callback Callback function for each chunk
     * @return \Generator|void
     */
    public function stream(array $params, ?callable $callback = null) {
        $messages = $params['messages'] ?? [];
        $model = $params['model'] ?? 'default';
        unset($params['messages'], $params['model']);

        $stream = $this->createStreamingCompletion($messages, $model, $params);

        if ($callback) {
            foreach ($stream as $chunk) {
                $callback($chunk);
            }
        } else {
            return $stream;
        }
    }

    /**
     * Apply Minimax M1 specific optimizations
     *
     * @param array &$data Request data to modify
     * @param array $options Original options
     */
    private function applyMinimaxM1Optimizations(array &$data, array $options): void {
        $this->client->getLogger()->info('Applying Minimax M1 optimizations');

        // Get hardware optimizer from models service
        $hardwareOptimizer = $this->client->models()->getHardwareOptimizer();

        if ($hardwareOptimizer) {
            $optimizationConfig = $hardwareOptimizer->getMinimaxM1Config();

            // Apply hardware-specific optimizations
            if (!isset($data['minimax_parameters'])) {
                $data['minimax_parameters'] = [];
            }

            // GPU optimizations for NVIDIA RTX 5080
            if ($hardwareOptimizer->getHardwareInfo()['gpu']['is_rtx_5080'] ?? false) {
                $data['minimax_parameters']['gpu_optimizations'] = [
                    'tensor_parallelism' => true,
                    'pipeline_parallelism' => true,
                    'mixed_precision' => 'fp16',
                    'attention_optimization' => 'flash_attention_2',
                    'kv_cache_optimization' => true,
                    'dynamic_batching' => true,
                    'cuda_graphs' => true,
                    'memory_optimization' => 'aggressive',
                ];
            }

            // CPU optimizations for Intel i9
            if ($hardwareOptimizer->getHardwareInfo()['cpu']['is_i9'] ?? false) {
                $data['minimax_parameters']['cpu_optimizations'] = [
                    'thread_pool_size' => 16,
                    'numa_binding' => true,
                    'cpu_affinity' => 'performance_cores',
                    'memory_prefetch' => true,
                    'vectorization' => 'avx512',
                    'cache_optimization' => true,
                    'parallel_processing' => true,
                ];
            }

            // Display optimizations for 240Hz
            if ($hardwareOptimizer->getHardwareInfo()['display']['is_240hz'] ?? false) {
                $data['minimax_parameters']['display_optimizations'] = [
                    'low_latency_mode' => true,
                    'frame_pacing' => true,
                    'response_time_optimization' => true,
                    'adaptive_sync' => true,
                    'buffer_optimization' => true,
                    'priority_scheduling' => 'realtime',
                ];
            }

            // Network optimizations
            $data['minimax_parameters']['network_optimizations'] = [
                'connection_pooling' => 32,
                'request_batching' => true,
                'compression' => 'brotli',
                'keep_alive_timeout' => 300,
                'tcp_nodelay' => true,
                'tcp_quickack' => true,
                'http2_multiplexing' => true,
            ];

            // Memory optimizations
            $memorySettings = $optimizationConfig['memory_settings'] ?? [];
            if (!empty($memorySettings)) {
                $data['minimax_parameters']['memory_optimizations'] = [
                    'heap_size' => $memorySettings['heap_size'] ?? 4,
                    'buffer_size' => $memorySettings['buffer_size'] ?? 512 * 1024,
                    'cache_size' => $memorySettings['cache_size'] ?? 2,
                    'preallocation' => $memorySettings['preallocation'] ?? true,
                    'garbage_collection' => 'optimized',
                ];
            }

            // Threading optimizations
            $threadingSettings = $optimizationConfig['threading_settings'] ?? [];
            if (!empty($threadingSettings)) {
                $data['minimax_parameters']['threading_optimizations'] = [
                    'worker_threads' => $threadingSettings['worker_threads'] ?? 16,
                    'io_threads' => $threadingSettings['io_threads'] ?? 8,
                    'compute_threads' => $threadingSettings['compute_threads'] ?? 16,
                    'thread_pool_size' => $threadingSettings['thread_pool_size'] ?? 32,
                    'numa_awareness' => $threadingSettings['numa_awareness'] ?? true,
                ];
            }
        }

        // Apply model-specific parameter optimizations
        $this->applyMinimaxM1ParameterOptimizations($data, $options);

        // Apply context and token optimizations
        $this->applyMinimaxM1ContextOptimizations($data, $options);

        $this->client->getLogger()->info('Minimax M1 optimizations applied', [
            'optimizations_count' => count($data['minimax_parameters'] ?? []),
            'hardware_detected' => $hardwareOptimizer ? 'yes' : 'no'
        ]);
    }

    /**
     * Apply Minimax M1 parameter optimizations
     *
     * @param array &$data Request data to modify
     * @param array $options Original options
     */
    private function applyMinimaxM1ParameterOptimizations(array &$data, array $options): void {
        // Optimize temperature for Minimax M1
        if (!isset($data['temperature']) && !isset($options['temperature'])) {
            $data['temperature'] = 0.7; // Optimal default for Minimax M1
        }

        // Optimize top_p for better performance
        if (!isset($data['top_p']) && !isset($options['top_p'])) {
            $data['top_p'] = 0.9; // Optimal default for Minimax M1
        }

        // Set optimal max_tokens if not specified
        if (!isset($data['max_tokens']) && !isset($options['max_tokens'])) {
            $data['max_tokens'] = 4096; // Balanced performance/quality
        }

        // Optimize frequency and presence penalties
        if (!isset($data['frequency_penalty'])) {
            $data['frequency_penalty'] = 0.1; // Slight penalty for better diversity
        }

        if (!isset($data['presence_penalty'])) {
            $data['presence_penalty'] = 0.1; // Slight penalty for better creativity
        }

        // Enable streaming by default for better responsiveness
        if (!isset($data['stream']) && !isset($options['stream'])) {
            $data['stream'] = true;
        }
    }

    /**
     * Apply Minimax M1 context optimizations
     *
     * @param array &$data Request data to modify
     * @param array $options Original options
     */
    private function applyMinimaxM1ContextOptimizations(array &$data, array $options): void {
        // Optimize message context for Minimax M1
        if (isset($data['messages']) && is_array($data['messages'])) {
            $totalTokens = $this->countTokens($data['messages']);

            // If context is too large, apply intelligent truncation
            if ($totalTokens > 28000) { // Leave room for response
                $data['messages'] = $this->optimizeMessageContext($data['messages'], 28000);

                $this->client->getLogger()->info('Applied context optimization for Minimax M1', [
                    'original_tokens' => $totalTokens,
                    'optimized_tokens' => $this->countTokens($data['messages'])
                ]);
            }
        }

        // Add Minimax M1 specific context parameters
        if (!isset($data['minimax_parameters'])) {
            $data['minimax_parameters'] = [];
        }

        $data['minimax_parameters']['context_optimizations'] = [
            'context_length' => 32768,
            'sliding_window' => true,
            'attention_optimization' => 'sparse',
            'memory_efficient' => true,
            'context_compression' => true,
        ];
    }

    /**
     * Optimize message context for token limits
     *
     * @param array $messages Original messages
     * @param int $maxTokens Maximum token limit
     * @return array Optimized messages
     */
    private function optimizeMessageContext(array $messages, int $maxTokens): array {
        // Always keep system message if present
        $systemMessage = null;
        $otherMessages = [];

        foreach ($messages as $message) {
            if ($message['role'] === 'system') {
                $systemMessage = $message;
            } else {
                $otherMessages[] = $message;
            }
        }

        // Calculate tokens for system message
        $systemTokens = $systemMessage ? $this->countTokens([$systemMessage]) : 0;
        $availableTokens = $maxTokens - $systemTokens;

        // Keep recent messages within token limit
        $optimizedMessages = [];
        $currentTokens = 0;

        // Process messages in reverse order (most recent first)
        $reversedMessages = array_reverse($otherMessages);

        foreach ($reversedMessages as $message) {
            $messageTokens = $this->countTokens([$message]);

            if ($currentTokens + $messageTokens <= $availableTokens) {
                array_unshift($optimizedMessages, $message);
                $currentTokens += $messageTokens;
            } else {
                break;
            }
        }

        // Add system message back at the beginning
        if ($systemMessage) {
            array_unshift($optimizedMessages, $systemMessage);
        }

        return $optimizedMessages;
    }
}
