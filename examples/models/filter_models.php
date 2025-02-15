<?php
/**
 * Venice AI API Example: Model Filtering
 * 
 * This example demonstrates how to:
 * 1. Filter models by type (text or image)
 * 2. Find models with specific traits
 * 3. Compare model capabilities
 */

require_once __DIR__ . '/../../VeniceAI.php';
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    // 1. Get text models
    printSection("Text Models");
    
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        $modelInfo = sprintf(
            "ID: %s\nContext Length: %d tokens",
            $model['id'],
            $model['model_spec']['availableContextTokens'] ?? 0
        );
        
        // Show model traits if available
        if (isset($model['model_spec']['traits'])) {
            $modelInfo .= "\nTraits: " . implode(', ', $model['model_spec']['traits']);
        }
        printResponse($modelInfo);
    }

    // 2. Get image models
    printSection("Image Models");
    
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        $modelInfo = sprintf("ID: %s", $model['id']);
        
        // Show model traits if available
        if (isset($model['model_spec']['traits'])) {
            $modelInfo .= "\nTraits: " . implode(', ', $model['model_spec']['traits']);
        }
        printResponse($modelInfo);
    }

    // 3. Find models with specific traits
    printSection("Models with 'most_intelligent' trait");
    
    $allModels = $venice->listModels();
    foreach ($allModels['data'] as $model) {
        $traits = $model['model_spec']['traits'] ?? [];
        if (in_array('most_intelligent', $traits)) {
            $modelInfo = sprintf(
                "ID: %s\nType: %s\nTraits: %s",
                $model['id'],
                $model['type'],
                implode(', ', $traits)
            );
            printResponse($modelInfo);
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output usage tips
printSection("Usage Tips");
echo "- Text models are best for chat and completion tasks\n";
echo "- Image models are used for generation and manipulation\n";
echo "- Models with 'most_intelligent' trait provide better reasoning\n";
echo "- Check context length for text models to ensure your input fits\n";