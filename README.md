# Venice AI PHP Examples

This repository contains comprehensive PHP examples for interacting with the Venice AI API. Each example is designed to be self-contained and demonstrate every available parameter and option, eliminating the need to constantly refer to external documentation.

## Official Resources

These examples draw from and complement the following official Venice AI resources:

- [Official API Documentation](https://github.com/veniceai/api-docs/)
- [Postman Collection](https://www.postman.com/veniceai/venice-ai-workspace/)

## Philosophy

The examples in this repository follow these principles:

1. **Comprehensive Coverage**: Each example demonstrates every available parameter for its endpoint, not just the common ones. This means you can find working examples of any feature without needing to search through documentation.

2. **Self-Contained**: Examples include all necessary setup and configuration, making it easy to get started.

3. **Educational**: Code is thoroughly documented with explanations of each parameter and its effects.

4. **Production-Ready**: Examples follow best practices and include proper error handling.

## Getting Started

1. Clone this repository
2. Copy `config.example.php` to `config.php`
3. Add your Venice AI API key to `config.php`
4. Run any example: `php examples/[category]/[example].php`

## Examples

### Image Generation
- `examples/images/basic_generation.php`: Demonstrates all image generation parameters including model selection, dimensions, steps, style presets, etc.
- `examples/images/upscaling.php`: Shows image upscaling with various scale factors
- `examples/images/analyze_image.php`: Demonstrates image analysis capabilities

### Text Generation
- `examples/text/basic_chat.php`: Basic chat completion with all available parameters
- `examples/text/advanced_chat.php`: Advanced chat features including system prompts
- `examples/text/streaming.php`: Streaming chat completions

### Model Management
- `examples/models/list_models.php`: List and filter available models
- `examples/models/filter_models.php`: Advanced model filtering and selection

### Workflows
- `examples/workflows/image_analysis.php`: Combined image generation and analysis
- `examples/workflows/story_illustration.php`: Text-to-image story creation

## Contributing

Contributions are welcome! Please ensure any new examples follow our philosophy of being comprehensive and self-contained.

## License

This project is licensed under the MIT License - see the LICENSE file for details.