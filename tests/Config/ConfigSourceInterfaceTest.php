<?php

namespace Venice\Tests\Config;

use PHPUnit\Framework\TestCase;
use Venice\Config\ConfigSourceInterface;
use Venice\Utils\Logger;
use Venice\Events\EventManager;

/**
 * Mock implementation of ConfigSourceInterface for testing
 */
class MockConfigSource implements ConfigSourceInterface {
    private array $config = [];
    private bool $readable = true;
    private bool $writable = true;
    private string $name;
    private array $metadata;

    public function __construct(string $name = 'mock', array $metadata = []) {
        $this->name = $name;
        $this->metadata = array_merge([
            'type' => 'mock',
            'version' => '1.0.0'
        ], $metadata);
    }

    public function load(): array {
        if (!$this->readable) {
            throw new \RuntimeException('Source is not readable');
        }
        return $this->config;
    }

    public function save(array $config): bool {
        if (!$this->writable) {
            throw new \RuntimeException('Source is not writable');
        }
        $this->config = $config;
        return true;
    }

    public function isReadable(): bool {
        return $this->readable;
    }

    public function isWritable(): bool {
        return $this->writable;
    }

    public function getName(): string {
        return $this->name;
    }

    public function getMetadata(): array {
        return $this->metadata;
    }

    // Test helper methods
    public function setReadable(bool $readable): void {
        $this->readable = $readable;
    }

    public function setWritable(bool $writable): void {
        $this->writable = $writable;
    }

    public function setConfig(array $config): void {
        $this->config = $config;
    }
}

/**
 * Test cases for ConfigSourceInterface implementations
 */
class ConfigSourceInterfaceTest extends TestCase {
    private MockConfigSource $source;
    private Logger $logger;
    private EventManager $events;

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        $this->events = new EventManager($this->logger);
        $this->source = new MockConfigSource();
    }

    public function testBasicOperations(): void {
        // Test initial state
        $this->assertTrue($this->source->isReadable());
        $this->assertTrue($this->source->isWritable());
        $this->assertEquals('mock', $this->source->getName());

        // Test metadata
        $metadata = $this->source->getMetadata();
        $this->assertEquals('mock', $metadata['type']);
        $this->assertEquals('1.0.0', $metadata['version']);
    }

    public function testLoadAndSave(): void {
        $config = [
            'app' => [
                'name' => 'Test App',
                'version' => '1.0.0'
            ]
        ];

        // Test save operation
        $this->assertTrue($this->source->save($config));

        // Test load operation
        $loaded = $this->source->load();
        $this->assertEquals($config, $loaded);
    }

    public function testReadOnlySource(): void {
        $this->source->setWritable(false);

        $this->assertTrue($this->source->isReadable());
        $this->assertFalse($this->source->isWritable());

        $this->expectException(\RuntimeException::class);
        $this->source->save(['test' => 'data']);
    }

    public function testWriteOnlySource(): void {
        $this->source->setReadable(false);

        $this->assertFalse($this->source->isReadable());
        $this->assertTrue($this->source->isWritable());

        $this->expectException(\RuntimeException::class);
        $this->source->load();
    }

    public function testCustomMetadata(): void {
        $customMetadata = [
            'type' => 'custom',
            'version' => '2.0.0',
            'description' => 'Custom config source',
            'features' => ['encryption', 'compression']
        ];

        $source = new MockConfigSource('custom', $customMetadata);
        $metadata = $source->getMetadata();

        $this->assertEquals('custom', $metadata['type']);
        $this->assertEquals('2.0.0', $metadata['version']);
        $this->assertEquals('Custom config source', $metadata['description']);
        $this->assertEquals(['encryption', 'compression'], $metadata['features']);
    }

    public function testNestedConfiguration(): void {
        $config = [
            'database' => [
                'connections' => [
                    'default' => [
                        'host' => 'localhost',
                        'port' => 3306,
                        'credentials' => [
                            'username' => 'root',
                            'password' => 'secret'
                        ]
                    ],
                    'replica' => [
                        'host' => 'replica.db',
                        'port' => 3306
                    ]
                ],
                'options' => [
                    'pool' => [
                        'min' => 5,
                        'max' => 20
                    ]
                ]
            ]
        ];

        $this->assertTrue($this->source->save($config));
        $loaded = $this->source->load();

        $this->assertEquals($config, $loaded);
        $this->assertArrayHasKey('database', $loaded);
        $this->assertArrayHasKey('connections', $loaded['database']);
        $this->assertArrayHasKey('default', $loaded['database']['connections']);
        $this->assertEquals(3306, $loaded['database']['connections']['default']['port']);
        $this->assertEquals(20, $loaded['database']['options']['pool']['max']);
    }

    public function testEmptyConfiguration(): void {
        // Test saving empty configuration
        $this->assertTrue($this->source->save([]));
        $this->assertEquals([], $this->source->load());

        // Test saving null values
        $config = [
            'null_value' => null,
            'nested' => [
                'null_value' => null
            ]
        ];
        $this->assertTrue($this->source->save($config));
        $loaded = $this->source->load();
        $this->assertArrayHasKey('null_value', $loaded);
        $this->assertNull($loaded['null_value']);
        $this->assertNull($loaded['nested']['null_value']);
    }

    public function testSpecialCharacters(): void {
        $config = [
            'special' => [
                'spaces' => 'value with spaces',
                'symbols' => '!@#$%^&*()',
                'quotes' => 'value with "quotes" and \'apostrophes\'',
                'unicode' => '🚀 Unicode characters 汉字',
                'multiline' => "Line 1\nLine 2\nLine 3"
            ]
        ];

        $this->assertTrue($this->source->save($config));
        $loaded = $this->source->load();

        $this->assertEquals($config['special']['spaces'], $loaded['special']['spaces']);
        $this->assertEquals($config['special']['symbols'], $loaded['special']['symbols']);
        $this->assertEquals($config['special']['quotes'], $loaded['special']['quotes']);
        $this->assertEquals($config['special']['unicode'], $loaded['special']['unicode']);
        $this->assertEquals($config['special']['multiline'], $loaded['special']['multiline']);
    }

    public function testLargeConfiguration(): void {
        $config = [];
        // Generate large nested configuration
        for ($i = 0; $i < 100; $i++) {
            $config["key_$i"] = [
                'name' => "Value $i",
                'timestamp' => time(),
                'nested' => [
                    'data' => str_repeat('x', 1000),
                    'array' => range(1, 100)
                ]
            ];
        }

        $this->assertTrue($this->source->save($config));
        $loaded = $this->source->load();

        $this->assertEquals($config, $loaded);
        $this->assertCount(100, $loaded);
    }

    public function testSourceBehaviorConsistency(): void {
        // Test consistent behavior after multiple operations
        for ($i = 0; $i < 10; $i++) {
            $config = ['iteration' => $i];

            $this->assertTrue($this->source->save($config));
            $this->assertEquals($config, $this->source->load());

            // Toggle readable/writable flags
            $this->source->setReadable(($i % 2) === 0);
            $this->source->setWritable(($i % 3) === 0);

            $this->assertEquals(($i % 2) === 0, $this->source->isReadable());
            $this->assertEquals(($i % 3) === 0, $this->source->isWritable());
        }
    }

    public function testMetadataImmutability(): void {
        $metadata = $this->source->getMetadata();
        $metadata['type'] = 'modified';

        // Original metadata should remain unchanged
        $this->assertEquals('mock', $this->source->getMetadata()['type']);
    }

    public function testConfigurationPersistence(): void {
        $initialConfig = ['test' => 'value'];
        $this->source->save($initialConfig);

        // Configuration should persist between load calls
        $this->assertEquals($initialConfig, $this->source->load());
        $this->assertEquals($initialConfig, $this->source->load());

        // Configuration should persist after toggling readable/writable
        $this->source->setReadable(false);
        $this->source->setReadable(true);
        $this->assertEquals($initialConfig, $this->source->load());
    }
}
