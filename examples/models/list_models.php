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
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    // Example 1: List all models
    printSection("Example 1: All Available Models");
    
    $models = $venice->listModels();
    foreach ($models['data'] as $model) {
        printResponse("• {$model['id']}");
    }

    // Example 2: List text models only
    printSection("Example 2: Text Models Only");
    
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        printResponse("• {$model['id']}");
    }

    // Example 3: List image models only
    printSection("Example 3: Image Models Only");
    
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        printResponse("• {$model['id']}");
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output model selection tips
printSection("Model Selection Tips");
echo "• Choose text models based on your language needs\n";
echo "• Select image models based on style and quality requirements\n";
echo "• Consider model capabilities and limitations\n";
echo "• Check model availability in your region\n";