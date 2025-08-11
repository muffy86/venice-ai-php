# Venice AI PHP SDK - Advanced Edition

A comprehensive, enterprise-grade PHP SDK for interacting with the Venice AI API. This advanced SDK provides powerful features for AI applications including text generation, image creation, audio processing, embeddings, and much more.

## 🚀 Features

### Core AI Capabilities

- **OpenAI API Compatibility**: Drop-in replacement for OpenAI API calls
- **Chat Completions**: Advanced conversational AI with function calling
- **Image Generation**: Create, edit, and upscale images using AI
- **Audio Processing**: Transcription, translation, and speech synthesis
- **Text Embeddings**: Semantic search and similarity calculations
- **Model Management**: Access and manage available AI models

### Advanced Features

- **Multi-tier Caching**: Memory, Redis, and file-based caching
- **Event System**: Event-driven architecture with hooks
- **Security Framework**: JWT tokens, encryption, and rate limiting
- **Async Processing**: Parallel requests and background jobs
- **Performance Monitoring**: Comprehensive metrics and analytics
- **Streaming Support**: Real-time response streaming
- **Error Recovery**: Automatic retry with exponential backoff

### Enterprise Features

- **Plugin System**: Extensible architecture
- **Audit Logging**: Comprehensive request/response logging
- **Resource Management**: Connection pooling and cleanup
- **Configuration Management**: Flexible configuration options
- **Testing Suite**: Comprehensive unit and integration tests

## 📦 Installation

Install the SDK using Composer:

```bash
composer require venice/venice-ai-php
```

## 🚀 Quick Start

```php
<?php
require_once 'vendor/autoload.php';

use Venice\VeniceAI;

// Initialize with advanced features
$venice = new VeniceAI('your-api-key-here', [
    'cache' => [
        'driver' => 'redis',
        'redis_dsn' => 'redis://localhost:6379'
    ],
    'async' => [
        'max_workers' => 8,
        'enable_parallel' => true
    ]
]);

// Generate a chat completion
$response = $venice->chat()->createCompletion([
    ['role' => 'user', 'content' => 'Hello, how are you?']
], 'gpt-3.5-turbo');

echo $response['choices'][0]['message']['content'];
```

## 🎯 Advanced Usage Examples

### Audio Processing

```php
// Generate speech from text
$speech = $venice->audio()->generateSpeech([
    'input' => 'Welcome to Venice AI!',
    'voice' => 'nova',
    'model' => 'tts-1-hd',
    'quality' => 'high'
]);

// Transcribe audio to text
$transcript = $venice->audio()->transcribe([
    'file' => 'recording.mp3',
    'language' => 'en',
    'word_timestamps' => true
]);

// Translate audio to English
$translation = $venice->audio()->translate([
    'file' => 'spanish_audio.mp3'
]);
```

### Text Embeddings & Semantic Search

```php
// Generate embeddings
$embeddings = $venice->embeddings()->createEmbeddings([
    'input' => [
        'Machine learning is fascinating',
        'AI will change the world',
        'I love programming'
    ],
    'model' => 'text-embedding-3-large'
]);

// Calculate similarity
$similarity = $venice->embeddings()->calculateSimilarity(
    $embeddings['data'][0]['embedding'],
    $embeddings['data'][1]['embedding'],
    'cosine'
);

// Semantic search
$results = $venice->embeddings()->searchSimilar(
    $queryEmbedding,
    $documentEmbeddings,
    ['top_k' => 5, 'threshold' => 0.8]
);
```

### Advanced Caching

```php
// Cache with automatic TTL
$venice->cache()->set('user_data', $userData, 'user', 300);

// Cache with callback (remember pattern)
$expensiveData = $venice->cache()->remember('complex_calculation', function() {
    return performComplexCalculation();
}, 'models', 3600);

// Batch cache warming
$venice->cache()->warm([
    'model_gpt4' => $gpt4Info,
    'model_gpt35' => $gpt35Info
], 'models');
```

### Event-Driven Architecture

```php
// Subscribe to events
$venice->events()->addListener('venice.api.request', function($event) {
    echo "API request made to: " . $event->getData()['endpoint'] . "\n";
});

// Custom event handling
$venice->events()->addListener('venice.chat.message', function($event) {
    // Log chat interactions
    logChatMessage($event->getData());
});
```

### Security Features

```php
// Generate JWT tokens
$token = $venice->security()->generateJWT([
    'user_id' => 123,
    'permissions' => ['chat', 'image', 'audio']
], ['expiry' => 3600]);

// Encrypt sensitive data
$encrypted = $venice->security()->encrypt($sensitiveData);
$decrypted = $venice->security()->decrypt($encrypted);

// Request signing
$signature = $venice->security()->signRequest($requestData);
$isValid = $venice->security()->verifyRequestSignature($requestData, $signature);
```

### Asynchronous Processing

```php
// Process multiple requests in parallel
$tasks = [
    function() use ($venice) {
        return $venice->chat()->createCompletion([...], 'gpt-3.5-turbo');
    },
    function() use ($venice) {
        return $venice->image()->generate(['prompt' => 'A sunset']);
    }
];

$results = $venice->async()->processParallel($tasks, [
    'max_concurrency' => 5,
    'timeout' => 30
]);

// Streaming processing
$stream = $venice->async()->createStream($processor, [
    'buffer_size' => 1024
]);

foreach ($stream->process($inputStream) as $chunk) {
    processChunk($chunk);
}
```

## ⚙️ Configuration

### Complete Configuration Example

```php
$venice = new VeniceAI('your-api-key', [
    'debug' => false,
    'timeout' => 30,
    'max_retries' => 3,

    // Caching configuration
    'cache' => [
        'driver' => 'redis',
        'redis_dsn' => 'redis://localhost:6379',
        'file_cache_dir' => '/tmp/venice_cache',
        'default_ttl' => 3600,
        'compression' => true
    ],

    // Security configuration
    'security' => [
        'encryption_method' => 'AES-256-CBC',
        'rate_limit_window' => 60,
        'rate_limit_max' => 100,
        'jwt_algorithm' => 'HS256'
    ],

    // Async processing configuration
    'async' => [
        'max_workers' => 4,
        'timeout' => 30,
        'memory_limit' => '256M',
        'enable_parallel' => true
    ]
]);
```

## 📊 Performance Monitoring

```php
// Get comprehensive metrics
$metrics = $venice->getMetrics();
echo "Total requests: " . $metrics['requests'] . "\n";
echo "Cache hit rate: " . $metrics['cache_stats']['hit_rate'] . "%\n";
echo "Average response time: " . $metrics['cache_stats']['average_time'] . "s\n";

// Reset metrics
$venice->resetMetrics();
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
composer test

# Run with coverage
composer test:coverage

# Run specific test suites
composer test tests/Advanced/
composer test tests/Integration/
composer test tests/Performance/

# Code quality checks
composer phpcs
composer phpstan
composer psalm
```

## 🔧 Development Tools

```bash
# Code formatting
composer php-cs-fixer

# Static analysis
composer phpstan
composer psalm

# All quality checks
composer check

# Fix code style issues
composer fix
```

## 📚 API Reference

### Core Services

- **Chat Service**: `$venice->chat()`
- **Image Service**: `$venice->image()`
- **Audio Service**: `$venice->audio()`
- **Embeddings Service**: `$venice->embeddings()`
- **Model Service**: `$venice->models()`

### System Managers

- **Cache Manager**: `$venice->cache()`
- **Event Manager**: `$venice->events()`
- **Security Manager**: `$venice->security()`
- **Async Processor**: `$venice->async()`

## 🛠️ Requirements

- PHP 8.1 or higher
- Required extensions: cURL, JSON, OpenSSL, mbstring, fileinfo
- Optional: Redis (for distributed caching)
- Composer for dependency management

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://venice.ai/docs)
- 🐛 [Issue Tracker](https://github.com/muffy86/venice-ai-php/issues)
- 💬 [Community Forum](https://venice.ai/community)
- 📧 [Email Support](mailto:support@venice.ai)

## 📈 Changelog

For version history and updates, please check the git commit history and releases section.

## 🌟 Examples

Check out the `examples/` directory for comprehensive usage examples:

- `advanced_features_showcase.php` - Complete feature demonstration
- `pdr_damage_assessment.php` - Industry-specific use case
- `enhanced_usage.php` - Common usage patterns

---

**Venice AI PHP SDK** - Empowering developers with advanced AI capabilities.
