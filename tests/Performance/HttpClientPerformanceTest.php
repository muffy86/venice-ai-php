<?php

namespace Venice\Tests\Performance;

use PHPUnit\Framework\TestCase;
use Venice\Http\HttpClient;
use Venice\Utils\Logger;

/**
 * Performance test suite for HttpClient optimizations
 */
class HttpClientPerformanceTest extends TestCase {
    private Logger $logger;
    private string $testUrl = 'https://api.venice.ai/v2/test';
    private array $testData;

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        HttpClient::setLogger($this->logger);
        HttpClient::resetStats();
        HttpClient::clearCache();
        HttpClient::closeConnections();

        // Generate test data
        $this->testData = $this->generateTestData();
    }

    /**
     * Test connection pooling performance
     */
    public function testConnectionPoolingPerformance(): void {
        // Configure client with and without connection pooling
        $iterations = 50;
        $urls = [
            'https://api1.venice.ai/v2/test',
            'https://api2.venice.ai/v2/test',
            'https://api3.venice.ai/v2/test'
        ];

        // Test with connection pooling
        HttpClient::configure(['keep_alive' => true]);
        $pooledTime = $this->measureRequestTime($urls, $iterations);

        // Test without connection pooling
        HttpClient::configure(['keep_alive' => false]);
        $unpooledTime = $this->measureRequestTime($urls, $iterations);

        // Assert performance improvement
        $improvement = (($unpooledTime - $pooledTime) / $unpooledTime) * 100;
        $this->assertGreaterThan(
            20,
            $improvement,
            "Connection pooling should improve performance by at least 20%"
        );

        $stats = HttpClient::getStats();
        $this->assertGreaterThan(0, $stats['connection_reuses']);
    }

    /**
     * Test caching performance
     */
    public function testCachingPerformance(): void {
        $iterations = 100;

        // Warm up cache
        HttpClient::request($this->testUrl);

        $startTime = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            HttpClient::request($this->testUrl);
        }

        $duration = microtime(true) - $startTime;
        $avgResponseTime = $duration / $iterations * 1000; // Convert to milliseconds

        $stats = HttpClient::getStats();

        // Assert cache effectiveness
        $this->assertGreaterThan(
            90,
            ($stats['cache_hits'] / $iterations) * 100,
            "Cache hit rate should be above 90%"
        );

        // Assert response time
        $this->assertLessThan(
            5, // 5ms
            $avgResponseTime,
            "Average cached response time should be less than 5ms"
        );
    }

    /**
     * Test concurrent request performance
     */
    public function testConcurrentRequestPerformance(): void {
        $concurrentRequests = 10;
        $urls = array_fill(0, $concurrentRequests, $this->testUrl);

        $startTime = microtime(true);

        // Simulate concurrent requests
        $responses = [];
        foreach ($urls as $url) {
            $responses[] = HttpClient::request($url);
        }

        $duration = microtime(true) - $startTime;
        $avgRequestTime = $duration / $concurrentRequests;

        // Assert reasonable concurrent performance
        $this->assertLessThan(
            0.5, // 500ms
            $avgRequestTime,
            "Average concurrent request time should be less than 500ms"
        );
    }

    /**
     * Test large payload handling
     */
    public function testLargePayloadPerformance(): void {
        $payloadSizes = [10, 100, 1000, 10000]; // KB
        $results = [];

        foreach ($payloadSizes as $size) {
            $payload = $this->generatePayload($size);

            $startTime = microtime(true);
            HttpClient::request($this->testUrl, 'POST', [], $payload);
            $duration = microtime(true) - $startTime;

            $results[$size] = $duration;

            // Clean up
            HttpClient::clearCache();
        }

        // Assert reasonable scaling
        foreach ($results as $size => $duration) {
            if ($size > 10) { // Skip baseline
                $scaleFactor = $duration / $results[10];
                $sizeRatio = $size / 10;

                // Duration should scale sub-linearly with payload size
                $this->assertLessThan(
                    $sizeRatio,
                    $scaleFactor,
                    "Performance should scale sub-linearly with payload size"
                );
            }
        }
    }

    /**
     * Test retry mechanism performance
     */
    public function testRetryMechanismPerformance(): void {
        $startTime = microtime(true);

        try {
            HttpClient::request($this->testUrl);
        } catch (\Exception $e) {
            // Expected
        }

        $duration = microtime(true) - $startTime;
        $stats = HttpClient::getStats();

        // Assert retry timing
        $this->assertLessThan(
            HttpClient::getConfig()['timeout'] * HttpClient::getConfig()['max_retries'],
            $duration,
            "Retry mechanism should not exceed maximum theoretical duration"
        );

        // Assert exponential backoff
        $this->assertTrue(
            $stats['retries'] > 0,
            "Retry mechanism should have been triggered"
        );
    }

    /**
     * Test memory usage
     */
    public function testMemoryUsage(): void {
        $initialMemory = memory_get_usage();

        // Perform multiple requests with varying payload sizes
        for ($i = 0; $i < 100; $i++) {
            $payload = $this->generatePayload(mt_rand(1, 100)); // 1-100 KB
            HttpClient::request($this->testUrl, 'POST', [], $payload);
        }

        $memoryUsed = memory_get_usage() - $initialMemory;

        // Assert reasonable memory usage (less than 10MB)
        $this->assertLessThan(
            10 * 1024 * 1024,
            $memoryUsed,
            "Memory usage should be less than 10MB"
        );

        // Test memory cleanup
        HttpClient::cleanup();
        $finalMemory = memory_get_usage();

        $this->assertLessThan(
            $initialMemory * 1.1, // Allow 10% overhead
            $finalMemory,
            "Memory should be properly cleaned up"
        );
    }

    /**
     * Test compression effectiveness
     */
    public function testCompressionEffectiveness(): void {
        $payload = $this->generateCompressiblePayload(1000); // 1MB of compressible data

        // Test with compression
        HttpClient::configure(['compression' => true]);
        $compressedStart = microtime(true);
        HttpClient::request($this->testUrl, 'POST', [], $payload);
        $compressedTime = microtime(true) - $compressedStart;

        // Test without compression
        HttpClient::configure(['compression' => false]);
        $uncompressedStart = microtime(true);
        HttpClient::request($this->testUrl, 'POST', [], $payload);
        $uncompressedTime = microtime(true) - $uncompressedStart;

        // Assert compression benefits
        $this->assertLessThan(
            $uncompressedTime,
            $compressedTime,
            "Compression should improve transfer time for compressible data"
        );
    }

    /**
     * Helper methods
     */
    private function measureRequestTime(array $urls, int $iterations): float {
        $startTime = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            foreach ($urls as $url) {
                HttpClient::request($url);
            }
        }

        return microtime(true) - $startTime;
    }

    private function generateTestData(): array {
        return [
            'string' => str_repeat('test', 1000),
            'array' => array_fill(0, 1000, 'test'),
            'nested' => array_fill(0, 100, array_fill(0, 10, 'test'))
        ];
    }

    private function generatePayload(int $sizeKB): array {
        $data = [];
        $itemSize = 100; // bytes per item (approximate)
        $items = ($sizeKB * 1024) / $itemSize;

        for ($i = 0; $i < $items; $i++) {
            $data[] = [
                'id' => $i,
                'value' => base64_encode(random_bytes(32)),
                'timestamp' => time()
            ];
        }

        return $data;
    }

    private function generateCompressiblePayload(int $sizeKB): array {
        $data = [];
        $pattern = "This is a highly compressible string with lots of repetition. ";
        $iterations = ($sizeKB * 1024) / strlen($pattern);

        for ($i = 0; $i < $iterations; $i++) {
            $data[] = $pattern;
        }

        return $data;
    }
}
