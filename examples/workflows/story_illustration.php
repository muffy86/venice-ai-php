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

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

// Helper function to save base64 image
function saveImage($base64Data, $filename) {
    $imageData = base64_decode($base64Data);
    file_put_contents($filename, $imageData);
    echo "Image saved as: $filename\n";
}

try {
    // Step 1: Generate a short story
    echo "Step 1: Generating Story\n";
    echo str_repeat("-", 50) . "\n";
    
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
    echo "Generated Story:\n$story\n\n";
    
    // Step 2: Extract key scenes for illustration
    echo "\nStep 2: Identifying Key Scenes\n";
    echo str_repeat("-", 50) . "\n";
    
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
    echo "\nStep 3: Generating Illustrations\n";
    echo str_repeat("-", 50) . "\n";
    
    foreach ($scenes as $index => $scene) {
        echo "\nGenerating illustration for scene " . ($index + 1) . ":\n";
        echo "Scene: " . $scene['scene'] . "\n";
        echo "Prompt: " . $scene['prompt'] . "\n";
        
        // Generate the illustration
        $imageResponse = $venice->generateImage([
            'model' => 'fluently-xl',
            'prompt' => $scene['prompt'],
            'style_preset' => 'Children\'s Book',
            'width' => 1024,
            'height' => 1024,
            'steps' => 35,
            'cfg_scale' => 7.0
        ]);

        if (isset($imageResponse['data'][0]['b64_json'])) {
            // Save the illustration
            saveImage(
                $imageResponse['data'][0]['b64_json'],
                __DIR__ . "/story_scene_" . ($index + 1) . ".png"
            );
            
            // Optional: Upscale the illustration
            $tempFile = tempnam(sys_get_temp_dir(), 'venice_');
            file_put_contents($tempFile, base64_decode($imageResponse['data'][0]['b64_json']));
            
            $upscaledResponse = $venice->upscaleImage([
                'image' => $tempFile
            ]);
            
            saveImage(
                $upscaledResponse['data'][0]['b64_json'],
                __DIR__ . "/story_scene_" . ($index + 1) . "_upscaled.png"
            );
            
            unlink($tempFile);
        }
    }

    // Step 4: Save the complete story with scene markers
    echo "\nStep 4: Saving Complete Story\n";
    echo str_repeat("-", 50) . "\n";
    
    $storyWithMarkers = $story . "\n\n";
    $storyWithMarkers .= "Scene Illustrations:\n";
    foreach ($scenes as $index => $scene) {
        $storyWithMarkers .= "\nScene " . ($index + 1) . ":\n";
        $storyWithMarkers .= $scene['scene'] . "\n";
        $storyWithMarkers .= "Illustration: story_scene_" . ($index + 1) . "_upscaled.png\n";
    }
    
    file_put_contents(__DIR__ . '/illustrated_story.txt', $storyWithMarkers);
    echo "Complete story saved to 'illustrated_story.txt'\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output workflow insights
echo "\nWorkflow Insights:\n";
echo "1. Start with well-structured text generation\n";
echo "2. Use AI to identify key visual moments\n";
echo "3. Maintain consistent style across illustrations\n";
echo "4. Consider upscaling for final quality\n";
echo "5. Organize output for easy assembly\n";

// Output practical applications
echo "\nPractical Applications:\n";
echo "- Children's book creation\n";
echo "- Educational content development\n";
echo "- Marketing material generation\n";
echo "- Storyboard development\n";
echo "- Interactive narrative experiences\n";