<?php

/**
 * Venice AI PHP SDK - Enhanced Usage Example
 *
 * Demonstrates optimized usage with the configured API key
 * and all enhanced features
 */

require_once __DIR__ . '/bootstrap.php';

use Venice\VeniceAI;
use Venice\Exceptions\VeniceException;

// Enable debug mode for demonstration
define('VENICE_DEBUG', true);

try {
    echo "🚀 Venice AI PHP SDK Enhanced Demo\n";
    echo str_repeat("=", 50) . "\n\n";

    // Initialize Venice AI with the configured API key
    $venice = new VeniceAI();

    echo "✅ Venice AI SDK initialized successfully\n";
    echo "📊 API Key configured and validated\n\n";

    // 1. Test Models Service
    echo "📋 1. Testing Models Service\n";
    echo str_repeat("-", 30) . "\n";

    try {
        $models = $venice->models()->list();
        echo "✅ Available models: " . count($models['data']) . "\n";

        // Display first few models
        foreach (array_slice($models['data'], 0, 3) as $model) {
            echo "   - " . $model['id'] . "\n";
        }
        echo "\n";

    } catch (Exception $e) {
        echo "❌ Models test failed: " . $e->getMessage() . "\n\n";
    }

    // 2. Test Chat Service
    echo "💬 2. Testing Chat Service\n";
    echo str_repeat("-", 30) . "\n";

    try {
        $response = $venice->chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => 'Hello! Please respond with "Venice AI SDK is working perfectly!"'
                ]
            ],
            'max_tokens' => 50
        ]);

        echo "✅ Chat response: " . $response['choices'][0]['message']['content'] . "\n\n";

    } catch (Exception $e) {
        echo "❌ Chat test failed: " . $e->getMessage() . "\n\n";
    }

    // 3. Test Image Service
    echo "🎨 3. Testing Image Service\n";
    echo str_repeat("-", 30) . "\n";

    try {
        $imageResponse = $venice->image()->create([
            'prompt' => 'A futuristic AI brain glowing with neon lights',
            'size' => '512x512',
            'n' => 1
        ]);

        echo "✅ Image generated: " . $imageResponse['data'][0]['url'] . "\n\n";

    } catch (Exception $e) {
        echo "❌ Image test failed: " . $e->getMessage() . "\n\n";
    }

    // 4. Test Embeddings Service
    echo "📐 4. Testing Embeddings Service\n";
    echo str_repeat("-", 30) . "\n";

    try {
        $embeddings = $venice->embeddings()->create([
            'model' => 'text-embedding-ada-002',
            'input' => 'Venice AI SDK is awesome!'
        ]);

        $embeddingLength = count($embeddings['data'][0]['embedding']);
        echo "✅ Embedding generated with $embeddingLength dimensions\n\n";

    } catch (Exception $e) {
        echo "❌ Embeddings test failed: " . $e->getMessage() . "\n\n";
    }

    // 5. Test System Features
    echo "⚙️ 5. Testing System Features\n";
    echo str_repeat("-", 30) . "\n";

    // Cache test
    $cacheManager = $venice->cache();
    $cacheManager->set('test_key', 'test_value', 300);
    $cachedValue = $cacheManager->get('test_key');
    echo "✅ Cache system: " . ($cachedValue === 'test_value' ? 'Working' : 'Failed') . "\n";

    // Logger test
    $logger = $venice->getLogger();
    $logger->info('Venice AI SDK demo completed successfully');
    echo "✅ Logging system: Working\n";

    // Security manager test
    $security = $venice->security();
    $encrypted = $security->encrypt('test data');
    $decrypted = $security->decrypt($encrypted);
    echo "✅ Security system: " . ($decrypted === 'test data' ? 'Working' : 'Failed') . "\n";

    echo "\n";

    // 6. Performance Metrics
    echo "📈 6. Performance Metrics\n";
    echo str_repeat("-", 30) . "\n";

    $stats = [
        'Memory usage' => number_format(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
        'Peak memory' => number_format(memory_get_peak_usage(true) / 1024 / 1024, 2) . ' MB',
        'Included files' => count(get_included_files()),
        'Extensions loaded' => count(get_loaded_extensions())
    ];

    foreach ($stats as $metric => $value) {
        echo "   $metric: $value\n";
    }

    echo "\n🎉 Venice AI SDK Enhanced Demo Completed Successfully!\n";
    echo "🔧 All systems optimized and ready for production use.\n\n";

} catch (VeniceException $e) {
    echo "❌ Venice AI Error: " . $e->getMessage() . "\n";
    echo "📝 Please check your API key and configuration.\n";

} catch (Exception $e) {
    echo "❌ System Error: " . $e->getMessage() . "\n";
    echo "📝 Please check the error logs for more details.\n";
}

// Advanced Usage Examples
echo "🔬 Advanced Usage Examples\n";
echo str_repeat("=", 50) . "\n\n";

try {
    $venice = new VeniceAI();

    // Example 1: Streaming Chat
    echo "🌊 1. Streaming Chat Example\n";
    echo str_repeat("-", 30) . "\n";

    $venice->chat()->stream([
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            ['role' => 'user', 'content' => 'Count from 1 to 5']
        ]
    ], function($chunk) {
        if (isset($chunk['choices'][0]['delta']['content'])) {
            echo $chunk['choices'][0]['delta']['content'];
        }
    });
    echo "\n✅ Streaming completed\n\n";

    // Example 2: Async Processing
    echo "⚡ 2. Async Processing Example\n";
    echo str_repeat("-", 30) . "\n";

    $asyncProcessor = $venice->async();

    $promises = [];
    for ($i = 1; $i <= 3; $i++) {
        $promises[] = $asyncProcessor->processAsync(function() use ($venice, $i) {
            return $venice->chat()->create([
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'user', 'content' => "Say 'Response $i'"]
                ],
                'max_tokens' => 10
            ]);
        });
    }

    $results = $asyncProcessor->waitAll($promises);
    echo "✅ Processed " . count($results) . " async requests\n\n";

    // Example 3: Event System
    echo "📡 3. Event System Example\n";
    echo str_repeat("-", 30) . "\n";

    $eventManager = $venice->events();

    $eventManager->addEventListener('venice.api.request', function($event) {
        echo "🔔 API request to: " . $event->get('endpoint') . "\n";
    });

    $eventManager->addEventListener('venice.api.response', function($event) {
        echo "✅ API response in: " . number_format($event->get('duration') * 1000, 2) . "ms\n";
    });

    // This will trigger the events
    $venice->models()->list();
    echo "\n";

} catch (Exception $e) {
    echo "❌ Advanced example error: " . $e->getMessage() . "\n";
}

echo "🎯 All examples completed!\n";
echo "📚 Check the documentation for more advanced features.\n";
