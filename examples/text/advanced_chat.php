<?php
/**
 * Venice AI API Example: Advanced Chat Features
 * 
 * This example demonstrates advanced chat completion features:
 * 1. System messages to control AI behavior
 * 2. Temperature and other generation parameters
 * 3. Token limits and penalties
 * 4. Venice-specific parameters
 * 5. Stop sequences
 * 
 * After understanding basic_chat.php, this example shows you
 * how to fine-tune the AI's behavior for specific use cases.
 */

require_once __DIR__ . '/../../VeniceAI.php';
require_once __DIR__ . '/../utils.php';
$config = require_once __DIR__ . '/../config.php';

// Initialize the Venice AI client
$venice = new VeniceAI($config['api_key'], true);

try {
    // Example 1: Using system message and temperature
    printSection("Example 1: System Message and Temperature");
    
    $response = $venice->createChatCompletion(
        [
            // System message sets the behavior
            [
                'role' => 'system',
                'content' => 'You are a professional science writer who explains complex topics simply.'
            ],
            [
                'role' => 'user',
                'content' => 'Explain quantum computing.'
            ]
        ],
        'default',  // model
        [
            'temperature' => 0.7,  // Lower = more focused, Higher = more creative
            'max_completion_tokens' => 200  // Limit response length
        ]
    );
    
    printResponse($response['choices'][0]['message']['content'], "Response with temperature 0.7");

    // Example 2: Using penalties to control repetition
    printSection("Example 2: Using Penalties");
    
    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'user',
                'content' => 'Write a creative story about a robot.'
            ]
        ],
        'default',
        [
            'temperature' => 0.9,
            'frequency_penalty' => 0.7,  // Reduces repetition of specific tokens
            'presence_penalty' => 0.7    // Encourages covering new topics
        ]
    );
    
    printResponse($response['choices'][0]['message']['content'], "Response with penalties");

    // Example 3: Using Venice parameters and stop sequences
    printSection("Example 3: Venice Parameters and Stop Sequences");
    
    $response = $venice->createChatCompletion(
        [
            [
                'role' => 'user',
                'content' => 'Tell me a joke.'
            ]
        ],
        'default',
        [
            'venice_parameters' => [
                'include_venice_system_prompt' => false,  // Don't include default system prompt
                'character_slug' => 'comedian'  // Use comedian character preset
            ],
            'stop' => ['Q:', 'A:'],  // Stop generating at these sequences
            'top_p' => 0.9  // Nucleus sampling parameter
        ]
    );
    
    printResponse($response['choices'][0]['message']['content'], "Response with custom parameters");

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output parameter explanations
printSection("Parameter Guide");
echo "temperature: Controls randomness (0.0 - 2.0)\n";
echo "top_p: Alternative to temperature, controls token selection\n";
echo "frequency_penalty: Reduces token repetition (-2.0 - 2.0)\n";
echo "presence_penalty: Encourages new topics (-2.0 - 2.0)\n";
echo "max_completion_tokens: Limits response length\n";
echo "stop: Array of sequences where generation should stop\n";

printSection("Venice Parameters");
echo "include_venice_system_prompt: Include default system prompt\n";
echo "character_slug: Use predefined character personalities\n";