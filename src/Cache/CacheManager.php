<?php

namespace Venice\Cache;

use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;
use Venice\Exceptions\VeniceException;

/**
 * Enhanced Cache Manager with multi-tier caching and optimizations
 */
class CacheManager {
    /** @var array Cache configuration */
    private array $config;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var EventManager Event manager instance */
    private EventManager $events;

    /** @var array Memory cache storage */
    private array $memoryCache = [];

    /** @var array Cache statistics */
    private array $stats = [
        'hits' => 0,
        'misses' => 0,
        'writes' => 0,
        'deletes' => 0,
        'memory_hits' => 0,
        'redis_hits' => 0,
        'file_hits' => 0
    ];

    /** @var \Redis|null Redis connection */
    private ?\Redis $redis = null;

    /** @var string Cache prefix for namespacing */
    private string $prefix;

    /** @var array Memory cache configuration */
    private array $memoryCacheConfig = [
        'max_items' => 10000,
        'ttl' => 3600
    ];

    /** @var array<string, int> Cache item timestamps */
    private array $timestamps = [];

    /** @var bool Compression enabled flag */
    private bool $compressionEnabled;

    /** @var int Compression level */
    private int $compressionLevel;

    /** @var array<string, array> Cache tags index */
    private array $tagIndex = [];

    /**
     * Constructor
     */
    public function __construct(array $config, Logger $logger, EventManager $events) {
        $this->config = array_merge([
            'driver' => 'auto',
            'prefix' => 'venice:cache:',
            'redis_dsn' => 'redis://localhost:6379',
            'file_cache_dir' => sys_get_temp_dir() . '/venice_cache',
            'memory_cache' => [
                'enabled' => true,
                'max_items' => 10000,
                'ttl' => 3600
            ],
            'compression' => [
                'enabled' => true,
                'level' => 6
            ]
        ], $config);

        $this->logger = $logger;
        $this->events = $events;
        $this->prefix = $this->config['prefix'];

        // Initialize memory cache settings
        $this->memoryCacheConfig = $this->config['memory_cache'];

        // Initialize compression settings
        $this->compressionEnabled = $this->config['compression']['enabled'];
        $this->compressionLevel = $this->config['compression']['level'];

        // Initialize cache driver
        $this->initializeDriver();

        $this->logger->info('Cache manager initialized', [
            'driver' => $this->config['driver'],
            'compression' => $this->compressionEnabled
        ]);
    }

    /**
     * Initialize cache driver with connection pooling
     */
    private function initializeDriver(): void {
        if ($this->config['driver'] === 'redis' || $this->config['driver'] === 'auto') {
            try {
                $this->redis = new \Redis();
                $parsed = parse_url($this->config['redis_dsn']);

                $this->redis->connect(
                    $parsed['host'] ?? 'localhost',
                    $parsed['port'] ?? 6379,
                    1.0, // Quick timeout for initial connection
                    null,
                    0, // Retry interval
                    0, // Read timeout
                    ['tcp_keepalive' => true]
                );

                if (isset($parsed['pass'])) {
                    $this->redis->auth($parsed['pass']);
                }

                // Optimize Redis connection
                $this->redis->setOption(\Redis::OPT_SERIALIZER, \Redis::SERIALIZER_PHP);
                $this->redis->setOption(\Redis::OPT_PREFIX, $this->prefix);
                $this->redis->setOption(\Redis::OPT_TCP_KEEPALIVE, 1);
                $this->redis->setOption(\Redis::OPT_READ_TIMEOUT, -1);

                $this->logger->info('Redis connection established');
            } catch (\RedisException $e) {
                if ($this->config['driver'] === 'redis') {
                    throw new VeniceException('Redis connection failed: ' . $e->getMessage());
                }
                $this->logger->warning('Redis connection failed, falling back to file cache');
                $this->redis = null;
            }
        }

        // Ensure file cache directory exists
        if (!$this->redis || $this->config['driver'] === 'file') {
            $dir = $this->config['file_cache_dir'];
            if (!is_dir($dir) && !mkdir($dir, 0777, true)) {
                throw new VeniceException("Failed to create cache directory: $dir");
            }
        }
    }

    /**
     * Get item from cache with multi-tier fallback
     */
    public function get(string $key): mixed {
        $start = microtime(true);

        // Try memory cache first
        if ($this->memoryCacheConfig['enabled']) {
            if (isset($this->memoryCache[$key])) {
                if ($this->isExpired($key)) {
                    unset($this->memoryCache[$key]);
                } else {
                    $this->stats['hits']++;
                    $this->stats['memory_hits']++;
                    return $this->memoryCache[$key];
                }
            }
        }

        // Try Redis if available
        if ($this->redis) {
            try {
                $value = $this->redis->get($key);
                if ($value !== false) {
                    $this->stats['hits']++;
                    $this->stats['redis_hits']++;

                    // Store in memory cache for faster subsequent access
                    if ($this->memoryCacheConfig['enabled']) {
                        $this->memoryCache[$key] = $value;
                        $this->timestamps[$key] = time();
                    }

                    return $this->maybeDecompress($value);
                }
            } catch (\RedisException $e) {
                $this->logger->warning('Redis get failed: ' . $e->getMessage());
            }
        }

        // Try file cache
        $path = $this->getFilePath($key);
        if (file_exists($path)) {
            $data = $this->readFile($path);
            if ($data !== null) {
                $this->stats['hits']++;
                $this->stats['file_hits']++;

                // Store in memory cache
                if ($this->memoryCacheConfig['enabled']) {
                    $this->memoryCache[$key] = $data;
                    $this->timestamps[$key] = time();
                }

                return $data;
            }
        }

        $this->stats['misses']++;

        // Record cache access time
        $duration = (microtime(true) - $start) * 1000;
        $this->events->dispatch(new Event('cache.access', [
            'key' => $key,
            'hit' => false,
            'duration_ms' => $duration
        ]));

        return null;
    }

    /**
     * Store item in cache with automatic compression
     */
    public function set(string $key, mixed $value, ?int $ttl = null, array $tags = []): bool {
        $ttl = $ttl ?? $this->memoryCacheConfig['ttl'];
        $compressed = $this->maybeCompress($value);

        $success = false;

        // Store in Redis if available
        if ($this->redis) {
            try {
                $success = $ttl > 0
                    ? $this->redis->setex($key, $ttl, $compressed)
                    : $this->redis->set($key, $compressed);
            } catch (\RedisException $e) {
                $this->logger->warning('Redis set failed: ' . $e->getMessage());
            }
        }

        // Store in file cache if Redis failed or not available
        if (!$success) {
            $success = $this->writeFile($this->getFilePath($key), $compressed);
        }

        // Store in memory cache
        if ($success && $this->memoryCacheConfig['enabled']) {
            $this->memoryCache[$key] = $value;
            $this->timestamps[$key] = time();

            // Implement LRU eviction if needed
            if (count($this->memoryCache) > $this->memoryCacheConfig['max_items']) {
                $this->evictOldestItem();
            }
        }

        // Update tag index
        foreach ($tags as $tag) {
            $this->tagIndex[$tag][] = $key;
        }

        if ($success) {
            $this->stats['writes']++;
            $this->events->dispatch(new Event('cache.write', [
                'key' => $key,
                'size' => is_string($value) ? strlen($value) : 0
            ]));
        }

        return $success;
    }

    /**
     * Delete item from all cache tiers
     */
    public function delete(string $key): bool {
        $success = false;

        // Remove from memory cache
        unset($this->memoryCache[$key], $this->timestamps[$key]);

        // Remove from Redis if available
        if ($this->redis) {
            try {
                $success = $this->redis->del($key) > 0;
            } catch (\RedisException $e) {
                $this->logger->warning('Redis delete failed: ' . $e->getMessage());
            }
        }

        // Remove from file cache
        $path = $this->getFilePath($key);
        if (file_exists($path)) {
            $success = unlink($path) || $success;
        }

        // Remove from tag index
        foreach ($this->tagIndex as $tag => $keys) {
            $this->tagIndex[$tag] = array_diff($keys, [$key]);
            if (empty($this->tagIndex[$tag])) {
                unset($this->tagIndex[$tag]);
            }
        }

        if ($success) {
            $this->stats['deletes']++;
            $this->events->dispatch(new Event('cache.delete', ['key' => $key]));
        }

        return $success;
    }

    /**
     * Clear cache by tag
     */
    public function clearByTag(string $tag): bool {
        if (!isset($this->tagIndex[$tag])) {
            return false;
        }

        $success = true;
        foreach ($this->tagIndex[$tag] as $key) {
            $success = $this->delete($key) && $success;
        }

        return $success;
    }

    /**
     * Get cache statistics
     */
    public function getStats(): array {
        return array_merge($this->stats, [
            'memory_items' => count($this->memoryCache),
            'memory_size' => $this->getMemoryCacheSize(),
            'hit_rate' => $this->calculateHitRate()
        ]);
    }

    /**
     * Clear expired items from memory cache
     */
    public function cleanup(): void {
        $now = time();
        foreach ($this->timestamps as $key => $timestamp) {
            if ($now - $timestamp > $this->memoryCacheConfig['ttl']) {
                unset($this->memoryCache[$key], $this->timestamps[$key]);
            }
        }

        $this->events->dispatch(new Event('cache.cleanup', [
            'items_remaining' => count($this->memoryCache)
        ]));
    }

    /**
     * Helper methods
     */
    private function isExpired(string $key): bool {
        return isset($this->timestamps[$key]) &&
            time() - $this->timestamps[$key] > $this->memoryCacheConfig['ttl'];
    }

    private function evictOldestItem(): void {
        if (empty($this->timestamps)) {
            return;
        }
        $oldest = array_keys($this->timestamps, min($this->timestamps))[0];
        unset($this->memoryCache[$oldest], $this->timestamps[$oldest]);
    }

    private function getFilePath(string $key): string {
        return $this->config['file_cache_dir'] . '/' . hash('sha256', $key) . '.cache';
    }

    private function readFile(string $path): mixed {
        $data = file_get_contents($path);
        return $data === false ? null : unserialize($data);
    }

    private function writeFile(string $path, mixed $data): bool {
        return file_put_contents($path, serialize($data), LOCK_EX) !== false;
    }

    private function maybeCompress(mixed $data): mixed {
        if (!$this->compressionEnabled || !is_string($data)) {
            return $data;
        }
        return gzencode($data, $this->compressionLevel);
    }

    private function maybeDecompress(mixed $data): mixed {
        if (!$this->compressionEnabled || !is_string($data)) {
            return $data;
        }
        return @gzdecode($data) ?: $data;
    }

    private function getMemoryCacheSize(): int {
        return array_sum(array_map('strlen', array_map('serialize', $this->memoryCache)));
    }

    private function calculateHitRate(): float {
        $total = $this->stats['hits'] + $this->stats['misses'];
        return $total > 0 ? round(($this->stats['hits'] / $total) * 100, 2) : 0.0;
    }
}
