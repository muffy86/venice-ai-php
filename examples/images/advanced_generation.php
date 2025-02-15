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
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

// Ensure output directory exists
$outputDir = ensureOutputDirectory(__DIR__ . '/output');

try {
    // Example 1: Using style presets
    printSection("Example 1: Style Presets");
    
    // First, let's see available styles
    $styles = $venice->getImageStyles();
    printResponse("Available styles: " . implode(", ", $styles['data']));
    
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
            $outputDir . '/cyberpunk.png'
        );
    }

    // Example 2: Using negative prompts and cfg_scale
    printSection("Example 2: Negative Prompts and CFG Scale");
    
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
            $outputDir . '/warrior.png'
        );
    }

    // Example 3: Reproducible generation with seed
    printSection("Example 3: Reproducible Generation");
    
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
                $outputDir . "/crystal_$i.png"
            );
        }
    }

    // Example 4: Safety and watermark options
    printSection("Example 4: Safety and Watermark Options");
    
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
            $outputDir . '/watch.png'
        );
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output advanced tips
printSection("Advanced Generation Tips");
echo "- Style presets help achieve consistent looks\n";
echo "- Negative prompts help avoid unwanted elements\n";
echo "- Higher cfg_scale makes images match prompts more closely\n";
echo "- More steps generally means higher quality but slower generation\n";
echo "- Use seed for reproducible results\n";
echo "- safe_mode helps filter inappropriate content\n";
echo "- hide_watermark controls Venice branding\n";

// Output parameter ranges
printSection("Parameter Ranges");
echo "steps: 1-50 (default: 30)\n";
echo "cfg_scale: typically 1-20 (default varies by model)\n";
echo "width/height: typically 512-1024 pixels\n";