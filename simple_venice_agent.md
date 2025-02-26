# Simple Venice AI Agent Implementation

Let's create a simple but functional agent using the Venice AI PHP SDK. This example demonstrates a single-file implementation that you can easily try out.

## What This Agent Does

This simple agent can:
1. Process user queries using Venice AI
2. Handle basic commands without using AI (for efficiency)
3. Maintain a basic conversation history
4. Extract and remember information from the conversation
5. Perform simple tasks like retrieving weather data

## Implementation

Save this code as `simple_venice_agent.php`:

```php
<?php
/**
 * Simple Venice AI Agent
 * 
 * A minimal implementation of an AI agent using the Venice AI PHP SDK.
 * This demonstrates the core concepts of an agent without unnecessary complexity.
 */

// Include the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * SimpleVeniceAgent class
 */
class SimpleVeniceAgent {
    /** @var VeniceAI Venice AI client */
    private $venice;
    
    /** @var array Conversation history */
    private $history = [];
    
    /** @var array Agent's memory/state */
    private $memory = [
        'user_name' => null,
        'user_location' => null,
        'last_query_time' => null,
        'interactions' => 0
    ];
    
    /** @var array Mock weather data for demonstration */
    private $weatherData = [
        'new york' => ['temp' => 72, 'condition' => 'Sunny'],
        'san francisco' => ['temp' => 65, 'condition' => 'Foggy'],
        'miami' => ['temp' => 85, 'condition' => 'Clear'],
        'chicago' => ['temp' => 45, 'condition' => 'Windy'],
        'london' => ['temp' => 60, 'condition' => 'Rainy'],
        'tokyo' => ['temp' => 70, 'condition' => 'Partly Cloudy']
    ];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     */
    public function __construct(string $apiKey) {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
    }
    
    /**
     * Process a user query and generate a response
     * 
     * @param string $query User query
     * @return string Agent response
     */
    public function processQuery(string $query): string {
        // Track interaction
        $this->memory['interactions']++;
        $this->memory['last_query_time'] = time();
        
        // Add user query to history
        $this->addToHistory('user', $query);
        
        // Try to handle query directly without AI
        $directResponse = $this->handleDirectCommands($query);
        if ($directResponse !== null) {
            $this->addToHistory('assistant', $directResponse);
            return $directResponse;
        }
        
        // Try to extract information from query
        $this->extractInformation($query);
        
        // Process with Venice AI
        $aiResponse = $this->getAIResponse($query);
        $this->addToHistory('assistant', $aiResponse);
        
        return $aiResponse;
    }
    
    /**
     * Handle direct commands without using AI
     * 
     * @param string $query User query
     * @return string|null Response or null if not a direct command
     */
    private function handleDirectCommands(string $query): ?string {
        $query = strtolower(trim($query));
        
        // Time command
        if (preg_match('/^(what\s+)?time(\s+is\s+it)?(\?)?$/', $query)) {
            return "It's currently " . date('h:i A') . ".";
        }
        
        // Date command
        if (preg_match('/^(what\s+)?date(\s+is\s+it)?(\?)?$/', $query)) {
            return "Today is " . date('l, F j, Y') . ".";
        }
        
        // Help command
        if ($query === 'help') {
            return "I'm a simple AI agent that can help with basic tasks. Try asking me about the time, date, weather, or any general questions.";
        }
        
        // Weather command
        if (preg_match('/weather\s+in\s+([a-z\s]+)(\?)?$/i', $query, $matches)) {
            $location = strtolower(trim($matches[1]));
            return $this->getWeather($location);
        }
        
        // Memory command
        if ($query === 'what do you know about me?' || $query === 'what do you remember?') {
            return $this->getMemoryResponse();
        }
        
        // Not a direct command
        return null;
    }
    
    /**
     * Get weather information for a location
     * 
     * @param string $location Location name
     * @return string Weather information
     */
    private function getWeather(string $location): string {
        if (isset($this->weatherData[$location])) {
            $weather = $this->weatherData[$location];
            return "The weather in " . ucwords($location) . " is currently " . 
                   $weather['temp'] . "°F and " . $weather['condition'] . ".";
        }
        
        return "I don't have weather information for " . ucwords($location) . ".";
    }
    
    /**
     * Get a response based on the agent's memory
     * 
     * @return string Memory response
     */
    private function getMemoryResponse(): string {
        $response = "Here's what I know about you:\n";
        
        if ($this->memory['user_name']) {
            $response .= "- Your name is " . $this->memory['user_name'] . "\n";
        }
        
        if ($this->memory['user_location']) {
            $response .= "- You're located in " . $this->memory['user_location'] . "\n";
        }
        
        $response .= "- We've had " . $this->memory['interactions'] . " interactions so far\n";
        
        if (empty($this->memory['user_name']) && empty($this->memory['user_location'])) {
            $response = "I don't know much about you yet. You can tell me your name and location.";
        }
        
        return $response;
    }
    
    /**
     * Extract information from user query
     * 
     * @param string $query User query
     */
    private function extractInformation(string $query): void {
        // Extract name
        if (preg_match('/my\s+name\s+is\s+([a-z\s]+)(\.|,|\s)/i', $query, $matches)) {
            $this->memory['user_name'] = ucwords(trim($matches[1]));
        }
        
        // Extract location
        if (preg_match('/i\s+(?:live|am)\s+(?:in|from)\s+([a-z\s]+)(\.|,|\s)/i', $query, $matches)) {
            $this->memory['user_location'] = ucwords(trim($matches[1]));
        }
    }
    
    /**
     * Get response from Venice AI
     * 
     * @param string $query User query
     * @return string AI response
     */
    private function getAIResponse(string $query): string {
        // Prepare messages for the AI
        $messages = $this->prepareMessages();
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            return $response['choices'][0]['message']['content'];
        } catch (\Exception $e) {
            // Handle errors
            return "I'm sorry, I encountered an error: " . $e->getMessage();
        }
    }
    
    /**
     * Prepare messages for Venice AI
     * 
     * @return array Messages for Venice AI
     */
    private function prepareMessages(): array {
        // System instructions
        $systemPrompt = "You are a helpful AI assistant. ";
        
        // Add memory context to system prompt
        if ($this->memory['user_name']) {
            $systemPrompt .= "The user's name is " . $this->memory['user_name'] . ". ";
        }
        
        if ($this->memory['user_location']) {
            $systemPrompt .= "The user is located in " . $this->memory['user_location'] . ". ";
        }
        
        $systemPrompt .= "Respond in a friendly, concise manner. The current time is " . 
                          date('h:i A') . " and the date is " . date('l, F j, Y') . ".";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        
        // Add the most recent conversation history (last 5 exchanges)
        $recentHistory = array_slice($this->history, -10);
        $messages = array_merge($messages, $recentHistory);
        
        return $messages;
    }
    
    /**
     * Add a message to the conversation history
     * 
     * @param string $role Message role ('user' or 'assistant')
     * @param string $content Message content
     */
    private function addToHistory(string $role, string $content): void {
        $this->history[] = [
            'role' => $role,
            'content' => $content
        ];
    }
    
    /**
     * Get the agent's memory
     * 
     * @return array Agent's memory
     */
    public function getMemory(): array {
        return $this->memory;
    }
    
    /**
     * Get the conversation history
     * 
     * @return array Conversation history
     */
    public function getHistory(): array {
        return $this->history;
    }
}

/**
 * Example usage (uncomment to run)
 */
/*
// Create agent
$apiKey = 'your_venice_api_key_here';
$agent = new SimpleVeniceAgent($apiKey);

// Interactive console
echo "Simple Venice AI Agent (type 'exit' to quit)\n";
echo "---------------------------------------------\n";

while (true) {
    echo "\nYou: ";
    $input = trim(fgets(STDIN));
    
    if ($input === 'exit') {
        break;
    }
    
    $response = $agent->processQuery($input);
    echo "Agent: " . $response . "\n";
}
*/
```

## How To Use This Agent

1. Copy the `simple_venice_agent.php` file into your Venice AI PHP SDK directory (where `VeniceAI.php` is located)

2. Create a test script called `test_agent.php`:

```php
<?php
// Include the agent class
require_once 'simple_venice_agent.php';

// Configure your API key
$apiKey = 'your_venice_api_key_here';  // Replace with your actual API key

// Create a new agent
$agent = new SimpleVeniceAgent($apiKey);

// Function to display the agent's response
function showResponse($query, $agent) {
    echo "\nYou: $query\n";
    $response = $agent->processQuery($query);
    echo "Agent: $response\n";
    echo "---------------------------------------------\n";
}

// Test the agent with a series of queries
echo "SIMPLE VENICE AI AGENT DEMO\n";
echo "============================\n";

// Basic greeting
showResponse("Hello there!", $agent);

// Introduce yourself
showResponse("My name is Alex and I live in New York.", $agent);

// Ask for the time (direct command)
showResponse("What time is it?", $agent);

// Ask about the weather (direct command)
showResponse("Weather in New York?", $agent);

// Ask a general question (uses AI)
showResponse("What are some good books to read?", $agent);

// Test memory
showResponse("What do you know about me?", $agent);

// Ask another general question (uses AI)
showResponse("Tell me a short story about a robot.", $agent);
```

3. Run the test script:

```
php test_agent.php
```

## Key Features Demonstrated

This simple agent demonstrates several key features:

1. **Efficient Command Handling**: Direct commands are handled without using the AI, improving response time and reducing API calls

2. **Information Extraction**: The agent can extract and remember information about the user

3. **Memory**: The agent maintains a memory of the user and conversation 

4. **Task Execution**: The agent can perform tasks like getting weather information

5. **Context Management**: The agent includes relevant context in AI requests

6. **Conversation History**: The agent maintains conversation history for context

## Making It Your Own

You can extend this simple agent by:

1. Adding more direct commands
2. Enhancing information extraction
3. Adding integration with external APIs
4. Implementing more sophisticated memory management
5. Adding function-calling capabilities

## What Makes This An "Agent"?

This script can be considered an "agent" because it:

1. Has some autonomy in deciding how to handle inputs
2. Maintains state and memory across interactions
3. Can perform tasks based on understanding user input
4. Can extract and remember information
5. Uses AI for understanding and decision-making

The key characteristic of an agent is that it doesn't just relay information to and from an API - it makes decisions about how to process inputs and what actions to take based on those inputs.

## Next Steps

To build upon this simple agent, you could:

1. Implement more sophisticated memory management (database storage)
2. Add more complex function calling
3. Create a web interface
4. Add tool integration (calculators, web search, etc.)
5. Implement more advanced context handling