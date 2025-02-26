# Venice AI Agent Demo Project Plan

## Project Overview

We'll create a demo project called "VeniceAgent" that demonstrates how to build a PHP-based agent using the Venice AI SDK. This agent will be able to:

1. Maintain conversation context and state across interactions
2. Process user requests and execute specific functions
3. Provide responses based on the current state and user input
4. Perform a sequence of actions to complete tasks

## Project Structure

```
venice-agent/
├── config.php                 # Configuration file with API key
├── index.php                  # Main entry point for web interface
├── agent.php                  # Core Agent class
├── functions/                 # Agent functions
│   ├── SearchFunction.php     # Example function to search for information
│   ├── ScheduleFunction.php   # Example function to manage schedules
│   └── WeatherFunction.php    # Example function to get weather data
├── tools/                     # Utility classes
│   ├── MemoryManager.php      # Manages conversation history and context
│   └── FunctionRegistry.php   # Registers and manages available functions
└── web/                       # Web interface assets
    ├── css/
    ├── js/
    └── templates/
```

## Core Components

### 1. Agent Class
The Agent class will be the central component that:
- Initializes the Venice AI client
- Maintains conversation memory
- Routes user requests to appropriate functions
- Manages the overall workflow

### 2. Memory Manager
This component will:
- Store conversation history
- Maintain agent state between interactions
- Provide context for the AI to generate coherent responses

### 3. Function Registry
This component will:
- Register available functions the agent can perform
- Determine which function to call based on user input
- Provide function descriptions to the AI for better understanding

### 4. Example Functions
We'll implement a few example functions to demonstrate the agent's capabilities:
- Search: Simulate searching for information
- Schedule: Manage calendar events and reminders
- Weather: Retrieve weather information for locations

## Implementation Approach

1. **Initialization**: The agent will initialize with a system prompt that defines its capabilities and personality.

2. **Request Processing**:
   - User sends a request
   - Agent processes the request using the Venice AI to understand the intent
   - Agent determines if a specific function needs to be called
   - Agent executes the function and gets the result
   - Agent formulates a response based on the result

3. **Memory Management**:
   - Each interaction is stored in memory
   - Relevant context is included in future AI requests
   - Agent can retrieve past information when needed

4. **Function Execution**:
   - Functions are registered with descriptions
   - When the AI determines a function should be called, it provides parameters
   - The function executes and returns a result
   - The result is incorporated into the response

## Implementation Details

### agent.php - Core Agent Class

The Agent class will:
- Initialize the Venice AI client
- Process user requests
- Maintain conversation context
- Execute functions based on user input
- Generate responses

```php
<?php
/**
 * Agent Class
 * 
 * The main class for the Venice AI Agent, responsible for:
 * - Initializing the Venice AI client
 * - Processing user input
 * - Maintaining conversation context
 * - Executing functions
 * - Generating responses
 */
class Agent {
    /** @var VeniceAI Venice AI client instance */
    private $venice;
    
    /** @var MemoryManager Manages conversation history and context */
    private $memory;
    
    /** @var FunctionRegistry Manages available functions */
    private $functions;
    
    /** @var array Agent configuration */
    private $config;
    
    /**
     * Constructor
     * 
     * @param array $config Configuration options
     */
    public function __construct(array $config = []) {
        $this->config = $config;
        $this->venice = new VeniceAI($config['api_key'] ?? null);
        $this->memory = new MemoryManager();
        $this->functions = new FunctionRegistry();
        
        // Register default functions
        $this->registerDefaultFunctions();
    }
    
    /**
     * Process a user message and generate a response
     * 
     * @param string $message User message
     * @return string Agent response
     */
    public function processMessage(string $message): string {
        // Add user message to memory
        $this->memory->addUserMessage($message);
        
        // Generate AI response
        $response = $this->generateResponse();
        
        // Add AI response to memory
        $this->memory->addAgentMessage($response);
        
        return $response;
    }
    
    /**
     * Generate a response using Venice AI
     * 
     * @return string Generated response
     */
    private function generateResponse(): string {
        // Get conversation history from memory
        $messages = $this->memory->getConversationHistory();
        
        // Add system message with function descriptions
        array_unshift($messages, [
            'role' => 'system',
            'content' => $this->getSystemPrompt()
        ]);
        
        // Get response from Venice AI
        $response = $this->venice->createChatCompletion($messages);
        
        // Check if a function should be called
        if ($this->shouldCallFunction($response)) {
            $functionName = $this->extractFunctionName($response);
            $parameters = $this->extractFunctionParameters($response);
            
            // Call the function
            $result = $this->functions->call($functionName, $parameters);
            
            // Generate a new response with the function result
            return $this->generateResponseWithFunctionResult($functionName, $result);
        }
        
        return $response['choices'][0]['message']['content'];
    }
    
    /**
     * Check if a function should be called based on the AI response
     * 
     * @param array $response Venice AI response
     * @return bool True if a function should be called
     */
    private function shouldCallFunction(array $response): bool {
        // Implementation will depend on how function calls are detected
        // This is a placeholder
        $content = $response['choices'][0]['message']['content'] ?? '';
        return strpos($content, 'FUNCTION:') !== false;
    }
    
    /**
     * Extract function name from response
     * 
     * @param array $response Venice AI response
     * @return string Function name
     */
    private function extractFunctionName(array $response): string {
        // Implementation will depend on the response format
        // This is a placeholder
        return 'search';
    }
    
    /**
     * Extract function parameters from response
     * 
     * @param array $response Venice AI response
     * @return array Function parameters
     */
    private function extractFunctionParameters(array $response): array {
        // Implementation will depend on the response format
        // This is a placeholder
        return ['query' => 'example'];
    }
    
    /**
     * Generate a response that includes function result
     * 
     * @param string $functionName Name of the called function
     * @param mixed $result Function result
     * @return string Generated response
     */
    private function generateResponseWithFunctionResult(string $functionName, $result): string {
        // Add function result to memory
        $this->memory->addFunctionResult($functionName, $result);
        
        // Get conversation history with function result
        $messages = $this->memory->getConversationHistory();
        
        // Add system message
        array_unshift($messages, [
            'role' => 'system',
            'content' => $this->getSystemPrompt()
        ]);
        
        // Get new response from Venice AI
        $response = $this->venice->createChatCompletion($messages);
        
        return $response['choices'][0]['message']['content'];
    }
    
    /**
     * Get the system prompt with function descriptions
     * 
     * @return string System prompt
     */
    private function getSystemPrompt(): string {
        $functionDescriptions = $this->functions->getDescriptions();
        
        $prompt = "You are a helpful AI assistant powered by Venice.ai. ";
        $prompt .= "You can assist with various tasks and have access to the following functions:\n\n";
        
        foreach ($functionDescriptions as $name => $description) {
            $prompt .= "- {$name}: {$description}\n";
        }
        
        $prompt .= "\nWhen you need to use a function, format your response like this:\n";
        $prompt .= "FUNCTION: function_name\n";
        $prompt .= "PARAMETERS: {\"param1\": \"value1\", \"param2\": \"value2\"}\n";
        $prompt .= "REASONING: Brief explanation of why you're calling this function\n";
        
        return $prompt;
    }
    
    /**
     * Register default functions
     */
    private function registerDefaultFunctions(): void {
        // Register search function
        $this->functions->register('search', 'Search for information', function ($parameters) {
            $query = $parameters['query'] ?? '';
            return "Search results for: {$query}";
        });
        
        // Register weather function
        $this->functions->register('weather', 'Get weather information for a location', function ($parameters) {
            $location = $parameters['location'] ?? '';
            return "Weather for {$location}: 72°F, Sunny";
        });
        
        // Register schedule function
        $this->functions->register('schedule', 'Schedule an event', function ($parameters) {
            $event = $parameters['event'] ?? '';
            $date = $parameters['date'] ?? '';
            $time = $parameters['time'] ?? '';
            return "Scheduled: {$event} on {$date} at {$time}";
        });
    }
}
```

### MemoryManager.php

```php
<?php
/**
 * Memory Manager
 * 
 * Manages conversation history and context for the agent
 */
class MemoryManager {
    /** @var array Conversation history */
    private $history = [];
    
    /** @var int Maximum number of messages to keep in memory */
    private $maxHistory = 10;
    
    /**
     * Add a user message to the conversation history
     * 
     * @param string $message User message
     */
    public function addUserMessage(string $message): void {
        $this->history[] = [
            'role' => 'user',
            'content' => $message
        ];
        
        $this->trimHistory();
    }
    
    /**
     * Add an agent message to the conversation history
     * 
     * @param string $message Agent message
     */
    public function addAgentMessage(string $message): void {
        $this->history[] = [
            'role' => 'assistant',
            'content' => $message
        ];
        
        $this->trimHistory();
    }
    
    /**
     * Add a function result to the conversation history
     * 
     * @param string $functionName Name of the function
     * @param mixed $result Function result
     */
    public function addFunctionResult(string $functionName, $result): void {
        $this->history[] = [
            'role' => 'function',
            'name' => $functionName,
            'content' => is_string($result) ? $result : json_encode($result)
        ];
        
        $this->trimHistory();
    }
    
    /**
     * Get the conversation history
     * 
     * @return array Conversation history
     */
    public function getConversationHistory(): array {
        return $this->history;
    }
    
    /**
     * Trim the conversation history to the maximum size
     */
    private function trimHistory(): void {
        if (count($this->history) > $this->maxHistory) {
            $this->history = array_slice($this->history, -$this->maxHistory);
        }
    }
}
```

### FunctionRegistry.php

```php
<?php
/**
 * Function Registry
 * 
 * Manages available functions for the agent
 */
class FunctionRegistry {
    /** @var array Registered functions */
    private $functions = [];
    
    /** @var array Function descriptions */
    private $descriptions = [];
    
    /**
     * Register a function
     * 
     * @param string $name Function name
     * @param string $description Function description
     * @param callable $callback Function callback
     */
    public function register(string $name, string $description, callable $callback): void {
        $this->functions[$name] = $callback;
        $this->descriptions[$name] = $description;
    }
    
    /**
     * Call a registered function
     * 
     * @param string $name Function name
     * @param array $parameters Function parameters
     * @return mixed Function result
     * @throws Exception If the function is not registered
     */
    public function call(string $name, array $parameters = []) {
        if (!isset($this->functions[$name])) {
            throw new Exception("Function not registered: {$name}");
        }
        
        return call_user_func($this->functions[$name], $parameters);
    }
    
    /**
     * Get function descriptions
     * 
     * @return array Function descriptions
     */
    public function getDescriptions(): array {
        return $this->descriptions;
    }
}
```

### Example Function Implementation

Example of a specific function implementation:

```php
<?php
/**
 * Weather Function
 * 
 * Provides weather information for locations
 */
class WeatherFunction {
    /** @var array Mock weather data */
    private $weatherData = [
        'New York' => ['temperature' => 72, 'condition' => 'Sunny'],
        'London' => ['temperature' => 65, 'condition' => 'Cloudy'],
        'Tokyo' => ['temperature' => 80, 'condition' => 'Partly Cloudy'],
        'Sydney' => ['temperature' => 85, 'condition' => 'Clear']
    ];
    
    /**
     * Get weather information for a location
     * 
     * @param string $location Location name
     * @return array Weather information
     */
    public function getWeather(string $location): array {
        // Default weather if location not found
        $default = ['temperature' => 70, 'condition' => 'Unknown'];
        
        // Return weather data for the location or default
        return $this->weatherData[$location] ?? $default;
    }
    
    /**
     * Get the function description for the agent
     * 
     * @return string Function description
     */
    public static function getDescription(): string {
        return "Get weather information for a location. Parameters: location (string)";
    }
}
```

## Web Interface

We'll create a simple web interface (index.php) to interact with the agent:

```php
<?php
require_once 'agent.php';
require_once 'tools/MemoryManager.php';
require_once 'tools/FunctionRegistry.php';
require_once 'config.php';

// Start session for state management
session_start();

// Initialize agent
$config = require 'config.php';
$agent = new Agent($config);

// Process message if submitted
$response = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['message'])) {
    $message = trim($_POST['message']);
    $response = $agent->processMessage($message);
}

// Store conversation history
if (!isset($_SESSION['conversation'])) {
    $_SESSION['conversation'] = [];
}

if (!empty($message) && !empty($response)) {
    $_SESSION['conversation'][] = [
        'user' => $message,
        'agent' => $response
    ];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Venice AI Agent Demo</title>
    <link rel="stylesheet" href="web/css/style.css">
</head>
<body>
    <div class="container">
        <h1>Venice AI Agent Demo</h1>
        
        <div class="conversation">
            <?php if (empty($_SESSION['conversation'])): ?>
                <div class="welcome">
                    <p>Welcome to the Venice AI Agent Demo. Send a message to start the conversation.</p>
                </div>
            <?php else: ?>
                <?php foreach ($_SESSION['conversation'] as $exchange): ?>
                    <div class="message user">
                        <div class="avatar">You</div>
                        <div class="content"><?= htmlspecialchars($exchange['user']) ?></div>
                    </div>
                    <div class="message agent">
                        <div class="avatar">Agent</div>
                        <div class="content"><?= nl2br(htmlspecialchars($exchange['agent'])) ?></div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        
        <form method="post" class="message-form">
            <input type="text" name="message" placeholder="Type your message..." required>
            <button type="submit">Send</button>
        </form>
        
        <div class="actions">
            <form method="post" action="?clear=1">
                <button type="submit" class="clear-btn">Clear Conversation</button>
            </form>
        </div>
    </div>
    
    <script src="web/js/script.js"></script>
</body>
</html>
```

## CSS for the Web Interface

```css
/* web/css/style.css */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    color: #333;
}

.conversation {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
}

.welcome {
    text-align: center;
    color: #666;
    padding: 20px;
}

.message {
    display: flex;
    margin-bottom: 15px;
}

.message .avatar {
    width: 60px;
    font-weight: bold;
    color: #333;
}

.message .content {
    flex: 1;
    padding: 10px 15px;
    border-radius: 8px;
}

.message.user .content {
    background-color: #e6f7ff;
    color: #0066cc;
}

.message.agent .content {
    background-color: #f0f0f0;
    color: #333;
}

.message-form {
    display: flex;
    margin-bottom: 20px;
}

.message-form input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    font-size: 16px;
}

.message-form button {
    padding: 10px 20px;
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    font-size: 16px;
}

.message-form button:hover {
    background-color: #0052a3;
}

.actions {
    text-align: center;
}

.clear-btn {
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.clear-btn:hover {
    background-color: #d32f2f;
}
```

## JavaScript for the Web Interface

```javascript
// web/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // Scroll conversation to bottom
    const conversation = document.querySelector('.conversation');
    conversation.scrollTop = conversation.scrollHeight;
    
    // Clear conversation when clear button is clicked
    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear the conversation?')) {
                // Submit the clear form
                this.closest('form').submit();
            }
        });
    }
    
    // Auto-focus the input field
    const inputField = document.querySelector('.message-form input');
    if (inputField) {
        inputField.focus();
    }
});
```

## Technical Considerations

1. **Error Handling**: The code should include robust error handling for API calls and function execution.

2. **Security**: User input should be properly sanitized to prevent security issues.

3. **Configuration**: The config.php file should store the API key securely.

4. **Performance**: Consider implementing caching for API calls to improve performance.

5. **Scalability**: The architecture should allow for easy addition of new functions.

## Next Steps

1. Implement the core components as outlined above
2. Create the web interface
3. Test with various scenarios
4. Refine based on feedback
5. Add more sophisticated functions as needed

## Possible Extensions

1. **Persistent Storage**: Add a database to store conversations and user preferences.

2. **Multiple Agents**: Allow creating different agents with different personalities and capabilities.

3. **More Functions**: Add more sophisticated functions like:
   - Text-to-image generation
   - Document summarization
   - Language translation
   - Data analysis

4. **Web API**: Create a RESTful API to interact with the agent programmatically.

5. **Authentication**: Add user authentication to support multiple users.