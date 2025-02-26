# Advanced Example: Multi-Function Personal Assistant Agent

This advanced example demonstrates a versatile personal assistant agent that can handle multiple types of tasks. It showcases how to build a more complex agent that integrates multiple functions and has a sophisticated architecture.

## What This Agent Does

- Manages a calendar with events and reminders
- Provides weather forecasts (simulated)
- Takes and retrieves notes
- Answers questions using AI
- Performs web searches (simulated)
- Maintains user preferences and settings
- Handles natural language commands for all functions

## The Code

```php
<?php
/**
 * Multi-Function Personal Assistant Agent
 * 
 * An advanced example of a versatile AI agent that can handle various tasks
 * including calendar management, note-taking, weather information, and more.
 */

// Load the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * PersonalAssistantAgent Class
 */
class PersonalAssistantAgent {
    // Venice AI client
    private $venice;
    
    // Data storage paths
    private $calendarFile;
    private $notesFile;
    private $preferencesFile;
    
    // Data storage
    private $calendar = [];
    private $notes = [];
    private $preferences = [
        'name' => null,
        'defaultLocation' => null,
        'temperatureUnit' => 'celsius',
        'timeFormat' => '24h',
    ];
    
    // Conversation history
    private $conversationHistory = [];
    
    // Available functions (for intent mapping)
    private $functions = [
        'calendar' => ['add_event', 'list_events', 'find_event', 'remove_event', 'update_event'],
        'notes' => ['add_note', 'list_notes', 'find_note', 'remove_note', 'update_note'],
        'weather' => ['current_weather', 'weather_forecast'],
        'search' => ['web_search', 'knowledge_query'],
        'settings' => ['update_preference', 'get_preferences'],
        'help' => ['get_help']
    ];
    
    // Simulated weather data (in a real app, this would come from an API)
    private $weatherData = [
        'new york' => ['temp' => 22, 'condition' => 'Sunny'],
        'london' => ['temp' => 18, 'condition' => 'Rainy'],
        'tokyo' => ['temp' => 28, 'condition' => 'Partly cloudy'],
        'sydney' => ['temp' => 24, 'condition' => 'Sunny'],
        'paris' => ['temp' => 20, 'condition' => 'Partly cloudy']
    ];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     * @param string $dataDir Directory to store data files
     */
    public function __construct($apiKey, $dataDir = './data') {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
        
        // Ensure data directory exists
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        // Set file paths
        $this->calendarFile = $dataDir . '/calendar.json';
        $this->notesFile = $dataDir . '/notes.json';
        $this->preferencesFile = $dataDir . '/preferences.json';
        
        // Load data
        $this->loadData();
    }
    
    /**
     * Process a user message and generate a response
     * 
     * @param string $message User message
     * @return string Agent response
     */
    public function processMessage($message) {
        // Add user message to history
        $this->addToHistory('user', $message);
        
        // Parse intent and parameters
        $intentData = $this->parseIntent($message);
        
        // Execute function based on intent
        $functionResult = $this->executeFunction($intentData);
        
        // Generate response based on function result
        $response = $this->generateResponse($intentData, $functionResult);
        
        // Add response to history
        $this->addToHistory('assistant', $response);
        
        return $response;
    }
    
    /**
     * Parse intent from user message
     * 
     * @param string $message User message
     * @return array Intent data
     */
    private function parseIntent($message) {
        // Prepare system prompt
        $systemPrompt = "You are a personal assistant that analyzes user messages to determine intent. " .
                        "You understand the following categories of intents:\n";
        
        // Add function categories and their intents
        foreach ($this->functions as $category => $intents) {
            $systemPrompt .= "- $category: " . implode(', ', $intents) . "\n";
        }
        
        $systemPrompt .= "\nAnalyze the user message and determine:\n" .
                        "1. The primary intent (one of the listed intents)\n" .
                        "2. The category it belongs to\n" .
                        "3. Any parameters needed for that intent\n\n" .
                        "Respond with a JSON object with this structure:\n" .
                        "{\n" .
                        "  \"category\": \"calendar|notes|weather|search|settings|help\",\n" .
                        "  \"intent\": \"the specific intent from the list\",\n" .
                        "  \"parameters\": {\n" .
                        "    \"param1\": \"value1\",\n" .
                        "    \"param2\": \"value2\"\n" .
                        "  },\n" .
                        "  \"confidence\": 0-1 indicating confidence\n" .
                        "}\n" .
                        "Provide only the JSON without any additional text.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $message]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Extract and parse JSON
            $content = $response['choices'][0]['message']['content'];
            $intentData = json_decode($content, true);
            
            // Validate and return
            if (is_array($intentData) && isset($intentData['category']) && isset($intentData['intent'])) {
                return $intentData;
            }
        } catch (Exception $e) {
            // If API request fails or parsing fails, use fallback parsing
        }
        
        // Fallback intent parsing using simple rules
        return $this->fallbackIntentParsing($message);
    }
    
    /**
     * Fallback intent parsing using simple rules
     * 
     * @param string $message User message
     * @return array Intent data
     */
    private function fallbackIntentParsing($message) {
        $message = strtolower($message);
        
        // Default intent
        $intentData = [
            'category' => 'help',
            'intent' => 'get_help',
            'parameters' => [],
            'confidence' => 0.5
        ];
        
        // Simple pattern matching for calendar
        if (preg_match('/(add|create|schedule)\s+(an?\s+)?(event|appointment|meeting)/i', $message)) {
            $intentData = [
                'category' => 'calendar',
                'intent' => 'add_event',
                'parameters' => [
                    'description' => $message
                ],
                'confidence' => 0.7
            ];
        } elseif (preg_match('/(show|list|what).*events/i', $message)) {
            $intentData = [
                'category' => 'calendar',
                'intent' => 'list_events',
                'parameters' => [],
                'confidence' => 0.7
            ];
        }
        
        // Simple pattern matching for notes
        elseif (preg_match('/(add|create|take|write).*note/i', $message)) {
            $intentData = [
                'category' => 'notes',
                'intent' => 'add_note',
                'parameters' => [
                    'content' => $message
                ],
                'confidence' => 0.7
            ];
        } elseif (preg_match('/(show|list|what).*notes/i', $message)) {
            $intentData = [
                'category' => 'notes',
                'intent' => 'list_notes',
                'parameters' => [],
                'confidence' => 0.7
            ];
        }
        
        // Simple pattern matching for weather
        elseif (preg_match('/weather\s+(?:in|at|for)?\s+([a-z\s]+)/i', $message, $matches)) {
            $intentData = [
                'category' => 'weather',
                'intent' => 'current_weather',
                'parameters' => [
                    'location' => trim($matches[1])
                ],
                'confidence' => 0.7
            ];
        }
        
        // Simple pattern matching for help
        elseif (preg_match('/help|how can you help|what can you do/i', $message)) {
            $intentData = [
                'category' => 'help',
                'intent' => 'get_help',
                'parameters' => [],
                'confidence' => 0.9
            ];
        }
        
        return $intentData;
    }
    
    /**
     * Execute function based on intent
     * 
     * @param array $intentData Intent data
     * @return mixed Function result
     */
    private function executeFunction($intentData) {
        $category = $intentData['category'];
        $intent = $intentData['intent'];
        $parameters = $intentData['parameters'] ?? [];
        
        // Calendar functions
        if ($category === 'calendar') {
            switch ($intent) {
                case 'add_event':
                    return $this->addEvent($parameters);
                case 'list_events':
                    return $this->listEvents($parameters);
                case 'find_event':
                    return $this->findEvent($parameters);
                case 'remove_event':
                    return $this->removeEvent($parameters);
                case 'update_event':
                    return $this->updateEvent($parameters);
            }
        }
        
        // Notes functions
        elseif ($category === 'notes') {
            switch ($intent) {
                case 'add_note':
                    return $this->addNote($parameters);
                case 'list_notes':
                    return $this->listNotes($parameters);
                case 'find_note':
                    return $this->findNote($parameters);
                case 'remove_note':
                    return $this->removeNote($parameters);
                case 'update_note':
                    return $this->updateNote($parameters);
            }
        }
        
        // Weather functions
        elseif ($category === 'weather') {
            switch ($intent) {
                case 'current_weather':
                    return $this->getCurrentWeather($parameters);
                case 'weather_forecast':
                    return $this->getWeatherForecast($parameters);
            }
        }
        
        // Search functions
        elseif ($category === 'search') {
            switch ($intent) {
                case 'web_search':
                    return $this->webSearch($parameters);
                case 'knowledge_query':
                    return $this->knowledgeQuery($parameters);
            }
        }
        
        // Settings functions
        elseif ($category === 'settings') {
            switch ($intent) {
                case 'update_preference':
                    return $this->updatePreference($parameters);
                case 'get_preferences':
                    return $this->getPreferences();
            }
        }
        
        // Help function
        elseif ($category === 'help') {
            return $this->getHelp($parameters);
        }
        
        // Default: Unknown function
        return ['error' => 'Unknown function', 'details' => "I don't know how to handle $category.$intent"];
    }
    
    /**
     * Generate a response based on function result
     * 
     * @param array $intentData Intent data
     * @param mixed $functionResult Function result
     * @return string Generated response
     */
    private function generateResponse($intentData, $functionResult) {
        // Check for error
        if (is_array($functionResult) && isset($functionResult['error'])) {
            return "I'm sorry, I encountered an error: " . $functionResult['details'];
        }
        
        // If function result is a string, return it directly
        if (is_string($functionResult)) {
            return $functionResult;
        }
        
        // For complex results, use Venice AI to generate a natural language response
        $systemPrompt = "You are a helpful personal assistant. ";
        
        if ($this->preferences['name']) {
            $systemPrompt .= "The user's name is {$this->preferences['name']}. ";
        }
        
        $systemPrompt .= "Generate a natural, conversational response based on the function result. " .
                         "Be concise but friendly.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => json_encode([
                'intent' => $intentData,
                'result' => $functionResult
            ])]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            // If AI request fails, return a simple response
            return "I've processed your request. " . json_encode($functionResult);
        }
    }
    
    /**
     * Calendar: Add event
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function addEvent($parameters) {
        // Extract parameters
        $title = $parameters['title'] ?? $parameters['description'] ?? null;
        $date = $parameters['date'] ?? date('Y-m-d');
        $time = $parameters['time'] ?? '00:00';
        $duration = $parameters['duration'] ?? 60; // minutes
        
        // Validate parameters
        if (!$title) {
            return ['error' => 'Missing parameter', 'details' => 'Event title is required'];
        }
        
        // Create event
        $event = [
            'id' => uniqid(),
            'title' => $title,
            'date' => $date,
            'time' => $time,
            'duration' => $duration,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Add to calendar
        $this->calendar[] = $event;
        
        // Save calendar
        $this->saveCalendar();
        
        // Return result
        return [
            'success' => true,
            'message' => "Event added: $title on $date at $time",
            'event' => $event
        ];
    }
    
    /**
     * Calendar: List events
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function listEvents($parameters) {
        // Extract parameters
        $date = $parameters['date'] ?? date('Y-m-d');
        $filter = $parameters['filter'] ?? null;
        
        // Filter events
        $filteredEvents = array_filter($this->calendar, function($event) use ($date, $filter) {
            $dateMatch = $event['date'] === $date;
            
            if ($filter) {
                return $dateMatch && stripos($event['title'], $filter) !== false;
            }
            
            return $dateMatch;
        });
        
        // Return result
        return [
            'success' => true,
            'date' => $date,
            'events' => array_values($filteredEvents),
            'count' => count($filteredEvents)
        ];
    }
    
    /**
     * Calendar: Find event
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function findEvent($parameters) {
        // Extract parameters
        $query = $parameters['query'] ?? null;
        
        // Validate parameters
        if (!$query) {
            return ['error' => 'Missing parameter', 'details' => 'Search query is required'];
        }
        
        // Search events
        $matchingEvents = array_filter($this->calendar, function($event) use ($query) {
            return stripos($event['title'], $query) !== false;
        });
        
        // Return result
        return [
            'success' => true,
            'query' => $query,
            'events' => array_values($matchingEvents),
            'count' => count($matchingEvents)
        ];
    }
    
    /**
     * Calendar: Remove event
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function removeEvent($parameters) {
        // Extract parameters
        $id = $parameters['id'] ?? null;
        
        // Validate parameters
        if (!$id) {
            return ['error' => 'Missing parameter', 'details' => 'Event ID is required'];
        }
        
        // Find event
        $eventIndex = null;
        foreach ($this->calendar as $index => $event) {
            if ($event['id'] === $id) {
                $eventIndex = $index;
                break;
            }
        }
        
        // Check if event exists
        if ($eventIndex === null) {
            return ['error' => 'Not found', 'details' => "Event with ID $id not found"];
        }
        
        // Remove event
        $removedEvent = $this->calendar[$eventIndex];
        unset($this->calendar[$eventIndex]);
        $this->calendar = array_values($this->calendar);
        
        // Save calendar
        $this->saveCalendar();
        
        // Return result
        return [
            'success' => true,
            'message' => "Event removed: {$removedEvent['title']}",
            'removed_event' => $removedEvent
        ];
    }
    
    /**
     * Calendar: Update event
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function updateEvent($parameters) {
        // Extract parameters
        $id = $parameters['id'] ?? null;
        
        // Validate parameters
        if (!$id) {
            return ['error' => 'Missing parameter', 'details' => 'Event ID is required'];
        }
        
        // Find event
        $eventIndex = null;
        foreach ($this->calendar as $index => $event) {
            if ($event['id'] === $id) {
                $eventIndex = $index;
                break;
            }
        }
        
        // Check if event exists
        if ($eventIndex === null) {
            return ['error' => 'Not found', 'details' => "Event with ID $id not found"];
        }
        
        // Update event
        $updatedEvent = $this->calendar[$eventIndex];
        
        // Apply updates
        foreach (['title', 'date', 'time', 'duration'] as $field) {
            if (isset($parameters[$field])) {
                $updatedEvent[$field] = $parameters[$field];
            }
        }
        
        $this->calendar[$eventIndex] = $updatedEvent;
        
        // Save calendar
        $this->saveCalendar();
        
        // Return result
        return [
            'success' => true,
            'message' => "Event updated: {$updatedEvent['title']}",
            'updated_event' => $updatedEvent
        ];
    }
    
    /**
     * Notes: Add note
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function addNote($parameters) {
        // Extract parameters
        $content = $parameters['content'] ?? null;
        $title = $parameters['title'] ?? 'Untitled Note';
        
        // Validate parameters
        if (!$content) {
            return ['error' => 'Missing parameter', 'details' => 'Note content is required'];
        }
        
        // Clean up content (remove command prefix)
        $content = preg_replace('/^(add|create|take|write).*note:?\s*/i', '', $content);
        
        // Create note
        $note = [
            'id' => uniqid(),
            'title' => $title,
            'content' => $content,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Add to notes
        $this->notes[] = $note;
        
        // Save notes
        $this->saveNotes();
        
        // Return result
        return [
            'success' => true,
            'message' => "Note added: $title",
            'note' => $note
        ];
    }
    
    /**
     * Notes: List notes
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function listNotes($parameters) {
        // Extract parameters
        $filter = $parameters['filter'] ?? null;
        
        // Filter notes
        $filteredNotes = $this->notes;
        
        if ($filter) {
            $filteredNotes = array_filter($filteredNotes, function($note) use ($filter) {
                return stripos($note['title'], $filter) !== false || 
                       stripos($note['content'], $filter) !== false;
            });
        }
        
        // Return result
        return [
            'success' => true,
            'notes' => array_values($filteredNotes),
            'count' => count($filteredNotes)
        ];
    }
    
    /**
     * Notes: Find note
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function findNote($parameters) {
        // Extract parameters
        $query = $parameters['query'] ?? null;
        
        // Validate parameters
        if (!$query) {
            return ['error' => 'Missing parameter', 'details' => 'Search query is required'];
        }
        
        // Search notes
        $matchingNotes = array_filter($this->notes, function($note) use ($query) {
            return stripos($note['title'], $query) !== false || 
                   stripos($note['content'], $query) !== false;
        });
        
        // Return result
        return [
            'success' => true,
            'query' => $query,
            'notes' => array_values($matchingNotes),
            'count' => count($matchingNotes)
        ];
    }
    
    /**
     * Notes: Remove note
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function removeNote($parameters) {
        // Extract parameters
        $id = $parameters['id'] ?? null;
        
        // Validate parameters
        if (!$id) {
            return ['error' => 'Missing parameter', 'details' => 'Note ID is required'];
        }
        
        // Find note
        $noteIndex = null;
        foreach ($this->notes as $index => $note) {
            if ($note['id'] === $id) {
                $noteIndex = $index;
                break;
            }
        }
        
        // Check if note exists
        if ($noteIndex === null) {
            return ['error' => 'Not found', 'details' => "Note with ID $id not found"];
        }
        
        // Remove note
        $removedNote = $this->notes[$noteIndex];
        unset($this->notes[$noteIndex]);
        $this->notes = array_values($this->notes);
        
        // Save notes
        $this->saveNotes();
        
        // Return result
        return [
            'success' => true,
            'message' => "Note removed: {$removedNote['title']}",
            'removed_note' => $removedNote
        ];
    }
    
    /**
     * Notes: Update note
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function updateNote($parameters) {
        // Extract parameters
        $id = $parameters['id'] ?? null;
        
        // Validate parameters
        if (!$id) {
            return ['error' => 'Missing parameter', 'details' => 'Note ID is required'];
        }
        
        // Find note
        $noteIndex = null;
        foreach ($this->notes as $index => $note) {
            if ($note['id'] === $id) {
                $noteIndex = $index;
                break;
            }
        }
        
        // Check if note exists
        if ($noteIndex === null) {
            return ['error' => 'Not found', 'details' => "Note with ID $id not found"];
        }
        
        // Update note
        $updatedNote = $this->notes[$noteIndex];
        
        // Apply updates
        foreach (['title', 'content'] as $field) {
            if (isset($parameters[$field])) {
                $updatedNote[$field] = $parameters[$field];
            }
        }
        
        $updatedNote['updated_at'] = date('Y-m-d H:i:s');
        $this->notes[$noteIndex] = $updatedNote;
        
        // Save notes
        $this->saveNotes();
        
        // Return result
        return [
            'success' => true,
            'message' => "Note updated: {$updatedNote['title']}",
            'updated_note' => $updatedNote
        ];
    }
    
    /**
     * Weather: Get current weather
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function getCurrentWeather($parameters) {
        // Extract parameters
        $location = strtolower($parameters['location'] ?? $this->preferences['defaultLocation'] ?? null);
        
        // Validate parameters
        if (!$location) {
            return ['error' => 'Missing parameter', 'details' => 'Location is required'];
        }
        
        // Check if we have weather data for this location
        if (!isset($this->weatherData[$location])) {
            return ['error' => 'Not found', 'details' => "Weather data not available for $location"];
        }
        
        // Get weather data
        $weatherData = $this->weatherData[$location];
        $tempUnit = $this->preferences['temperatureUnit'] === 'celsius' ? '°C' : '°F';
        $temp = $this->preferences['temperatureUnit'] === 'celsius' ? 
                $weatherData['temp'] : 
                ($weatherData['temp'] * 9/5) + 32;
        
        // Return result
        return [
            'success' => true,
            'location' => $location,
            'temperature' => [
                'value' => round($temp),
                'unit' => $tempUnit
            ],
            'condition' => $weatherData['condition']
        ];
    }
    
    /**
     * Weather: Get weather forecast
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function getWeatherForecast($parameters) {
        // Simplified forecast (in a real app, this would be more detailed)
        $location = strtolower($parameters['location'] ?? $this->preferences['defaultLocation'] ?? null);
        
        if (!$location) {
            return ['error' => 'Missing parameter', 'details' => 'Location is required'];
        }
        
        if (!isset($this->weatherData[$location])) {
            return ['error' => 'Not found', 'details' => "Weather data not available for $location"];
        }
        
        // Simulate a 5-day forecast based on current conditions
        $currentWeather = $this->weatherData[$location];
        $tempBase = $currentWeather['temp'];
        $conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Rainy', 'Thunderstorm'];
        $forecast = [];
        
        for ($i = 0; $i < 5; $i++) {
            $dayTemp = $tempBase + rand(-3, 3);
            $condition = $conditions[array_rand($conditions)];
            
            $forecast[] = [
                'day' => date('l', strtotime("+$i day")),
                'temperature' => [
                    'value' => $dayTemp,
                    'unit' => $this->preferences['temperatureUnit'] === 'celsius' ? '°C' : '°F'
                ],
                'condition' => $condition
            ];
        }
        
        return [
            'success' => true,
            'location' => $location,
            'forecast' => $forecast
        ];
    }
    
    /**
     * Search: Web search (simulated)
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function webSearch($parameters) {
        // Extract parameters
        $query = $parameters['query'] ?? null;
        
        // Validate parameters
        if (!$query) {
            return ['error' => 'Missing parameter', 'details' => 'Search query is required'];
        }
        
        // Simulate search results
        $results = [
            [
                'title' => "Results for: $query - Example Website",
                'url' => "https://example.com/search?q=" . urlencode($query),
                'description' => "This is a simulated search result for \"$query\". In a real assistant, this would connect to a search API."
            ],
            [
                'title' => "More about $query - Sample Site",
                'url' => "https://sample.org/" . strtolower(str_replace(' ', '-', $query)),
                'description' => "Another simulated result related to your search. Real results would come from a search engine API."
            ]
        ];
        
        // Return result
        return [
            'success' => true,
            'query' => $query,
            'results' => $results
        ];
    }
    
    /**
     * Search: Knowledge query
     * 
     * @param array $parameters Parameters
     * @return string Result
     */
    private function knowledgeQuery($parameters) {
        // Extract parameters
        $query = $parameters['query'] ?? null;
        
        // Validate parameters
        if (!$query) {
            return ['error' => 'Missing parameter', 'details' => 'Query is required'];
        }
        
        // Use AI to generate a response
        $systemPrompt = "You are a knowledgeable assistant providing factual information. " .
                        "Respond to the user's query with accurate, helpful information. " .
                        "If you don't know something for certain, acknowledge the limitations.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $query]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            return ['error' => 'AI request failed', 'details' => $e->getMessage()];
        }
    }
    
    /**
     * Settings: Update preference
     * 
     * @param array $parameters Parameters
     * @return array Result
     */
    private function updatePreference($parameters) {
        // Extract parameters
        $key = $parameters['key'] ?? null;
        $value = $parameters['value'] ?? null;
        
        // Validate parameters
        if (!$key || $value === null) {
            return ['error' => 'Missing parameter', 'details' => 'Both key and value are required'];
        }
        
        // Check if preference exists
        if (!array_key_exists($key, $this->preferences)) {
            return ['error' => 'Invalid preference', 'details' => "Preference '$key' does not exist"];
        }
        
        // Update preference
        $this->preferences[$key] = $value;
        
        // Save preferences
        $this->savePreferences();
        
        // Return result
        return [
            'success' => true,
            'message' => "Preference updated: $key = $value",
            'preferences' => $this->preferences
        ];
    }
    
    /**
     * Settings: Get preferences
     * 
     * @return array Result
     */
    private function getPreferences() {
        return [
            'success' => true,
            'preferences' => $this->preferences
        ];
    }
    
    /**
     * Help: Get help
     * 
     * @param array $parameters Parameters
     * @return string Result
     */
    private function getHelp($parameters) {
        // Extract specific help topic if provided
        $topic = $parameters['topic'] ?? null;
        
        // General help message
        $generalHelp = "I'm your personal assistant! Here's what I can do:\n\n" .
                       "📅 Calendar: Add, list, find, and manage events\n" .
                       "📝 Notes: Create, view, and search notes\n" .
                       "🌤️ Weather: Get current conditions and forecasts\n" .
                       "🔍 Search: Look up information online\n" .
                       "⚙️ Settings: Configure your preferences\n\n" .
                       "Try asking me things like:\n" .
                       "- Add a meeting with John tomorrow at 2pm\n" .
                       "- What's the weather in New York?\n" .
                       "- Take a note: Remember to buy groceries\n" .
                       "- Search for vegetarian recipes\n" .
                       "- Set my default location to London";
        
        // Topic-specific help
        if ($topic) {
            switch (strtolower($topic)) {
                case 'calendar':
                    return "📅 Calendar Help:\n\n" .
                           "- Add an event: 'Schedule a meeting with John tomorrow at 2pm'\n" .
                           "- List events: 'Show my events for today'\n" .
                           "- Find an event: 'When is my next meeting with John?'\n" .
                           "- Remove an event: 'Delete my meeting tomorrow'\n" .
                           "- Update an event: 'Change my 2pm meeting to 3pm'";
                
                case 'notes':
                    return "📝 Notes Help:\n\n" .
                           "- Add a note: 'Take a note: Remember to buy groceries'\n" .
                           "- List notes: 'Show all my notes'\n" .
                           "- Find a note: 'Find my note about groceries'\n" .
                           "- Remove a note: 'Delete my note about groceries'\n" .
                           "- Update a note: 'Update my groceries note to add milk'";
                
                case 'weather':
                    return "🌤️ Weather Help:\n\n" .
                           "- Current weather: 'What's the weather in New York?'\n" .
                           "- Forecast: 'What's the weather forecast for London?'\n" .
                           "- Set default location: 'Set my default location to London'\n" .
                           "- Change units: 'Change temperature to Fahrenheit'";
                
                case 'search':
                    return "🔍 Search Help:\n\n" .
                           "- Web search: 'Search for vegetarian recipes'\n" .
                           "- Knowledge query: 'Who invented the telephone?'\n" .
                           "- Follow-up query: 'Tell me more about that'";
                
                case 'settings':
                    return "⚙️ Settings Help:\n\n" .
                           "- Set name: 'My name is John'\n" .
                           "- Set location: 'Set my default location to London'\n" .
                           "- Change temperature unit: 'Use Fahrenheit for temperature'\n" .
                           "- Change time format: 'Set time format to 12-hour'\n" .
                           "- Show preferences: 'What are my preferences?'";
                
                default:
                    return "I don't have specific help for '$topic'. " . $generalHelp;
            }
        }
        
        return $generalHelp;
    }
    
    /**
     * Load all data
     */
    private function loadData() {
        $this->loadCalendar();
        $this->loadNotes();
        $this->loadPreferences();
    }
    
    /**
     * Load calendar from file
     */
    private function loadCalendar() {
        if (file_exists($this->calendarFile)) {
            $content = file_get_contents($this->calendarFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->calendar = $data;
            }
        }
    }
    
    /**
     * Save calendar to file
     */
    private function saveCalendar() {
        file_put_contents($this->calendarFile, json_encode($this->calendar, JSON_PRETTY_PRINT));
    }
    
    /**
     * Load notes from file
     */
    private function loadNotes() {
        if (file_exists($this->notesFile)) {
            $content = file_get_contents($this->notesFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->notes = $data;
            }
        }
    }
    
    /**
     * Save notes to file
     */
    private function saveNotes() {
        file_put_contents($this->notesFile, json_encode($this->notes, JSON_PRETTY_PRINT));
    }
    
    /**
     * Load preferences from file
     */
    private function loadPreferences() {
        if (file_exists($this->preferencesFile)) {
            $content = file_get_contents($this->preferencesFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->preferences = array_merge($this->preferences, $data);
            }
        }
    }
    
    /**
     * Save preferences to file
     */
    private function savePreferences() {
        file_put_contents($this->preferencesFile, json_encode($this->preferences, JSON_PRETTY_PRINT));
    }
    
    /**
     * Add message to conversation history
     * 
     * @param string $role Role ('user' or 'assistant')
     * @param string $content Message content
     */
    private function addToHistory($role, $content) {
        $this->conversationHistory[] = [
            'role' => $role,
            'content' => $content
        ];
        
        // Limit history size
        if (count($this->conversationHistory) > 20) {
            array_shift($this->conversationHistory);
        }
    }
}
```

## How to Use This Agent

1. Save the code above as `personal_assistant_agent.php`
2. Create a simple CLI interface to interact with the agent:

```php
<?php
// Include the agent class
require_once 'personal_assistant_agent.php';

// Replace with your Venice AI API key
$apiKey = 'your_venice_api_key_here';

// Create a new personal assistant agent
$agent = new PersonalAssistantAgent($apiKey);

// Simple command-line interface
echo "Personal Assistant Agent (type 'exit' to quit)\n";
echo "---------------------------------------------\n";
echo "Type 'help' to see what I can do\n\n";

while (true) {
    // Get user input
    echo "You: ";
    $input = trim(fgets(STDIN));
    
    // Exit if requested
    if (strtolower($input) === 'exit') {
        break;
    }
    
    // Get response from agent
    $response = $agent->processMessage($input);
    
    // Display response
    echo "Agent: " . $response . "\n\n";
}
```

3. Run the script from the command line:
```
php assistant_cli.php
```

## Key Learning Points

1. **Multi-Function Design** - The agent handles multiple types of tasks through a modular architecture.

2. **Intent Classification** - The agent uses AI to understand the user's intent and route requests to the appropriate function.

3. **Structured Function Handling** - Each function is implemented in a separate method with consistent parameters and return values.

4. **State Management** - The agent maintains and persists calendar events, notes, and user preferences.

5. **Natural Language Generation** - The agent uses AI to generate natural responses based on function results.

6. **Fallback Mechanisms** - The agent has fallback mechanisms for when AI-based intent parsing fails.

7. **Contextual Help** - The agent provides context-aware help based on specific topics.

## Extending This Agent

This advanced agent can be extended in several ways:

1. **More Functions** - Add more capabilities like task management, reminders, or recipe suggestions.

2. **Real API Integrations** - Connect to real APIs for weather, calendar, search, etc.

3. **Better Natural Language Understanding** - Improve intent parsing with more sophisticated techniques.

4. **Voice Interface** - Add speech-to-text and text-to-speech capabilities.

5. **User Authentication** - Add multi-user support with authentication.

6. **Context Awareness** - Enhance the agent's ability to understand context from previous interactions.

7. **Mobile App Integration** - Create mobile app interfaces for the agent.

8. **Smart Home Integration** - Add the ability to control smart home devices.

## Creating a Web Interface

For a more user-friendly experience, you can create a simple web interface:

```php
<?php
// Include the agent class
require_once 'personal_assistant_agent.php';

// Start session for chat history
session_start();

// Initialize agent
$apiKey = 'your_venice_api_key_here';
$agent = new PersonalAssistantAgent($apiKey);

// Process message if submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['message'])) {
    $userMessage = trim($_POST['message']);
    $response = $agent->processMessage($userMessage);
    
    // Store in session
    if (!isset($_SESSION['chat_history'])) {
        $_SESSION['chat_history'] = [];
    }
    
    $_SESSION['chat_history'][] = [
        'user' => $userMessage,
        'agent' => $response
    ];
    
    // Redirect to avoid form resubmission
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}

// Clear history if requested
if (isset($_GET['clear']) && $_GET['clear'] === '1') {
    unset($_SESSION['chat_history']);
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personal Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        h1 {
            color: #333;
            text-align: center;
        }
        
        .chat-container {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            height: 400px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 15px;
            display: flex;
        }
        
        .user-message {
            justify-content: flex-end;
        }
        
        .message-content {
            padding: 10px 15px;
            border-radius: 18px;
            max-width: 70%;
        }
        
        .user-message .message-content {
            background-color: #0084ff;
            color: white;
        }
        
        .agent-message .message-content {
            background-color: #e5e5ea;
            color: black;
        }
        
        .input-container {
            margin-top: 20px;
            display: flex;
        }
        
        input[type="text"] {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px 0 0 4px;
            font-size: 16px;
        }
        
        button {
            padding: 10px 20px;
            background-color: #0084ff;
            color: white;
            border: none;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
            font-size: 16px;
        }
        
        .controls {
            margin-top: 10px;
            text-align: right;
        }
        
        .clear-btn {
            background-color: #ff3b30;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            font-size: 14px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <h1>Personal Assistant</h1>
    
    <div class="chat-container" id="chat-container">
        <?php if (empty($_SESSION['chat_history'])): ?>
            <div class="message agent-message">
                <div class="message-content">
                    Hello! I'm your personal assistant. I can help with calendar, notes, weather, and more. Type 'help' to learn what I can do.
                </div>
            </div>
        <?php else: ?>
            <?php foreach ($_SESSION['chat_history'] as $message): ?>
                <div class="message user-message">
                    <div class="message-content"><?= htmlspecialchars($message['user']) ?></div>
                </div>
                <div class="message agent-message">
                    <div class="message-content"><?= nl2br(htmlspecialchars($message['agent'])) ?></div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
    
    <form method="post" class="input-container">
        <input type="text" name="message" placeholder="Type your message..." autofocus required>
        <button type="submit">Send</button>
    </form>
    
    <div class="controls">
        <a href="?clear=1" class="clear-btn" onclick="return confirm('Clear conversation history?')">Clear Chat</a>
    </div>
    
    <script>
        // Scroll to bottom of chat container on load
        window.onload = function() {
            var chatContainer = document.getElementById('chat-container');
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };
    </script>
</body>
</html>
```

## Conclusion

This advanced agent example demonstrates how to create a versatile personal assistant that can handle multiple types of tasks. It shows how to:

1. Parse user intents using AI
2. Route requests to the appropriate function
3. Maintain and persist various types of data
4. Generate natural language responses
5. Provide contextual help

The modular architecture makes it easy to extend with new capabilities, and the consistent function interfaces ensure that new features can be added without disrupting existing functionality. This example provides a foundation that can be built upon to create more sophisticated AI agents for various applications.