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
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    printSection("Example 1: Basic Streaming");

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
    $fullResponse = handleStreamingResponse($response);

    printSection("Full Response Received");
    echo $fullResponse . "\n";

    // Example 2: Streaming with a progress counter
    printSection("Example 2: Streaming with Progress");

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
    
    // Custom progress callback for fact counting
    $progressCallback = function($text) use (&$factCount, &$currentFact, $totalFacts) {
        $currentFact .= $text;
        
        // Check if we've received a complete fact
        if (strpos($text, "\n") !== false) {
            $factCount++;
            $progress = ($factCount / $totalFacts) * 100;
            echo "\nFact $factCount of $totalFacts received... (" . number_format($progress, 1) . "% complete)\n";
            $currentFact = '';
        }
    };

    handleStreamingResponse($response, $progressCallback);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output streaming tips
printSection("Streaming Tips");
echo "- Enable streaming by setting stream=true in your request options\n";
echo "- Use a progress callback to track and display completion status\n";
echo "- Handle output buffering properly to ensure real-time updates\n";
echo "- Process partial responses as they arrive for better user experience\n";
echo "- Consider implementing percentage-based progress indicators\n";
echo "- Add debug mode for troubleshooting streaming issues\n";
echo "- Remember to handle end-of-stream markers ([DONE])\n";