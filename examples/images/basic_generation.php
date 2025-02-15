<?php
/**
 * Venice AI API Example: Image Generation
 * 
 * This example demonstrates EVERY parameter available in the image generation API.
 * Each example shows different combinations of parameters to serve as a complete
 * reference for the API's capabilities.
 * 
 * Required Parameters:
 * - model (string): The model ID to use for generation
 * - prompt (string): The description for the image (max 1500 chars)
 * 
 * Optional Parameters:
 * - width (number, default: 1024): Width of the generated image
 * - height (number, default: 1024): Height of the generated image
 * - steps (number, default: 30, max: 50): Number of inference steps
 * - hide_watermark (boolean, default: false): Whether to hide watermark
 * - return_binary (boolean, default: false): Return binary image data instead of base64
 * - seed (number): Random seed for reproducible generation
 * - cfg_scale (number): Classifier Free Guidance scale parameter
 * - style_preset (string): Visual style to apply
 * - negative_prompt (string): What to avoid in generation (max 1500 chars)
 * - safe_mode (boolean, default: false): Blur adult content
 * 
 * Valid Image Sizes:
 * - Square: 1024x1024 (default)
 * - Portrait: 1024x1280
 * - Landscape: 1280x1024
 * 
 * Source: https://github.com/veniceai/api-docs/
 * Postman: https://www.postman.com/veniceai/venice-ai-workspace/
 */

require_once __DIR__ . '/../../VeniceAI.php';
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

// Ensure output directory exists
$outputDir = ensureOutputDirectory(__DIR__ . '/output');

try {
    // Example 1: Basic square image with minimal parameters
    printSection("Example 1: Basic Square Image (Minimal Parameters)");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A beautiful sunset over mountains',
        'width' => 1024,
        'height' => 1024
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/1_basic_square.png');
    }

    // Example 2: Portrait with quality parameters
    printSection("Example 2: Portrait with Quality Parameters");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Professional portrait of a business person in an office',
        'width' => 1024,
        'height' => 1280,
        'steps' => 50,                     // Maximum steps for best quality
        'cfg_scale' => 7.5,                // Balanced prompt adherence
        'hide_watermark' => true,          // Remove watermark
        'style_preset' => 'Hyperrealism',  // From valid styles list
        'negative_prompt' => 'cartoon, illustration, blurry, low quality, bad lighting'
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/2_portrait_quality.png');
    }

    // Example 3: Landscape with artistic style
    printSection("Example 3: Landscape with Artistic Style");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Serene beach scene with palm trees at sunset',
        'width' => 1280,
        'height' => 1024,
        'steps' => 40,
        'cfg_scale' => 8.0,
        'style_preset' => 'Watercolor',    // From valid styles list
        'seed' => 12345                    // Fixed seed for reproducibility
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/3_landscape_artistic.png');
    }

    // Example 4: Gaming style with safe mode
    printSection("Example 4: Gaming Style with Safe Mode");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Epic battle scene with dragons and warriors',
        'width' => 1024,
        'height' => 1024,
        'steps' => 35,
        'cfg_scale' => 9.0,
        'style_preset' => 'RPG Fantasy Game',  // From valid styles list
        'safe_mode' => true,                   // Enable content filtering
        'return_binary' => true                // Get raw binary data
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/4_gaming_safe.png');
    }

    // Example 5: Commercial photography
    printSection("Example 5: Commercial Photography");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Elegant plated gourmet dish on marble background',
        'width' => 1024,
        'height' => 1024,
        'steps' => 45,
        'cfg_scale' => 7.0,
        'style_preset' => 'Food Photography',  // From valid styles list
        'negative_prompt' => 'cluttered, messy, dark, blurry',
        'hide_watermark' => true
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/5_commercial.png');
    }

    // Example 6: Paper art style
    printSection("Example 6: Paper Art Style");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'Intricate butterfly design',
        'width' => 1024,
        'height' => 1024,
        'steps' => 40,
        'cfg_scale' => 7.5,
        'style_preset' => 'Paper Quilling',  // From valid styles list
        'negative_prompt' => 'flat, simple, basic'
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/6_paper_art.png');
    }

    // Example 7: Photography style
    printSection("Example 7: Photography Style");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'City skyline at night with neon lights',
        'width' => 1280,
        'height' => 1024,
        'steps' => 45,
        'cfg_scale' => 8.0,
        'style_preset' => 'Neon Noir',  // From valid styles list
        'negative_prompt' => 'daylight, bright, sunny'
    ]);

    if (isset($response['data'][0]['b64_json'])) {
        saveImage($response['data'][0]['b64_json'], $outputDir . '/7_photography.png');
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output comprehensive tips
printSection("Image Generation Parameters");
echo "1. Required:\n";
echo "   • model: Model ID to use (e.g., 'fluently-xl')\n";
echo "   • prompt: Image description (max 1500 chars)\n";

printSection("Image Size Options");
echo "   • Square: 1024x1024 (default)\n";
echo "   • Portrait: 1024x1280\n";
echo "   • Landscape: 1280x1024\n";

printSection("Quality Control");
echo "   • steps: 1-50 (default: 30)\n";
echo "   • cfg_scale: Controls prompt adherence\n";
echo "   • negative_prompt: What to avoid (max 1500 chars)\n";

printSection("Style Options");
echo "   • style_preset: Many options (see documentation above)\n";
echo "   • hide_watermark: Remove watermark (default: false)\n";

printSection("Advanced Options");
echo "   • seed: For reproducible results\n";
echo "   • return_binary: Raw data vs base64 (default: false)\n";
echo "   • safe_mode: Blur adult content (default: false)\n";

printSection("Best Practices");
echo "   • Use clear, detailed prompts\n";
echo "   • Include negative prompts for better control\n";
echo "   • Increase steps for higher quality\n";
echo "   • Save seeds for reproducible images\n";
echo "   • Choose appropriate style presets\n";

printSection("Style Categories");
echo "   • Artistic: 3D Model, Digital Art, Fantasy Art...\n";
echo "   • Commercial: Advertising, Food Photography...\n";
echo "   • Fine Art: Abstract, Watercolor, Pop Art...\n";
echo "   • Gaming: RPG Fantasy Game, Minecraft, Pokemon...\n";
echo "   • Aesthetic: Gothic, Minimalist, Space...\n";
echo "   • Paper Art: Origami, Kirigami, Collage...\n";
echo "   • Photography: Film Noir, HDR, Tilt-Shift...\n";
