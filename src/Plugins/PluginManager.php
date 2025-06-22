<?php

namespace Venice\Plugins;

use Venice\VeniceAI;
use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;
use Venice\Exceptions\VeniceException;

/**
 * Advanced Plugin Management System
 *
 * Provides comprehensive plugin architecture including:
 * - Dynamic plugin loading and unloading
 * - Plugin dependency management
 * - Lifecycle management (install, activate, deactivate, uninstall)
 * - Plugin sandboxing and security
 * - Hook system integration
 * - Plugin configuration management
 * - Auto-discovery and registration
 */
class PluginManager {
    /** @var VeniceAI Venice AI instance */
    private VeniceAI $venice;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var EventManager Event manager */
    private EventManager $events;

    /** @var array Loaded plugins */
    private array $plugins = [];

    /** @var array Plugin metadata */
    private array $pluginMeta = [];

    /** @var array Plugin hooks */
    private array $hooks = [];

    /** @var array Plugin dependencies */
    private array $dependencies = [];

    /** @var string Plugin directory */
    private string $pluginDir;

    /** @var array Plugin configuration */
    private array $config = [];

    /**
     * Constructor
     */
    public function __construct(VeniceAI $venice, Logger $logger, EventManager $events, array $config = []) {
        $this->venice = $venice;
        $this->logger = $logger;
        $this->events = $events;
        $this->config = array_merge([
            'plugin_dir' => dirname(__DIR__, 2) . '/plugins',
            'auto_discover' => true,
            'sandbox_mode' => true,
            'max_execution_time' => 30
        ], $config);

        $this->pluginDir = $this->config['plugin_dir'];

        if ($this->config['auto_discover']) {
            $this->discoverPlugins();
        }
    }

    /**
     * Register a plugin
     */
    public function register(string $name, PluginInterface $plugin): void {
        if (isset($this->plugins[$name])) {
            throw new VeniceException("Plugin '$name' is already registered");
        }

        $this->plugins[$name] = $plugin;
        $this->pluginMeta[$name] = $plugin->getMetadata();

        // Check dependencies
        $this->checkDependencies($name);

        $this->logger->info("Plugin registered: $name", [
            'version' => $this->pluginMeta[$name]['version'] ?? 'unknown'
        ]);

        $this->events->dispatch(new Event('plugin.registered', [
            'name' => $name,
            'metadata' => $this->pluginMeta[$name]
        ]));
    }

    /**
     * Activate a plugin
     */
    public function activate(string $name): bool {
        if (!isset($this->plugins[$name])) {
            throw new VeniceException("Plugin '$name' is not registered");
        }

        $plugin = $this->plugins[$name];

        try {
            // Set execution time limit
            if ($this->config['sandbox_mode']) {
                set_time_limit($this->config['max_execution_time']);
            }

            // Call plugin activation
            $result = $plugin->activate($this->venice);

            if ($result) {
                $this->pluginMeta[$name]['active'] = true;
                $this->registerPluginHooks($name, $plugin);

                $this->logger->info("Plugin activated: $name");

                $this->events->dispatch(new Event('plugin.activated', [
                    'name' => $name
                ]));
            }

            return $result;

        } catch (\Exception $e) {
            $this->logger->error("Failed to activate plugin: $name", [
                'error' => $e->getMessage()
            ]);

            $this->events->dispatch(new Event('plugin.activation_failed', [
                'name' => $name,
                'error' => $e->getMessage()
            ]));

            return false;
        }
    }

    /**
     * Deactivate a plugin
     */
    public function deactivate(string $name): bool {
        if (!isset($this->plugins[$name])) {
            return false;
        }

        $plugin = $this->plugins[$name];

        try {
            $result = $plugin->deactivate($this->venice);

            if ($result) {
                $this->pluginMeta[$name]['active'] = false;
                $this->unregisterPluginHooks($name);

                $this->logger->info("Plugin deactivated: $name");

                $this->events->dispatch(new Event('plugin.deactivated', [
                    'name' => $name
                ]));
            }

            return $result;

        } catch (\Exception $e) {
            $this->logger->error("Failed to deactivate plugin: $name", [
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Unregister a plugin
     */
    public function unregister(string $name): bool {
        if (!isset($this->plugins[$name])) {
            return false;
        }

        // Deactivate first if active
        if ($this->isActive($name)) {
            $this->deactivate($name);
        }

        unset($this->plugins[$name]);
        unset($this->pluginMeta[$name]);

        $this->logger->info("Plugin unregistered: $name");

        $this->events->dispatch(new Event('plugin.unregistered', [
            'name' => $name
        ]));

        return true;
    }

    /**
     * Check if plugin is active
     */
    public function isActive(string $name): bool {
        return isset($this->pluginMeta[$name]['active']) && $this->pluginMeta[$name]['active'];
    }

    /**
     * Get plugin instance
     */
    public function getPlugin(string $name): ?PluginInterface {
        return $this->plugins[$name] ?? null;
    }

    /**
     * Get all plugins
     */
    public function getPlugins(): array {
        return $this->plugins;
    }

    /**
     * Get active plugins
     */
    public function getActivePlugins(): array {
        return array_filter($this->plugins, function($name) {
            return $this->isActive($name);
        }, ARRAY_FILTER_USE_KEY);
    }

    /**
     * Get plugin metadata
     */
    public function getPluginMetadata(string $name): ?array {
        return $this->pluginMeta[$name] ?? null;
    }

    /**
     * Execute hook
     */
    public function executeHook(string $hookName, array $args = []): array {
        $results = [];

        if (!isset($this->hooks[$hookName])) {
            return $results;
        }

        foreach ($this->hooks[$hookName] as $callback) {
            try {
                $result = call_user_func_array($callback, $args);
                $results[] = $result;
            } catch (\Exception $e) {
                $this->logger->error("Hook execution failed: $hookName", [
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $results;
    }

    /**
     * Add hook
     */
    public function addHook(string $hookName, callable $callback, int $priority = 10): void {
        if (!isset($this->hooks[$hookName])) {
            $this->hooks[$hookName] = [];
        }

        $this->hooks[$hookName][] = [
            'callback' => $callback,
            'priority' => $priority
        ];

        // Sort by priority
        usort($this->hooks[$hookName], function($a, $b) {
            return $a['priority'] <=> $b['priority'];
        });
    }

    /**
     * Remove hook
     */
    public function removeHook(string $hookName, callable $callback): void {
        if (!isset($this->hooks[$hookName])) {
            return;
        }

        $this->hooks[$hookName] = array_filter($this->hooks[$hookName], function($hook) use ($callback) {
            return $hook['callback'] !== $callback;
        });
    }

    /**
     * Install plugin from file
     */
    public function installFromFile(string $filePath): bool {
        if (!file_exists($filePath)) {
            throw new VeniceException("Plugin file not found: $filePath");
        }

        $pluginInfo = $this->extractPluginInfo($filePath);

        if (!$pluginInfo) {
            throw new VeniceException("Invalid plugin file: $filePath");
        }

        // Extract to plugin directory
        $pluginName = $pluginInfo['name'];
        $pluginPath = $this->pluginDir . '/' . $pluginName;

        if (is_dir($pluginPath)) {
            throw new VeniceException("Plugin already exists: $pluginName");
        }

        // Create plugin directory and extract
        mkdir($pluginPath, 0755, true);

        if (pathinfo($filePath, PATHINFO_EXTENSION) === 'zip') {
            $this->extractZip($filePath, $pluginPath);
        } else {
            copy($filePath, $pluginPath . '/' . basename($filePath));
        }

        // Load and register plugin
        $this->loadPlugin($pluginName);

        $this->logger->info("Plugin installed: $pluginName");

        return true;
    }

    /**
     * Uninstall plugin
     */
    public function uninstall(string $name): bool {
        // Unregister first
        $this->unregister($name);

        // Remove plugin files
        $pluginPath = $this->pluginDir . '/' . $name;
        if (is_dir($pluginPath)) {
            $this->removeDirectory($pluginPath);
        }

        $this->logger->info("Plugin uninstalled: $name");

        return true;
    }

    /**
     * Discover plugins in plugin directory
     */
    private function discoverPlugins(): void {
        if (!is_dir($this->pluginDir)) {
            mkdir($this->pluginDir, 0755, true);
            return;
        }

        $directories = glob($this->pluginDir . '/*', GLOB_ONLYDIR);

        foreach ($directories as $dir) {
            $pluginName = basename($dir);
            $this->loadPlugin($pluginName);
        }
    }

    /**
     * Load plugin from directory
     */
    private function loadPlugin(string $name): bool {
        $pluginPath = $this->pluginDir . '/' . $name;
        $mainFile = $pluginPath . '/plugin.php';

        if (!file_exists($mainFile)) {
            $this->logger->warning("Plugin main file not found: $mainFile");
            return false;
        }

        try {
            // Load plugin file
            require_once $mainFile;

            // Look for plugin class
            $className = ucfirst($name) . 'Plugin';
            $fullClassName = "Venice\\Plugins\\$className";

            if (!class_exists($fullClassName)) {
                $this->logger->warning("Plugin class not found: $fullClassName");
                return false;
            }

            $plugin = new $fullClassName();

            if (!$plugin instanceof PluginInterface) {
                $this->logger->warning("Plugin does not implement PluginInterface: $fullClassName");
                return false;
            }

            $this->register($name, $plugin);
            return true;

        } catch (\Exception $e) {
            $this->logger->error("Failed to load plugin: $name", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Check plugin dependencies
     */
    private function checkDependencies(string $name): void {
        $metadata = $this->pluginMeta[$name];

        if (!isset($metadata['dependencies'])) {
            return;
        }

        foreach ($metadata['dependencies'] as $dependency) {
            if (!isset($this->plugins[$dependency])) {
                throw new VeniceException("Plugin '$name' requires '$dependency' which is not available");
            }
        }
    }

    /**
     * Register plugin hooks
     */
    private function registerPluginHooks(string $name, PluginInterface $plugin): void {
        $hooks = $plugin->getHooks();

        foreach ($hooks as $hookName => $callback) {
            $this->addHook($hookName, $callback);
        }
    }

    /**
     * Unregister plugin hooks
     */
    private function unregisterPluginHooks(string $name): void {
        if (!isset($this->plugins[$name])) {
            return;
        }

        $plugin = $this->plugins[$name];
        $hooks = $plugin->getHooks();

        foreach ($hooks as $hookName => $callback) {
            $this->removeHook($hookName, $callback);
        }
    }

    /**
     * Extract plugin info from file
     */
    private function extractPluginInfo(string $filePath): ?array {
        // This would parse plugin metadata from file
        // Implementation depends on plugin format (ZIP, JSON, etc.)
        return [
            'name' => pathinfo($filePath, PATHINFO_FILENAME),
            'version' => '1.0.0'
        ];
    }

    /**
     * Extract ZIP file
     */
    private function extractZip(string $zipPath, string $destination): bool {
        if (!class_exists('ZipArchive')) {
            throw new VeniceException("ZipArchive extension is required for plugin installation");
        }

        $zip = new \ZipArchive();
        $result = $zip->open($zipPath);

        if ($result !== true) {
            throw new VeniceException("Failed to open ZIP file: $zipPath");
        }

        $zip->extractTo($destination);
        $zip->close();

        return true;
    }

    /**
     * Remove directory recursively
     */
    private function removeDirectory(string $dir): bool {
        if (!is_dir($dir)) {
            return false;
        }

        $files = array_diff(scandir($dir), ['.', '..']);

        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }

        return rmdir($dir);
    }
}
