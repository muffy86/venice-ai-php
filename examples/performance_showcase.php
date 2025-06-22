<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Http\HttpClient;
use Venice\Cache\CacheManager;
use Venice\Utils\Logger;

/**
 * Performance Showcase - Demonstrates optimized features
 */

echo "Venice AI PHP SDK - Performance Optimization Showcase\n";
echo "====================================================\n\n";

// Initialize Venice AI with optimized configuration
$config = [
    'debug' => false,
    'timeout' => 30,
    'max_retries' => 3,
    'cache' => [
        'driver' => 'memory',
        'memory_cache' => [
            'enabled' => true,
            'max_items' => 10000,
            'ttl' => 3600
        ],
        'compression' => [
            'enabled' => true,
            'level' => 6
        ]
    ],
    'http' => [
        'keep_alive' => true,
        'connection_pool_size' => 10,
        'dns_cache_timeout' => 300,
        'buffer_size' => 65536
    ]
];

$venice = new VeniceAI('demo-api-key', $config);

// 1. Cache Performance Demo
echo "1. Cache Performance Demonstration\n";
echo "-----------------------------------\n";

$cache = $venice->cache();
$iterations = 1000;

// Warm up cache
echo "Warming up cache with $iterations items...\n";
$startTime = microtime(true);

for ($i = 0; $i < $iterations; $i++) {
    $cache->set("perf_test_$i", [
        'id' => $i,
        'data' => str_repeat('x', 100),
        'timestamp' => time()
    ]);
}

$writeTime = microtime(true) - $startTime;
echo "Cache write time: " . round($writeTime * 1000, 2) . "ms\n";
echo "Write rate: " . round($iterations / $writeTime) . " ops/sec\n\n";

// Test cache read performance
echo "Testing cache read performance...\n";
$startTime = microtime(true);

for ($i = 0; $i < $iterations; $i++) {
    $cache->get("perf_test_$i");
}

$readTime = microtime(true) - $startTime;
echo "Cache read time: " . round($readTime * 1000, 2) . "ms\n";
echo "Read rate: " . round($iterations / $readTime) . " ops/sec\n\n";

// Display cache statistics
$stats = $cache->getStats();
echo "Cache Statistics:\n";
foreach ($stats as $key => $value) {
    echo "  $key: $value\n";
}
echo "\n";

// 2. HTTP Client Performance Demo
echo "2. HTTP Client Performance Demonstration\n";
echo "----------------------------------------\n";

// Configure HTTP client
HttpClient::configure([
    'keep_alive' => true,
    'connection_pool_size' => 10,
    'timeout' => 10
]);

// Simulate multiple requests to same host
$urls = [
    'https://api.venice.ai/v2/test1',
    'https://api.venice.ai/v2/test2',
    'https://api.venice.ai/v2/test3'
];

echo "Simulating HTTP requests with connection pooling...\n";
$startTime = microtime(true);

try {
    foreach ($urls as $url) {
        // Note: These are demo URLs and will fail in real execution
        // In a real scenario, these would be actual API endpoints
        echo "Request to: $url (simulated)\n";
    }
} catch (Exception $e) {
    echo "Note: Demo URLs used - actual requests would work with real endpoints\n";
}

$httpTime = microtime(true) - $startTime;
echo "HTTP request simulation time: " . round($httpTime * 1000, 2) . "ms\n";

// Display HTTP client statistics
$httpStats = HttpClient::getStats();
echo "HTTP Client Statistics:\n";
foreach ($httpStats as $key => $value) {
    echo "  $key: $value\n";
}
echo "\n";

// 3. Memory Usage Demo
echo "3. Memory Usage Optimization\n";
echo "----------------------------\n";

$initialMemory = memory_get_usage();
echo "Initial memory usage: " . formatBytes($initialMemory) . "\n";

// Perform memory-intensive operations
echo "Performing memory-intensive operations...\n";
for ($i = 0; $i < 5000; $i++) {
    $cache->set("memory_test_$i", str_repeat('data', 50));
}

$peakMemory = memory_get_usage();
echo "Peak memory usage: " . formatBytes($peakMemory) . "\n";
echo "Memory increase: " . formatBytes($peakMemory - $initialMemory) . "\n";

// Cleanup and measure memory recovery
$cache->cleanup();
$finalMemory = memory_get_usage();
echo "Memory after cleanup: " . formatBytes($finalMemory) . "\n";
echo "Memory recovered: " . formatBytes($peakMemory - $finalMemory) . "\n\n";

// 4. Concurrent Operations Demo
echo "4. Concurrent Operations Performance\n";
echo "------------------------------------\n";

echo "Simulating concurrent cache operations...\n";
$startTime = microtime(true);

// Simulate concurrent operations
$operations = [];
for ($i = 0; $i < 100; $i++) {
    $operations[] = function() use ($cache, $i) {
        $key = "concurrent_$i";
        $value = "value_$i";

        $cache->set($key, $value);
        return $cache->get($key) === $value;
    };
}

// Execute operations
$results = array_map(function($op) { return $op(); }, $operations);
$successCount = count(array_filter($results));

$concurrentTime = microtime(true) - $startTime;
echo "Concurrent operations time: " . round($concurrentTime * 1000, 2) . "ms\n";
echo "Success rate: $successCount/" . count($operations) . " (" . round(($successCount/count($operations))*100, 1) . "%)\n";
echo "Concurrent ops rate: " . round(count($operations) / $concurrentTime) . " ops/sec\n\n";

// 5. Compression Demo
echo "5. Compression Performance\n";
echo "--------------------------\n";

$largeData = str_repeat('This is compressible test data. ', 1000);
$originalSize = strlen($largeData);

echo "Original data size: " . formatBytes($originalSize) . "\n";

$startTime = microtime(true);
$cache->set('compression_test', $largeData);
$compressionTime = microtime(true) - $startTime;

$startTime = microtime(true);
$retrievedData = $cache->get('compression_test');
$decompressionTime = microtime(true) - $startTime;

echo "Compression time: " . round($compressionTime * 1000, 2) . "ms\n";
echo "Decompression time: " . round($decompressionTime * 1000, 2) . "ms\n";
echo "Data integrity: " . ($largeData === $retrievedData ? 'PASSED' : 'FAILED') . "\n\n";

// 6. System Health Check
echo "6. System Health and Metrics\n";
echo "-----------------------------\n";

$health = $venice->getHealth();
echo "System Health Status: " . $health['status'] . "\n";

if (isset($health['components'])) {
    echo "Component Status:\n";
    foreach ($health['components'] as $component => $status) {
        echo "  $component: $status\n";
    }
}

if (isset($health['metrics'])) {
    echo "Performance Metrics:\n";
    foreach ($health['metrics'] as $metric => $value) {
        echo "  $metric: $value\n";
    }
}
echo "\n";

// 7. Configuration Optimization
echo "7. Configuration Performance\n";
echo "----------------------------\n";

$configManager = $venice->config();
$startTime = microtime(true);

// Test configuration access speed
for ($i = 0; $i < 1000; $i++) {
    $configManager->get('cache.driver');
    $configManager->get('http.keep_alive');
}

$configTime = microtime(true) - $startTime;
echo "Configuration access time (1000 ops): " . round($configTime * 1000, 2) . "ms\n";
echo "Config access rate: " . round(1000 / $configTime) . " ops/sec\n\n";

// Final cleanup
echo "8. Resource Cleanup\n";
echo "-------------------\n";

$cache->cleanup();
HttpClient::cleanup();

echo "All resources cleaned up successfully.\n\n";

// Performance Summary
echo "Performance Summary\n";
echo "===================\n";
echo "Cache write rate: " . round($iterations / $writeTime) . " ops/sec\n";
echo "Cache read rate: " . round($iterations / $readTime) . " ops/sec\n";
echo "Memory efficiency: " . formatBytes($peakMemory - $initialMemory) . " for " . ($iterations + 5000) . " operations\n";
echo "Concurrent success rate: " . round(($successCount/count($operations))*100, 1) . "%\n";
echo "Configuration access rate: " . round(1000 / $configTime) . " ops/sec\n";

/**
 * Helper function to format bytes
 */
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');

    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }

    return round($bytes, $precision) . ' ' . $units[$i];
}

echo "\nPerformance showcase completed!\n";
