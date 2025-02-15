<?php
/**
 * Venice AI API Example: Image Analysis Workflow
 * 
 * This example demonstrates a complete workflow that:
 * 1. Generates an image with specific parameters
 * 2. Upscales it for better quality
 * 3. Uses AI to analyze and describe the result
 * 
 * This shows how to combine multiple API features
 * to create more sophisticated applications.
 */

require_once __DIR__ . '/../../VeniceAI.php';
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client with debug mode enabled
$venice = new VeniceAI($config['api_key'], true);  // Enable debug mode to see API interactions

// Ensure output directory exists
$outputDir = ensureOutputDirectory(__DIR__ . '/output');

try {
    // Step 1: Generate an artistic image
    printSection("Step 1: Generating Initial Image");
    
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A surreal landscape where floating islands contain different ecosystems, 
                    with waterfalls flowing between them and exotic creatures flying through 
                    the scene. Style should be detailed and fantastical.',
        'style_preset' => 'Fantasy Art',
        'width' => 1024,
        'height' => 1024,
        'steps' => 40,
        'cfg_scale' => 7.5,
        'negative_prompt' => 'blurry, low quality, distorted'
    ]);

    // Check for valid response
    if (!isset($response['data'][0]['b64_json'])) {
        if (isset($response['error'])) {
            throw new Exception("API Error: " . $response['error']);
        } else {
            echo "Unexpected API Response:\n";
            print_r($response);
            throw new Exception("Unexpected response format. Check API response above for details.");
        }
    }

    if (!isset($response['data']) || !is_array($response['data']) || empty($response['data'])) {
        throw new Exception("No image data in response");
    }

    // Save the original image
    $imagePath = saveImage(
        $response['data'][0]['b64_json'],
        $outputDir . '/surreal_landscape_original.png'
    );
    
    // Step 2: Upscale the generated image
    printSection("Step 2: Upscaling Image");
    
    // Create temp file for upscaling
    $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
    file_put_contents($tempFile, file_get_contents($imagePath));
    
    $upscaledResponse = $venice->upscaleImage([
        'image' => $tempFile,
        'scale' => '2'  // Specify scale factor
    ]);
    
    if (isset($upscaledResponse['data'][0]['b64_json'])) {
        // Save the upscaled result
        saveImage(
            $upscaledResponse['data'][0]['b64_json'],
            $outputDir . '/surreal_landscape_upscaled.png'
        );
    }
    
    unlink($tempFile);

    // Step 3: Analyze the image using AI
    printSection("Step 3: AI Analysis of the Image");
    
    // First, get a technical analysis
    // Use original image since it's already the right size (1024x1024)
    $imagePath = $outputDir . '/surreal_landscape_original.png';
    if (!file_exists($imagePath)) {
        throw new Exception("Original image not found at: $imagePath");
    }

    // Read the image
    $imageData = base64_encode(file_get_contents($imagePath));
    
    $technicalAnalysis = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are an expert in digital art and image analysis.
                          Analyze images in terms of composition, technique, and artistic elements.'
        ],
        [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Analyze this AI-generated image of a surreal landscape with floating islands.
                              Focus on the technical aspects of the generation, including how well the
                              upscaling worked and the effectiveness of the chosen style preset.'
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => 'data:image/png;base64,' . $imageData
                    ]
                ]
            ]
        ]
    ], 'qwen-2.5-vl', [
        'temperature' => 0.7,
        'max_completion_tokens' => 300
    ]);

    printResponse($technicalAnalysis['choices'][0]['message']['content'], "Technical Analysis");

    // Then, get a creative interpretation using the same image
    $creativeAnalysis = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are a creative writer and art critic.
                          Describe images in an engaging, narrative style.'
        ],
        [
            'role' => 'user',
            'content' => [
                [
                    'type' => 'text',
                    'text' => 'Tell a story inspired by this surreal landscape.
                              What mysteries might exist in these floating islands?
                              What kind of world is this?'
                ],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => 'data:image/png;base64,' . $imageData
                    ]
                ]
            ]
        ]
    ], 'qwen-2.5-vl', [
        'temperature' => 0.9,
        'max_completion_tokens' => 300
    ]);

    printResponse($creativeAnalysis['choices'][0]['message']['content'], "Creative Interpretation");

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output workflow insights
printSection("Workflow Insights");
echo "1. Start with high-quality generation parameters\n";
echo "2. Use upscaling to enhance details\n";
echo "3. Leverage AI for both technical and creative analysis\n";
echo "4. Consider the workflow as a pipeline where each step builds on the previous\n";
echo "5. Save intermediate results for comparison and backup\n";

// Output practical applications
printSection("Practical Applications");
echo "- Art generation and critique\n";
echo "- Content creation workflows\n";
echo "- Educational tools for art analysis\n";
echo "- Portfolio generation with commentary\n";