<?php

namespace Venice\Plugins;

use Venice\VeniceAI;

/**
 * Plugin Interface
 *
 * Defines the contract that all Venice AI plugins must implement.
 */
interface PluginInterface {
    /**
     * Get plugin metadata
     *
     * @return array Plugin metadata including:
     *               - name: Plugin name
     *               - version: Plugin version
     *               - description: Plugin description
     *               - author: Plugin author
     *               - dependencies: Array of required plugin names
     *               - minimumPhpVersion: Minimum PHP version required
     *               - minimumSdkVersion: Minimum Venice AI SDK version required
     */
    public function getMetadata(): array;

    /**
     * Activate the plugin
     *
     * @param VeniceAI $venice Venice AI instance
     * @return bool True if activation was successful
     */
    public function activate(VeniceAI $venice): bool;

    /**
     * Deactivate the plugin
     *
     * @param VeniceAI $venice Venice AI instance
     * @return bool True if deactivation was successful
     */
    public function deactivate(VeniceAI $venice): bool;

    /**
     * Get plugin hooks
     *
     * @return array Array of hook name => callback pairs
     */
    public function getHooks(): array;

    /**
     * Get plugin configuration schema
     *
     * @return array Configuration schema
     */
    public function getConfigSchema(): array;

    /**
     * Validate plugin configuration
     *
     * @param array $config Configuration to validate
     * @return bool True if configuration is valid
     */
    public function validateConfig(array $config): bool;

    /**
     * Handle plugin updates
     *
     * @param string $oldVersion Previous version
     * @param string $newVersion New version
     * @return bool True if update was successful
     */
    public function update(string $oldVersion, string $newVersion): bool;
}
