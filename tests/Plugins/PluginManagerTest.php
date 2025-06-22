<?php

namespace Venice\Tests\Plugins;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Plugins\PluginManager;
use Venice\Plugins\PluginInterface;
use Venice\Exceptions\VeniceException;

class MockPlugin implements PluginInterface {
    private bool $isActive = false;
    private array $hooks = [];

    public function getMetadata(): array {
        return [
            'name' => 'mock_plugin',
            'version' => '1.0.0',
            'description' => 'Test plugin',
            'author' => 'Test Author',
            'dependencies' => []
        ];
    }

    public function activate(VeniceAI $venice): bool {
        $this->isActive = true;
        return true;
    }

    public function deactivate(VeniceAI $venice): bool {
        $this->isActive = false;
        return true;
    }

    public function getHooks(): array {
        return $this->hooks;
    }

    public function addHook(string $name, callable $callback): void {
        $this->hooks[$name] = $callback;
    }

    public function getConfigSchema(): array {
        return [
            'setting1' => ['type' => 'string', 'required' => true],
            'setting2' => ['type' => 'integer', 'default' => 42]
        ];
    }

    public function validateConfig(array $config): bool {
        return isset($config['setting1']) && is_string($config['setting1']);
    }

    public function update(string $oldVersion, string $newVersion): bool {
        return true;
    }
}

class PluginManagerTest extends TestCase {
    private VeniceAI $venice;
    private Logger $logger;
    private EventManager $events;
    private PluginManager $pluginManager;
    private string $tempDir;

    protected function setUp(): void {
        $this->venice = $this->createMock(VeniceAI::class);
        $this->logger = $this->createMock(Logger::class);
        $this->events = $this->createMock(EventManager::class);

        // Create temporary plugin directory
        $this->tempDir = sys_get_temp_dir() . '/venice_plugins_' . uniqid();
        mkdir($this->tempDir);

        $this->pluginManager = new PluginManager($this->venice, $this->logger, $this->events, [
            'plugin_dir' => $this->tempDir,
            'auto_discover' => false
        ]);
    }

    protected function tearDown(): void {
        // Clean up temporary directory
        $this->removeDirectory($this->tempDir);
    }

    public function testPluginRegistration(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        $this->assertTrue($this->pluginManager->getPlugin('test_plugin') instanceof PluginInterface);
        $this->assertCount(1, $this->pluginManager->getPlugins());
    }

    public function testPluginActivation(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        $this->assertTrue($this->pluginManager->activate('test_plugin'));
        $this->assertTrue($this->pluginManager->isActive('test_plugin'));
    }

    public function testPluginDeactivation(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);
        $this->pluginManager->activate('test_plugin');

        $this->assertTrue($this->pluginManager->deactivate('test_plugin'));
        $this->assertFalse($this->pluginManager->isActive('test_plugin'));
    }

    public function testPluginUnregistration(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        $this->assertTrue($this->pluginManager->unregister('test_plugin'));
        $this->assertNull($this->pluginManager->getPlugin('test_plugin'));
    }

    public function testHookExecution(): void {
        $plugin = new MockPlugin();
        $executed = false;

        $plugin->addHook('test_hook', function() use (&$executed) {
            $executed = true;
            return 'hook_result';
        });

        $this->pluginManager->register('test_plugin', $plugin);
        $this->pluginManager->activate('test_plugin');

        $results = $this->pluginManager->executeHook('test_hook');

        $this->assertTrue($executed);
        $this->assertEquals(['hook_result'], $results);
    }

    public function testPluginInstallation(): void {
        // Create test plugin file
        $pluginFile = $this->tempDir . '/test_plugin.php';
        file_put_contents($pluginFile, '<?php class TestPlugin implements \Venice\Plugins\PluginInterface {}');

        $this->assertTrue($this->pluginManager->installFromFile($pluginFile));
        $this->assertDirectoryExists($this->tempDir . '/test_plugin');
    }

    public function testPluginUninstallation(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        // Create plugin directory
        mkdir($this->tempDir . '/test_plugin');

        $this->assertTrue($this->pluginManager->uninstall('test_plugin'));
        $this->assertDirectoryDoesNotExist($this->tempDir . '/test_plugin');
    }

    public function testPluginDependencies(): void {
        $this->expectException(VeniceException::class);

        $dependentPlugin = new class implements PluginInterface {
            public function getMetadata(): array {
                return ['dependencies' => ['required_plugin']];
            }
            public function activate(VeniceAI $venice): bool { return true; }
            public function deactivate(VeniceAI $venice): bool { return true; }
            public function getHooks(): array { return []; }
            public function getConfigSchema(): array { return []; }
            public function validateConfig(array $config): bool { return true; }
            public function update(string $oldVersion, string $newVersion): bool { return true; }
        };

        $this->pluginManager->register('dependent_plugin', $dependentPlugin);
    }

    public function testPluginMetadata(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        $metadata = $this->pluginManager->getPluginMetadata('test_plugin');

        $this->assertIsArray($metadata);
        $this->assertEquals('1.0.0', $metadata['version']);
        $this->assertEquals('Test Author', $metadata['author']);
    }

    public function testActivePlugins(): void {
        $plugin1 = new MockPlugin();
        $plugin2 = new MockPlugin();

        $this->pluginManager->register('plugin1', $plugin1);
        $this->pluginManager->register('plugin2', $plugin2);

        $this->pluginManager->activate('plugin1');

        $activePlugins = $this->pluginManager->getActivePlugins();
        $this->assertCount(1, $activePlugins);
        $this->assertArrayHasKey('plugin1', $activePlugins);
    }

    public function testHookPriority(): void {
        $execution = [];
        $plugin = new MockPlugin();

        $plugin->addHook('priority_test', function() use (&$execution) {
            $execution[] = 'low';
            return 'low';
        });

        $this->pluginManager->register('test_plugin', $plugin);
        $this->pluginManager->activate('test_plugin');

        // Add high priority hook
        $this->pluginManager->addHook('priority_test', function() use (&$execution) {
            $execution[] = 'high';
            return 'high';
        }, 1);

        $results = $this->pluginManager->executeHook('priority_test');

        $this->assertEquals(['high', 'low'], $execution);
    }

    public function testPluginConfigValidation(): void {
        $plugin = new MockPlugin();
        $this->pluginManager->register('test_plugin', $plugin);

        $this->assertTrue($plugin->validateConfig(['setting1' => 'value']));
        $this->assertFalse($plugin->validateConfig(['setting2' => 42]));
    }

    private function removeDirectory(string $dir): void {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
