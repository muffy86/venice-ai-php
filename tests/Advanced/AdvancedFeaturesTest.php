<?php

namespace Venice\Tests\Advanced;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Audio\AudioService;
use Venice\Embeddings\EmbeddingsService;
use Venice\Cache\CacheManager;
use Venice\Events\EventManager;
use Venice\Security\SecurityManager;
use Venice\Async\AsyncProcessor;
use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\ValidationException;

/**
 * Comprehensive test suite for advanced Venice AI SDK features
 */
class AdvancedFeaturesTest extends TestCase {
    private VeniceAI $venice;
    private string $testApiKey = 'sk-test1234567890abcdef1234567890abcdef1234567890ab';

    protected function setUp(): void {
        $this->venice = new VeniceAI($this->testApiKey, [
            'debug' => false,
            'cache' => [
                'driver' => 'array',
                'default_ttl' => 3600
            ],
            'security' => [
                'rate_limit_max' => 1000,
                'encryption_method' => 'AES-256-CBC'
            ],
            'async' => [
                'max_workers' => 2,
                'enable_parallel' => true
            ]
        ]);
    }

    /**
     * Test Audio Service functionality
     */
    public function testAudioService(): void {
        $audio = $this->venice->audio();
        $this->assertInstanceOf(AudioService::class, $audio);

        // Test supported formats
        $formats = $audio->getSupportedFormats();
        $this->assertIsArray($formats);
        $this->assertContains('mp3', $formats);
        $this->assertContains('wav', $formats);

        // Test supported languages
        $languages = $audio->getSupportedLanguages();
        $this->assertIsArray($languages);
        $this->assertContains('en', $languages);
        $this->assertContains('es', $languages);

        // Test voice models
        $voices = $audio->getVoiceModels();
        $this->assertIsArray($voices);
        $this->assertContains('alloy', $voices);
        $this->assertContains('nova', $voices);

        // Test quality settings
        $quality = $audio->getQualitySettings();
        $this->assertIsArray($quality);
        $this->assertArrayHasKey('standard', $quality);
        $this->assertArrayHasKey('high', $quality);
    }

    /**
     * Test audio file validation
     */
    public function testAudioFileValidation(): void {
        $audio = $this->venice->audio();

        // Test non-existent file
        $result = $audio->validateAudioFile('non_existent.mp3');
        $this->assertFalse($result['valid']);
        $this->assertContains('File does not exist', $result['errors']);

        // Create a temporary test file
        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio') . '.mp3';
        file_put_contents($tempFile, 'fake audio content');

        $result = $audio->validateAudioFile($tempFile);
        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
        $this->assertEquals('mp3', $result['info']['format']);

        unlink($tempFile);
    }

    /**
     * Test Embeddings Service functionality
     */
    public function testEmbeddingsService(): void {
        $embeddings = $this->venice->embeddings();
        $this->assertInstanceOf(EmbeddingsService::class, $embeddings);

        // Test model info
        $modelInfo = $embeddings->getModelInfo('text-embedding-3-small');
        $this->assertIsArray($modelInfo);
        $this->assertEquals('text-embedding-3-small', $modelInfo['name']);
        $this->assertEquals(1536, $modelInfo['dimensions']);
    }

    /**
     * Test similarity calculations
     */
    public function testSimilarityCalculations(): void {
        $embeddings = $this->venice->embeddings();

        // Test vectors
        $vector1 = [1.0, 0.0, 0.0];
        $vector2 = [0.0, 1.0, 0.0];
        $vector3 = [1.0, 0.0, 0.0]; // Same as vector1

        // Test cosine similarity
        $similarity1 = $embeddings->calculateSimilarity($vector1, $vector2, 'cosine');
        $this->assertEquals(0.0, $similarity1, '', 0.001);

        $similarity2 = $embeddings->calculateSimilarity($vector1, $vector3, 'cosine');
        $this->assertEquals(1.0, $similarity2, '', 0.001);

        // Test euclidean distance
        $distance = $embeddings->calculateSimilarity($vector1, $vector2, 'euclidean');
        $this->assertGreaterThan(0, $distance);

        // Test dot product
        $dotProduct = $embeddings->calculateSimilarity($vector1, $vector2, 'dot_product');
        $this->assertEquals(0.0, $dotProduct);
    }

    /**
     * Test search functionality
     */
    public function testSimilaritySearch(): void {
        $embeddings = $this->venice->embeddings();

        $query = [1.0, 0.0, 0.0];
        $database = [
            [1.0, 0.0, 0.0],  // Exact match
            [0.9, 0.1, 0.0],  // Close match
            [0.0, 1.0, 0.0],  // Different
            [0.0, 0.0, 1.0]   // Different
        ];

        $results = $embeddings->searchSimilar($query, $database, [
            'top_k' => 2,
            'metric' => 'cosine'
        ]);

        $this->assertCount(2, $results);
        $this->assertEquals(0, $results[0]['index']); // Exact match should be first
        $this->assertEquals(1.0, $results[0]['score'], '', 0.001);
    }

    /**
     * Test Cache Manager functionality
     */
    public function testCacheManager(): void {
        $cache = $this->venice->cache();
        $this->assertInstanceOf(CacheManager::class, $cache);

        // Test basic cache operations
        $key = 'test_key';
        $value = ['data' => 'test_value', 'timestamp' => time()];

        // Set and get
        $this->assertTrue($cache->set($key, $value));
        $retrieved = $cache->get($key);
        $this->assertEquals($value, $retrieved);

        // Test cache miss
        $missing = $cache->get('non_existent_key');
        $this->assertNull($missing);

        // Test delete
        $this->assertTrue($cache->delete($key));
        $deleted = $cache->get($key);
        $this->assertNull($deleted);
    }

    /**
     * Test cache remember functionality
     */
    public function testCacheRemember(): void {
        $cache = $this->venice->cache();
        $callCount = 0;

        $callback = function() use (&$callCount) {
            $callCount++;
            return 'computed_value_' . $callCount;
        };

        // First call should execute callback
        $result1 = $cache->remember('remember_test', $callback);
        $this->assertEquals('computed_value_1', $result1);
        $this->assertEquals(1, $callCount);

        // Second call should use cache
        $result2 = $cache->remember('remember_test', $callback);
        $this->assertEquals('computed_value_1', $result2);
        $this->assertEquals(1, $callCount); // Callback not called again
    }

    /**
     * Test Event Manager functionality
     */
    public function testEventManager(): void {
        $events = $this->venice->events();
        $this->assertInstanceOf(EventManager::class, $events);

        $eventFired = false;
        $eventData = null;

        // Add listener
        $events->addListener('test.event', function($event) use (&$eventFired, &$eventData) {
            $eventFired = true;
            $eventData = $event->getData();
        });

        // Dispatch event
        $testEvent = new \Venice\Events\Event('test.event', ['test' => 'data']);
        $events->dispatch($testEvent);

        $this->assertTrue($eventFired);
        $this->assertEquals(['test' => 'data'], $eventData);
    }

    /**
     * Test Security Manager functionality
     */
    public function testSecurityManager(): void {
        $security = $this->venice->security();
        $this->assertInstanceOf(SecurityManager::class, $security);

        // Test encryption/decryption
        $originalData = 'sensitive information';
        $encrypted = $security->encrypt($originalData);
        $decrypted = $security->decrypt($encrypted);

        $this->assertNotEquals($originalData, $encrypted);
        $this->assertEquals($originalData, $decrypted);
    }

    /**
     * Test JWT token functionality
     */
    public function testJWTTokens(): void {
        $security = $this->venice->security();

        $payload = [
            'user_id' => 'test_user',
            'permissions' => ['read', 'write']
        ];

        // Generate token
        $token = $security->generateJWT($payload);
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        // Verify token
        $decoded = $security->verifyJWT($token);
        $this->assertEquals('test_user', $decoded['user_id']);
        $this->assertEquals(['read', 'write'], $decoded['permissions']);
    }

    /**
     * Test request signing
     */
    public function testRequestSigning(): void {
        $security = $this->venice->security();

        $requestData = [
            'method' => 'POST',
            'endpoint' => '/test',
            'data' => ['key' => 'value']
        ];

        $signature = $security->signRequest($requestData);
        $this->assertIsString($signature);
        $this->assertNotEmpty($signature);

        // Verify signature
        $isValid = $security->verifyRequestSignature($requestData, $signature);
        $this->assertTrue($isValid);

        // Test with modified data
        $modifiedData = $requestData;
        $modifiedData['data']['key'] = 'modified_value';
        $isValidModified = $security->verifyRequestSignature($modifiedData, $signature);
        $this->assertFalse($isValidModified);
    }

    /**
     * Test data masking
     */
    public function testDataMasking(): void {
        $security = $this->venice->security();

        $sensitiveText = 'API Key: sk-1234567890abcdef1234567890abcdef12345678 and email: user@example.com';
        $masked = $security->maskSensitiveData($sensitiveText);

        $this->assertStringNotContainsString('sk-1234567890abcdef1234567890abcdef12345678', $masked);
        $this->assertStringNotContainsString('user@example.com', $masked);
        $this->assertStringContainsString('sk-**', $masked);
        $this->assertStringContainsString('us**@ex**', $masked);
    }

    /**
     * Test Async Processor functionality
     */
    public function testAsyncProcessor(): void {
        $async = $this->venice->async();
        $this->assertInstanceOf(AsyncProcessor::class, $async);

        // Test simple async task
        $task = function() {
            return 'task_result';
        };

        $promise = $async->processAsync($task);
        $this->assertInstanceOf(\React\Promise\Promise::class, $promise);
    }

    /**
     * Test performance metrics
     */
    public function testPerformanceMetrics(): void {
        $metrics = $this->venice->getMetrics();

        $this->assertIsArray($metrics);
        $this->assertArrayHasKey('requests', $metrics);
        $this->assertArrayHasKey('cache_hits', $metrics);
        $this->assertArrayHasKey('cache_misses', $metrics);
        $this->assertArrayHasKey('errors', $metrics);
        $this->assertArrayHasKey('total_time', $metrics);

        // Test metrics reset
        $this->venice->resetMetrics();
        $resetMetrics = $this->venice->getMetrics();
        $this->assertEquals(0, $resetMetrics['requests']);
    }

    /**
     * Test validation exceptions
     */
    public function testValidationExceptions(): void {
        $embeddings = $this->venice->embeddings();

        // Test invalid model
        $this->expectException(ValidationException::class);
        $embeddings->getModelInfo('invalid_model');
    }

    /**
     * Test rate limiting
     */
    public function testRateLimiting(): void {
        $security = $this->venice->security();

        $clientId = 'test_client';

        // Should be within rate limit initially
        $this->assertTrue($security->checkRateLimit($clientId));

        // Increment rate limit
        $security->incrementRateLimit($clientId);

        // Should still be within limit
        $this->assertTrue($security->checkRateLimit($clientId));
    }

    /**
     * Test cache statistics
     */
    public function testCacheStatistics(): void {
        $cache = $this->venice->cache();

        // Perform some cache operations
        $cache->set('test1', 'value1');
        $cache->get('test1'); // Hit
        $cache->get('test2'); // Miss

        $stats = $cache->getStats();
        $this->assertArrayHasKey('hits', $stats);
        $this->assertArrayHasKey('misses', $stats);
        $this->assertArrayHasKey('sets', $stats);
        $this->assertGreaterThan(0, $stats['hits']);
        $this->assertGreaterThan(0, $stats['misses']);
    }

    /**
     * Test service integration
     */
    public function testServiceIntegration(): void {
        // Test that all services are properly initialized
        $this->assertInstanceOf(AudioService::class, $this->venice->audio());
        $this->assertInstanceOf(EmbeddingsService::class, $this->venice->embeddings());
        $this->assertInstanceOf(CacheManager::class, $this->venice->cache());
        $this->assertInstanceOf(EventManager::class, $this->venice->events());
        $this->assertInstanceOf(SecurityManager::class, $this->venice->security());
        $this->assertInstanceOf(AsyncProcessor::class, $this->venice->async());
        $this->assertInstanceOf(Logger::class, $this->venice->getLogger());
    }

    /**
     * Test error handling and recovery
     */
    public function testErrorHandling(): void {
        $audio = $this->venice->audio();

        // Test validation error
        $this->expectException(ValidationException::class);
        $audio->transcribe(['file' => 'non_existent_file.mp3']);
    }

    /**
     * Test configuration management
     */
    public function testConfigurationManagement(): void {
        // Test getting configuration
        $timeout = $this->venice->getConfig('timeout');
        $this->assertIsInt($timeout);

        // Test setting configuration
        $this->venice->setConfig('custom_setting', 'test_value');
        $customValue = $this->venice->getConfig('custom_setting');
        $this->assertEquals('test_value', $customValue);

        // Test default value
        $defaultValue = $this->venice->getConfig('non_existent', 'default');
        $this->assertEquals('default', $defaultValue);
    }
}
