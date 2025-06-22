<?php

namespace Venice\Tests\Config;

use PHPUnit\Framework\TestCase;
use Venice\Config\ConfigManager;
use Venice\Config\Sources\FileConfigSource;
use Venice\Config\Sources\EnvironmentConfigSource;
use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;
use Venice\Exceptions\VeniceException;

class ConfigManagerTest extends TestCase {
    private ConfigManager $configManager;
    private Logger $logger;
    private EventManager $events;
    private string $tempDir;

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        $this->events = new EventManager($this->logger);

        // Create temporary directory for test config files
        $this->tempDir = sys_get_temp_dir() . '/venice_config_test_' . uniqid();
        mkdir($this->tempDir);

        $this->configManager = new ConfigManager(
            $this->logger,
            $this->events,
            ['config_dir' => $this->tempDir]
        );
    }

    protected function tearDown(): void {
        // Cleanup temporary files
        if (is_dir($this->tempDir)) {
            array_map('unlink', glob($this->tempDir . '/*'));
            rmdir($this->tempDir);
        }
    }

    public function testBasicConfigOperations(): void {
        // Test setting and getting values
        $this->configManager->set('test.key', 'value');
        $this->assertEquals('value', $this->configManager->get('test.key'));

        // Test default value
        $this->assertEquals('default', $this->configManager->get('nonexistent.key', 'default'));

        // Test has method
        $this->assertTrue($this->configManager->has('test.key'));
        $this->assertFalse($this->configManager->has('nonexistent.key'));

        // Test getting all config
        $config = $this->configManager->all();
        $this->assertIsArray($config);
        $this->assertArrayHasKey('test', $config);
    }

    public function testNestedConfigOperations(): void {
        $this->configManager->set('database.mysql.host', 'localhost');
        $this->configManager->set('database.mysql.port', 3306);
        $this->configManager->set('database.mysql.credentials.user', 'root');

        $this->assertEquals('localhost', $this->configManager->get('database.mysql.host'));
        $this->assertEquals(3306, $this->configManager->get('database.mysql.port'));

        $dbConfig = $this->configManager->get('database.mysql');
        $this->assertIsArray($dbConfig);
        $this->assertArrayHasKey('host', $dbConfig);
        $this->assertArrayHasKey('credentials', $dbConfig);
    }

    public function testConfigValidation(): void {
        $schema = [
            'app.name' => [
                'type' => 'string',
                'required' => true
            ],
            'app.version' => [
                'type' => 'string',
                'required' => true
            ],
            'app.debug' => [
                'type' => 'boolean',
                'default' => false
            ],
            'app.port' => [
                'type' => 'integer',
                'min' => 1,
                'max' => 65535
            ]
        ];

        $this->configManager->setSchema($schema);

        // Test valid configuration
        $this->configManager->set('app.name', 'Test App');
        $this->configManager->set('app.version', '1.0.0');
        $this->configManager->set('app.port', 8080);

        $this->assertTrue($this->configManager->validate());

        // Test invalid configuration
        $this->expectException(VeniceException::class);
        $this->configManager->set('app.port', 70000); // Exceeds max value
        $this->configManager->validate();
    }

    public function testConfigSources(): void {
        // Test file config source
        $fileSource = new FileConfigSource($this->tempDir);
        $this->configManager->addSource($fileSource);

        // Test environment config source
        $envSource = new EnvironmentConfigSource('VENICE_TEST_');
        $this->configManager->addSource($envSource);

        // Test loading from multiple sources
        putenv('VENICE_TEST_APP_NAME=Test App');
        file_put_contents($this->tempDir . '/app.php', '<?php return ["version" => "1.0.0"];');

        $this->configManager->load();

        $this->assertEquals('Test App', $this->configManager->get('app.name'));
        $this->assertEquals('1.0.0', $this->configManager->get('app.version'));

        putenv('VENICE_TEST_APP_NAME'); // Cleanup
    }

    public function testConfigEvents(): void {
        $eventTriggered = false;
        $this->events->addListener('config.changed', function(Event $event) use (&$eventTriggered) {
            $eventTriggered = true;
            $this->assertEquals('test.key', $event->getData()['key']);
            $this->assertEquals('new value', $event->getData()['value']);
        });

        $this->configManager->set('test.key', 'new value');
        $this->assertTrue($eventTriggered);
    }

    public function testConfigSnapshots(): void {
        // Create initial configuration
        $this->configManager->set('app.name', 'Test App');
        $this->configManager->set('app.version', '1.0.0');

        // Create snapshot
        $this->configManager->createSnapshot('test_snapshot');

        // Modify configuration
        $this->configManager->set('app.name', 'Modified App');
        $this->configManager->set('app.version', '2.0.0');

        // Restore snapshot
        $this->configManager->restoreSnapshot('test_snapshot');

        // Verify restored values
        $this->assertEquals('Test App', $this->configManager->get('app.name'));
        $this->assertEquals('1.0.0', $this->configManager->get('app.version'));
    }

    public function testConfigExportImport(): void {
        // Set up test configuration
        $this->configManager->set('app.name', 'Test App');
        $this->configManager->set('app.version', '1.0.0');
        $this->configManager->set('app.debug', true);

        // Test JSON export/import
        $json = $this->configManager->export('json');
        $this->configManager->import($json, 'json');

        $this->assertEquals('Test App', $this->configManager->get('app.name'));

        // Test PHP export/import
        $php = $this->configManager->export('php');
        $this->configManager->import($php, 'php');

        $this->assertEquals('1.0.0', $this->configManager->get('app.version'));

        // Test ENV export
        $env = $this->configManager->export('env');
        $this->assertStringContainsString('APP_NAME=Test App', $env);
    }

    public function testConfigEncryption(): void {
        // Set encryption key
        $this->configManager = new ConfigManager(
            $this->logger,
            $this->events,
            [
                'config_dir' => $this->tempDir,
                'encryption_key' => 'test_key_32_chars_1234567890123'
            ]
        );

        // Test encrypting sensitive values
        $sensitiveValue = 'secret_password';
        $encryptedValue = $this->configManager->encrypt($sensitiveValue);

        $this->assertNotEquals($sensitiveValue, $encryptedValue);
        $this->assertEquals($sensitiveValue, $this->configManager->decrypt($encryptedValue));

        // Test storing encrypted values
        $this->configManager->set('database.password_encrypted', $encryptedValue);
        $this->assertEquals($sensitiveValue, $this->configManager->get('database.password'));
    }

    public function testConfigWatchers(): void {
        $watcherCalled = false;
        $watchedValue = null;

        // Add watcher for specific key
        $this->configManager->watch('app.name', function($value) use (&$watcherCalled, &$watchedValue) {
            $watcherCalled = true;
            $watchedValue = $value;
        });

        // Change watched value
        $this->configManager->set('app.name', 'New App Name');

        $this->assertTrue($watcherCalled);
        $this->assertEquals('New App Name', $watchedValue);
    }

    public function testConfigDiff(): void {
        // Set up initial configuration
        $this->configManager->set('app.name', 'Test App');
        $this->configManager->set('app.version', '1.0.0');

        $originalConfig = $this->configManager->all();

        // Make changes
        $this->configManager->set('app.name', 'Modified App');
        $this->configManager->set('app.debug', true);

        // Get diff
        $diff = $this->configManager->diff($originalConfig);

        $this->assertArrayHasKey('app', $diff);
        $this->assertEquals('Modified App', $diff['app']['name']);
        $this->assertTrue($diff['app']['debug']);
    }

    public function testInvalidConfigOperations(): void {
        // Test setting invalid values
        $this->expectException(VeniceException::class);
        $this->configManager->set('', 'invalid');

        // Test getting with invalid key
        $this->expectException(VeniceException::class);
        $this->configManager->get('');

        // Test invalid snapshot
        $this->expectException(VeniceException::class);
        $this->configManager->restoreSnapshot('nonexistent_snapshot');

        // Test invalid import format
        $this->expectException(VeniceException::class);
        $this->configManager->import('invalid data', 'invalid_format');
    }
}
