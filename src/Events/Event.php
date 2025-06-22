<?php

namespace Venice\Events;

/**
 * Generic Event class for Venice AI SDK
 *
 * Provides event data container with stoppage support
 */
class Event {
    /** @var string Event name */
    private string $name;

    /** @var array Event data */
    private array $data;

    /** @var bool Whether propagation is stopped */
    private bool $propagationStopped = false;

    /** @var float Event timestamp */
    private float $timestamp;

    /**
     * Constructor
     *
     * @param string $name Event name
     * @param array $data Event data
     */
    public function __construct(string $name, array $data = []) {
        $this->name = $name;
        $this->data = $data;
        $this->timestamp = microtime(true);
    }

    /**
     * Get event name
     *
     * @return string
     */
    public function getName(): string {
        return $this->name;
    }

    /**
     * Get event data
     *
     * @return array
     */
    public function getData(): array {
        return $this->data;
    }

    /**
     * Get specific data value
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, mixed $default = null): mixed {
        return $this->data[$key] ?? $default;
    }

    /**
     * Set data value
     *
     * @param string $key
     * @param mixed $value
     * @return void
     */
    public function set(string $key, mixed $value): void {
        $this->data[$key] = $value;
    }

    /**
     * Get event timestamp
     *
     * @return float
     */
    public function getTimestamp(): float {
        return $this->timestamp;
    }

    /**
     * Stop event propagation
     *
     * @return void
     */
    public function stopPropagation(): void {
        $this->propagationStopped = true;
    }

    /**
     * Check if propagation is stopped
     *
     * @return bool
     */
    public function isPropagationStopped(): bool {
        return $this->propagationStopped;
    }

    /**
     * Convert to array
     *
     * @return array
     */
    public function toArray(): array {
        return [
            'name' => $this->name,
            'data' => $this->data,
            'timestamp' => $this->timestamp,
            'propagation_stopped' => $this->propagationStopped
        ];
    }

    /**
     * Convert to JSON
     *
     * @return string
     */
    public function toJson(): string {
        return json_encode($this->toArray(), JSON_THROW_ON_ERROR);
    }
}
