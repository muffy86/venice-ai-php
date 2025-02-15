<?php
/**
 * Venice AI API Example: Image Analysis with Qwen
 * 
 * This example demonstrates how to:
 * 1. Generate an image
 * 2. Use Qwen's multimodal capabilities to analyze the image
 * 3. Process and display the analysis results
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

try {
    // Step 1: Generate a test image
    echo "Step 1: Generating Test Image\n";
    echo str_repeat("-", 50) . "\n";
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A detailed painting of a hummingbird feeding on bright flowers',
        'width' => 1024,
        'height' => 1024
    ]);

    if (!isset($response['data'])) {
        throw new Exception("Image generation failed");
    }

    // Save the generated image silently
    $imagePath = $outputDir . '/test_image.png';
    if (!file_put_contents($imagePath, base64_decode($response['data']))) {
        throw new Exception("Failed to save image to: $imagePath");
    }

    // Step 2: Analyze the image with Qwen
    echo "Step 2: Analyzing Image with Qwen\n";
    echo str_repeat("-", 50) . "\n";

    // Convert image to base64 silently
    $imageData = file_get_contents($imagePath);
    if ($imageData === false) {
        throw new Exception("Failed to read generated image for analysis");
    }
    $base64Image = base64_encode($imageData);

    // Send to Qwen for analysis
    $analysisResponse = $venice->createChatCompletion([
        [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'What do you see in this image? Please describe it in detail, including colors, composition, and any notable features.'
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => 'data:image/png;base64,' . $base64Image
                    ]
                ]
            ]
        ]
    ], 'qwen-2.5-vl');

    echo "\nQwen's Analysis:\n";
    if (isset($analysisResponse['choices'][0]['message']['content'])) {
        echo $analysisResponse['choices'][0]['message']['content'] . "\n";
    } else {
        echo "Failed to get analysis response\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output tips
echo "\nImage Analysis Tips:\n";
echo "- Provide clear, high-quality images for best results\n";
echo "- Ask specific questions about what you want to analyze\n";
echo "- Consider different aspects like composition, color, style\n";
echo "- Use the analysis for content verification or description\n";