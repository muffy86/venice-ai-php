<?php
/**
 * Venice AI API Example: Image Analysis with Qwen
 * 
 * This example demonstrates how to:
 * 1. Generate an image
 * 2. Use Qwen's multimodal capabilities to analyze the image
 * 3. Process and display the analysis results
 * 
 * Debug Options:
 * --debug (-d): Show detailed HTTP output
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Parse command line arguments for debug mode
$debug = in_array('--debug', $argv) || in_array('-d', $argv);

// Initialize the Venice AI client
$venice = new VeniceAI($debug);

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

    // Save the generated image
    $imagePath = $outputDir . '/test_image.png';
    if (!file_put_contents($imagePath, base64_decode($response['data']))) {
        throw new Exception("Failed to save image to: $imagePath");
    }
    echo "Generated image saved to: $imagePath\n";

    // Step 2: Analyze the image with Qwen
    echo "\nStep 2: Analyzing Image with Qwen\n";
    echo str_repeat("-", 50) . "\n";

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
        echo "\nAnalysis " . ($index + 1) . ":\n";
        echo "Question: $prompt\n";
        echo "Response:\n";

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
            echo $analysisResponse['choices'][0]['message']['content'] . "\n";
        } else {
            echo "Failed to get analysis response\n";
        }
        
        echo str_repeat("-", 50) . "\n";
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
echo "- Try different prompts to get varied perspectives\n";
echo "- Compare analyses to understand the image better\n";
echo "\nDebug Options:\n";
echo "- --debug (-d): Show detailed HTTP output\n";