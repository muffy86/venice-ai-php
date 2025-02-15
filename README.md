# Venice AI PHP Examples

Example PHP implementations for the Venice AI API, providing OpenAI-compatible endpoints for text & image generation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/php-%3E%3D7.4-blue.svg)](https://php.net/)

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

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/venice-ai/venice.ai-php-examples.git
   cd venice.ai-php-examples
   ```

2. Copy the example config file and set your API key:
   ```bash
   cp config.example.php config.php
   ```
   Then edit `config.php` and replace `your-api-key-here` with your actual Venice AI API key.

## Examples

The `examples/` directory contains comprehensive examples:

1. **Text Generation**
   - `examples/text/basic_chat.php` - Simple chat completion
   - `examples/text/advanced_chat.php` - Advanced chat features
   - `examples/text/streaming.php` - Streaming responses

2. **Image Generation**
   - `examples/images/basic_generation.php` - Generate images from text
   - `examples/images/advanced_generation.php` - Style-based generation
   - `examples/images/upscaling.php` - Upscale existing images
   - `examples/images/analyze_image.php` - Image analysis

3. **Model Management**
   - `examples/models/list_models.php` - List available models
   - `examples/models/filter_models.php` - Filter models by type

4. **Workflows**
   - `examples/workflows/story_illustration.php` - Generate images from story text
   - `examples/workflows/image_analysis.php` - Analyze and describe images

## Error Handling

The client includes comprehensive error handling:

- Configuration validation
- Input validation
- API error handling
- Rate limit detection

## Best Practices

1. **API Key Security**
   - Never commit your `config.php` file
   - Store your API key securely
   - Use environment variables in production

2. **Error Handling**
   - Always wrap API calls in try-catch blocks
   - Handle rate limits appropriately
   - Validate input before making requests

## License

MIT License - feel free to use these examples in your projects!