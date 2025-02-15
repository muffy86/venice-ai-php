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

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

// Helper function to save base64 image
function saveImage($base64Data, $filename) {
    $imageData = base64_decode($base64Data);
    file_put_contents($filename, $imageData);
    echo "Image saved as: $filename\n";
}

try {
    // Step 1: Generate an artistic image
    echo "Step 1: Generating Initial Image\n";
    echo str_repeat("-", 50) . "\n";
    
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

    if (!isset($response['data'][0]['b64_json'])) {
        throw new Exception("Image generation failed");
    }

    // Save the original image
    saveImage(
        $response['data'][0]['b64_json'],
        __DIR__ . '/surreal_landscape_original.png'
    );
    
    // Step 2: Upscale the generated image
    echo "\nStep 2: Upscaling Image\n";
    echo str_repeat("-", 50) . "\n";
    
    // Create temporary file for upscaling
    $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
    file_put_contents($tempFile, base64_decode($response['data'][0]['b64_json']));
    
    $upscaledResponse = $venice->upscaleImage([
        'image' => $tempFile
    ]);
    
    // Save the upscaled result
    saveImage(
        $upscaledResponse['data'][0]['b64_json'],
        __DIR__ . '/surreal_landscape_upscaled.png'
    );
    
    unlink($tempFile);  // Clean up temp file

    // Step 3: Analyze the image using AI
    echo "\nStep 3: AI Analysis of the Image\n";
    echo str_repeat("-", 50) . "\n";
    
    // First, get a technical analysis
    $technicalAnalysis = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are an expert in digital art and image analysis. 
                         Analyze images in terms of composition, technique, and artistic elements.'
        ],
        [
            'role' => 'user',
            'content' => 'Analyze this AI-generated image of a surreal landscape with floating islands. 
                         Focus on the technical aspects of the generation, including how well the 
                         upscaling worked and the effectiveness of the chosen style preset.'
        ]
    ], 'default', [
        'temperature' => 0.7,
        'max_completion_tokens' => 300
    ]);

    echo "Technical Analysis:\n";
    echo $technicalAnalysis['choices'][0]['message']['content'] . "\n\n";

    // Then, get a creative interpretation
    $creativeAnalysis = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are a creative writer and art critic. 
                         Describe images in an engaging, narrative style.'
        ],
        [
            'role' => 'user',
            'content' => 'Tell a story inspired by this surreal landscape. 
                         What mysteries might exist in these floating islands? 
                         What kind of world is this?'
        ]
    ], 'default', [
        'temperature' => 0.9,
        'max_completion_tokens' => 300
    ]);

    echo "Creative Interpretation:\n";
    echo $creativeAnalysis['choices'][0]['message']['content'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output workflow insights
echo "\nWorkflow Insights:\n";
echo "1. Start with high-quality generation parameters\n";
echo "2. Use upscaling to enhance details\n";
echo "3. Leverage AI for both technical and creative analysis\n";
echo "4. Consider the workflow as a pipeline where each step builds on the previous\n";
echo "5. Save intermediate results for comparison and backup\n";

// Output practical applications
echo "\nPractical Applications:\n";
echo "- Art generation and critique\n";
echo "- Content creation workflows\n";
echo "- Educational tools for art analysis\n";
echo "- Portfolio generation with commentary\n";