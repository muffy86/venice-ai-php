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
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

// Ensure output directory exists
$outputDir = ensureOutputDirectory(__DIR__ . '/output');

try {
    // Step 1: Generate a test image
    printSection("Step 1: Generating Test Image");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A detailed painting of a hummingbird feeding on bright flowers',
        'width' => 1024,
        'height' => 1024
    ]);

    if (!isset($response['data'][0]['b64_json'])) {
        throw new Exception("Image generation failed");
    }

    // Save the generated image
    $imagePath = saveImage(
        $response['data'][0]['b64_json'],
        $outputDir . '/test_image.png'
    );

    // Step 2: Analyze the image with Qwen
    printSection("Step 2: Analyzing Image with Qwen");

    // Read and encode the image
    $imageData = file_get_contents($imagePath);
    if ($imageData === false) {
        throw new Exception("Failed to read generated image for analysis");
    }

    // Prepare analysis prompts
    $prompts = [
        "What do you see in this image? Please describe it in detail.",
        "What are the main colors and composition elements?",
        "Are there any notable artistic techniques or styles used?"
    ];

    foreach ($prompts as $index => $prompt) {
        printSection("Analysis " . ($index + 1));
        printResponse("Question: $prompt");

        // Send to Qwen for analysis
        $analysisResponse = $venice->createChatCompletion([
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => $prompt
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => 'data:image/png;base64,' . base64_encode($imageData)
                        ]
                    ]
                ]
            ]
        ], 'qwen-2.5-vl');

        if (isset($analysisResponse['choices'][0]['message']['content'])) {
            printResponse($analysisResponse['choices'][0]['message']['content'], "Response");
        } else {
            printResponse("Failed to get analysis response", "Error");
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output tips
printSection("Image Analysis Tips");
echo "- Provide clear, high-quality images for best results\n";
echo "- Ask specific questions about what you want to analyze\n";
echo "- Consider different aspects like composition, color, style\n";
echo "- Use the analysis for content verification or description\n";
echo "- Try different prompts to get varied perspectives\n";
echo "- Compare analyses to understand the image better\n";