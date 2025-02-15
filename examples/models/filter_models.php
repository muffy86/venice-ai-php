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

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

try {
    // 1. Get text models
    echo "Text Models:\n";
    echo str_repeat("-", 50) . "\n";
    
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        echo sprintf(
            "ID: %s\nContext Length: %d tokens\n",
            $model['id'],
            $model['model_spec']['availableContextTokens'] ?? 0
        );
        
        // Show model traits if available
        if (isset($model['model_spec']['traits'])) {
            echo "Traits: " . implode(', ', $model['model_spec']['traits']) . "\n";
        }
        echo str_repeat("-", 50) . "\n";
    }

    // 2. Get image models
    echo "\nImage Models:\n";
    echo str_repeat("-", 50) . "\n";
    
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        echo sprintf("ID: %s\n", $model['id']);
        
        // Show model traits if available
        if (isset($model['model_spec']['traits'])) {
            echo "Traits: " . implode(', ', $model['model_spec']['traits']) . "\n";
        }
        echo str_repeat("-", 50) . "\n";
    }

    // 3. Find models with specific traits
    echo "\nModels with 'most_intelligent' trait:\n";
    echo str_repeat("-", 50) . "\n";
    
    $allModels = $venice->listModels();
    foreach ($allModels['data'] as $model) {
        $traits = $model['model_spec']['traits'] ?? [];
        if (in_array('most_intelligent', $traits)) {
            echo sprintf(
                "ID: %s\nType: %s\nTraits: %s\n",
                $model['id'],
                $model['type'],
                implode(', ', $traits)
            );
            echo str_repeat("-", 50) . "\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output usage tips
echo "\nUsage Tips:\n";
echo "- Text models are best for chat and completion tasks\n";
echo "- Image models are used for generation and manipulation\n";
echo "- Models with 'most_intelligent' trait provide better reasoning\n";
echo "- Check context length for text models to ensure your input fits\n";