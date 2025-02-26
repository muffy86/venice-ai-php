# Beginner Example: Simple Conversational Agent

This example creates a very simple conversational agent using the Venice AI PHP SDK. It's perfect for beginners who want to understand the basics of building an AI agent.

## What This Agent Does

- Maintains a simple conversation with the user
- Remembers basic user information (name, preferences)
- Provides responses using Venice AI
- Includes minimal error handling
- Has a simple command system

## The Code

```php
<?php
/**
 * Simple Conversational Agent
 * 
 * A beginner-friendly example of an AI agent that can maintain a conversation
 * and remember basic information about the user.
 */

// Load the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * ConversationalAgent Class
 */
class ConversationalAgent {
    // Venice AI client
    private $venice;
    
    // Conversation history
    private $conversationHistory = [];
    
    // User information
    private $userInfo = [
        'name' => null,
        'preferences' => []
    ];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     */
    public function __construct($apiKey) {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
    }
    
    /**
     * Process a message from the user and generate a response
     * 
     * @param string $message User's message
     * @return string Agent's response
     */
    public function chat($message) {
        // Add user message to history
        $this->addToHistory('user', $message);
        
        // Check for special commands
        $commandResponse = $this->handleCommands($message);
        if ($commandResponse) {
            $this->addToHistory('assistant', $commandResponse);
            return $commandResponse;
        }
        
        // Try to extract user information
        $this->extractUserInfo($message);
        
        // Generate response using Venice AI
        try {
            $response = $this->generateResponse();
            $this->addToHistory('assistant', $response);
            return $response;
        } catch (Exception $e) {
            $errorResponse = "I'm sorry, I encountered an error: " . $e->getMessage();
            $this->addToHistory('assistant', $errorResponse);
            return $errorResponse;
        }
    }
    
    /**
     * Handle special commands
     * 
     * @param string $message User's message
     * @return string|null Response to command or null if not a command
     */
    private function handleCommands($message) {
        $message = strtolower(trim($message));
        
        // Clear conversation command
        if ($message === 'clear' || $message === 'clear conversation') {
            $this->conversationHistory = [];
            return "Conversation has been cleared.";
        }
        
        // Help command
        if ($message === 'help') {
            return "I'm a simple conversational agent. You can talk to me about anything! " .
                   "Special commands: 'clear' to reset the conversation, 'info' to see what I know about you.";
        }
        
        // Show user info command
        if ($message === 'info' || $message === 'what do you know about me') {
            return $this->getUserInfoResponse();
        }
        
        // Not a command
        return null;
    }
    
    /**
     * Extract user information from the message
     * 
     * @param string $message User's message
     */
    private function extractUserInfo($message) {
        // Extract name (simple pattern matching)
        if (preg_match('/my name is ([a-z\s]+)/i', $message, $matches)) {
            $this->userInfo['name'] = trim($matches[1]);
        }
        
        // Extract preferences (simple pattern matching)
        if (preg_match('/i (?:like|love|enjoy) ([a-z\s]+)/i', $message, $matches)) {
            $preference = trim($matches[1]);
            if (!in_array($preference, $this->userInfo['preferences'])) {
                $this->userInfo['preferences'][] = $preference;
            }
        }
    }
    
    /**
     * Generate a response using Venice AI
     * 
     * @return string Generated response
     */
    private function generateResponse() {
        // Prepare messages for the AI
        $messages = $this->prepareMessages();
        
        // Get response from Venice AI
        $response = $this->venice->createChatCompletion($messages);
        
        // Return the response content
        return $response['choices'][0]['message']['content'];
    }
    
    /**
     * Prepare messages for Venice AI
     * 
     * @return array Messages for Venice AI
     */
    private function prepareMessages() {
        // Create system message
        $systemMessage = "You are a friendly and helpful assistant. ";
        
        // Add user info to system message if available
        if ($this->userInfo['name']) {
            $systemMessage .= "The user's name is " . $this->userInfo['name'] . ". ";
        }
        
        if (!empty($this->userInfo['preferences'])) {
            $systemMessage .= "The user enjoys: " . implode(', ', $this->userInfo['preferences']) . ". ";
        }
        
        $systemMessage .= "Keep your responses friendly and concise.";
        
        // Start with system message
        $messages = [
            ['role' => 'system', 'content' => $systemMessage]
        ];
        
        // Add conversation history (last 10 messages)
        $recentHistory = array_slice($this->conversationHistory, -10);
        $messages = array_merge($messages, $recentHistory);
        
        return $messages;
    }
    
    /**
     * Add a message to the conversation history
     * 
     * @param string $role The role ('user' or 'assistant')
     * @param string $content The message content
     */
    private function addToHistory($role, $content) {
        $this->conversationHistory[] = [
            'role' => $role,
            'content' => $content
        ];
    }
    
    /**
     * Get response about user information
     * 
     * @return string Response with user information
     */
    private function getUserInfoResponse() {
        if (!$this->userInfo['name'] && empty($this->userInfo['preferences'])) {
            return "I don't know anything about you yet. You can tell me your name and what you like!";
        }
        
        $response = "Here's what I know about you:";
        
        if ($this->userInfo['name']) {
            $response .= "\n- Your name is " . $this->userInfo['name'];
        }
        
        if (!empty($this->userInfo['preferences'])) {
            $response .= "\n- You enjoy: " . implode(', ', $this->userInfo['preferences']);
        }
        
        return $response;
    }
}
```

## How to Use This Agent

1. Save the code above as `conversational_agent.php`
2. Create a simple interface script to interact with the agent:

```php
<?php
// Include the agent class
require_once 'conversational_agent.php';

// Replace with your Venice AI API key
$apiKey = 'your_venice_api_key_here';

// Create a new agent
$agent = new ConversationalAgent($apiKey);

// Simple command-line interface
echo "Simple Conversational Agent (type 'exit' to quit)\n";
echo "------------------------------------------------\n";
echo "Type 'help' for available commands\n\n";

while (true) {
    // Get user input
    echo "You: ";
    $input = trim(fgets(STDIN));
    
    // Exit if requested
    if (strtolower($input) === 'exit') {
        break;
    }
    
    // Get response from agent
    $response = $agent->chat($input);
    
    // Display response
    echo "Agent: " . $response . "\n\n";
}
```

3. Run the script from the command line:
```
php agent_interface.php
```

## Key Learning Points

1. **Basic Agent Structure** - The agent has methods for processing input, generating responses, and maintaining state.

2. **Conversation History** - The agent stores conversation history to provide context for the AI.

3. **Simple Memory** - The agent extracts and remembers basic information about the user.

4. **Command System** - The agent recognizes and handles special commands like 'help' and 'clear'.

5. **Error Handling** - The agent catches exceptions and provides friendly error messages.

## Extending This Agent

Here are some ways to extend this simple agent:

1. **Add more commands** - Create additional special commands for specific functionality.

2. **Improve information extraction** - Use more sophisticated patterns to extract information.

3. **Add persistence** - Save conversation history and user information to a file or database.

4. **Create a web interface** - Build a simple web UI for the agent using HTML, CSS, and JavaScript.

5. **Add more context** - Include more context information like the current time and date.