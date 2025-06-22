<?php

namespace Venice\Tests;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Exceptions\VeniceException;
use Venice\Exceptions\AuthenticationException;
use Venice\Exceptions\ValidationException;
use Venice\Utils\Logger;

class VeniceAITest extends TestCase {
    private VeniceAI $venice;
    private string $testApiKey = 'test-api-key';

    protected function setUp(): void {
        $this->venice = new VeniceAI($this->testApiKey, [
            'debug' => true,
            'log_file' => sys_get_temp_dir() . '/venice-test.log'
        ]);
    }

    public function testConstructorWithApiKey(): void {
        $venice = new VeniceAI($this->testApiKey);
        $this->assertInstanceOf(VeniceAI::class, $venice);
    }

    public function testConstructorWithoutApiKey(): void {
        $this->expectException(VeniceException::class);
        new VeniceAI();
    }

    public function testGetLogger(): void {
        $logger = $this->venice->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
    }

    public function testValidateApiKeySuccess(): void {
        // Mock successful API response
        $this->assertTrue($this->venice->validateApiKey());
    }

    public function testValidateApiKeyFailure(): void {
        $venice = new VeniceAI('invalid-key');
        $this->assertFalse($venice->validateApiKey());
    }

    public function testGetConfig(): void {
        $this->assertEquals(true, $this->venice->getConfig('debug'));
        $this->assertEquals(30, $this->venice->getConfig('timeout'));
        $this->assertNull($this->venice->getConfig('nonexistent'));
    }

    public function testSetConfig(): void {
        $this->venice->setConfig('custom_option', 'value');
        $this->assertEquals('value', $this->venice->getConfig('custom_option'));
    }

    public function testGetBaseUrl(): void {
        $this->assertEquals('https://api.venice.ai/api/v1', $this->venice->getBaseUrl());
    }

    public function testRequestWithInvalidAuth(): void {
        $this->expectException(AuthenticationException::class);
        $this->venice->request('GET', '/models');
    }

    public function testRequestWithInvalidData(): void {
        $this->expectException(ValidationException::class);
        $this->venice->request('POST', '/chat/completions', [
            'messages' => [] // Empty messages array should trigger validation error
        ]);
    }

    public function testChatService(): void {
        $chat = $this->venice->chat();
        $this->assertInstanceOf(\Venice\Chat\ChatService::class, $chat);
    }

    public function testImageService(): void {
        $image = $this->venice->image();
        $this->assertInstanceOf(\Venice\Image\ImageService::class, $image);
    }

    public function testModelsService(): void {
        $models = $this->venice->models();
        $this->assertInstanceOf(\Venice\Models\ModelService::class, $models);
    }

    protected function tearDown(): void {
        // Clean up test log file
        $logFile = sys_get_temp_dir() . '/venice-test.log';
        if (file_exists($logFile)) {
            unlink($logFile);
        }
    }
}
