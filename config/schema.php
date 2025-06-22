<?php

/**
 * Venice AI PHP SDK - Configuration Schema
 *
 * This file defines the validation schema for all configuration options.
 * Used by ConfigManager to validate configuration at runtime.
 */

return [
    // Core Application Settings
    'app.name' => [
        'type' => 'string',
        'required' => true,
        'min_length' => 1,
        'max_length' => 100
    ],
    'app.version' => [
        'type' => 'string',
        'required' => true,
        'pattern' => '/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+)?$/' // Semantic versioning
    ],
    'app.environment' => [
        'type' => 'string',
        'required' => true,
        'enum' => ['local', 'development', 'testing', 'staging', 'production']
    ],
    'app.debug' => [
        'type' => 'boolean',
        'default' => false
    ],
    'app.timezone' => [
        'type' => 'string',
        'default' => 'UTC',
        'validator' => function($value) {
            return in_array($value, \DateTimeZone::listIdentifiers());
        }
    ],
    'app.locale' => [
        'type' => 'string',
        'pattern' => '/^[a-z]{2}(?:-[A-Z]{2})?$/' // e.g., 'en' or 'en-US'
    ],

    // API Configuration
    'api.key' => [
        'type' => 'string',
        'required' => true,
        'sensitive' => true,
        'min_length' => 32
    ],
    'api.endpoint' => [
        'type' => 'string',
        'required' => true,
        'pattern' => '/^https?:\/\/.+/'
    ],
    'api.timeout' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 300,
        'default' => 30
    ],
    'api.retry.max_attempts' => [
        'type' => 'integer',
        'min' => 0,
        'max' => 10,
        'default' => 3
    ],
    'api.retry.initial_delay' => [
        'type' => 'integer',
        'min' => 100,
        'max' => 10000,
        'default' => 1000
    ],

    // Cache Configuration
    'cache.default' => [
        'type' => 'string',
        'required' => true,
        'enum' => ['memory', 'redis', 'file']
    ],
    'cache.ttl' => [
        'type' => 'integer',
        'min' => 0,
        'default' => 3600
    ],
    'cache.drivers.redis.host' => [
        'type' => 'string',
        'default' => 'localhost'
    ],
    'cache.drivers.redis.port' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 65535,
        'default' => 6379
    ],

    // Security Settings
    'security.encryption.method' => [
        'type' => 'string',
        'required' => true,
        'enum' => ['AES-256-CBC', 'AES-256-GCM']
    ],
    'security.encryption.key' => [
        'type' => 'string',
        'required' => true,
        'sensitive' => true,
        'min_length' => 32,
        'validator' => function($value) {
            return strlen(base64_decode($value)) >= 32;
        }
    ],

    // Logging Configuration
    'logging.default' => [
        'type' => 'string',
        'required' => true
    ],
    'logging.level' => [
        'type' => 'string',
        'enum' => ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'],
        'default' => 'info'
    ],

    // Event System Configuration
    'events.async' => [
        'type' => 'boolean',
        'default' => true
    ],
    'events.queue.driver' => [
        'type' => 'string',
        'enum' => ['sync', 'redis', 'database'],
        'default' => 'sync'
    ],

    // Monitoring and Metrics
    'monitoring.enabled' => [
        'type' => 'boolean',
        'default' => true
    ],
    'monitoring.driver' => [
        'type' => 'string',
        'enum' => ['prometheus', 'statsd', 'datadog'],
        'default' => 'prometheus'
    ],

    // Plugin System
    'plugins.enabled' => [
        'type' => 'boolean',
        'default' => true
    ],
    'plugins.auto_discover' => [
        'type' => 'boolean',
        'default' => true
    ],
    'plugins.paths' => [
        'type' => 'array',
        'validator' => function($value) {
            return array_reduce($value, function($valid, $path) {
                return $valid && (is_null($path) || is_dir($path));
            }, true);
        }
    ],

    // Service-Specific Settings
    'services.chat.model' => [
        'type' => 'string',
        'enum' => ['gpt-4', 'gpt-3.5-turbo'],
        'default' => 'gpt-4'
    ],
    'services.chat.temperature' => [
        'type' => 'float',
        'min' => 0.0,
        'max' => 2.0,
        'default' => 0.7
    ],
    'services.chat.max_tokens' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 4096,
        'default' => 2000
    ],
    'services.image.model' => [
        'type' => 'string',
        'enum' => ['dall-e-2', 'dall-e-3'],
        'default' => 'dall-e-3'
    ],
    'services.image.size' => [
        'type' => 'string',
        'enum' => ['256x256', '512x512', '1024x1024'],
        'default' => '1024x1024'
    ],
    'services.audio.model' => [
        'type' => 'string',
        'enum' => ['whisper-1'],
        'default' => 'whisper-1'
    ],
    'services.embeddings.model' => [
        'type' => 'string',
        'enum' => ['text-embedding-ada-002'],
        'default' => 'text-embedding-ada-002'
    ],

    // Performance Tuning
    'performance.concurrency.max_workers' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 32,
        'default' => 4
    ],
    'performance.timeouts.connect' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 30,
        'default' => 5
    ],
    'performance.compression.enabled' => [
        'type' => 'boolean',
        'default' => true
    ],
    'performance.compression.level' => [
        'type' => 'integer',
        'min' => 1,
        'max' => 9,
        'default' => 6
    ],

    // Development Tools
    'development.profiler.enabled' => [
        'type' => 'boolean',
        'default' => false,
        'environment' => ['local', 'development']
    ],
    'development.debug.queries' => [
        'type' => 'boolean',
        'default' => false,
        'environment' => ['local', 'development']
    ],
    'development.mocks.enabled' => [
        'type' => 'boolean',
        'default' => false,
        'environment' => ['local', 'development', 'testing']
    ]
];
