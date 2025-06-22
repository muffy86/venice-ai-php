# Venice AI PHP SDK - Quick Start Guide

🚀 **Your Venice AI PHP SDK has been optimized and configured!**

## ✅ What's Been Done

### 1. API Key Configuration
- ✅ API key `vBgTDh77ba5HlsADmHN8WsQIBke27dN04_RoNxgk8S` has been configured
- ✅ Primary config file: `config.php`
- ✅ Advanced config file: `config/config.php`
- ✅ Production-ready settings applied

### 2. System Optimization
- ✅ Enhanced autoloader with performance monitoring
- ✅ Comprehensive error handling
- ✅ Security hardening
- ✅ Cache and logging systems configured
- ✅ Memory and OPcache optimization

### 3. Code Enhancements
- ✅ Fixed all syntax errors and missing dependencies
- ✅ Added OpenAI-compatible API methods
- ✅ Enhanced security manager with encryption
- ✅ Improved event system with aliases
- ✅ Async processing with promise support

### 4. Directory Structure
```
venice-ai-php/
├── config.php              # Main configuration
├── config/config.php       # Advanced configuration
├── bootstrap.php           # Enhanced autoloader
├── optimize.php            # Optimization script
├── test-runner.php         # Comprehensive test suite
├── enhanced-demo.php       # Feature demonstration
├── cache/                  # Cache directory
├── logs/                   # Log directory
├── src/                    # Source code
└── vendor/                 # Dependencies
```

## 🚀 Quick Start

### 1. Verify Installation
```bash
php optimize.php
```

### 2. Run Tests
```bash
php test-runner.php --verbose
```

### 3. Try the Demo
```bash
php enhanced-demo.php
```

## 💻 Basic Usage

```php
<?php
require_once 'bootstrap.php';

use Venice\VeniceAI;

// Initialize with configured API key
$venice = new VeniceAI();

// Chat completion
$response = $venice->chat()->create([
    'model' => 'gpt-3.5-turbo',
    'messages' => [
        ['role' => 'user', 'content' => 'Hello!']
    ]
]);

// Image generation
$image = $venice->image()->create([
    'prompt' => 'A beautiful sunset',
    'size' => '512x512'
]);

// Embeddings
$embeddings = $venice->embeddings()->create([
    'model' => 'text-embedding-ada-002',
    'input' => 'Your text here'
]);
```

## 🔧 Advanced Features

### Streaming Chat
```php
$venice->chat()->stream([
    'model' => 'gpt-3.5-turbo',
    'messages' => [['role' => 'user', 'content' => 'Count to 5']]
], function($chunk) {
    echo $chunk['choices'][0]['delta']['content'] ?? '';
});
```

### Async Processing
```php
$promises = [];
for ($i = 1; $i <= 3; $i++) {
    $promises[] = $venice->async()->processAsync(function() use ($venice, $i) {
        return $venice->chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [['role' => 'user', 'content' => "Say $i"]]
        ]);
    });
}

$results = $venice->async()->waitAll($promises);
```

### Event Handling
```php
$venice->events()->addEventListener('venice.api.request', function($event) {
    echo "API request to: " . $event->get('endpoint') . "\n";
});
```

### Caching
```php
$cache = $venice->cache();
$cache->set('key', 'value', 3600);
$value = $cache->get('key');
```

## 🛠️ Configuration Options

Your SDK is configured with these settings:

- **API Key**: Permanently configured
- **Endpoint**: https://api.venice.ai/v2
- **Timeout**: 30 seconds
- **Cache**: File-based caching enabled
- **Logging**: Enabled with rotation
- **Security**: SSL verification enabled
- **Performance**: OPcache optimized

## 📝 Available Services

- **Chat**: `$venice->chat()` - Text generation and chat
- **Image**: `$venice->image()` - Image generation and editing
- **Audio**: `$venice->audio()` - Audio processing
- **Embeddings**: `$venice->embeddings()` - Text embeddings
- **Models**: `$venice->models()` - Model management

## 🔒 Security Features

- ✅ API key encryption
- ✅ Request signing
- ✅ Rate limiting
- ✅ SSL verification
- ✅ Data sanitization
- ✅ Secure error handling

## 📊 Monitoring & Debugging

- **Debug Mode**: Set `VENICE_DEBUG=true` environment variable
- **Logs**: Check `logs/venice-ai.log`
- **Performance**: Built-in metrics collection
- **Errors**: Comprehensive error reporting

## 🎯 Next Steps

1. **Explore Examples**: Check the `examples/` directory
2. **Read Documentation**: See `docs/` for detailed guides
3. **Run Tests**: Execute `php test-runner.php` regularly
4. **Monitor Performance**: Check logs and metrics
5. **Scale Up**: Consider Redis for caching in production

## 🆘 Support

If you encounter any issues:

1. Run `php optimize.php` to re-optimize
2. Check `logs/venice-ai.log` for errors
3. Verify your API key is valid
4. Ensure all PHP extensions are installed

---

**🎉 Your Venice AI PHP SDK is ready for production use!**
