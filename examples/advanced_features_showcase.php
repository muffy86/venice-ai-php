<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Events\Event;
use Venice\Events\EventSubscriberInterface;

/**
 * Advanced Features Showcase
 *
 * This example demonstrates the comprehensive capabilities of the Venice AI PHP SDK
 * including all the advanced features like caching, events, security, async processing,
 * audio processing, embeddings, and more.
 */

// Custom event subscriber for monitoring
class VeniceEventSubscriber implements EventSubscriberInterface {
    public static function getSubscribedEvents(): array {
        return [
            'venice.api.request' => 'onApiRequest',
            'venice.api.response' => 'onApiResponse',
            'venice.cache.hit' => 'onCacheHit',
            'venice.audio.processed' => 'onAudioProcessed'
        ];
    }

    public function onApiRequest(Event $event): void {
        echo "🚀 API Request: " . json_encode($event->getData()) . "\n";
    }

    public function onApiResponse(Event $event): void {
        echo "✅ API Response: Duration " . $event->getData()['duration'] . "s\n";
    }

    public function onCacheHit(Event $event): void {
        echo "⚡ Cache Hit: " . $event->getData()['key'] . "\n";
    }

    public function onAudioProcessed(Event $event): void {
        echo "🎵 Audio Processed: " . json_encode($event->getData()) . "\n";
    }
}

try {
    echo "🌟 Venice AI SDK - Advanced Features Showcase\n";
    echo "=" . str_repeat("=", 50) . "\n\n";

    // Initialize Venice AI with advanced configuration
    $venice = new VeniceAI('your-api-key-here', [
        'debug' => true,
        'cache' => [
            'driver' => 'auto',
            'redis_dsn' => 'redis://localhost:6379',
            'default_ttl' => 3600
        ],
        'security' => [
            'rate_limit_max' => 1000,
            'encryption_method' => 'AES-256-CBC'
        ],
        'async' => [
            'max_workers' => 8,
            'enable_parallel' => true
        ]
    ]);

    // Subscribe to events
    $venice->events()->addSubscriber(new VeniceEventSubscriber());

    echo "1. 🧠 Advanced Chat with Function Calling\n";
    echo "-" . str_repeat("-", 40) . "\n";

    $chatResponse = $venice->chat()->createCompletion([
        [
            'role' => 'system',
            'content' => 'You are a helpful AI assistant with access to various tools.'
        ],
        [
            'role' => 'user',
            'content' => 'What\'s the weather like and can you generate an image of a sunny day?'
        ]
    ], 'gpt-4', [
        'temperature' => 0.7,
        'max_tokens' => 500,
        'functions' => [
            [
                'name' => 'get_weather',
                'description' => 'Get current weather information',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'location' => ['type' => 'string', 'description' => 'City name']
                    ]
                ]
            ]
        ]
    ]);

    echo "Chat Response: " . substr($chatResponse['choices'][0]['message']['content'], 0, 100) . "...\n\n";

    echo "2. 🎨 Advanced Image Generation with Caching\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // This will be cached for subsequent requests
    $imageResponse = $venice->image()->generate([
        'prompt' => 'A futuristic AI laboratory with holographic displays and advanced technology',
        'width' => 1024,
        'height' => 1024,
        'steps' => 30,
        'style_preset' => 'photographic',
        'cfg_scale' => 7.5
    ]);

    echo "Image generated successfully! Size: " . strlen($imageResponse['data'][0]['b64_json']) . " bytes\n\n";

    echo "3. 🎵 Audio Processing Capabilities\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Generate speech from text
    $speechResponse = $venice->audio()->generateSpeech([
        'input' => 'Welcome to the Venice AI SDK advanced features showcase!',
        'voice' => 'nova',
        'model' => 'tts-1-hd',
        'response_format' => 'mp3',
        'speed' => 1.0,
        'quality' => 'high'
    ]);

    echo "Speech generated: " . $speechResponse['size'] . " bytes\n";

    // Audio analysis (simulated)
    if (file_exists('sample_audio.mp3')) {
        $analysisResponse = $venice->audio()->analyze([
            'file' => 'sample_audio.mp3',
            'detect_emotions' => true,
            'detect_speakers' => true,
            'extract_keywords' => true
        ]);
        echo "Audio analysis completed with " . count($analysisResponse['keywords'] ?? []) . " keywords\n";
    }

    echo "\n4. 🔍 Embeddings and Semantic Search\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Generate embeddings for multiple texts
    $texts = [
        'Artificial intelligence and machine learning',
        'Natural language processing and understanding',
        'Computer vision and image recognition',
        'Robotics and automation systems',
        'Data science and analytics'
    ];

    $embeddingsResponse = $venice->embeddings()->batchProcess($texts, [
        'model' => 'text-embedding-3-large',
        'batch_size' => 5
    ]);

    echo "Generated embeddings for " . count($embeddingsResponse['data']) . " texts\n";

    // Perform semantic similarity search
    if (count($embeddingsResponse['data']) >= 2) {
        $similarity = $venice->embeddings()->calculateSimilarity(
            $embeddingsResponse['data'][0]['embedding'],
            $embeddingsResponse['data'][1]['embedding'],
            'cosine'
        );
        echo "Similarity between first two texts: " . round($similarity, 4) . "\n";
    }

    echo "\n5. ⚡ Asynchronous Processing\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Process multiple tasks in parallel
    $tasks = [];
    for ($i = 1; $i <= 5; $i++) {
        $tasks[] = function() use ($venice, $i) {
            return $venice->chat()->createCompletion([
                ['role' => 'user', 'content' => "Tell me a fact about number $i"]
            ], 'gpt-3.5-turbo', ['max_tokens' => 50]);
        };
    }

    echo "Processing 5 chat requests in parallel...\n";
    $startTime = microtime(true);

    $results = $venice->async()->processParallel($tasks, [
        'max_concurrency' => 3,
        'timeout' => 30
    ]);

    $duration = microtime(true) - $startTime;
    echo "Parallel processing completed in " . round($duration, 2) . " seconds\n";

    echo "\n6. 🔒 Security and Authentication\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Generate JWT token
    $token = $venice->security()->generateJWT([
        'user_id' => 'user123',
        'permissions' => ['chat', 'image', 'audio']
    ], ['expiry' => 3600]);

    echo "JWT Token generated: " . substr($token, 0, 50) . "...\n";

    // Verify token
    $payload = $venice->security()->verifyJWT($token);
    echo "Token verified for user: " . $payload['user_id'] . "\n";

    // Encrypt sensitive data
    $sensitiveData = "This is confidential information";
    $encrypted = $venice->security()->encrypt($sensitiveData);
    $decrypted = $venice->security()->decrypt($encrypted);
    echo "Data encryption/decryption: " . ($decrypted === $sensitiveData ? "✅ Success" : "❌ Failed") . "\n";

    echo "\n7. 📊 Performance Metrics and Monitoring\n";
    echo "-" . str_repeat("-", 40) . "\n";

    $metrics = $venice->getMetrics();
    echo "Performance Metrics:\n";
    echo "- Total Requests: " . $metrics['requests'] . "\n";
    echo "- Cache Hit Rate: " . $metrics['cache_stats']['hit_rate'] . "%\n";
    echo "- Average Response Time: " . round($metrics['cache_stats']['average_time'] ?? 0, 3) . "s\n";
    echo "- Active Async Tasks: " . $metrics['async_stats']['active_tasks'] . "\n";

    echo "\n8. 🎛️ Advanced Configuration and Caching\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Demonstrate cache warming
    $cacheData = [
        'model_info_gpt4' => ['name' => 'GPT-4', 'context_length' => 8192],
        'model_info_gpt35' => ['name' => 'GPT-3.5', 'context_length' => 4096]
    ];

    $cachedItems = $venice->cache()->warm($cacheData, 'models', 7200);
    echo "Warmed cache with $cachedItems items\n";

    // Test cache retrieval
    $cachedModel = $venice->cache()->get('model_info_gpt4', 'models');
    echo "Retrieved from cache: " . ($cachedModel ? $cachedModel['name'] : 'Not found') . "\n";

    echo "\n9. 🔄 Streaming and Real-time Processing\n";
    echo "-" . str_repeat("-", 40) . "\n";

    // Streaming chat completion
    echo "Streaming response: ";
    $streamGenerator = $venice->chat()->createStreamingCompletion([
        ['role' => 'user', 'content' => 'Count from 1 to 5 slowly']
    ], 'gpt-3.5-turbo');

    foreach ($streamGenerator as $chunk) {
        if (isset($chunk['choices'][0]['delta']['content'])) {
            echo $chunk['choices'][0]['delta']['content'];
            flush();
            usleep(100000); // 100ms delay for demonstration
        }
    }
    echo "\n";

    echo "\n10. 🎯 Advanced Error Handling and Recovery\n";
    echo "-" . str_repeat("-", 40) . "\n";

    try {
        // Intentionally trigger an error
        $venice->chat()->createCompletion([], 'invalid-model');
    } catch (\Exception $e) {
        echo "Caught and handled error: " . $e->getMessage() . "\n";

        // Demonstrate error recovery
        echo "Implementing fallback strategy...\n";
        $fallbackResponse = $venice->chat()->createCompletion([
            ['role' => 'user', 'content' => 'Hello, this is a fallback request']
        ], 'gpt-3.5-turbo');
        echo "Fallback successful: " . substr($fallbackResponse['choices'][0]['message']['content'], 0, 50) . "...\n";
    }

    echo "\n🎉 Advanced Features Showcase Complete!\n";
    echo "=" . str_repeat("=", 50) . "\n";

    // Final metrics
    $finalMetrics = $venice->getMetrics();
    echo "\nFinal Performance Summary:\n";
    echo "- Total API Calls: " . $finalMetrics['requests'] . "\n";
    echo "- Cache Efficiency: " . $finalMetrics['cache_stats']['hit_rate'] . "%\n";
    echo "- Total Processing Time: " . round($finalMetrics['total_time'], 2) . "s\n";
    echo "- Errors Handled: " . $finalMetrics['errors'] . "\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n💡 Tips for Production Use:\n";
echo "- Configure Redis for distributed caching\n";
echo "- Set up proper logging and monitoring\n";
echo "- Implement rate limiting strategies\n";
echo "- Use async processing for batch operations\n";
echo "- Enable security features for sensitive data\n";
echo "- Monitor performance metrics regularly\n";
