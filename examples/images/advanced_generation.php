<?php
/**
 * Venice AI API Example: Advanced Image Generation
 * 
 * This example demonstrates advanced image generation features:
 * 1. Style presets
 * 2. Negative prompts
 * 3. Generation parameters (steps, cfg_scale)
 * 4. Safety and watermark options
 * 5. Seed control for reproducibility
 * 
 * After understanding basic_generation.php, this example shows you
 * how to fine-tune image generation for specific use cases.
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

// Helper function to save base64 image
function saveImage($base64Data, $filename) {
    $imageData = base64_decode($base64Data);
    file_put_contents($filename, $imageData);
    echo "Image saved as: $filename\n";
}

try {
    // Example 1: Using style presets
    echo "Example 1: Style Presets\n";
    echo str_repeat("-", 50) . "\n";
    
    // First, let's see available styles
    $styles = $venice->getImageStyles();
    echo "Available styles: " . implode(", ", $styles['data']) . "\n\n";
    
    // Generate image with specific style
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A cyberpunk city street',
        'style_preset' => 'Neon Punk',
        'width' => 1024,
        'height' => 1024,
        'steps' => 40  // More steps for higher quality
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage(
            $response['data'][0]['b64_json'],
            __DIR__ . '/cyberpunk.png'
        );
    }

    // Example 2: Using negative prompts and cfg_scale
    echo "\nExample 2: Negative Prompts and CFG Scale\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A detailed portrait of a warrior',
        'negative_prompt' => 'blurry, low quality, distorted, bad anatomy',
        'cfg_scale' => 7.5,  // Higher value = more prompt adherence
        'steps' => 35,
        'width' => 1024,
        'height' => 1024
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage(
            $response['data'][0]['b64_json'],
            __DIR__ . '/warrior.png'
        );
    }

    // Example 3: Reproducible generation with seed
    echo "\nExample 3: Reproducible Generation\n";
    echo str_repeat("-", 50) . "\n";
    
    $seed = 12345;  // Fixed seed for reproducibility
    
    // Generate two identical images
    for ($i = 1; $i <= 2; $i++) {
        $response = $venice->generateImage([
            'model' => 'fluently-xl',
            'prompt' => 'A magical crystal floating in space',
            'seed' => $seed,  // Same seed will generate same image
            'style_preset' => 'Fantasy Art',
            'width' => 1024,
            'height' => 1024
        ]);

        if (isset($response['data'][0]['b64_json'])) {
            saveImage(
                $response['data'][0]['b64_json'],
                __DIR__ . "/crystal_$i.png"
            );
        }
    }

    // Example 4: Safety and watermark options
    echo "\nExample 4: Safety and Watermark Options\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A professional product photo of a luxury watch',
        'safe_mode' => true,  // Enable content filtering
        'hide_watermark' => false,  // Show Venice watermark
        'style_preset' => 'Product Photography',
        'width' => 1024,
        'height' => 1024
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage(
            $response['data'][0]['b64_json'],
            __DIR__ . '/watch.png'
        );
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output advanced tips
echo "\nAdvanced Generation Tips:\n";
echo "- Style presets help achieve consistent looks\n";
echo "- Negative prompts help avoid unwanted elements\n";
echo "- Higher cfg_scale makes images match prompts more closely\n";
echo "- More steps generally means higher quality but slower generation\n";
echo "- Use seed for reproducible results\n";
echo "- safe_mode helps filter inappropriate content\n";
echo "- hide_watermark controls Venice branding\n";

// Output parameter ranges
echo "\nParameter Ranges:\n";
echo "steps: 1-50 (default: 30)\n";
echo "cfg_scale: typically 1-20 (default varies by model)\n";
echo "width/height: typically 512-1024 pixels\n";