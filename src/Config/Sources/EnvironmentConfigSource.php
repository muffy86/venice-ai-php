<?php

namespace Venice\Config\Sources;

use Venice\Config\ConfigSourceInterface;

/**
 * Environment Variables Configuration Source
 *
 * Handles configuration from environment variables with prefix support
 */
class EnvironmentConfigSource implements ConfigSourceInterface {
    /** @var string Environment variable prefix */
    private string $prefix;

    /** @var array Type casting rules */
    private array $typeCasting = [
        'true' => true,
        'false' => false,
        'null' => null,
        'empty' => ''
    ];

    /**
     * Constructor
     */
    public function __construct(string $prefix = 'VENICE_') {
        $this->prefix = $prefix;
    }

    /**
     * Load configuration from environment variables
     */
    public function load(): array {
        $config = [];

        foreach ($_ENV as $key => $value) {
            if (strpos($key, $this->prefix) === 0) {
                $configKey = $this->transformKey($key);
                $configValue = $this->castValue($value);

                $this->setNestedValue($config, $configKey, $configValue);
            }
        }

        // Also check $_SERVER for environment variables
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, $this->prefix) === 0 && !isset($_ENV[$key])) {
                $configKey = $this->transformKey($key);
                $configValue = $this->castValue($value);

                $this->setNestedValue($config, $configKey, $configValue);
            }
        }

        return $config;
    }

    /**
     * Save configuration to environment (not supported)
     */
    public function save(array $data): bool {
        // Environment variables are typically read-only from application perspective
        return false;
    }

    /**
     * Check if source is readable
     */
    public function isReadable(): bool {
        return true; // Environment variables are always readable
    }

    /**
     * Check if source is writable
     */
    public function isWritable(): bool {
        return false; // Environment variables are not writable from application
    }

    /**
     * Get source name
     */
    public function getName(): string {
        return 'environment:' . $this->prefix;
    }

    /**
     * Get source metadata
     */
    public function getMetadata(): array {
        $envVars = [];

        foreach ($_ENV as $key => $value) {
            if (strpos($key, $this->prefix) === 0) {
                $envVars[] = $key;
            }
        }

        return [
            'type' => 'environment',
            'prefix' => $this->prefix,
            'variables' => $envVars,
            'count' => count($envVars)
        ];
    }

    /**
     * Transform environment variable key to configuration key
     */
    private function transformKey(string $envKey): string {
        // Remove prefix
        $key = substr($envKey, strlen($this->prefix));

        // Convert to lowercase and replace underscores with dots
        $key = strtolower($key);
        $key = str_replace('__', '.', $key); // Double underscore becomes dot
        $key = str_replace('_', '.', $key);  // Single underscore becomes dot

        return $key;
    }

    /**
     * Cast string value to appropriate type
     */
    private function castValue(string $value) {
        // Check for special values
        $lowerValue = strtolower($value);

        if (isset($this->typeCasting[$lowerValue])) {
            return $this->typeCasting[$lowerValue];
        }

        // Try to cast to number
        if (is_numeric($value)) {
            if (strpos($value, '.') !== false) {
                return (float) $value;
            } else {
                return (int) $value;
            }
        }

        // Try to parse as JSON
        if (($value[0] === '{' && $value[-1] === '}') ||
            ($value[0] === '[' && $value[-1] === ']')) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        // Return as string
        return $value;
    }

    /**
     * Set nested value using dot notation
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
}
