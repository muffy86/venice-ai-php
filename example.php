<?php

require_once 'VeniceAI.php';

/**
 * Venice AI API Comprehensive Example
 * 
 * This example demonstrates all capabilities of the Venice AI API
 * including text generation, image generation, and model management.
 * 
 * Each section shows the complete range of options available for that feature.
 */

// Initialize the Venice AI client with debug mode enabled
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

/**
 * Helper function to print section headers
 */
function printSection(string $title) {
    echo "\n", str_repeat("=", 80), "\n";
    echo $title, "\n";
    echo str_repeat("=", 80), "\n";
}

/**
 * Helper function to print responses
 */
function printResponse($response, $label = '') {
    if ($label) echo "\n$label:\n";
    if (is_string($response)) {
        echo $response, "\n";
    } else {
        // Special handling for image generation responses
        if (isset($response['data']) && isset($response['data'][0]['b64_json'])) {
            $imageData = $response['data'][0];
            echo "Image generated successfully:\n";
            echo "- Format: " . ($imageData['format'] ?? 'unknown') . "\n";
            echo "- Size: " . strlen($imageData['b64_json']) . " bytes\n";
            // Omit the actual base64 data to avoid overwhelming output
        } else {
            echo json_encode($response, JSON_PRETTY_PRINT), "\n";
        }
    }
}

try {
    // SECTION 1: Model Management
    printSection("1. Model Management");

    // List all models
    echo "\n1.1 List All Models:\n";
    $models = $venice->listModels();
    foreach ($models['data'] as $model) {
        echo sprintf(
            "- %s (Type: %s, Created: %s)\n",
            $model['id'],
            $model['type'],
            date('Y-m-d', $model['created'])
        );
    }

    // List text models
    echo "\n1.2 Text Models:\n";
    $textModels = $venice->listTextModels();
    foreach ($textModels['data'] as $model) {
        echo sprintf(
            "- %s (Context: %d tokens)\n",
            $model['id'],
            $model['model_spec']['availableContextTokens'] ?? 'N/A'
        );
    }

    // List image models
    echo "\n1.3 Image Models:\n";
    $imageModels = $venice->listImageModels();
    foreach ($imageModels['data'] as $model) {
        echo sprintf(
            "- %s (Traits: %s)\n",
            $model['id'],
            implode(', ', $model['model_spec']['traits'] ?? [])
        );
    }

    // SECTION 2: Text Generation
    printSection("2. Text Generation");

    // Basic chat completion
    echo "\n2.1 Basic Chat Completion:\n";
    $response = $venice->createChatCompletion([
        [
            'role' => 'user',
            'content' => 'What is Venice AI?'
        ]
    ]);
    printResponse($response['choices'][0]['message']['content'], 'Response');

    // Advanced chat completion with all options
    echo "\n2.2 Advanced Chat Completion:\n";
    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'system',
                'content' => 'You are a technical expert who explains complex topics simply.'
            ],
            [
                'role' => 'user',
                'content' => 'Explain neural networks in simple terms.'
            ]
        ],
        'dolphin-2.9.2-qwen2-72b',
        [
            'temperature' => 0.7,
            'top_p' => 0.9,
            'max_completion_tokens' => 500,
            'frequency_penalty' => 0.5,
            'presence_penalty' => 0.5,
            'stop' => ["\n\n", "END"],
            'venice_parameters' => [
                'include_venice_system_prompt' => true,
                'character_slug' => 'tech_expert'
            ]
        ]
    );
    printResponse($response['choices'][0]['message']['content'], 'Response');

    // Streaming chat completion
    echo "\n2.3 Streaming Chat Completion:\n";
    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'user',
                'content' => 'Write a short story.'
            ]
        ],
        'default',
        ['stream' => true]
    );
    printResponse($response, 'Streaming Response');

    // SECTION 3: Image Generation
    printSection("3. Image Generation");

    // Comprehensive image generation showcasing all options
    echo "\n3.1 Comprehensive Image Generation:\n";
    try {
        // Generate image with all available options
        $response = $venice->generateImage([
            'model' => 'fluently-xl',
            'prompt' => 'A serene landscape with mountains and a lake at sunset',
            'width' => 1024,
            'height' => 1024,
            'steps' => 30,
            'style_preset' => 'Photographic',
            'negative_prompt' => 'blurry, low quality, distorted',
            'safe_mode' => true,
            'hide_watermark' => false,
            'return_binary' => false,
            'seed' => 12345,
            'cfg_scale' => 7.5
        ]);
        printResponse($response, 'Generated Image Data');

        // Demonstrate image upscaling
        if (isset($response['data'][0]['b64_json'])) {
            $imageData = base64_decode($response['data'][0]['b64_json']);
            $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
            file_put_contents($tempFile, $imageData);
            
            $upscaledResponse = $venice->upscaleImage([
                'image' => $tempFile
            ]);
            printResponse($upscaledResponse, 'Upscaled Image Data');
            
            unlink($tempFile);
        }
    } catch (Exception $e) {
        echo "Image operations failed: " . $e->getMessage() . "\n";
    }

    // List available image styles
    echo "\n3.2 Available Image Styles:\n";
    try {
        $styles = $venice->getImageStyles();
        printResponse($styles, 'Available Styles');
    } catch (Exception $e) {
        echo "Failed to get image styles: " . $e->getMessage() . "\n";
    }

    // SECTION 4: Advanced Workflow Example
    printSection("4. Advanced Workflow - Image Generation, Upscaling, and Description");

    echo "\n4.1 Complete Image Workflow:\n";
    try {
        // Step 1: Generate initial image
        echo "Step 1: Generating initial image...\n";
        $response = $venice->generateImage([
            'model' => 'fluently-xl',
            'prompt' => 'A magical forest with glowing mushrooms and fairy lights',
            'width' => 512,  // Start with smaller size
            'height' => 512,
            'style_preset' => 'Fantasy Art'
        ]);
        printResponse($response, 'Initial Image Generation');

        // Step 2: Upscale the image
        if (isset($response['data'][0]['b64_json'])) {
            echo "\nStep 2: Upscaling image...\n";
            $imageData = base64_decode($response['data'][0]['b64_json']);
            $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
            file_put_contents($tempFile, $imageData);
            
            $upscaledResponse = $venice->upscaleImage([
                'image' => $tempFile
            ]);
            printResponse($upscaledResponse, 'Upscaled Image');

            // Step 3: Have the AI describe the image
            echo "\nStep 3: Getting AI description of the image...\n";
            $description = $venice->createChatCompletion([
                [
                    'role' => 'system',
                    'content' => 'You are an art critic and image analyst. Describe the image in detail, including its artistic style, composition, and notable elements.'
                ],
                [
                    'role' => 'user',
                    'content' => 'Describe this AI-generated image of a magical forest with glowing mushrooms and fairy lights. Focus on the artistic elements and how the upscaling has affected the detail and quality.'
                ]
            ], 'default', [
                'temperature' => 0.7,
                'max_completion_tokens' => 300
            ]);
            printResponse($description['choices'][0]['message']['content'], 'AI Image Analysis');
            
            unlink($tempFile);
        }
    } catch (Exception $e) {
        echo "Advanced workflow failed: " . $e->getMessage() . "\n";
    }

    // SECTION 5: Error Handling
    printSection("4. Error Handling Examples");

    // Invalid model type
    echo "\n4.1 Invalid Model Type:\n";
    try {
        $venice->listModels('invalid_type');
    } catch (InvalidArgumentException $e) {
        echo "Caught expected error: " . $e->getMessage() . "\n";
    }

    // Invalid message format
    echo "\n4.2 Invalid Message Format:\n";
    try {
        $venice->createChatCompletion([
            ['invalid' => 'message']
        ]);
    } catch (InvalidArgumentException $e) {
        echo "Caught expected error: " . $e->getMessage() . "\n";
    }

    // Missing required parameters
    echo "\n4.3 Missing Required Parameters:\n";
    try {
        $venice->generateImage([
            'model' => 'fluently-xl'
            // Missing required 'prompt' parameter
        ]);
    } catch (InvalidArgumentException $e) {
        echo "Caught expected error: " . $e->getMessage() . "\n";
    }

    // Invalid image for upscaling
    echo "\n4.4 Invalid Image for Upscaling:\n";
    try {
        $venice->upscaleImage([
            'image' => 'nonexistent.png'
        ]);
    } catch (InvalidArgumentException $e) {
        echo "Caught expected error: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nExample completed successfully!\n";
