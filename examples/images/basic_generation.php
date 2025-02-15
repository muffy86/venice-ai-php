<?php
/**
 * Venice AI API Example: Basic Image Generation
 * 
 * This example demonstrates how to:
 * 1. Generate images using simple prompts
 * 2. Handle the image response
 * 3. Save the generated image
 * 
 * This is the starting point for image generation - once you understand
 * this, see advanced_generation.php for more options and features.
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Initialize the Venice AI client with debug mode enabled
$venice = new VeniceAI(true);

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
    try {
        if (file_put_contents($filename, base64_decode($imageData)) === false) {
            throw new Exception("Failed to save image to: $filename");
        }
        echo "Image saved as: $filename\n";
    } catch (Exception $e) {
        throw new Exception("Failed to save image: " . $e->getMessage());
    }
}

try {
    // Example 1: Basic image generation
    echo "Example 1: Basic Image Generation\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',  // Basic model for standard images
        'prompt' => 'A beautiful sunset over mountains',
        'width' => 1024,   // Standard width
        'height' => 1024   // Standard height
    ]);

    // Save the binary image data
    if (isset($response['data'])) {
        saveImage(
            $response['data'],
            $outputDir . '/sunset.png'
        );
    }

    // Example 2: Simple portrait generation
    echo "\nExample 2: Portrait Generation\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Professional portrait of a business person, studio lighting',
        'width' => 512,    // Smaller size for portraits
        'height' => 768    // Portrait orientation
    ]);

    // Save the binary image data
    if (isset($response['data'])) {
        saveImage(
            $response['data'],
            $outputDir . '/portrait.png'
        );
    }

    // Example 3: Simple landscape generation
    echo "\nExample 3: Landscape Generation\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Serene beach scene with palm trees',
        'width' => 768,    // Landscape orientation
        'height' => 512
    ]);

    // Save the binary image data
    if (isset($response['data'])) {
        saveImage(
            $response['data'],
            $outputDir . '/beach.png'
        );
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output basic tips
echo "\nImage Generation Tips:\n";
echo "- Keep prompts clear and descriptive\n";
echo "- Standard sizes are 512x512, 1024x1024\n";
echo "- Adjust width/height ratio for different orientations\n";
echo "- Images are saved directly to the output directory\n";
echo "- Check the output directory for generated images\n";