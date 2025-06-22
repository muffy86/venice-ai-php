<?php

namespace Venice\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Exceptions\AuthenticationException;
use Venice\Exceptions\RateLimitException;
use Venice\Exceptions\ValidationException;

class VeniceIntegrationTest extends TestCase {
    private VeniceAI $venice;
    private string $apiKey;

    protected function setUp(): void {
        $this->apiKey = getenv('VENICE_API_KEY') ?: 'test-api-key';
        $this->venice = new VeniceAI($this->apiKey, [
            'debug' => true,
            'log_file' => sys_get_temp_dir() . '/venice-integration-test.log',
            'timeout' => 30,
            'max_retries' => 3
        ]);
    }

    public function testRealAPIInteraction(): void {
        try {
            $response = $this->venice->models()->list();
            $this->assertIsArray($response);
            $this->assertArrayHasKey('data', $response);
        } catch (AuthenticationException $e) {
            $this->markTestSkipped('API key not valid for real API testing');
        }
    }

    public function testRateLimitingBehavior(): void {
        $this->expectException(RateLimitException::class);

        // Make rapid requests to trigger rate limit
        for ($i = 0; $i < 100; $i++) {
            $this->venice->models()->list();
        }
    }

    public function testStreamingResponses(): void {
        try {
            $messages = [
                ['role' => 'user', 'content' => 'Hello, world!']
            ];

            $generator = $this->venice->chat()->createStreamingCompletion($messages);
            $chunks = [];

            foreach ($generator as $chunk) {
                $chunks[] = $chunk;
                $this->assertArrayHasKey('choices', $chunk);
            }

            $this->assertNotEmpty($chunks);
        } catch (AuthenticationException $e) {
            $this->markTestSkipped('API key not valid for streaming test');
        }
    }

    public function testNetworkFailureRetry(): void {
        // Configure client with invalid base URL to simulate network failure
        $venice = new VeniceAI($this->apiKey, [
            'base_url' => 'https://invalid.venice.ai',
            'max_retries' => 3,
            'timeout' => 5
        ]);

        $start = microtime(true);

        try {
            $venice->models()->list();
            $this->fail('Expected exception not thrown');
        } catch (\Exception $e) {
            $duration = microtime(true) - $start;

            // Should have attempted 3 retries
            $this->assertGreaterThan(10, $duration); // At least 2 retries worth of delay
            $this->assertStringContainsString('after 3 attempts', $e->getMessage());
        }
    }

    public function testLargeMessageHandling(): void {
        $largeContent = str_repeat('a', 100000); // 100KB message

        try {
            $messages = [
                ['role' => 'user', 'content' => $largeContent]
            ];

            $this->expectException(ValidationException::class);
            $this->venice->chat()->createCompletion($messages);
        } catch (AuthenticationException $e) {
            $this->markTestSkipped('API key not valid for large message test');
        }
    }

    public function testConcurrentRequests(): void {
        $processes = [];
        $results = [];

        // Spawn multiple processes to make concurrent requests
        for ($i = 0; $i < 5; $i++) {
            $processes[$i] = popen('php ' . __DIR__ . '/concurrent_request.php', 'r');
        }

        // Collect results
        foreach ($processes as $i => $process) {
            $results[$i] = fgets($process);
            pclose($process);
        }

        // Verify all requests completed
        $this->assertCount(5, array_filter($results));
    }

    public function testMemoryUsage(): void {
        $initialMemory = memory_get_usage();

        // Make several requests with large payloads
        for ($i = 0; $i < 10; $i++) {
            $messages = [
                ['role' => 'user', 'content' => str_repeat('a', 10000)]
            ];

            try {
                $this->venice->chat()->createCompletion($messages);
            } catch (AuthenticationException $e) {
                $this->markTestSkipped('API key not valid for memory usage test');
            }
        }

        $finalMemory = memory_get_usage();
        $memoryIncrease = $finalMemory - $initialMemory;

        // Memory increase should be reasonable
        $this->assertLessThan(10 * 1024 * 1024, $memoryIncrease); // Less than 10MB increase
    }

    public function testResponseTimes(): void {
        $payloads = [
            'small' => str_repeat('a', 100),
            'medium' => str_repeat('a', 10000),
            'large' => str_repeat('a', 100000)
        ];

        $times = [];

        foreach ($payloads as $size => $content) {
            $messages = [
                ['role' => 'user', 'content' => $content]
            ];

            $start = microtime(true);

            try {
                $this->venice->chat()->createCompletion($messages);
                $times[$size] = microtime(true) - $start;
            } catch (AuthenticationException $e) {
                $this->markTestSkipped('API key not valid for response time test');
            } catch (ValidationException $e) {
                // Expected for large payloads
                $times[$size] = microtime(true) - $start;
            }
        }

        // Response times should scale reasonably with payload size
        $this->assertLessThan($times['medium'], $times['small']);
        $this->assertLessThan($times['large'], $times['medium']);
    }

    protected function tearDown(): void {
        $logFile = sys_get_temp_dir() . '/venice-integration-test.log';
        if (file_exists($logFile)) {
            unlink($logFile);
        }
    }
}
