# Venice.ai PHP SDK - Official PHP Client for Venice AI API

The official PHP SDK for interacting with the Venice.ai API. This SDK provides a simple and powerful interface for accessing Venice's AI models for text generation, image generation, vision, and more.

[![Latest Version](https://img.shields.io/github/release/veniceai/venice-ai-php.svg)](https://github.com/veniceai/venice-ai-php/releases)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D7.4-8892BF.svg)](https://www.php.net/)
[![License](https://img.shields.io/github/license/veniceai/venice-ai-php.svg)](LICENSE)

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Why Choose Venice.ai PHP SDK?](#why-choose-veniceai-php-sdk)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start Guide](#quick-start-guide)
- [Advanced Usage Examples](#advanced-usage-examples)
- [OpenAI Compatibility Layer](#openai-compatibility-layer)
- [Backward Compatibility](#backward-compatibility)
- [Venice.ai API Documentation](#veniceai-api-documentation)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Introduction

The Venice.ai PHP SDK is a powerful and flexible client library that enables PHP developers to easily integrate Venice's advanced AI capabilities into their applications. Venice.ai provides state-of-the-art models for text generation, image creation, and multimodal AI, with an API that's compatible with the OpenAI specification.

This SDK offers a modern, object-oriented interface to the Venice.ai API, with comprehensive support for all endpoints, proper error handling, and detailed documentation. Whether you're building a chatbot, generating images, or creating advanced AI applications, the Venice.ai PHP SDK provides the tools you need.

## Features

- **Modern PHP SDK**: Built with namespaces, PSR-4 autoloading, and modern PHP practices
- **OpenAI API Compatibility**: Drop-in replacement for OpenAI clients
- **AI Text Generation**: Create powerful text completions with Venice models
- **AI Image Generation**: Generate and manipulate images with diverse style presets
- **Image Upscaling**: Enhance image resolution with advanced AI techniques
- **Vision Models**: Access cutting-edge vision models for multimodal applications
- **Comprehensive Model Information**: Access model capabilities, traits, and selection guidance
- **Extensible Architecture**: Easy to extend with new endpoints and features

## Requirements

- PHP 7.4 or higher
- cURL extension
- JSON extension

## Why Choose Venice.ai PHP SDK?

- **High-Performance AI Models**: Access Venice's state-of-the-art AI models for text, chat, and image generation
- **PHP-First Development**: Built specifically for PHP developers with intuitive interfaces
- **Enterprise-Ready**: Designed for production use with robust error handling and rate limiting support
- **Comprehensive Documentation**: Detailed examples and API documentation
- **Active Maintenance**: Regular updates to support new Venice.ai features
- **Community Support**: Join a growing community of Venice.ai developers

## Installation

### Manual Installation

Download the SDK or clone the repository, then include the necessary files:

```php
// Core client
require_once 'path/to/src/VeniceAI.php';

// Service components
require_once 'path/to/src/Http/HttpClient.php';
require_once 'path/to/src/Models/ModelService.php';
require_once 'path/to/src/Chat/ChatService.php';
require_once 'path/to/src/Image/ImageService.php';
```

Alternatively, use the backward compatibility layer for the simplest integration:

```php
require_once 'path/to/VeniceAI-legacy.php';
```

## Configuration

Copy `config.example.php` to `config.php` and add your API key:

```php
return [
    'api_key' => 'your-api-key-here',
    // Optional debug mode
    // 'debug' => true,
];
```

## Quick Start Guide

Initialize the Venice.ai client and start creating AI-powered applications:

```php
use Venice\VeniceAI;

// Initialize with config file
$venice = new VeniceAI();

// Or with direct API key
$venice = new VeniceAI('your-venice-api-key-here');

// Enable debug mode for development
$venice = new VeniceAI(null, true);
```

### AI Text Generation with Venice Models

Generate human-quality text responses using Venice's advanced language models:

```php
// Create a chat completion with Venice.ai
$response = $venice->chat()->createCompletion([
    ['role' => 'system', 'content' => 'You are a helpful AI assistant powered by Venice.'],
    ['role' => 'user', 'content' => 'Write a short poem about artificial intelligence.']
]);

// Display the generated text
echo $response['choices'][0]['message']['content'];
```

### AI Image Generation and Manipulation

Create stunning AI-generated images with Venice's image models:

```php
// Generate an image with Venice.ai
$response = $venice->image()->generate([
    'prompt' => 'A futuristic cityscape with flying cars and neon lights',
    'model' => 'default',  // Use Venice's recommended model
    'width' => 1024,
    'height' => 1024,
    'style_preset' => 'Digital Art'  // Apply artistic style
]);

// Save the generated image
$imageData = base64_decode($response['data'][0]['b64_json']);
file_put_contents('venice_generated_image.png', $imageData);

// Upscale an existing image
$upscaledResponse = $venice->image()->upscale([
    'image' => 'path/to/image.png',
    'scale' => '4'  // 4x upscaling
]);
```

### Exploring Venice.ai Models and Capabilities

Discover available AI models and their capabilities:

```php
// List all available Venice AI models
$models = $venice->models()->list();

// Get only text generation models
$textModels = $venice->models()->listTextModels();

// Get only image generation models
$imageModels = $venice->models()->listImageModels();

// Discover model traits and capabilities
$traits = $venice->models()->listTraits();

// Find available image style presets
$styles = $venice->image()->listStyles();

foreach ($styles['styles'] as $style) {
    echo "{$style['name']}: {$style['description']}\n";
}
```

## Advanced Usage Examples

For more detailed examples showcasing how to use the Venice.ai PHP SDK for various AI applications, see the `examples/` directory:

- Text generation and chat applications
- Image creation and manipulation
- AI-powered content generation
- Model selection and filtering
- Enterprise integration patterns

## OpenAI Compatibility Layer

The Venice.ai API implements the OpenAI API specification, providing seamless compatibility with existing OpenAI clients and tools. This makes migrating from OpenAI to Venice.ai simple and straightforward:

```php
// Using Venice parameters with OpenAI compatibility
$response = $venice->chat()->createCompletion([
    ['role' => 'system', 'content' => 'You are a helpful assistant.'],
    ['role' => 'user', 'content' => 'Explain quantum computing briefly.']
], 'default', [
    // Standard OpenAI parameters
    'temperature' => 0.7,
    'max_tokens' => 500,
    
    // Venice-specific parameters
    'venice_parameters' => [
        'include_venice_system_prompt' => false
    ]
]);
```

## Backward Compatibility

For projects using the previous version of the SDK, we provide a backward compatibility layer:

```php
// Include the legacy adapter
require_once 'VeniceAI-legacy.php';

// Use the original API style
$venice = new VeniceAI();
$response = $venice->createChatCompletion([...]);
```

## Venice.ai API Documentation

For comprehensive information about the Venice.ai API endpoints and capabilities, visit:
- [Venice.ai API Documentation](https://docs.venice.ai/)
- [API Reference](https://api.venice.ai/doc/api/swagger.yaml)

## Contributing

Contributions to the Venice.ai PHP SDK are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions about the Venice.ai PHP SDK, please:
- Check the [examples](./examples) directory for usage patterns
- Visit [Venice.ai documentation](https://docs.venice.ai/)
- [Open an issue](https://github.com/veniceai/venice-ai-php/issues) on GitHub

## License

The Venice.ai PHP SDK is distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.