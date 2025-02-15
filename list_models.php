<?php
/**
 * Venice AI API Example: List Available Models
 * 
 * This example demonstrates how to:
 * 1. List all available models
 * 2. Filter models by type (text/image)
 * 3. Display model capabilities
 */

require_once __DIR__ . '/VeniceAI.php';

// Initialize the Venice AI client with debug mode enabled
$venice = new VeniceAI(true);

try {
    // Example 1: List all models
    echo "Example 1: All Available Models\n";
    echo str_repeat("-", 50) . "\n";
    
    $models = $venice->listModels();
    foreach ($models['data'] as $model) {
        echo "- {$model['id']}: {$model['description']}\n";
    }

    // Example 2: List text models only
    echo "\nExample 2: Text Models Only\n";
    echo str_repeat("-", 50) . "\n";
    
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        echo "- {$model['id']}: {$model['description']}\n";
    }

    // Example 3: List image models only
    echo "\nExample 3: Image Models Only\n";
    echo str_repeat("-", 50) . "\n";
    
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        echo "- {$model['id']}: {$model['description']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output model selection tips
echo "\nModel Selection Tips:\n";
echo "- Choose text models based on your language needs\n";
echo "- Select image models based on style and quality requirements\n";
echo "- Consider model capabilities and limitations\n";
echo "- Check model availability in your region\n";