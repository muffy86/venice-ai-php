# Venice Agent Implementation Guide

This document provides detailed implementation instructions for building the Venice Agent demo project. After reviewing this guide, you can switch to Code mode to implement the solution.

## Implementation Steps

1. Create the project directory structure
2. Implement the core files 
3. Create the web interface
4. Test the implementation

## 1. Directory Structure Setup

Create the following directory structure:

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
    │   └── style.css          # CSS for the web interface
    ├── js/
    │   └── script.js          # JavaScript for the web interface
```

## 2. Implementation Guide for Core Files

### 2.1 config.php

Create a configuration file with your Venice AI API key:

```php
<?php
/**
 * Venice Agent Configuration File
 */
return [
    // Your Venice AI API key
    'api_key' => 'your-venice-api-key-here',
    
    // Debug mode (set to true for development)
    'debug' => true,
    
    // Maximum conversation history to maintain
    'max_history' => 10,
    
    // Default model to use
    'model' => 'default',
    
    // Agent personality (system prompt)
    'personality' => 'You are a helpful AI assistant powered by Venice.ai. You can answer questions and perform tasks using your available functions.'
];
```

### 2.2 agent.php

Implement the core Agent class that processes user messages and manages the workflow:

```php
<?php
require_once __DIR__ . '/tools/MemoryManager.php';
require_once __DIR__ . '/tools/FunctionRegistry.php';
require_once __DIR__ . '/VeniceAI.php';

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
        $this->venice = new VeniceAI($config['api_key'] ?? null, $config['debug'] ?? false);
        $this->memory = new MemoryManager($config['max_history'] ?? 10);
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
        $response = $this->venice->createChatCompletion(
            $messages,
            $this->config['model'] ?? 'default',
            [
                'temperature' => 0.7,
                'max_tokens' => 500
            ]
        );
        
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
        $content = $response['choices'][0]['message']['content'] ?? '';
        
        if (preg_match('/FUNCTION:\s*(\w+)/i', $content, $matches)) {
            return trim($matches[1]);
        }
        
        return '';
    }
    
    /**
     * Extract function parameters from response
     * 
     * @param array $response Venice AI response
     * @return array Function parameters
     */
    private function extractFunctionParameters(array $response): array {
        $content = $response['choices'][0]['message']['content'] ?? '';
        
        if (preg_match('/PARAMETERS:\s*(\{.*\})/is', $content, $matches)) {
            $paramJson = trim($matches[1]);
            try {
                return json_decode($paramJson, true) ?? [];
            } catch (\Exception $e) {
                return [];
            }
        }
        
        return [];
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
        $response = $this->venice->createChatCompletion(
            $messages,
            $this->config['model'] ?? 'default',
            [
                'temperature' => 0.7,
                'max_tokens' => 500
            ]
        );
        
        return $response['choices'][0]['message']['content'];
    }
    
    /**
     * Get the system prompt with function descriptions
     * 
     * @return string System prompt
     */
    private function getSystemPrompt(): string {
        $functionDescriptions = $this->functions->getDescriptions();
        
        $prompt = $this->config['personality'] ?? "You are a helpful AI assistant powered by Venice.ai. ";
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
        $this->functions->register('search', 'Search for information. Parameters: query (string)', function ($parameters) {
            $query = $parameters['query'] ?? '';
            
            // Simulate search results
            $results = [
                "Found 5 results for: {$query}",
                "1. Example result 1 about {$query}",
                "2. Example result 2 about {$query}",
                "3. Example result 3 about {$query}"
            ];
            
            return implode("\n", $results);
        });
        
        // Register weather function
        $this->functions->register('weather', 'Get weather information for a location. Parameters: location (string)', function ($parameters) {
            $location = $parameters['location'] ?? '';
            
            // Simulate weather data
            $weatherData = [
                'New York' => ['temperature' => 72, 'condition' => 'Sunny'],
                'London' => ['temperature' => 65, 'condition' => 'Cloudy'],
                'Tokyo' => ['temperature' => 80, 'condition' => 'Partly Cloudy'],
                'Sydney' => ['temperature' => 85, 'condition' => 'Clear']
            ];
            
            $weather = $weatherData[$location] ?? ['temperature' => 70, 'condition' => 'Unknown'];
            
            return "Weather for {$location}: {$weather['temperature']}°F, {$weather['condition']}";
        });
        
        // Register schedule function
        $this->functions->register('schedule', 'Schedule an event. Parameters: event (string), date (string), time (string)', function ($parameters) {
            $event = $parameters['event'] ?? '';
            $date = $parameters['date'] ?? '';
            $time = $parameters['time'] ?? '';
            
            return "Scheduled: {$event} on {$date} at {$time}";
        });
    }
    
    /**
     * Get conversation history
     * 
     * @return array Conversation history
     */
    public function getConversationHistory(): array {
        return $this->memory->getConversationHistory();
    }
    
    /**
     * Clear conversation history
     */
    public function clearConversation(): void {
        $this->memory->clearHistory();
    }
}
```

### 2.3 tools/MemoryManager.php

Implement the MemoryManager class that manages conversation history:

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
    private $maxHistory;
    
    /**
     * Constructor
     * 
     * @param int $maxHistory Maximum number of messages to keep
     */
    public function __construct(int $maxHistory = 10) {
        $this->maxHistory = $maxHistory;
    }
    
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
     * Clear conversation history
     */
    public function clearHistory(): void {
        $this->history = [];
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

### 2.4 tools/FunctionRegistry.php

Implement the FunctionRegistry class that manages agent functions:

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
    
    /**
     * Check if a function is registered
     * 
     * @param string $name Function name
     * @return bool True if the function is registered
     */
    public function hasFunction(string $name): bool {
        return isset($this->functions[$name]);
    }
    
    /**
     * Get all registered function names
     * 
     * @return array Function names
     */
    public function getFunctionNames(): array {
        return array_keys($this->functions);
    }
}
```

## 3. Web Interface Implementation

### 3.1 index.php

Create the main entry point for the web interface:

```php
<?php
require_once __DIR__ . '/agent.php';

// Start session for state management
session_start();

// Clear conversation if requested
if (isset($_GET['clear']) && $_GET['clear'] == 1) {
    unset($_SESSION['conversation']);
    header('Location: index.php');
    exit;
}

// Initialize agent
$config = require __DIR__ . '/config.php';
$agent = new Agent($config);

// Process message if submitted
$response = '';
$message = '';
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
                    <p>Try asking about the weather, scheduling an event, or searching for information.</p>
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
            <input type="text" name="message" placeholder="Type your message..." required autofocus>
            <button type="submit">Send</button>
        </form>
        
        <div class="actions">
            <a href="?clear=1" class="clear-btn" onclick="return confirm('Are you sure you want to clear the conversation?')">Clear Conversation</a>
        </div>
    </div>
    
    <script src="web/js/script.js"></script>
</body>
</html>
```

### 3.2 web/css/style.css

Create the CSS file for styling the web interface:

```css
/* Base styles */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    color: #0066cc;
    margin-bottom: 30px;
}

/* Conversation area */
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

/* Form styles */
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

/* Action buttons */
.actions {
    text-align: center;
}

.clear-btn {
    display: inline-block;
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
}

.clear-btn:hover {
    background-color: #d32f2f;
}
```

### 3.3 web/js/script.js

Create the JavaScript file for the web interface:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Scroll conversation to bottom
    const conversation = document.querySelector('.conversation');
    conversation.scrollTop = conversation.scrollHeight;
    
    // Auto-submit form when Enter key is pressed
    const messageForm = document.querySelector('.message-form');
    const inputField = document.querySelector('.message-form input');
    
    if (inputField && messageForm) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                messageForm.submit();
            }
        });
    }
});
```

## 4. Custom Function Examples

### 4.1 functions/WeatherFunction.php

Example of a dedicated weather function class:

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
     * Format weather data as a string
     * 
     * @param string $location Location name
     * @return string Formatted weather data
     */
    public function getWeatherString(string $location): string {
        $weather = $this->getWeather($location);
        return "Weather for {$location}: {$weather['temperature']}°F, {$weather['condition']}";
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

### 4.2 functions/SearchFunction.php

Example of a dedicated search function class:

```php
<?php
/**
 * Search Function
 * 
 * Simulates searching for information
 */
class SearchFunction {
    /**
     * Search for information
     * 
     * @param string $query Search query
     * @return array Search results
     */
    public function search(string $query): array {
        // Simulate search results
        $results = [
            "Found " . rand(3, 10) . " results for: {$query}",
            "1. Example result 1 about {$query}",
            "2. Example result 2 about {$query}",
            "3. Example result 3 about {$query}"
        ];
        
        return $results;
    }
    
    /**
     * Format search results as a string
     * 
     * @param string $query Search query
     * @return string Formatted search results
     */
    public function searchString(string $query): string {
        $results = $this->search($query);
        return implode("\n", $results);
    }
    
    /**
     * Get the function description for the agent
     * 
     * @return string Function description
     */
    public static function getDescription(): string {
        return "Search for information. Parameters: query (string)";
    }
}
```

## 5. Testing the Implementation

To test your implementation:

1. Set up a local PHP server:
   ```
   cd venice-agent
   php -S localhost:8000
   ```

2. Open a web browser and go to `http://localhost:8000`

3. Start interacting with the agent by sending messages

4. Test each of the functions:
   - Ask about the weather: "What's the weather in New York?"
   - Search for information: "Search for artificial intelligence"
   - Schedule an event: "Schedule a meeting with John tomorrow at 2pm"

## 6. Extension Ideas

Once you have the basic agent working, you could extend it in the following ways:

1. **Add more functions**:
   - Translation function
   - Summarization function
   - Image generation function (using Venice's image generation capabilities)

2. **Improve function calling**:
   - Use a more robust method for function detection and parameter extraction
   - Add validation for function parameters

3. **Enhance memory management**:
   - Implement persistent storage (database or file-based)
   - Add context summarization for longer conversations

4. **Improve the web interface**:
   - Add a loading indicator during response generation
   - Implement real-time updates with websockets
   - Add support for rich responses (formatted text, images, etc.)

5. **Create a command-line interface**:
   - Add support for interacting with the agent from the command line

## 7. Switching to Code Mode

Now that you have a detailed implementation plan, you can switch to Code mode to implement the solution. The Code mode will allow you to create and edit the PHP files needed for this project.