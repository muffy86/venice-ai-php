# Venice AI PHP Client | OpenAI-Compatible API Integration

Version: 1.0.0 | PHP SDK for AI Text & Image Generation

A powerful, production-ready PHP client for the Venice AI API, providing seamless integration with OpenAI-compatible endpoints. Perfect for chatbots, content generation, image creation, and AI-powered applications.

[![Latest Version](https://img.shields.io/github/v/release/venice/venice-php)](https://github.com/venice/venice-php/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D7.4-blue.svg)](https://php.net/)

## Why Choose Venice AI PHP Client?

- 🚀 **OpenAI-Compatible**: Drop-in replacement for OpenAI's API
- 💡 **Advanced AI Features**: Text generation, image creation, and analysis
- 🛡️ **Production-Ready**: Enterprise-grade error handling and security
- 📦 **Easy Integration**: Simple installation via Composer
- 📘 **Comprehensive Documentation**: Clear examples and guides
- 🔧 **Type-Safe**: Full PHP 7.4+ type hints and return types

## Features

- **Text Generation**
  - Chat completions with GPT models
  - System prompt management
  - Conversation context handling

- **Image Generation**
  - Basic image generation
  - Style-based generation
  - Image upscaling
  - Multiple size options

- **Model Management**
  - List available models
  - Filter by type (text/image)
  - Model capabilities inspection

## Installation

1. Clone this repository or copy the files to your project:
   - `VeniceAI.php` - The main client class
   - `example.php` - Comprehensive examples

2. Include the client in your project:
```php
require_once 'VeniceAI.php';
```

## Quick Start

```php
// Initialize the client
$venice = new VeniceAI('your-api-key');

// Generate text
$response = $venice->createChatCompletion([
    [
        'role' => 'user',
        'content' => 'What is AI?'
    ]
]);

// Generate an image
$image = $venice->generateImage([
    'prompt' => 'A beautiful sunset',
    'model' => 'sdxl-1.0',
    'size' => '1024x1024'
]);
```

## Examples

The `example.php` file contains comprehensive examples of all features:

1. **Model Management**
   - Listing all models
   - Filtering by type
   - Inspecting model capabilities

2. **Text Generation**
   - Basic chat completions
   - System prompt usage
   - Custom prompt configurations

3. **Image Generation**
   - Basic image generation
   - Style-based generation
   - Image upscaling

4. **Error Handling**
   - Input validation
   - API error handling
   - Rate limit management

Run the examples:
```bash
php example.php
```

## Error Handling

The client includes comprehensive error handling:

- `InvalidArgumentException` for invalid input
- `Exception` for API errors with detailed messages
- Rate limit detection and handling
- Input validation for all parameters

## Best Practices

1. **API Key Security**
   - Store your API key securely
   - Use environment variables when possible
   - Never commit API keys to version control

2. **Error Handling**
   - Always wrap API calls in try-catch blocks
   - Handle rate limits appropriately
   - Validate input before making requests

3. **Resource Management**
   - Close connections properly
   - Handle large responses carefully
   - Monitor API usage

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this client in your projects!