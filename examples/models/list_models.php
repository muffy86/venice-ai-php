<?php
/**
 * Venice AI API Example: Model Listing
 * 
 * This example demonstrates how to:
 * 1. List all available models
 * 2. Filter models by type (text/image)
 * 3. Access model information
 * 
 * Source: https://github.com/veniceai/api-docs/
 * Postman: https://www.postman.com/veniceai/venice-ai-workspace/
 */

require_once __DIR__ . '/../../VeniceAI.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    // Example 1: List all models
    echo "\n=== Example 1: All Available Models ===\n\n";
    
    $models = $venice->listModels();
    foreach ($models['data'] as $model) {
        echo "• {$model['id']}\n";
    }
    echo "\n";

    // Example 2: List text models only
    echo "=== Example 2: Text Models Only ===\n\n";
    
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        echo "• {$model['id']}\n";
    }
    echo "\n";

    // Example 3: List image models only
    echo "=== Example 3: Image Models Only ===\n\n";
    
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        echo "• {$model['id']}\n";
    }
    echo "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output model selection tips
echo "=== Model Selection Tips ===\n\n";
echo "• Choose text models based on your language needs\n";
echo "• Select image models based on style and quality requirements\n";
echo "• Consider model capabilities and limitations\n";
echo "• Check model availability in your region\n";