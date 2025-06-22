<?php

/**
 * Venice AI PHP SDK - Example Configuration
 *
 * This file demonstrates all available configuration options and features.
 * Copy this file to config.php and modify according to your needs.
 */

return [
    // Core Application Settings
    'app' => [
        'name' => 'Venice AI Application',
        'version' => '2.0.0',
        'environment' => getenv('APP_ENV') ?: 'production',
        'debug' => filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN),
        'timezone' => 'UTC',
        'locale' => 'en',
        'url' => getenv('APP_URL') ?: 'https://your-app.com',
    ],

    // API Configuration
    'api' => [
        'key' => getenv('VENICE_API_KEY'),
        'endpoint' => getenv('VENICE_API_ENDPOINT') ?: 'https://api.venice.ai/v2',
        'timeout' => intval(getenv('API_TIMEOUT') ?: 30),
        'retry' => [
            'max_attempts' => 3,
            'initial_delay' => 1000, // milliseconds
            'max_delay' => 5000,
            'multiplier' => 2.0
        ],
        'rate_limit' => [
            'enabled' => true,
            'max_requests' => 100,
            'window' => 60 // seconds
        ]
    ],

    // Cache Configuration
    'cache' => [
        'default' => getenv('CACHE_DRIVER') ?: 'redis',
        'prefix' => 'venice:',
        'ttl' => 3600,
        'drivers' => [
            'memory' => [
                'limit' => 10000 // items
            ],
            'redis' => [
                'host' => getenv('REDIS_HOST') ?: 'localhost',
                'port' => intval(getenv('REDIS_PORT') ?: 6379),
                'database' => 0,
                'prefix' => 'venice:cache:',
                'options' => [
                    'compression' => true,
                    'compression_level' => 6
                ]
            ],
            'file' => [
                'path' => getenv('CACHE_PATH') ?: sys_get_temp_dir() . '/venice_cache',
                'extension' => '.cache',
                'umask' => 0077
            ]
        ]
    ],

    // Security Settings
    'security' => [
        'encryption' => [
            'method' => 'AES-256-CBC',
            'key' => getenv('ENCRYPTION_KEY'),
            'cipher' => OPENSSL_RAW_DATA,
        ],
        'rate_limiting' => [
            'enabled' => true,
            'driver' => 'redis',
            'key_prefix' => 'venice:ratelimit:',
            'decay_minutes' => 1
        ],
        'headers' => [
            'signature' => true,
            'timestamp' => true,
            'nonce' => true
        ]
    ],

    // Logging Configuration
    'logging' => [
        'default' => 'stack',
        'level' => getenv('LOG_LEVEL') ?: 'info',
        'channels' => [
            'stack' => [
                'driver' => 'stack',
                'channels' => ['daily', 'slack'],
                'ignore_exceptions' => false,
            ],
            'daily' => [
                'driver' => 'daily',
                'path' => getenv('LOG_PATH') ?: __DIR__ . '/../logs/venice.log',
                'level' => 'debug',
                'days' => 14,
                'permission' => 0664
            ],
            'slack' => [
                'driver' => 'slack',
                'url' => getenv('LOG_SLACK_WEBHOOK_URL'),
                'username' => 'Venice AI Bot',
                'emoji' => ':robot_face:',
                'level' => 'error',
            ]
        ]
    ],

    // Event System Configuration
    'events' => [
        'async' => true,
        'queue' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => 'events',
            'retry_after' => 90
        ],
        'listeners' => [
            'api.*' => [
                'Venice\Listeners\ApiMetricsListener',
                'Venice\Listeners\ApiLoggingListener'
            ],
            'cache.*' => [
                'Venice\Listeners\CacheMetricsListener'
            ]
        ]
    ],

    // Monitoring and Metrics
    'monitoring' => [
        'enabled' => true,
        'driver' => 'prometheus',
        'endpoint' => '/metrics',
        'collectors' => [
            'api_requests',
            'cache_hits',
            'response_times',
            'error_rates'
        ],
        'exporters' => [
            'prometheus' => [
                'host' => 'localhost',
                'port' => 9091
            ]
        ]
    ],

    // Plugin System
    'plugins' => [
        'enabled' => true,
        'auto_discover' => true,
        'paths' => [
            __DIR__ . '/../plugins',
            getenv('VENICE_PLUGINS_PATH')
        ],
        'cache' => true,
        'blacklist' => [],
        'config' => [
            'custom_analytics' => [
                'enabled' => true,
                'tracking_id' => getenv('ANALYTICS_ID')
            ],
            'rate_limiter' => [
                'enabled' => true,
                'max_requests' => 1000
            ]
        ]
    ],

    // Service-Specific Settings
    'services' => [
        'chat' => [
            'model' => 'gpt-4',
            'temperature' => 0.7,
            'max_tokens' => 2000,
            'cache_responses' => true,
            'stream' => true
        ],
        'image' => [
            'model' => 'dall-e-3',
            'size' => '1024x1024',
            'quality' => 'standard',
            'storage' => [
                'driver' => 's3',
                'bucket' => getenv('AWS_BUCKET'),
                'path' => 'images'
            ]
        ],
        'audio' => [
            'model' => 'whisper-1',
            'language' => 'en',
            'format' => 'mp3',
            'cache_transcriptions' => true
        ],
        'embeddings' => [
            'model' => 'text-embedding-ada-002',
            'dimensions' => 1536,
            'cache_embeddings' => true
        ]
    ],

    // Performance Tuning
    'performance' => [
        'concurrency' => [
            'max_workers' => 4,
            'queue_size' => 100
        ],
        'timeouts' => [
            'connect' => 5,
            'request' => 30,
            'stream' => 600
        ],
        'compression' => [
            'enabled' => true,
            'level' => 6,
            'algorithms' => ['gzip', 'deflate']
        ],
        'cache_warmup' => [
            'enabled' => true,
            'interval' => 3600
        ]
    ],

    // Development Tools
    'development' => [
        'profiler' => [
            'enabled' => filter_var(getenv('ENABLE_PROFILER') ?: false, FILTER_VALIDATE_BOOLEAN),
            'collectors' => ['database', 'cache', 'api', 'events']
        ],
        'debug' => [
            'queries' => true,
            'cache' => true,
            'api_calls' => true,
            'events' => true
        ],
        'mocks' => [
            'enabled' => false,
            'api_responses' => __DIR__ . '/mocks/api',
            'probability' => 0
        ]
    ]
];
