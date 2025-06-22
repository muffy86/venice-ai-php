<?php

namespace Venice\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Utils\Logger;
use Venice\Http\HttpClient;
use Venice\Cache\CacheManager;

/**
 * Integration tests for all optimization features working together
 */
class OptimizationIntegrationTest extends TestCase {
    private VeniceAI $venice;
    private array $config;

    protected function setUp(): void {
        $this->config = [
            'debug' => false,
            'timeout' => 30,
            'max_retries' => 3,
            'cache' => [
                'driver' => 'memory',
                'memory_cache' => [
                    'enabled' => true,
                    'max_items' => 1000,
                    'ttl' => 3600
                ]
            ],
            'async' => [
                'enable_parallel' => true,
                'max_workers' => 4
            ],
            'plugins' => [
                'enabled' => true
            ]
        ];
    }

    public function testOptimizedInitialization(): void {
        $startTime = microtime(true);

        $this->venice = new VeniceAI('test-api-key', $this->config);

        $initTime = microtime(true) - $startTime;

        // Initialization should be fast with lazy loading
        $this->assertLessThan(0.5, $initTime, 'Initialization should take less than 500ms');

        // Verify core components are initialized
        $this->assertInstanceOf(Logger::class, $this->venice->getLogger());
        $this->assertInstanceOf(CacheManager::class, $this->venice->cache());
    }

    public function testCacheIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $cache = $this->venice->cache();

        // Test cache functionality
        $key = 'integration_test';
        $value = ['data' => 'test_value', 'timestamp' => time()];

        $this->assertTrue($cache->set($key, $value));
        $this->assertEquals($value, $cache->get($key));

        // Test cache statistics
        $stats = $cache->getStats();
        $this->assertArrayHasKey('hits', $stats);
        $this->assertArrayHasKey('misses', $stats);
    }

    public function testHttpClientIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        // Configure HTTP client through Venice
        HttpClient::configure([
            'keep_alive' => true,
            'connection_pool_size' => 5
        ]);

        $stats = HttpClient::getStats();
        $this->assertArrayHasKey('requests', $stats);
        $this->assertArrayHasKey('cache_hits', $stats);
        $this->assertArrayHasKey('connection_reuses', $stats);
    }

    public function testMetricsCollection(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $metrics = $this->venice->getMetrics();

        $this->assertIsArray($metrics);
        $this->assertArrayHasKey('system', $metrics);
        $this->assertArrayHasKey('performance', $metrics);
    }

    public function testEventSystemIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $events = $this->venice->events();
        $eventFired = false;

        // Register event listener
        $events->on('test.event', function($data) use (&$eventFired) {
            $eventFired = true;
        });

        // Dispatch event
        $events->dispatch(new \Venice\Events\Event('test.event', ['test' => true]));

        $this->assertTrue($eventFired, 'Event should have been fired');
    }

    public function testConcurrentOperations(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $cache = $this->venice->cache();
        $operations = [];

        // Simulate concurrent cache operations
        for ($i = 0; $i < 10; $i++) {
            $operations[] = function() use ($cache, $i) {
                $key = "concurrent_$i";
                $value = "value_$i";

                $cache->set($key, $value);
                return $cache->get($key) === $value;
            };
        }

        // Execute operations
        $results = array_map(function($op) { return $op(); }, $operations);

        // All operations should succeed
        $this->assertCount(10, array_filter($results));
    }

    public function testMemoryEfficiency(): void {
        $initialMemory = memory_get_usage();

        $this->venice = new VeniceAI('test-api-key', $this->config);

        // Perform various operations
        $cache = $this->venice->cache();
        for ($i = 0; $i < 100; $i++) {
            $cache->set("memory_test_$i", str_repeat('x', 1000));
        }

        $peakMemory = memory_get_usage();

        // Cleanup
        $cache->cleanup();
        unset($this->venice);

        $finalMemory = memory_get_usage();

        // Memory usage should be reasonable
        $memoryIncrease = $peakMemory - $initialMemory;
        $this->assertLessThan(20 * 1024 * 1024, $memoryIncrease); // Less than 20MB

        // Memory should be cleaned up
        $memoryAfterCleanup = $finalMemory - $initialMemory;
        $this->assertLessThan($memoryIncrease * 0.5, $memoryAfterCleanup);
    }

    public function testConfigurationIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $configManager = $this->venice->config();

        // Test configuration access
        $this->assertIsArray($configManager->get('cache'));
        $this->assertEquals('memory', $configManager->get('cache.driver'));

        // Test configuration updates
        $configManager->set('test.value', 'test_data');
        $this->assertEquals('test_data', $configManager->get('test.value'));
    }

    public function testPluginSystemIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $pluginManager = $this->venice->plugins();

        // Test plugin manager is available
        $this->assertNotNull($pluginManager);

        // Test plugin loading capabilities
        $loadedPlugins = $pluginManager->getLoadedPlugins();
        $this->assertIsArray($loadedPlugins);
    }

    public function testAsyncProcessorIntegration(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $async = $this->venice->async();

        // Test async processor availability
        $this->assertNotNull($async);

        // Test task queuing
        $taskCompleted = false;
        $async->queue(function() use (&$taskCompleted) {
            $taskCompleted = true;
        });

        // Process tasks
        $async->process();

        $this->assertTrue($taskCompleted, 'Async task should have completed');
    }

    public function testHealthMonitoring(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $health = $this->venice->getHealth();

        $this->assertIsArray($health);
        $this->assertArrayHasKey('status', $health);
        $this->assertArrayHasKey('components', $health);
        $this->assertArrayHasKey('metrics', $health);
    }

    public function testPerformanceUnderLoad(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        $startTime = microtime(true);
        $operations = 1000;

        // Perform many operations
        for ($i = 0; $i < $operations; $i++) {
            $this->venice->cache()->set("load_test_$i", "value_$i");
            $this->venice->cache()->get("load_test_$i");
        }

        $duration = microtime(true) - $startTime;
        $opsPerSecond = $operations / $duration;

        // Should handle at least 1000 ops/second
        $this->assertGreaterThan(1000, $opsPerSecond, 'Should handle at least 1000 operations per second');
    }

    public function testResourceCleanup(): void {
        $this->venice = new VeniceAI('test-api-key', $this->config);

        // Use various components
        $this->venice->cache()->set('cleanup_test', 'value');
        $this->venice->events()->dispatch(new \Venice\Events\Event('cleanup.test', []));

        // Cleanup should not throw errors
        $this->venice->cache()->cleanup();
        HttpClient::cleanup();

        $this->assertTrue(true, 'Cleanup completed without errors');
    }

    protected function tearDown(): void {
        if (isset($this->venice)) {
            // Cleanup resources
            $this->venice->cache()->cleanup();
            HttpClient::cleanup();
            unset($this->venice);
        }
    }
}
