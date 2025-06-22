<?php

namespace Venice\Config;

/**
 * Configuration Source Interface
 *
 * Defines the contract that all configuration sources must implement.
 * Sources can include files, environment variables, databases, remote APIs, etc.
 */
interface ConfigSourceInterface {
    /**
     * Load configuration data from source
     *
     * @return array Configuration data
     * @throws \Venice\Exceptions\VeniceException If loading fails
     */
    public function load(): array;

    /**
     * Save configuration data to source
     *
     * @param array $data Configuration data to save
     * @return bool True if save was successful
     * @throws \Venice\Exceptions\VeniceException If saving fails
     */
    public function save(array $data): bool;

    /**
     * Check if source is readable
     *
     * @return bool True if source is readable
     */
    public function isReadable(): bool;

    /**
     * Check if source is writable
     *
     * @return bool True if source is writable
     */
    public function isWritable(): bool;

    /**
     * Get source name/identifier
     *
     * @return string Source name/identifier
     */
    public function getName(): string;

    /**
     * Get source metadata
     *
     * @return array Source metadata
     */
    public function getMetadata(): array;
}
