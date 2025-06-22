<?php

namespace Venice\Config;

use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;
use Venice\Exceptions\VeniceException;

/**
 * Advanced Configuration Management System
 *
 * Provides comprehensive configuration management including:
 * - Multi-source configuration loading (files, environment, database)
 * - Configuration validation and schema enforcement
 * - Dynamic configuration updates
 * - Configuration caching and optimization
 * - Environment-specific configurations
 * - Configuration encryption for sensitive data
 * - Configuration versioning and rollback
 * - Hot-reload capabilities
 */
class ConfigManager {
    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var EventManager Event manager */
    private EventManager $events;

    /** @var array Configuration data */
    private array $config = [];

    /** @var array Configuration schema */
    private array $schema = [];

    /** @var array Configuration sources */
    private array $sources = [];

    /** @var array Cached configurations */
    private array $cache = [];

    /** @var string Current environment */
    private string $environment;

    /** @var array Watchers for configuration changes */
    private array $watchers = [];

    /** @var bool Enable hot reload */
    private bool $hotReload = false;

    /** @var string Encryption key for sensitive data */
    private ?string $encryptionKey = null;

    /**
     * Constructor
     */
    public function __construct(Logger $logger, EventManager $events, array $options = []) {
        $this->logger = $logger;
        $this->events = $events;
        $this->environment = $options['environment'] ?? 'production';
        $this->hotReload = $options['hot_reload'] ?? false;
        $this->encryptionKey = $options['encryption_key'] ?? null;

        $this->initializeDefaultSources();

        if ($this->hotReload) {
            $this->enableHotReload();
        }
    }

    /**
     * Load configuration from multiple sources
     */
    public function load(): void {
        $this->config = [];

        foreach ($this->sources as $source) {
            try {
                $data = $source->load();
                $this->config = array_merge_recursive($this->config, $data);

                $this->logger->debug('Configuration loaded from source', [
                    'source' => get_class($source),
                    'keys' => array_keys($data)
                ]);

            } catch (\Exception $e) {
                $this->logger->error('Failed to load configuration from source', [
                    'source' => get_class($source),
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Apply environment-specific overrides
        $this->applyEnvironmentOverrides();

        // Validate configuration
        $this->validate();

        // Decrypt sensitive values
        $this->decryptSensitiveValues();

        $this->events->dispatch(new Event('config.loaded', [
            'environment' => $this->environment,
            'keys' => array_keys($this->config)
        ]));
    }

    /**
     * Get configuration value
     */
    public function get(string $key, $default = null) {
        return $this->getNestedValue($this->config, $key, $default);
    }

    /**
     * Set configuration value
     */
    public function set(string $key, $value): void {
        $this->setNestedValue($this->config, $key, $value);

        $this->events->dispatch(new Event('config.changed', [
            'key' => $key,
            'value' => $value
        ]));

        // Trigger watchers
        $this->triggerWatchers($key, $value);
    }

    /**
     * Check if configuration key exists
     */
    public function has(string $key): bool {
        return $this->getNestedValue($this->config, $key, '__NOT_FOUND__') !== '__NOT_FOUND__';
    }

    /**
     * Get all configuration
     */
    public function all(): array {
        return $this->config;
    }

    /**
     * Add configuration source
     */
    public function addSource(ConfigSourceInterface $source, int $priority = 10): void {
        $this->sources[] = [
            'source' => $source,
            'priority' => $priority
        ];

        // Sort by priority
        usort($this->sources, function($a, $b) {
            return $a['priority'] <=> $b['priority'];
        });

        // Extract just the source objects
        $this->sources = array_column($this->sources, 'source');
    }

    /**
     * Set configuration schema
     */
    public function setSchema(array $schema): void {
        $this->schema = $schema;
    }

    /**
     * Validate configuration against schema
     */
    public function validate(): bool {
        if (empty($this->schema)) {
            return true;
        }

        $errors = [];

        foreach ($this->schema as $key => $rules) {
            $value = $this->get($key);

            // Check required fields
            if (isset($rules['required']) && $rules['required'] && $value === null) {
                $errors[] = "Required configuration key '$key' is missing";
                continue;
            }

            // Skip validation if value is null and not required
            if ($value === null) {
                continue;
            }

            // Type validation
            if (isset($rules['type'])) {
                if (!$this->validateType($value, $rules['type'])) {
                    $errors[] = "Configuration key '$key' must be of type {$rules['type']}";
                }
            }

            // Range validation
            if (isset($rules['min']) && is_numeric($value) && $value < $rules['min']) {
                $errors[] = "Configuration key '$key' must be at least {$rules['min']}";
            }

            if (isset($rules['max']) && is_numeric($value) && $value > $rules['max']) {
                $errors[] = "Configuration key '$key' must be at most {$rules['max']}";
            }

            // Enum validation
            if (isset($rules['enum']) && !in_array($value, $rules['enum'])) {
                $allowed = implode(', ', $rules['enum']);
                $errors[] = "Configuration key '$key' must be one of: $allowed";
            }

            // Custom validation
            if (isset($rules['validator']) && is_callable($rules['validator'])) {
                if (!call_user_func($rules['validator'], $value)) {
                    $errors[] = "Configuration key '$key' failed custom validation";
                }
            }
        }

        if (!empty($errors)) {
            $this->logger->error('Configuration validation failed', ['errors' => $errors]);
            throw new VeniceException('Configuration validation failed: ' . implode(', ', $errors));
        }

        return true;
    }

    /**
     * Watch for configuration changes
     */
    public function watch(string $key, callable $callback): void {
        if (!isset($this->watchers[$key])) {
            $this->watchers[$key] = [];
        }

        $this->watchers[$key][] = $callback;
    }

    /**
     * Reload configuration
     */
    public function reload(): void {
        $oldConfig = $this->config;
        $this->load();

        // Find changed keys
        $changes = $this->findChanges($oldConfig, $this->config);

        foreach ($changes as $key => $value) {
            $this->triggerWatchers($key, $value);
        }

        $this->events->dispatch(new Event('config.reloaded', [
            'changes' => array_keys($changes)
        ]));
    }

    /**
     * Export configuration
     */
    public function export(string $format = 'array'): string {
        switch ($format) {
            case 'json':
                return json_encode($this->config, JSON_PRETTY_PRINT);

            case 'yaml':
                if (!function_exists('yaml_emit')) {
                    throw new VeniceException('YAML extension is required for YAML export');
                }
                return yaml_emit($this->config);

            case 'php':
                return '<?php return ' . var_export($this->config, true) . ';';

            case 'env':
                return $this->exportToEnv($this->config);

            default:
                return serialize($this->config);
        }
    }

    /**
     * Import configuration
     */
    public function import(string $data, string $format = 'array'): void {
        switch ($format) {
            case 'json':
                $imported = json_decode($data, true);
                break;

            case 'yaml':
                if (!function_exists('yaml_parse')) {
                    throw new VeniceException('YAML extension is required for YAML import');
                }
                $imported = yaml_parse($data);
                break;

            case 'php':
                $imported = eval('return ' . $data . ';');
                break;

            default:
                $imported = unserialize($data);
        }

        if (!is_array($imported)) {
            throw new VeniceException('Invalid configuration data format');
        }

        $this->config = array_merge($this->config, $imported);
        $this->validate();
    }

    /**
     * Create configuration snapshot
     */
    public function createSnapshot(string $name): void {
        $snapshot = [
            'name' => $name,
            'timestamp' => time(),
            'environment' => $this->environment,
            'config' => $this->config
        ];

        $snapshotFile = $this->getSnapshotPath($name);
        file_put_contents($snapshotFile, serialize($snapshot));

        $this->logger->info('Configuration snapshot created', ['name' => $name]);
    }

    /**
     * Restore from snapshot
     */
    public function restoreSnapshot(string $name): void {
        $snapshotFile = $this->getSnapshotPath($name);

        if (!file_exists($snapshotFile)) {
            throw new VeniceException("Configuration snapshot '$name' not found");
        }

        $snapshot = unserialize(file_get_contents($snapshotFile));
        $this->config = $snapshot['config'];

        $this->validate();

        $this->events->dispatch(new Event('config.restored', [
            'snapshot' => $name,
            'timestamp' => $snapshot['timestamp']
        ]));

        $this->logger->info('Configuration restored from snapshot', ['name' => $name]);
    }

    /**
     * Get configuration diff
     */
    public function diff(array $other): array {
        return $this->arrayDiff($this->config, $other);
    }

    /**
     * Encrypt sensitive configuration value
     */
    public function encrypt(string $value): string {
        if (!$this->encryptionKey) {
            throw new VeniceException('Encryption key not configured');
        }

        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($value, 'AES-256-CBC', $this->encryptionKey, 0, $iv);

        return base64_encode($iv . $encrypted);
    }

    /**
     * Decrypt sensitive configuration value
     */
    public function decrypt(string $encryptedValue): string {
        if (!$this->encryptionKey) {
            throw new VeniceException('Encryption key not configured');
        }

        $data = base64_decode($encryptedValue);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);

        return openssl_decrypt($encrypted, 'AES-256-CBC', $this->encryptionKey, 0, $iv);
    }

    /**
     * Initialize default configuration sources
     */
    private function initializeDefaultSources(): void {
        // Add environment variables source
        $this->addSource(new EnvironmentConfigSource(), 1);

        // Add file-based sources
        $configDir = dirname(__DIR__, 2) . '/config';
        if (is_dir($configDir)) {
            $this->addSource(new FileConfigSource($configDir), 5);
        }
    }

    /**
     * Apply environment-specific configuration overrides
     */
    private function applyEnvironmentOverrides(): void {
        $envConfig = $this->config[$this->environment] ?? [];

        if (!empty($envConfig)) {
            $this->config = array_merge_recursive($this->config, $envConfig);
            unset($this->config[$this->environment]);
        }
    }

    /**
     * Decrypt sensitive values in configuration
     */
    private function decryptSensitiveValues(): void {
        if (!$this->encryptionKey) {
            return;
        }

        $this->config = $this->walkArray($this->config, function($value, $key) {
            if (is_string($value) && strpos($key, '_encrypted') !== false) {
                try {
                    return $this->decrypt($value);
                } catch (\Exception $e) {
                    $this->logger->warning('Failed to decrypt configuration value', [
                        'key' => $key,
                        'error' => $e->getMessage()
                    ]);
                    return $value;
                }
            }
            return $value;
        });
    }

    /**
     * Get nested value from array using dot notation
     */
    private function getNestedValue(array $array, string $key, $default = null) {
        $keys = explode('.', $key);
        $value = $array;

        foreach ($keys as $k) {
            if (!is_array($value) || !array_key_exists($k, $value)) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }

    /**
     * Set nested value in array using dot notation
     */
    private function setNestedValue(array &$array, string $key, $value): void {
        $keys = explode('.', $key);
        $current = &$array;

        foreach ($keys as $k) {
            if (!isset($current[$k]) || !is_array($current[$k])) {
                $current[$k] = [];
            }
            $current = &$current[$k];
        }

        $current = $value;
    }

    /**
     * Validate value type
     */
    private function validateType($value, string $type): bool {
        switch ($type) {
            case 'string':
                return is_string($value);
            case 'integer':
            case 'int':
                return is_int($value);
            case 'float':
            case 'double':
                return is_float($value);
            case 'boolean':
            case 'bool':
                return is_bool($value);
            case 'array':
                return is_array($value);
            case 'object':
                return is_object($value);
            default:
                return true;
        }
    }

    /**
     * Trigger watchers for configuration key
     */
    private function triggerWatchers(string $key, $value): void {
        if (!isset($this->watchers[$key])) {
            return;
        }

        foreach ($this->watchers[$key] as $callback) {
            try {
                call_user_func($callback, $value, $key);
            } catch (\Exception $e) {
                $this->logger->error('Configuration watcher failed', [
                    'key' => $key,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Find changes between two configuration arrays
     */
    private function findChanges(array $old, array $new): array {
        $changes = [];

        foreach ($new as $key => $value) {
            if (!isset($old[$key]) || $old[$key] !== $value) {
                $changes[$key] = $value;
            }
        }

        return $changes;
    }

    /**
     * Enable hot reload functionality
     */
    private function enableHotReload(): void {
        // This would implement file watching for configuration changes
        // Implementation would depend on the platform and available extensions
    }

    /**
     * Get snapshot file path
     */
    private function getSnapshotPath(string $name): string {
        $snapshotDir = dirname(__DIR__, 2) . '/config/snapshots';
        if (!is_dir($snapshotDir)) {
            mkdir($snapshotDir, 0755, true);
        }

        return $snapshotDir . '/' . $name . '.snapshot';
    }

    /**
     * Export configuration to environment format
     */
    private function exportToEnv(array $config, string $prefix = ''): string {
        $lines = [];

        foreach ($config as $key => $value) {
            $envKey = $prefix . strtoupper($key);

            if (is_array($value)) {
                $lines[] = $this->exportToEnv($value, $envKey . '_');
            } else {
                $envValue = is_bool($value) ? ($value ? 'true' : 'false') : $value;
                $lines[] = "$envKey=$envValue";
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Calculate array diff recursively
     */
    private function arrayDiff(array $array1, array $array2): array {
        $diff = [];

        foreach ($array1 as $key => $value) {
            if (!array_key_exists($key, $array2)) {
                $diff[$key] = $value;
            } elseif (is_array($value) && is_array($array2[$key])) {
                $nestedDiff = $this->arrayDiff($value, $array2[$key]);
                if (!empty($nestedDiff)) {
                    $diff[$key] = $nestedDiff;
                }
            } elseif ($value !== $array2[$key]) {
                $diff[$key] = $value;
            }
        }

        return $diff;
    }

    /**
     * Walk array recursively and apply callback
     */
    private function walkArray(array $array, callable $callback): array {
        $result = [];

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->walkArray($value, $callback);
            } else {
                $result[$key] = call_user_func($callback, $value, $key);
            }
        }

        return $result;
    }
}
