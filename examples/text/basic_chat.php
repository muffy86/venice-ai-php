<?php
/**
 * Venice AI API Example: Basic Chat Completion
 * 
 * This example demonstrates the simplest way to:
 * 1. Create a chat completion
 * 2. Handle the response
 * 3. Display the generated text
 * 
 * This is the starting point for text generation - once you understand
 * this, see advanced_chat.php for more options and features.
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

try {
    // Create a simple chat completion
    // This is the most basic way to get a response from the AI
    $response = $venice->createChatCompletion([
        [
            'role' => 'user',
            'content' => 'What is artificial intelligence?'
        ]
    ]);

    // The response contains various metadata, but we're most interested
    // in the actual message content
    $answer = $response['choices'][0]['message']['content'];
    
    echo "Question: What is artificial intelligence?\n";
    echo "Answer: $answer\n";

    // You can also have a multi-turn conversation
    echo "\nLet's have a follow-up question...\n";
    
    $response = $venice->createChatCompletion([
        [
            'role' => 'user',
            'content' => 'What is artificial intelligence?'
        ],
        [
            'role' => 'assistant',
            'content' => $answer
        ],
        [
            'role' => 'user',
            'content' => 'What are some real-world applications of AI?'
        ]
    ]);

    echo "\nQuestion: What are some real-world applications of AI?\n";
    echo "Answer: " . $response['choices'][0]['message']['content'] . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output usage tips
echo "\nUsage Tips:\n";
echo "- Each message must have a 'role' and 'content'\n";
echo "- Roles can be: 'user', 'assistant', or 'system'\n";
echo "- Include previous messages for context in multi-turn conversations\n";
echo "- The response is always in choices[0].message.content\n";