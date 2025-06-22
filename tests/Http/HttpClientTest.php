<?php

namespace Venice\Tests\Http;

use PHPUnit\Framework\TestCase;
use Venice\Http\HttpClient;
use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\AuthenticationException;
use Venice\Exceptions\RateLimitException;

class HttpClientTest extends TestCase {
    private Logger $logger;
    private string $testUrl = 'https://api.venice.ai/v2/test';

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        HttpClient::setLogger($this->logger);
        HttpClient::resetStats();
        HttpClient::clearCache();
        HttpClient::closeConnections();
    }

    public function testBasicGetRequest(): void {
        $mockResponse = ['status' => 'success'];
        $this->mockCurlExec(json_encode($mockResponse));

        $response = HttpClient::request($this->testUrl);

        $this->assertEquals($mockResponse, $response);
        $this->assertRequestStats(1, 0, 0);
    }

    public function testPostRequest(): void {
        $data = ['key' => 'value'];
        $mockResponse = ['status' => 'created'];
        $this->mockCurlExec(json_encode($mockResponse));

        $response = HttpClient::request($this->testUrl, 'POST', [], $data);

        $this->assertEquals($mockResponse, $response);
        $this->assertRequestStats(1, 0, 0);
    }

    public function testCacheHit(): void {
        $mockResponse = ['cached' => true];
        $this->mockCurlExec(json_encode($mockResponse));

        // First request should hit the API
        $response1 = HttpClient::request($this->testUrl);

        // Second request should hit the cache
        $response2 = HttpClient::request($this->testUrl);

        $this->assertEquals($mockResponse, $response1);
        $this->assertEquals($mockResponse, $response2);

        $stats = HttpClient::getStats();
        $this->assertEquals(1, $stats['cache_hits']);
    }

    public function testRetryOnFailure(): void {
        $this->mockCurlExecWithFailures(2);

        $response = HttpClient::request($this->testUrl);

        $this->assertEquals(['success' => true], $response);
        $this->assertRequestStats(1, 2, 0);
    }

    public function testMaxRetriesExceeded(): void {
        $this->mockCurlExecWithFailures(4);

        $this->expectException(VeniceException::class);
        HttpClient::request($this->testUrl);

        $this->assertRequestStats(1, 3, 1);
    }

    public function testAuthenticationError(): void {
        $this->mockCurlExecWithHttpCode(401);

        $this->expectException(AuthenticationException::class);
        HttpClient::request($this->testUrl);
    }

    public function testRateLimitError(): void {
        $this->mockCurlExecWithHttpCode(429);

        $this->expectException(RateLimitException::class);
        HttpClient::request($this->testUrl);
    }

    public function testConnectionPooling(): void {
        HttpClient::configure(['keep_alive' => true]);

        // Multiple requests to same host should reuse connection
        for ($i = 0; $i < 3; $i++) {
            $this->mockCurlExec(json_encode(['success' => true]));
            HttpClient::request($this->testUrl);
        }

        $stats = HttpClient::getStats();
        $this->assertGreaterThan(0, $stats['connection_reuses']);
    }

    public function testCustomConfiguration(): void {
        $config = [
            'timeout' => 60,
            'connect_timeout' => 10,
            'max_retries' => 5,
            'keep_alive' => true,
            'connection_pool_size' => 20
        ];

        HttpClient::configure($config);

        $mockResponse = ['success' => true];
        $this->mockCurlExec(json_encode($mockResponse));

        $response = HttpClient::request($this->testUrl);

        $this->assertEquals($mockResponse, $response);
    }

    public function testLargeResponseHandling(): void {
        $largeData = array_fill(0, 1000, 'test data');
        $this->mockCurlExec(json_encode($largeData));

        $response = HttpClient::request($this->testUrl);

        $this->assertEquals($largeData, $response);
    }

    public function testConcurrentRequests(): void {
        $urls = [
            'https://api1.venice.ai/v2/test',
            'https://api2.venice.ai/v2/test',
            'https://api3.venice.ai/v2/test'
        ];

        $responses = [];
        foreach ($urls as $url) {
            $this->mockCurlExec(json_encode(['url' => $url]));
            $responses[] = HttpClient::request($url);
        }

        $this->assertCount(3, $responses);
        $stats = HttpClient::getStats();
        $this->assertEquals(3, $stats['requests']);
    }

    public function testErrorHandling(): void {
        $errorCases = [
            400 => VeniceException::class,
            401 => AuthenticationException::class,
            403 => VeniceException::class,
            404 => VeniceException::class,
            429 => RateLimitException::class,
            500 => VeniceException::class,
            502 => VeniceException::class,
            503 => VeniceException::class,
            504 => VeniceException::class
        ];

        foreach ($errorCases as $code => $exception) {
            $this->mockCurlExecWithHttpCode($code);

            try {
                HttpClient::request($this->testUrl);
                $this->fail("Expected exception $exception for HTTP code $code");
            } catch (\Exception $e) {
                $this->assertInstanceOf($exception, $e);
            }
        }
    }

    public function testNonJsonResponse(): void {
        $plainText = 'Plain text response';
        $this->mockCurlExec($plainText);

        $response = HttpClient::request($this->testUrl);

        $this->assertEquals($plainText, $response);
    }

    public function testHeaderHandling(): void {
        $headers = [
            'Authorization' => 'Bearer test-token',
            'Content-Type' => 'application/json',
            'X-Custom-Header' => 'test-value'
        ];

        $this->mockCurlExec(json_encode(['success' => true]));

        $response = HttpClient::request($this->testUrl, 'GET', $headers);

        $this->assertEquals(['success' => true], $response);
    }

    public function testCleanup(): void {
        // Fill cache and connection pool
        $this->mockCurlExec(json_encode(['success' => true]));
        HttpClient::request($this->testUrl);

        HttpClient::cleanup();

        $stats = HttpClient::getStats();
        $this->assertEquals(0, $stats['cache_size']);
        $this->assertEquals(0, $stats['connection_pool_size']);
    }

    /**
     * Helper methods for mocking cURL
     */
    private function mockCurlExec(string $response): void {
        $this->setUpCurlMock($response, 200);
    }

    private function mockCurlExecWithHttpCode(int $httpCode): void {
        $this->setUpCurlMock('', $httpCode);
    }

    private function mockCurlExecWithFailures(int $failures): void {
        static $attempt = 0;

        if ($attempt < $failures) {
            $attempt++;
            $this->setUpCurlMock('', 500);
        } else {
            $attempt = 0;
            $this->mockCurlExec(json_encode(['success' => true]));
        }
    }

    private function setUpCurlMock(string $response, int $httpCode): void {
        // Note: In a real test environment, you would use a proper HTTP mocking library
        // or set up a test server. This is a simplified example.
        $this->assertTrue(true);
    }

    private function assertRequestStats(int $requests, int $retries, int $errors): void {
        $stats = HttpClient::getStats();
        $this->assertEquals($requests, $stats['requests']);
        $this->assertEquals($retries, $stats['retries']);
        $this->assertEquals($errors, $stats['errors']);
    }
}
