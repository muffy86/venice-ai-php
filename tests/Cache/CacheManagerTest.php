<?php

namespace Venice\Tests\Cache;

use PHPUnit\Framework\TestCase;
use Venice\Cache\CacheManager;
use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Exceptions\VeniceException;

class CacheManagerTest extends TestCase {
    private Logger $logger;
    private EventManager $events;
    private CacheManager $cache;
    private array $config;

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        $this->events = $this->createMock(EventManager::class);

        $this->config = [
            'driver' => 'memory',
            'prefix' => 'test:',
            'memory_cache' => [
                'enabled' => true,
                'max_items' => 100,
                'ttl' => 3600
            ],
            'compression' => [
                'enabled' => true,
                'level' => 6
            ]
        ];

        $this->cache = new CacheManager($this->config, $this->logger, $this->events);
    }

    public function testBasicSetAndGet(): void {
        $key = 'test_key';
        $value = ['data' => 'test_value'];

        $this->assertTrue($this->cache->set($key, $value));
        $this->assertEquals($value, $this->cache->get($key));
    }

    public function testGetNonExistentKey(): void {
        $this->assertNull($this->cache->get('non_existent_key'));
    }

    public function testSetWithTTL(): void {
        $key = 'ttl_key';
        $value = 'ttl_value';
        $ttl = 1; // 1 second

        $this->assertTrue($this->cache->set($key, $value, $ttl));
        $this->assertEquals($value, $this->cache->get($key));

        // Wait for expiration
        sleep(2);
        $this->assertNull($this->cache->get($key));
    }

    public function testDelete(): void {
        $key = 'delete_key';
        $value = 'delete_value';

        $this->cache->set($key, $value);
        $this->assertEquals($value, $this->cache->get($key));

        $this->assertTrue($this->cache->delete($key));
        $this->assertNull($this->cache->get($key));
    }

    public function testTaggedCaching(): void {
        $key1 = 'tagged_key_1';
        $key2 = 'tagged_key_2';
        $tag = 'test_tag';

        $this->cache->set($key1, 'value1', null, [$tag]);
        $this->cache->set($key2, 'value2', null, [$tag]);

        $this->assertEquals('value1', $this->cache->get($key1));
        $this->assertEquals('value2', $this->cache->get($key2));

        // Clear by tag
        $this->assertTrue($this->cache->clearByTag($tag));

        $this->assertNull($this->cache->get($key1));
        $this->assertNull($this->cache->get($key2));
    }

    public function testLRUEviction(): void {
        // Configure small cache for testing eviction
        $config = array_merge($this->config, [
            'memory_cache' => ['max_items' => 3, 'ttl' => 3600, 'enabled' => true]
        ]);

        $cache = new CacheManager($config, $this->logger, $this->events);

        // Fill cache to capacity
        $cache->set('key1', 'value1');
        $cache->set('key2', 'value2');
        $cache->set('key3', 'value3');

        // Add one more item to trigger eviction
        $cache->set('key4', 'value4');

        // First item should be evicted
        $this->assertNull($cache->get('key1'));
        $this->assertEquals('value4', $cache->get('key4'));
    }

    public function testCacheStatistics(): void {
        $this->cache->set('stats_key', 'stats_value');
        $this->cache->get('stats_key'); // Hit
        $this->cache->get('non_existent'); // Miss

        $stats = $this->cache->getStats();

        $this->assertArrayHasKey('hits', $stats);
        $this->assertArrayHasKey('misses', $stats);
        $this->assertArrayHasKey('writes', $stats);
        $this->assertArrayHasKey('memory_items', $stats);
        $this->assertArrayHasKey('hit_rate', $stats);

        $this->assertGreaterThan(0, $stats['hits']);
        $this->assertGreaterThan(0, $stats['misses']);
        $this->assertGreaterThan(0, $stats['writes']);
    }

    public function testCompressionHandling(): void {
        $largeData = str_repeat('This is compressible data. ', 1000);
        $key = 'compression_key';

        $this->assertTrue($this->cache->set($key, $largeData));
        $this->assertEquals($largeData, $this->cache->get($key));
    }

    public function testCleanup(): void {
        // Add items with short TTL
        $this->cache->set('cleanup1', 'value1', 1);
        $this->cache->set('cleanup2', 'value2', 1);

        // Wait for expiration
        sleep(2);

        // Cleanup should remove expired items
        $this->cache->cleanup();

        $stats = $this->cache->getStats();
        $this->assertEquals(0, $stats['memory_items']);
    }

    public function testMultiTierCaching(): void {
        // Test memory -> file fallback
        $config = array_merge($this->config, [
            'driver' => 'file',
            'file_cache_dir' => sys_get_temp_dir() . '/test_cache'
        ]);

        $cache = new CacheManager($config, $this->logger, $this->events);

        $key = 'multitier_key';
        $value = 'multitier_value';

        $this->assertTrue($cache->set($key, $value));
        $this->assertEquals($value, $cache->get($key));

        // Clean up test directory
        $this->cleanupTestCache($config['file_cache_dir']);
    }

    public function testConcurrentAccess(): void {
        $key = 'concurrent_key';
        $values = [];

        // Simulate concurrent writes
        for ($i = 0; $i < 10; $i++) {
            $value = "value_$i";
            $values[] = $value;
            $this->cache->set($key . "_$i", $value);
        }

        // Verify all values are accessible
        for ($i = 0; $i < 10; $i++) {
            $this->assertEquals("value_$i", $this->cache->get($key . "_$i"));
        }
    }

    public function testErrorHandling(): void {
        // Test with invalid configuration
        $invalidConfig = [
            'driver' => 'invalid_driver',
            'file_cache_dir' => '/invalid/path'
        ];

        $this->expectException(VeniceException::class);
        new CacheManager($invalidConfig, $this->logger, $this->events);
    }

    public function testMemoryUsageOptimization(): void {
        $initialMemory = memory_get_usage();

        // Add many items
        for ($i = 0; $i < 1000; $i++) {
            $this->cache->set("memory_test_$i", str_repeat('x', 100));
        }

        $peakMemory = memory_get_usage();

        // Cleanup
        $this->cache->cleanup();

        $finalMemory = memory_get_usage();

        // Memory should be managed efficiently
        $memoryIncrease = $peakMemory - $initialMemory;
        $this->assertLessThan(50 * 1024 * 1024, $memoryIncrease); // Less than 50MB
    }

    private function cleanupTestCache(string $dir): void {
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($dir);
        }
    }
}
