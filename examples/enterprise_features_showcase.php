<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Plugins\PluginInterface;
use Venice\Events\Event;

/**
 * Enterprise Features Showcase
 *
 * Demonstrates the comprehensive capabilities of the Venice AI PHP SDK Enterprise Edition
 */

// Example custom plugin
class CustomAnalyticsPlugin implements PluginInterface {
    public function getMetadata(): array {
        return [
            'name' => 'custom_analytics',
            'version' => '1.0.0',
            'description' => 'Custom analytics and reporting plugin',
            'author' => 'Your Company',
            'dependencies' => []
        ];
    }

    public function activate(VeniceAI $venice): bool {
        echo "✅ Custom Analytics Plugin activated\n";
        return true;
    }

    public function deactivate(VeniceAI $venice): bool {
        echo "❌ Custom Analytics Plugin deactivated\n";
        return true;
    }

    public function getHooks(): array {
        return [
            'venice.api.response' => [$this, 'trackApiResponse'],
            'venice.chat.completion' => [$this, 'analyzeChatCompletion']
        ];
    }

    public function trackApiResponse($data): void {
        echo "📊 Analytics: API response tracked - Duration: {$data['duration']}s\n";
    }

    public function analyzeChatCompletion($data): void {
        echo "🧠 Analytics: Chat completion analyzed - Tokens: {$data['usage']['total_tokens']}\n";
    }

    public function getConfigSchema(): array {
        return [
            'tracking_enabled' => ['type' => 'boolean', 'default' => true],
            'report_interval' => ['type' => 'integer', 'default' => 3600]
        ];
    }

    public function validateConfig(array $config): bool {
        return true;
    }

    public function update(string $oldVersion, string $newVersion): bool {
        return true;
    }
}

echo "🚀 Venice AI Enterprise Edition - Feature Showcase\n";
echo "================================================\n\n";

try {
    // Initialize Venice AI with enterprise configuration
    $venice = new VeniceAI('your-api-key-here', [
        'debug' => true,
        'cache' => [
            'driver' => 'memory',
            'default_ttl' => 3600
        ],
        'security' => [
            'encryption_method' => 'AES-256-CBC',
            'rate_limit_window' => 60,
            'rate_limit_max' => 100
        ],
        'async' => [
            'max_workers' => 4,
            'enable_parallel' => true
        ],
        'plugins' => [
            'auto_discover' => false
        ]
    ]);

    echo "✅ Venice AI Enterprise Edition initialized\n\n";

    // 1. Configuration Management Demo
    echo "📋 Configuration Management\n";
    echo "==========================\n";

    $configManager = $venice->config();
    $configManager->set('app.name', 'Venice AI Enterprise Demo');
    $configManager->set('app.version', '2.0.0');

    echo "App Name: " . $configManager->get('app.name') . "\n";
    echo "App Version: " . $configManager->get('app.version') . "\n";

    // Create configuration snapshot
    $configManager->createSnapshot('demo_snapshot');
    echo "📸 Configuration snapshot created\n\n";

    // 2. Plugin System Demo
    echo "🔌 Plugin System\n";
    echo "================\n";

    $pluginManager = $venice->plugins();
    $customPlugin = new CustomAnalyticsPlugin();

    $pluginManager->register('custom_analytics', $customPlugin);
    $pluginManager->activate('custom_analytics');

    echo "Active plugins: " . count($pluginManager->getActivePlugins()) . "\n\n";

    // 3. Event System Demo
    echo "📡 Event System\n";
    echo "===============\n";

    $eventManager = $venice->events();

    // Add custom event listener
    $eventManager->addListener('demo.event', function($event) {
        echo "🎯 Custom event triggered: " . $event->getName() . "\n";
    });

    // Dispatch custom event
    $eventManager->dispatch(new Event('demo.event', ['message' => 'Hello from events!']));
    echo "\n";

    // 4. Caching System Demo
    echo "💾 Caching System\n";
    echo "=================\n";

    $cacheManager = $venice->cache();

    // Cache some data
    $cacheManager->set('demo_key', ['message' => 'Cached data', 'timestamp' => time()]);
    $cachedData = $cacheManager->get('demo_key');

    echo "Cached data retrieved: " . $cachedData['message'] . "\n";
    echo "Cache stats: " . json_encode($cacheManager->getStats()) . "\n\n";

    // 5. Security Features Demo
    echo "🔒 Security Features\n";
    echo "====================\n";

    $securityManager = $venice->security();

    // Encrypt sensitive data
    $sensitiveData = "This is sensitive information";
    $encrypted = $securityManager->encrypt($sensitiveData);
    $decrypted = $securityManager->decrypt($encrypted);

    echo "Original: $sensitiveData\n";
    echo "Encrypted: " . substr($encrypted, 0, 50) . "...\n";
    echo "Decrypted: $decrypted\n\n";

    // 6. Metrics and Monitoring Demo
    echo "📊 Metrics & Monitoring\n";
    echo "=======================\n";

    $metricsCollector = $venice->metrics();

    // Record custom metrics
    $metricsCollector->increment('demo.counter');
    $metricsCollector->record('demo.timer', 1.5);
    $metricsCollector->gauge('demo.memory', memory_get_usage());

    // Get comprehensive metrics
    $metrics = $venice->getMetrics();
    echo "Total metrics recorded: " . count($metrics) . "\n";

    // Get health report
    $health = $venice->getHealth();
    echo "System health: " . ($health['status'] === 'healthy' ? '✅ Healthy' : '❌ Unhealthy') . "\n\n";

    // 7. Asynchronous Processing Demo
    echo "⚡ Asynchronous Processing\n";
    echo "=========================\n";

    $asyncProcessor = $venice->async();

    if ($asyncProcessor->isEnabled()) {
        echo "✅ Async processing is enabled\n";
        echo "Max workers: " . $asyncProcessor->getMaxWorkers() . "\n";

        // Queue some async tasks (simulated)
        for ($i = 1; $i <= 3; $i++) {
            $asyncProcessor->queue(function() use ($i) {
                return "Task $i completed";
            });
        }

        echo "📋 Queued 3 async tasks\n";
    } else {
        echo "❌ Async processing is disabled\n";
    }
    echo "\n";

    // 8. AI Services Demo (if API key is valid)
    echo "🤖 AI Services Demo\n";
    echo "===================\n";

    try {
        // Chat completion with caching and metrics
        $chatResponse = $venice->chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                ['role' => 'user', 'content' => 'Hello! This is a test of the Venice AI Enterprise SDK.']
            ],
            'max_tokens' => 50
        ]);

        echo "✅ Chat completion successful\n";
        echo "Response: " . $chatResponse['choices'][0]['message']['content'] . "\n";

    } catch (Exception $e) {
        echo "ℹ️  Chat demo skipped (API key required): " . $e->getMessage() . "\n";
    }
    echo "\n";

    // 9. Performance Summary
    echo "📈 Performance Summary\n";
    echo "=====================\n";

    $finalMetrics = $venice->getMetrics();
    echo "API Requests: " . ($finalMetrics['api.requests'] ?? 0) . "\n";
    echo "Cache Hits: " . ($finalMetrics['cache.hits'] ?? 0) . "\n";
    echo "Cache Misses: " . ($finalMetrics['cache.misses'] ?? 0) . "\n";
    echo "Errors: " . ($finalMetrics['api.errors'] ?? 0) . "\n";

    if (isset($finalMetrics['api.request_time'])) {
        echo "Average Response Time: " . round($finalMetrics['api.request_time'], 3) . "s\n";
    }

    echo "\n";

    // 10. Plugin Management Demo
    echo "🔧 Plugin Management\n";
    echo "====================\n";

    // Get plugin metadata
    $pluginMetadata = $pluginManager->getPluginMetadata('custom_analytics');
    echo "Plugin: " . $pluginMetadata['name'] . " v" . $pluginMetadata['version'] . "\n";
    echo "Author: " . $pluginMetadata['author'] . "\n";

    // Execute plugin hooks
    $pluginManager->executeHook('demo.hook', ['test' => 'data']);

    // Deactivate plugin
    $pluginManager->deactivate('custom_analytics');
    echo "\n";

    // 11. Configuration Export/Import Demo
    echo "📤 Configuration Export/Import\n";
    echo "==============================\n";

    // Export configuration
    $configJson = $configManager->export('json');
    echo "Configuration exported to JSON (" . strlen($configJson) . " bytes)\n";

    // Create diff
    $originalConfig = $configManager->all();
    $configManager->set('demo.new_setting', 'test_value');
    $diff = $configManager->diff($originalConfig);
    echo "Configuration changes: " . count($diff) . " items\n\n";

    echo "🎉 Enterprise Features Showcase Complete!\n";
    echo "=========================================\n";
    echo "All advanced features have been demonstrated successfully.\n";
    echo "The Venice AI Enterprise Edition provides comprehensive\n";
    echo "enterprise-grade capabilities for production applications.\n\n";

    // Cleanup and shutdown
    echo "🧹 Cleaning up...\n";
    $venice->shutdown();
    echo "✅ Shutdown complete\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
