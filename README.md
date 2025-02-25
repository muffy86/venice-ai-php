# Venice AI PHP SDK

This PHP SDK provides a simple interface for interacting with the Venice AI API, offering access to state-of-the-art AI models for text generation, image generation, and more.

## Features

- Modern PHP structure with namespaces
- OpenAI API compatibility
- Support for text generation via chat completions
- Support for image generation and upscaling
- Access to available models and model traits

## Requirements

- PHP 7.4 or higher
- cURL extension
- JSON extension

## Installation

### Using Composer (recommended)

```bash
composer require venice/venice-ai-php
```

### Manual Installation

Clone this repository and include the files:

```php
require_once 'path/to/src/VeniceAI.php';
require_once 'path/to/src/Http/HttpClient.php';
require_once 'path/to/src/Models/ModelService.php';
require_once 'path/to/src/Chat/ChatService.php';
require_once 'path/to/src/Image/ImageService.php';
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

## Usage

Initialize the client and access the services:

```php
use Venice\VeniceAI;

// Initialize with config file
$venice = new VeniceAI();

// Or with direct API key
$venice = new VeniceAI('your-api-key-here');

// Enable debug mode
$venice = new VeniceAI(null, true);
```

### Text Generation

```php
$response = $venice->chat()->createCompletion([
    ['role' => 'system', 'content' => 'You are a helpful assistant.'],
    ['role' => 'user', 'content' => 'Tell me a joke about programming.']
]);

echo $response['choices'][0]['message']['content'];
```

### Image Generation

```php
$response = $venice->image()->generate([
    'prompt' => 'A beautiful sunset over mountains',
    'width' => 1024,
    'height' => 1024
]);

// Save the image
$imageData = base64_decode($response['data'][0]['b64_json']);
file_put_contents('generated_image.png', $imageData);
```

### List Models

```php
// All models
$models = $venice->models()->list();

// Just text models
$textModels = $venice->models()->listTextModels();

// Just image models
$imageModels = $venice->models()->listImageModels();

// Model traits
$traits = $venice->models()->listTraits();
```

### Image Styles

```php
// Get available image styles
$styles = $venice->image()->listStyles();
```

## Examples

See the `examples/` directory for more usage examples.

## OpenAI Compatibility

The Venice AI API implements the OpenAI API specification for text generation, allowing compatibility with existing OpenAI clients and tools.

## License

This SDK is distributed under the MIT License.