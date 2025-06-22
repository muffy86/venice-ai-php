<?php

namespace Venice\Tests\Config\Sources;

use PHPUnit\Framework\TestCase;
use Venice\Config\Sources\EnvironmentConfigSource;

class EnvironmentConfigSourceTest extends TestCase {
    private EnvironmentConfigSource $envSource;
    private array $originalEnv;

    protected function setUp(): void {
        $this->envSource = new EnvironmentConfigSource('VENICE_TEST_');

        // Backup original environment
        $this->originalEnv = $_ENV;
    }

    protected function tearDown(): void {
        // Restore original environment
        $_ENV = $this->originalEnv;

        // Clean up any test environment variables
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'VENICE_TEST_') === 0) {
                unset($_SERVER[$key]);
            }
        }
    }

    public function testBasicEnvironmentLoading(): void {
        // Set test environment variables
        $_ENV['VENICE_TEST_APP_NAME'] = 'Test Application';
        $_ENV['VENICE_TEST_APP_VERSION'] = '1.0.0';
        $_ENV['VENICE_TEST_APP_DEBUG'] = 'true';

        $config = $this->envSource->load();

        $this->assertArrayHasKey('app', $config);
        $this->assertEquals('Test Application', $config['app']['name']);
        $this->assertEquals('1.0.0', $config['app']['version']);
        $this->assertTrue($config['app']['debug']);
    }

    public function testNestedEnvironmentVariables(): void {
        // Test double underscore for nested keys
        $_ENV['VENICE_TEST_DATABASE__HOST'] = 'localhost';
        $_ENV['VENICE_TEST_DATABASE__PORT'] = '3306';
        $_ENV['VENICE_TEST_DATABASE__CREDENTIALS__USERNAME'] = 'root';
        $_ENV['VENICE_TEST_DATABASE__CREDENTIALS__PASSWORD'] = 'secret';

        $config = $this->envSource->load();

        $this->assertArrayHasKey('database', $config);
        $this->assertEquals('localhost', $config['database']['host']);
        $this->assertEquals(3306, $config['database']['port']);
        $this->assertArrayHasKey('credentials', $config['database']);
        $this->assertEquals('root', $config['database']['credentials']['username']);
        $this->assertEquals('secret', $config['database']['credentials']['password']);
    }

    public function testTypeCasting(): void {
        $_ENV['VENICE_TEST_STRING_VALUE'] = 'hello world';
        $_ENV['VENICE_TEST_INTEGER_VALUE'] = '42';
        $_ENV['VENICE_TEST_FLOAT_VALUE'] = '3.14';
        $_ENV['VENICE_TEST_BOOLEAN_TRUE'] = 'true';
        $_ENV['VENICE_TEST_BOOLEAN_FALSE'] = 'false';
        $_ENV['VENICE_TEST_NULL_VALUE'] = 'null';
        $_ENV['VENICE_TEST_EMPTY_VALUE'] = 'empty';
        $_ENV['VENICE_TEST_JSON_ARRAY'] = '["item1", "item2", "item3"]';
        $_ENV['VENICE_TEST_JSON_OBJECT'] = '{"key": "value", "number": 123}';

        $config = $this->envSource->load();

        $this->assertIsString($config['string']['value']);
        $this->assertEquals('hello world', $config['string']['value']);

        $this->assertIsInt($config['integer']['value']);
        $this->assertEquals(42, $config['integer']['value']);

        $this->assertIsFloat($config['float']['value']);
        $this->assertEquals(3.14, $config['float']['value']);

        $this->assertIsBool($config['boolean']['true']);
        $this->assertTrue($config['boolean']['true']);

        $this->assertIsBool($config['boolean']['false']);
        $this->assertFalse($config['boolean']['false']);

        $this->assertNull($config['null']['value']);

        $this->assertEquals('', $config['empty']['value']);

        $this->assertIsArray($config['json']['array']);
        $this->assertEquals(['item1', 'item2', 'item3'], $config['json']['array']);

        $this->assertIsArray($config['json']['object']);
        $this->assertEquals(['key' => 'value', 'number' => 123], $config['json']['object']);
    }

    public function testCustomPrefix(): void {
        $customSource = new EnvironmentConfigSource('CUSTOM_PREFIX_');

        $_ENV['CUSTOM_PREFIX_TEST_KEY'] = 'test value';
        $_ENV['VENICE_TEST_OTHER_KEY'] = 'other value';

        $config = $customSource->load();

        $this->assertArrayHasKey('test', $config);
        $this->assertEquals('test value', $config['test']['key']);
        $this->assertArrayNotHasKey('other', $config);
    }

    public function testServerVariables(): void {
        // Test loading from $_SERVER when not in $_ENV
        $_SERVER['VENICE_TEST_SERVER_VAR'] = 'server value';

        $config = $this->envSource->load();

        $this->assertArrayHasKey('server', $config);
        $this->assertEquals('server value', $config['server']['var']);
    }

    public function testEnvPrecedenceOverServer(): void {
        // Test that $_ENV takes precedence over $_SERVER
        $_ENV['VENICE_TEST_PRECEDENCE_TEST'] = 'env value';
        $_SERVER['VENICE_TEST_PRECEDENCE_TEST'] = 'server value';

        $config = $this->envSource->load();

        $this->assertEquals('env value', $config['precedence']['test']);
    }

    public function testSourceMetadata(): void {
        $_ENV['VENICE_TEST_META1'] = 'value1';
        $_ENV['VENICE_TEST_META2'] = 'value2';
        $_ENV['OTHER_PREFIX_VAR'] = 'ignored';

        $metadata = $this->envSource->getMetadata();

        $this->assertIsArray($metadata);
        $this->assertEquals('environment', $metadata['type']);
        $this->assertEquals('VENICE_TEST_', $metadata['prefix']);
        $this->assertIsArray($metadata['variables']);
        $this->assertContains('VENICE_TEST_META1', $metadata['variables']);
        $this->assertContains('VENICE_TEST_META2', $metadata['variables']);
        $this->assertNotContains('OTHER_PREFIX_VAR', $metadata['variables']);
        $this->assertEquals(2, $metadata['count']);
    }

    public function testReadOnlyOperations(): void {
        $this->assertTrue($this->envSource->isReadable());
        $this->assertFalse($this->envSource->isWritable());

        // Test that save operation returns false
        $this->assertFalse($this->envSource->save(['test' => 'data']));
    }

    public function testSourceName(): void {
        $name = $this->envSource->getName();
        $this->assertEquals('environment:VENICE_TEST_', $name);

        $customSource = new EnvironmentConfigSource('CUSTOM_');
        $this->assertEquals('environment:CUSTOM_', $customSource->getName());
    }

    public function testEmptyEnvironment(): void {
        // Test with no matching environment variables
        $emptySource = new EnvironmentConfigSource('NONEXISTENT_PREFIX_');
        $config = $emptySource->load();

        $this->assertIsArray($config);
        $this->assertEmpty($config);
    }

    public function testComplexNestedStructure(): void {
        $_ENV['VENICE_TEST_CACHE__DRIVERS__REDIS__HOST'] = 'redis.example.com';
        $_ENV['VENICE_TEST_CACHE__DRIVERS__REDIS__PORT'] = '6379';
        $_ENV['VENICE_TEST_CACHE__DRIVERS__REDIS__OPTIONS__PREFIX'] = 'app:';
        $_ENV['VENICE_TEST_CACHE__DRIVERS__REDIS__OPTIONS__TIMEOUT'] = '3600';
        $_ENV['VENICE_TEST_CACHE__DRIVERS__MEMCACHED__SERVERS'] = '["server1:11211", "server2:11211"]';

        $config = $this->envSource->load();

        $this->assertArrayHasKey('cache', $config);
        $this->assertArrayHasKey('drivers', $config['cache']);

        $redis = $config['cache']['drivers']['redis'];
        $this->assertEquals('redis.example.com', $redis['host']);
        $this->assertEquals(6379, $redis['port']);
        $this->assertEquals('app:', $redis['options']['prefix']);
        $this->assertEquals(3600, $redis['options']['timeout']);

        $memcached = $config['cache']['drivers']['memcached'];
        $this->assertIsArray($memcached['servers']);
        $this->assertEquals(['server1:11211', 'server2:11211'], $memcached['servers']);
    }

    public function testSpecialCharactersInValues(): void {
        $_ENV['VENICE_TEST_SPECIAL_CHARS'] = 'value with spaces and symbols: !@#$%^&*()';
        $_ENV['VENICE_TEST_MULTILINE'] = "line1\nline2\nline3";
        $_ENV['VENICE_TEST_QUOTES'] = 'value with "quotes" and \'apostrophes\'';

        $config = $this->envSource->load();

        $this->assertEquals('value with spaces and symbols: !@#$%^&*()', $config['special']['chars']);
        $this->assertEquals("line1\nline2\nline3", $config['multiline']);
        $this->assertEquals('value with "quotes" and \'apostrophes\'', $config['quotes']);
    }

    public function testInvalidJsonHandling(): void {
        $_ENV['VENICE_TEST_INVALID_JSON'] = '{"invalid": json}';

        $config = $this->envSource->load();

        // Should fall back to string value when JSON parsing fails
        $this->assertIsString($config['invalid']['json']);
        $this->assertEquals('{"invalid": json}', $config['invalid']['json']);
    }

    public function testNumericStringHandling(): void {
        $_ENV['VENICE_TEST_LEADING_ZERO'] = '0123';
        $_ENV['VENICE_TEST_PHONE_NUMBER'] = '+1234567890';
        $_ENV['VENICE_TEST_VERSION'] = '1.2.3';

        $config = $this->envSource->load();

        // Leading zero should be preserved as string
        $this->assertEquals('0123', $config['leading']['zero']);

        // Phone number should remain string
        $this->assertEquals('+1234567890', $config['phone']['number']);

        // Version should remain string
        $this->assertEquals('1.2.3', $config['version']);
    }
}
