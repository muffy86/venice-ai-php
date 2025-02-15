<?php
/**
 * Venice AI API Example: Basic Model Listing
 * 
 * This example demonstrates how to:
 * 1. Initialize the Venice AI client
 * 2. List all available models
 * 3. Access model information like ID, type, and creation date
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Initialize the Venice AI client
// Set debug to true to see detailed API interaction
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

try {
    // List all available models
    $models = $venice->listModels();
    
    echo "Available Models:\n";
    echo str_repeat("-", 50) . "\n";
    
    foreach ($models['data'] as $model) {
        // Format and display key model information
        echo sprintf(
            "ID: %s\nType: %s\nCreated: %s\nOwned By: %s\n",
            $model['id'],
            $model['type'],
            date('Y-m-d', $model['created']),
            $model['owned_by']
        );
        
        // Display model specifications if available
        if (isset($model['model_spec'])) {
            if (isset($model['model_spec']['availableContextTokens'])) {
                echo "Context Tokens: " . $model['model_spec']['availableContextTokens'] . "\n";
            }
            if (isset($model['model_spec']['traits'])) {
                echo "Traits: " . implode(', ', $model['model_spec']['traits']) . "\n";
            }
        }
        
        echo str_repeat("-", 50) . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}