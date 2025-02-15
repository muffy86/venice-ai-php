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

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

try {
    echo "Starting streaming response...\n";
    echo str_repeat("-", 50) . "\n";

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

    // In streaming mode, we get multiple chunks of data
    // Each chunk contains a piece of the response
    $fullResponse = '';
    
    // Process each chunk as it arrives
    foreach ($response as $chunk) {
        if (isset($chunk['choices'][0]['message']['content'])) {
            $text = $chunk['choices'][0]['message']['content'];
            echo $text;  // Print each piece as it arrives
            $fullResponse .= $text;
            
            // Flush output buffer to show text immediately
            ob_flush();
            flush();
            
            // Simulate processing delay
            usleep(100000);  // 100ms delay
        }
    }

    echo "\n\nFull response received:\n";
    echo str_repeat("-", 50) . "\n";
    echo $fullResponse . "\n";

    // Example 2: Streaming with a progress counter
    echo "\nExample 2: Streaming with progress\n";
    echo str_repeat("-", 50) . "\n";

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
    
    foreach ($response as $chunk) {
        if (isset($chunk['choices'][0]['message']['content'])) {
            $text = $chunk['choices'][0]['message']['content'];
            $currentFact .= $text;
            
            // Check if we've received a complete fact
            if (strpos($text, "\n") !== false) {
                $factCount++;
                echo "Fact $factCount received...\n";
                $currentFact = '';
            }
            
            echo $text;
            ob_flush();
            flush();
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output streaming tips
echo "\nStreaming Tips:\n";
echo "- Use stream=true in options to enable streaming\n";
echo "- Process each chunk as it arrives\n";
echo "- Remember to flush output for real-time display\n";
echo "- Handle partial responses appropriately\n";
echo "- Consider implementing a progress indicator\n";