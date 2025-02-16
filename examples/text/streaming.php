<?php
/**
 * Venice AI API Example: Streaming Chat Completion
 * 
 * This example demonstrates how to:
 * 1. Use streaming mode for real-time responses
 * 2. Process chunks of generated text as they arrive
 * 3. Handle streaming-specific response format
 * 
 * Streaming is useful for:
 * - Real-time chat interfaces
 * - Progress indicators
 * - Faster perceived response time
 */

require_once __DIR__ . '/../../VeniceAI.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    echo "\n=== Example 1: Basic Streaming ===\n\n";

    // Create a streaming chat completion
    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'user',
                'content' => 'Write a story about an adventure, one sentence at a time.'
            ]
        ],
        'default',
        [
            'stream' => true,  // Enable streaming
            'temperature' => 0.9,  // Higher temperature for creative writing
            'max_completion_tokens' => 200
        ]
    );

    // Process the streaming response
    $fullResponse = '';
    $chunks = explode("\n", $response);
    
    foreach ($chunks as $chunk) {
        if (strpos($chunk, 'data: ') === 0) {
            $json = substr($chunk, 6); // Remove "data: " prefix
            
            if ($json === '[DONE]') continue;
            
            // Fix malformed JSON by adding missing commas
            $json = preg_replace('/"([^"]+)""/', '"$1","', $json);
            $data = json_decode($json, true);
            
            if ($data && isset($data['choices'][0]['delta']['content'])) {
                $text = $data['choices'][0]['delta']['content'];
                echo $text;
                $fullResponse .= $text;
                
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                @flush();
            }
        }
    }

    echo "\n=== Full Response Received ===\n\n";
    echo $fullResponse . "\n";

    // Example 2: Streaming with a progress counter
    echo "\n=== Example 2: Streaming with Progress ===\n\n";

    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'user',
                'content' => 'List 5 interesting facts about space.'
            ]
        ],
        'default',
        ['stream' => true]
    );

    $factCount = 0;
    $currentFact = '';
    $totalFacts = 5;
    $fullResponse = '';
    $chunks = explode("\n", $response);
    
    foreach ($chunks as $chunk) {
        if (strpos($chunk, 'data: ') === 0) {
            $json = substr($chunk, 6);
            
            if ($json === '[DONE]') continue;
            
            $json = preg_replace('/"([^"]+)""/', '"$1","', $json);
            $data = json_decode($json, true);
            
            if ($data && isset($data['choices'][0]['delta']['content'])) {
                $text = $data['choices'][0]['delta']['content'];
                echo $text;
                $fullResponse .= $text;
                $currentFact .= $text;
                
                if (strpos($text, "\n") !== false) {
                    $factCount++;
                    $progress = ($factCount / $totalFacts) * 100;
                    echo "\nFact $factCount of $totalFacts received... (" . number_format($progress, 1) . "% complete)\n";
                    $currentFact = '';
                }
                
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                @flush();
            }
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output streaming tips
echo "\n=== Streaming Tips ===\n\n";
echo "- Enable streaming by setting stream=true in your request options\n";
echo "- Use a progress callback to track and display completion status\n";
echo "- Handle output buffering properly to ensure real-time updates\n";
echo "- Process partial responses as they arrive for better user experience\n";
echo "- Consider implementing percentage-based progress indicators\n";
echo "- Add debug mode for troubleshooting streaming issues\n";
echo "- Remember to handle end-of-stream markers ([DONE])\n";