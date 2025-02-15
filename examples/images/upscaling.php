<?php
/**
 * Venice AI API Example: Image Upscaling
 * 
 * This example demonstrates how to:
 * 1. Upscale existing images
 * 2. Handle different image sources (file, generated)
 * 3. Process upscaling results
 * 
 * Upscaling is useful for:
 * - Improving quality of generated images
 * - Enhancing existing images
 * - Preparing images for high-resolution use
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

// Create output directory if it doesn't exist
$outputDir = __DIR__ . '/output';
if (!file_exists($outputDir)) {
    if (!mkdir($outputDir, 0777, true)) {
        die("Failed to create output directory: $outputDir\n");
    }
    echo "Created output directory: $outputDir\n";
}

// Helper function to save image data
function saveImage($imageData, $filename) {
    // Check if data is base64 encoded
    if (preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $imageData)) {
        $imageData = base64_decode($imageData);
    }
    
    if (!$imageData) {
        throw new Exception("Failed to process image data");
    }
    
    if (file_put_contents($filename, $imageData) === false) {
        throw new Exception("Failed to save image to: $filename");
    }
    
    echo "Image saved as: $filename\n";
}

try {
    // Example 1: Upscale a generated image
    echo "Example 1: Upscaling a Generated Image\n";
    echo str_repeat("-", 50) . "\n";
    
    // First generate a small image
    echo "Generating initial image...\n";
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A simple geometric pattern with circles and squares',
        'width' => 512,    // Start with smaller size
        'height' => 512
    ]);

    if (isset($response['data'])) {
        // Save the original image
        saveImage(
            $response['data'],
            $outputDir . '/hummingbird_original.png'
        );
        
        echo "Upscaling generated image...\n";
        $upscaledResponse = $venice->upscaleImage([
            'image' => $outputDir . '/hummingbird_original.png',
            'scale' => 4,  // Quadruple the size for first test
            'return_binary' => true
        ]);
        
        // Save the upscaled result
        if (isset($upscaledResponse['data'])) {
            saveImage(
                $upscaledResponse['data'],
                $outputDir . '/hummingbird_upscaled_2x_first.png'
            );
        }
    }

    // Example 2: Upscale with different parameters
    echo "\nExample 2: Upscaling with Different Parameters\n";
    echo str_repeat("-", 50) . "\n";
    
    $imagePath = $outputDir . '/hummingbird_original.png';
    if (file_exists($imagePath)) {
        echo "Upscaling image with 2x scale...\n";
        try {
            $response = $venice->upscaleImage([
                'image' => $imagePath,
                'scale' => 1.5,  // Use a different scale factor
                'return_binary' => true
            ]);
            
            if (isset($response['data'])) {
                saveImage(
                    $response['data'],
                    $outputDir . '/hummingbird_upscaled_2x.png'
                );
            }
        } catch (Exception $e) {
            echo "Upscaling error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Error: Source image not found.\n";
    }

    // Example 3: Error handling for invalid images
    echo "\nExample 3: Error Handling\n";
    echo str_repeat("-", 50) . "\n";
    
    try {
        $venice->upscaleImage([
            'image' => 'nonexistent.png'
        ]);
    } catch (InvalidArgumentException $e) {
        echo "Expected error caught: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output upscaling tips
echo "\nUpscaling Tips:\n";
echo "- Input images must be PNG format\n";
echo "- Maximum input file size is 5MB\n";
echo "- Upscaling works best on clear, well-defined images\n";
echo "- Consider memory usage when handling large images\n";
echo "- Always clean up temporary files\n";
echo "- Check upscaled image quality before using\n";

// Step 4: Analyze the upscaled image with qwen2.5vl72b
echo "\nStep 4: AI Analysis of Upscaled Image\n";
echo str_repeat("-", 50) . "\n";

$analysisResponse = $venice->createChatCompletion([
    [
        'role' => 'system',
        'content' => 'You are an expert in image analysis. Describe images in detail, focusing on quality and technical aspects.'
    ],
    [
        'role' => 'user',
        'content' => 'Analyze this upscaled image. How effective was the upscaling? What details can you see?'
    ]
], 'qwen2.5vl72b', [
    'temperature' => 0.7,
    'max_completion_tokens' => 300
]);

echo "AI Analysis:\n";
echo $analysisResponse['choices'][0]['message']['content'] . "\n\n";

// Output common use cases
echo "\nCommon Use Cases:\n";
echo "1. Enhance AI-generated images for higher quality\n";
echo "2. Improve existing images for printing or display\n";
echo "3. Prepare images for high-resolution applications\n";
echo "4. Batch process multiple images for consistent quality\n";