<?php

// Require the autoloader (if using Composer)
// require_once __DIR__ . '/../vendor/autoload.php';

// Alternatively, manually include the files
require_once __DIR__ . '/../src/VeniceAI.php';
require_once __DIR__ . '/../src/Http/HttpClient.php';
require_once __DIR__ . '/../src/Models/ModelService.php';
require_once __DIR__ . '/../src/Chat/ChatService.php';
require_once __DIR__ . '/../src/Image/ImageService.php';

use Venice\VeniceAI;

// Initialize the client
// Method 1: Using config.php
$venice = new VeniceAI();

// Method 2: Direct API key
// $venice = new VeniceAI('your-api-key-here');

// Method 3: With debug mode enabled
// $venice = new VeniceAI(null, true);

// Example: List available models
try {
    // Using the models service
    $models = $venice->models()->list();
    echo "Available models:\n";
    foreach ($models['data'] as $model) {
        echo "- {$model['id']}: {$model['name']}\n";
    }
    
    // Get model traits
    $traits = $venice->models()->listTraits();
    echo "\nModel traits:\n";
    foreach ($traits['data'] as $trait) {
        echo "- {$trait['name']}: {$trait['description']}\n";
    }

    // Using the chat service for text generation
    $chatResponse = $venice->chat()->createCompletion([
        ['role' => 'system', 'content' => 'You are a helpful assistant.'],
        ['role' => 'user', 'content' => 'Tell me a joke about programming.']
    ]);
    
    echo "\nChat Response:\n";
    if (isset($chatResponse['choices'][0]['message']['content'])) {
        echo $chatResponse['choices'][0]['message']['content'] . "\n";
    }
    
    // Using the image service for image generation
    /*
    $imageResponse = $venice->image()->generate([
        'prompt' => 'A beautiful sunset over mountains',
        'width' => 1024,
        'height' => 1024
    ]);
    
    // Save the generated image
    if (isset($imageResponse['data'][0]['b64_json'])) {
        $imageData = base64_decode($imageResponse['data'][0]['b64_json']);
        file_put_contents(__DIR__ . '/generated_image.png', $imageData);
        echo "\nImage saved as 'generated_image.png'\n";
    }
    */
    
    // List available image styles
    $styles = $venice->image()->listStyles();
    echo "\nAvailable image styles:\n";
    if (isset($styles['styles'])) {
        foreach (array_slice($styles['styles'], 0, 5) as $style) {
            echo "- {$style['name']}\n";
        }
        echo "... (and more)\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}