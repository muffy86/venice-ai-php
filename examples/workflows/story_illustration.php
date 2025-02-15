<?php
/**
 * Venice AI API Example: Story Illustration Workflow
 * 
 * This example demonstrates how to:
 * 1. Generate a story using text completion
 * 2. Extract key scenes from the story
 * 3. Generate illustrations for each scene
 * 4. Create a complete illustrated story
 * 
 * This shows how to combine text and image generation
 * for creative content production.
 */

require_once __DIR__ . '/../../VeniceAI.php';
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

// Ensure output directory exists
$outputDir = ensureOutputDirectory(__DIR__ . '/output');

try {
    // Step 1: Generate a short story
    printSection("Step 1: Generating Story");
    
    $storyResponse = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are a children\'s story writer. Write a short, 
                         imaginative story with clear, distinct scenes that 
                         would work well with illustrations.'
        ],
        [
            'role' => 'user',
            'content' => 'Write a short story about a young inventor who creates 
                         a magical device. Include 3 key scenes that would make 
                         good illustrations.'
        ]
    ], 'default', [
        'temperature' => 0.9,
        'max_completion_tokens' => 500
    ]);

    $story = $storyResponse['choices'][0]['message']['content'];
    printResponse($story, "Generated Story");
    
    // Step 2: Extract key scenes for illustration
    printSection("Step 2: Identifying Key Scenes");
    
    $sceneResponse = $venice->createChatCompletion([
        [
            'role' => 'system',
            'content' => 'You are an art director. Extract key scenes from stories 
                         and create clear, detailed art prompts for illustration.'
        ],
        [
            'role' => 'user',
            'content' => "From this story, identify 3 key scenes and create detailed 
                         prompts for generating illustrations. Format as JSON array with 
                         'scene' and 'prompt' keys.\n\n$story"
        ]
    ], 'default', [
        'temperature' => 0.7
    ]);

    $scenes = json_decode($sceneResponse['choices'][0]['message']['content'], true);
    
    // Step 3: Generate illustrations for each scene
    printSection("Step 3: Generating Illustrations");
    
    foreach ($scenes as $index => $scene) {
        printResponse("Scene " . ($index + 1) . ":\n" . $scene['scene']);
        printResponse("Prompt: " . $scene['prompt']);
        
        // Generate the illustration
        $imageResponse = $venice->generateImage([
            'model' => 'fluently-xl',
            'prompt' => $scene['prompt'],
            'style_preset' => 'Fantasy Art',  // Using a valid style preset
            'width' => 1024,
            'height' => 1024,
            'steps' => 35,
            'cfg_scale' => 7.0
        ]);

        if (isset($imageResponse['data'][0]['b64_json'])) {
            // Save the illustration
            $imagePath = saveImage(
                $imageResponse['data'][0]['b64_json'],
                $outputDir . "/story_scene_" . ($index + 1) . ".png"
            );
            
            // Optional: Upscale the illustration
            $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
            file_put_contents($tempFile, base64_decode($imageResponse['data'][0]['b64_json']));
            
            $upscaledResponse = $venice->upscaleImage([
                'image' => $tempFile
            ]);
            
            saveImage(
                $upscaledResponse['data'][0]['b64_json'],
                $outputDir . "/story_scene_" . ($index + 1) . "_upscaled.png"
            );
            
            unlink($tempFile);
        }
    }

    // Step 4: Save the complete story with scene markers
    printSection("Step 4: Saving Complete Story");
    
    $storyWithMarkers = $story . "\n\n";
    $storyWithMarkers .= "Scene Illustrations:\n";
    foreach ($scenes as $index => $scene) {
        $storyWithMarkers .= "\nScene " . ($index + 1) . ":\n";
        $storyWithMarkers .= $scene['scene'] . "\n";
        $storyWithMarkers .= "Illustration: story_scene_" . ($index + 1) . "_upscaled.png\n";
    }
    
    file_put_contents($outputDir . '/illustrated_story.txt', $storyWithMarkers);
    printResponse("Complete story saved to 'output/illustrated_story.txt'");

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output workflow insights
printSection("Workflow Insights");
echo "1. Start with well-structured text generation\n";
echo "2. Use AI to identify key visual moments\n";
echo "3. Maintain consistent style across illustrations\n";
echo "4. Consider upscaling for final quality\n";
echo "5. Organize output for easy assembly\n";

// Output practical applications
printSection("Practical Applications");
echo "- Children's book creation\n";
echo "- Educational content development\n";
echo "- Marketing material generation\n";
echo "- Storyboard development\n";
echo "- Interactive narrative experiences\n";