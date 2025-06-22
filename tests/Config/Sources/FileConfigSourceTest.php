<?php

namespace Venice\Tests\Config\Sources;

use PHPUnit\Framework\TestCase;
use Venice\Config\Sources\FileConfigSource;
use Venice\Exceptions\VeniceException;

class FileConfigSourceTest extends TestCase {
    private string $tempDir;
    private FileConfigSource $fileSource;

    protected function setUp(): void {
        // Create temporary directory for test config files
        $this->tempDir = sys_get_temp_dir() . '/venice_config_test_' . uniqid();
        mkdir($this->tempDir);

        $this->fileSource = new FileConfigSource($this->tempDir);
    }

    protected function tearDown(): void {
        // Cleanup temporary files
        if (is_dir($this->tempDir)) {
            array_map('unlink', glob($this->tempDir . '/*'));
            rmdir($this->tempDir);
        }
    }

    public function testLoadPhpConfig(): void {
        // Create test PHP config file
        $config = [
            'app' => [
                'name' => 'Test App',
                'version' => '1.0.0',
                'debug' => true
            ]
        ];

        file_put_contents(
            $this->tempDir . '/app.php',
            '<?php return ' . var_export($config, true) . ';'
        );

        $loadedConfig = $this->fileSource->load();

        $this->assertArrayHasKey('app', $loadedConfig);
        $this->assertEquals('Test App', $loadedConfig['app']['name']);
        $this->assertEquals('1.0.0', $loadedConfig['app']['version']);
        $this->assertTrue($loadedConfig['app']['debug']);
    }

    public function testLoadJsonConfig(): void {
        // Create test JSON config file
        $config = [
            'database' => [
                'host' => 'localhost',
                'port' => 3306,
                'username' => 'root'
            ]
        ];

        file_put_contents(
            $this->tempDir . '/database.json',
            json_encode($config, JSON_PRETTY_PRINT)
        );

        $loadedConfig = $this->fileSource->load();

        $this->assertArrayHasKey('database', $loadedConfig);
        $this->assertEquals('localhost', $loadedConfig['database']['host']);
        $this->assertEquals(3306, $loadedConfig['database']['port']);
    }

    public function testLoadYamlConfig(): void {
        if (!extension_loaded('yaml')) {
            $this->markTestSkipped('YAML extension not available');
            return;
        }

        // Create test YAML config file
        $yaml = <<<YAML
cache:
    driver: redis
    host: localhost
    port: 6379
    options:
        prefix: venice:
        timeout: 3600
YAML;

        file_put_contents($this->tempDir . '/cache.yaml', $yaml);

        $loadedConfig = $this->fileSource->load();

        $this->assertArrayHasKey('cache', $loadedConfig);
        $this->assertEquals('redis', $loadedConfig['cache']['driver']);
        $this->assertEquals('venice:', $loadedConfig['cache']['options']['prefix']);
    }

    public function testLoadIniConfig(): void {
        // Create test INI config file
        $ini = <<<INI
[email]
driver = smtp
host = smtp.example.com
port = 587
encryption = tls

[email.auth]
username = test@example.com
password = secret
INI;

        file_put_contents($this->tempDir . '/email.ini', $ini);

        $loadedConfig = $this->fileSource->load();

        $this->assertArrayHasKey('email', $loadedConfig);
        $this->assertEquals('smtp', $loadedConfig['email']['driver']);
        $this->assertEquals('test@example.com', $loadedConfig['email']['auth']['username']);
    }

    public function testSaveConfig(): void {
        $config = [
            'app' => [
                'name' => 'Test App',
                'version' => '1.0.0'
            ]
        ];

        $this->assertTrue($this->fileSource->save($config));

        // Verify saved config can be loaded
        $loadedConfig = $this->fileSource->load();
        $this->assertEquals($config, $loadedConfig);
    }

    public function testInvalidDirectory(): void {
        $this->expectException(VeniceException::class);
        new FileConfigSource('/nonexistent/directory');
    }

    public function testInvalidPhpConfig(): void {
        // Create invalid PHP config file
        file_put_contents(
            $this->tempDir . '/invalid.php',
            '<?php return "not an array";'
        );

        $this->expectException(VeniceException::class);
        $this->fileSource->load();
    }

    public function testInvalidJsonConfig(): void {
        // Create invalid JSON config file
        file_put_contents(
            $this->tempDir . '/invalid.json',
            '{ invalid json }'
        );

        $this->expectException(VeniceException::class);
        $this->fileSource->load();
    }

    public function testSourceMetadata(): void {
        $metadata = $this->fileSource->getMetadata();

        $this->assertIsArray($metadata);
        $this->assertEquals('file', $metadata['type']);
        $this->assertEquals($this->tempDir, $metadata['directory']);
        $this->assertIsArray($metadata['supported_extensions']);
    }

    public function testReadWritePermissions(): void {
        $this->assertTrue($this->fileSource->isReadable());
        $this->assertTrue($this->fileSource->isWritable());

        // Test with read-only directory
        chmod($this->tempDir, 0444);
        $this->assertTrue($this->fileSource->isReadable());
        $this->assertFalse($this->fileSource->isWritable());

        // Restore permissions for cleanup
        chmod($this->tempDir, 0777);
    }

    public function testConfigMerging(): void {
        // Create multiple config files
        file_put_contents(
            $this->tempDir . '/app.php',
            '<?php return ["name" => "Test App"];'
        );

        file_put_contents(
            $this->tempDir . '/app.json',
            '{"version": "1.0.0"}'
        );

        $loadedConfig = $this->fileSource->load();

        $this->assertArrayHasKey('app', $loadedConfig);
        $this->assertEquals('Test App', $loadedConfig['app']['name']);
        $this->assertEquals('1.0.0', $loadedConfig['app']['version']);
    }

    public function testCacheManagement(): void {
        // Initial load
        file_put_contents(
            $this->tempDir . '/cache-test.php',
            '<?php return ["key" => "value"];'
        );

        $firstLoad = $this->fileSource->load();
        $this->assertEquals('value', $firstLoad['cache-test']['key']);

        // Modify file
        file_put_contents(
            $this->tempDir . '/cache-test.php',
            '<?php return ["key" => "new-value"];'
        );

        // Load should reflect new value (no caching)
        $secondLoad = $this->fileSource->load();
        $this->assertEquals('new-value', $secondLoad['cache-test']['key']);
    }

    public function testEmptyDirectory(): void {
        $emptyDir = sys_get_temp_dir() . '/venice_empty_' . uniqid();
        mkdir($emptyDir);

        try {
            $emptySource = new FileConfigSource($emptyDir);
            $config = $emptySource->load();

            $this->assertIsArray($config);
            $this->assertEmpty($config);
        } finally {
            rmdir($emptyDir);
        }
    }
}
