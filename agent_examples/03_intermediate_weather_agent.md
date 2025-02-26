# Intermediate Example: Weather Forecast Agent

This example demonstrates a specialized agent focused on a specific domain - weather forecasting. It shows how to integrate an AI agent with an external API to provide useful, contextual information.

## What This Agent Does

- Provides current weather conditions for any location
- Gives multi-day weather forecasts
- Remembers user's preferred locations
- Offers weather-related recommendations (what to wear, activities)
- Uses Venice AI to understand natural language queries and provide conversational responses

## The Code

```php
<?php
/**
 * Weather Forecast Agent
 * 
 * An intermediate-level example of a domain-specific AI agent that
 * provides weather information and personalized recommendations.
 * 
 * Note: This example uses simulated weather data. In a real application,
 * you would integrate with a weather API like OpenWeatherMap or WeatherAPI.
 */

// Load the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * WeatherAgent Class
 */
class WeatherAgent {
    // Venice AI client
    private $venice;
    
    // User preferences
    private $userPreferences = [
        'defaultLocation' => null,
        'temperatureUnit' => 'celsius', // 'celsius' or 'fahrenheit'
        'savedLocations' => [],
    ];
    
    // Preference file path
    private $preferencesFile;
    
    // Conversation history
    private $conversationHistory = [];
    
    // Simulated weather data (in a real app, this would come from an API)
    private $weatherData = [
        'new york' => [
            'current' => [
                'temp_c' => 22, 'temp_f' => 72, 
                'condition' => 'Sunny', 
                'humidity' => 55, 
                'wind_kph' => 15
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 22, 'temp_f' => 72, 'condition' => 'Sunny'],
                ['day' => 'Tomorrow', 'temp_c' => 25, 'temp_f' => 77, 'condition' => 'Partly cloudy'],
                ['day' => 'Wednesday', 'temp_c' => 20, 'temp_f' => 68, 'condition' => 'Rainy'],
                ['day' => 'Thursday', 'temp_c' => 18, 'temp_f' => 64, 'condition' => 'Overcast'],
                ['day' => 'Friday', 'temp_c' => 21, 'temp_f' => 70, 'condition' => 'Sunny']
            ]
        ],
        'london' => [
            'current' => [
                'temp_c' => 18, 'temp_f' => 64, 
                'condition' => 'Rainy', 
                'humidity' => 70, 
                'wind_kph' => 20
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 18, 'temp_f' => 64, 'condition' => 'Rainy'],
                ['day' => 'Tomorrow', 'temp_c' => 17, 'temp_f' => 63, 'condition' => 'Overcast'],
                ['day' => 'Wednesday', 'temp_c' => 19, 'temp_f' => 66, 'condition' => 'Partly cloudy'],
                ['day' => 'Thursday', 'temp_c' => 20, 'temp_f' => 68, 'condition' => 'Sunny'],
                ['day' => 'Friday', 'temp_c' => 22, 'temp_f' => 72, 'condition' => 'Sunny']
            ]
        ],
        'tokyo' => [
            'current' => [
                'temp_c' => 28, 'temp_f' => 82, 
                'condition' => 'Partly cloudy', 
                'humidity' => 65, 
                'wind_kph' => 10
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 28, 'temp_f' => 82, 'condition' => 'Partly cloudy'],
                ['day' => 'Tomorrow', 'temp_c' => 30, 'temp_f' => 86, 'condition' => 'Sunny'],
                ['day' => 'Wednesday', 'temp_c' => 29, 'temp_f' => 84, 'condition' => 'Sunny'],
                ['day' => 'Thursday', 'temp_c' => 27, 'temp_f' => 81, 'condition' => 'Thunderstorm'],
                ['day' => 'Friday', 'temp_c' => 26, 'temp_f' => 79, 'condition' => 'Rainy']
            ]
        ],
        'sydney' => [
            'current' => [
                'temp_c' => 24, 'temp_f' => 75, 
                'condition' => 'Sunny', 
                'humidity' => 50, 
                'wind_kph' => 25
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 24, 'temp_f' => 75, 'condition' => 'Sunny'],
                ['day' => 'Tomorrow', 'temp_c' => 23, 'temp_f' => 73, 'condition' => 'Sunny'],
                ['day' => 'Wednesday', 'temp_c' => 22, 'temp_f' => 72, 'condition' => 'Partly cloudy'],
                ['day' => 'Thursday', 'temp_c' => 21, 'temp_f' => 70, 'condition' => 'Partly cloudy'],
                ['day' => 'Friday', 'temp_c' => 20, 'temp_f' => 68, 'condition' => 'Rainy']
            ]
        ],
        'paris' => [
            'current' => [
                'temp_c' => 20, 'temp_f' => 68, 
                'condition' => 'Partly cloudy', 
                'humidity' => 60, 
                'wind_kph' => 12
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 20, 'temp_f' => 68, 'condition' => 'Partly cloudy'],
                ['day' => 'Tomorrow', 'temp_c' => 22, 'temp_f' => 72, 'condition' => 'Sunny'],
                ['day' => 'Wednesday', 'temp_c' => 23, 'temp_f' => 73, 'condition' => 'Sunny'],
                ['day' => 'Thursday', 'temp_c' => 21, 'temp_f' => 70, 'condition' => 'Partly cloudy'],
                ['day' => 'Friday', 'temp_c' => 19, 'temp_f' => 66, 'condition' => 'Rainy']
            ]
        ],
        'dubai' => [
            'current' => [
                'temp_c' => 38, 'temp_f' => 100, 
                'condition' => 'Sunny', 
                'humidity' => 30, 
                'wind_kph' => 8
            ],
            'forecast' => [
                ['day' => 'Today', 'temp_c' => 38, 'temp_f' => 100, 'condition' => 'Sunny'],
                ['day' => 'Tomorrow', 'temp_c' => 39, 'temp_f' => 102, 'condition' => 'Sunny'],
                ['day' => 'Wednesday', 'temp_c' => 40, 'temp_f' => 104, 'condition' => 'Sunny'],
                ['day' => 'Thursday', 'temp_c' => 39, 'temp_f' => 102, 'condition' => 'Sunny'],
                ['day' => 'Friday', 'temp_c' => 38, 'temp_f' => 100, 'condition' => 'Sunny']
            ]
        ]
    ];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     * @param string $preferencesFile File to store user preferences
     */
    public function __construct($apiKey, $preferencesFile = 'weather_preferences.json') {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
        
        // Set preferences file
        $this->preferencesFile = $preferencesFile;
        
        // Load user preferences
        $this->loadPreferences();
    }
    
    /**
     * Process a user query and generate a response
     * 
     * @param string $query User query
     * @return string Agent response
     */
    public function processQuery($query) {
        // Add user query to history
        $this->addToHistory('user', $query);
        
        // Check for direct commands
        $commandResponse = $this->handleDirectCommands($query);
        if ($commandResponse !== null) {
            $this->addToHistory('assistant', $commandResponse);
            return $commandResponse;
        }
        
        // Determine intent and extract location
        $analysis = $this->analyzeQuery($query);
        
        // Handle the request based on intent
        $response = $this->handleIntent($analysis);
        
        // Add response to history
        $this->addToHistory('assistant', $response);
        
        return $response;
    }
    
    /**
     * Handle direct commands without using AI
     * 
     * @param string $query User query
     * @return string|null Response or null if not a direct command
     */
    private function handleDirectCommands($query) {
        $query = strtolower(trim($query));
        
        // Help command
        if ($query === 'help') {
            return "I'm a weather agent that can provide current conditions and forecasts. Try asking:\n" .
                   "- What's the weather in [location]?\n" .
                   "- What's the forecast for [location]?\n" .
                   "- Should I wear a jacket today in [location]?\n" .
                   "- Set my default location to [location]\n" .
                   "- Save [location] to my favorites\n" .
                   "- Show my saved locations\n" .
                   "- Change temperature to Fahrenheit/Celsius";
        }
        
        // Show saved locations
        if ($query === 'show my saved locations' || $query === 'list saved locations') {
            if (empty($this->userPreferences['savedLocations'])) {
                return "You don't have any saved locations yet. You can save a location by saying 'Save [location] to my favorites'.";
            }
            
            $locations = implode(', ', $this->userPreferences['savedLocations']);
            return "Your saved locations: $locations";
        }
        
        // Show preferences
        if ($query === 'show my preferences' || $query === 'what are my preferences') {
            $defaultLocation = $this->userPreferences['defaultLocation'] ?? 'Not set';
            $tempUnit = ucfirst($this->userPreferences['temperatureUnit']);
            
            return "Your preferences:\n" .
                   "- Default location: $defaultLocation\n" .
                   "- Temperature unit: $tempUnit";
        }
        
        return null; // Not a direct command
    }
    
    /**
     * Analyze the query to determine intent and extract location
     * 
     * @param string $query User query
     * @return array Analysis results
     */
    private function analyzeQuery($query) {
        // Prepare system prompt
        $systemPrompt = "You are a weather assistant. Analyze the user query and extract the intent and location. " .
                        "Respond with a JSON object with the following structure:\n" .
                        "{\n" .
                        "  \"intent\": \"current_weather|forecast|recommendation|set_default_location|save_location|change_unit|other\",\n" .
                        "  \"location\": extracted location or null if not specified,\n" .
                        "  \"days\": number of days for forecast (1-5) or null,\n" .
                        "  \"unit\": \"celsius\" or \"fahrenheit\" if specified, or null\n" .
                        "}\n" .
                        "Provide only the JSON without any additional text.";
        
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $query]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Extract and parse JSON
            $content = $response['choices'][0]['message']['content'];
            $analysis = json_decode($content, true);
            
            // Validate and return
            if (is_array($analysis) && isset($analysis['intent'])) {
                return $analysis;
            }
        } catch (Exception $e) {
            // If API request fails or parsing fails
        }
        
        // Default analysis if API request fails or parsing fails
        $location = $this->extractLocation($query);
        
        return [
            'intent' => 'current_weather',
            'location' => $location ?? $this->userPreferences['defaultLocation'],
            'days' => null,
            'unit' => null
        ];
    }
    
    /**
     * Extract location from query using pattern matching (fallback method)
     * 
     * @param string $query User query
     * @return string|null Extracted location or null
     */
    private function extractLocation($query) {
        // Simple pattern matching to extract location
        if (preg_match('/(?:in|for|at)\s+([a-z\s]+)(?:$|\?|\.)/i', $query, $matches)) {
            return strtolower(trim($matches[1]));
        }
        
        return null;
    }
    
    /**
     * Handle intent based on analysis
     * 
     * @param array $analysis Query analysis
     * @return string Response
     */
    private function handleIntent($analysis) {
        $intent = $analysis['intent'];
        $location = $analysis['location'];
        
        // Use default location if not specified
        if (!$location && $this->userPreferences['defaultLocation']) {
            $location = $this->userPreferences['defaultLocation'];
        }
        
        // Handle intents
        switch ($intent) {
            case 'current_weather':
                if (!$location) {
                    return "I need to know which location you're asking about. You can try saying 'What's the weather in New York?'";
                }
                return $this->getCurrentWeather($location);
                
            case 'forecast':
                if (!$location) {
                    return "I need to know which location you're asking about for the forecast.";
                }
                $days = $analysis['days'] ?? 5; // Default to 5-day forecast
                return $this->getForecast($location, $days);
                
            case 'recommendation':
                if (!$location) {
                    return "I need to know which location you're asking about for recommendations.";
                }
                return $this->getRecommendation($location);
                
            case 'set_default_location':
                if (!$location) {
                    return "What location would you like to set as your default?";
                }
                return $this->setDefaultLocation($location);
                
            case 'save_location':
                if (!$location) {
                    return "What location would you like to save to your favorites?";
                }
                return $this->saveLocation($location);
                
            case 'change_unit':
                $unit = $analysis['unit'] ?? null;
                if (!$unit) {
                    return "Would you like to use Celsius or Fahrenheit?";
                }
                return $this->changeTemperatureUnit($unit);
                
            default:
                // For unknown intents, use AI to generate a response
                return $this->generateResponse($analysis);
        }
    }
    
    /**
     * Get current weather for a location
     * 
     * @param string $location Location
     * @return string Response with current weather
     */
    private function getCurrentWeather($location) {
        $location = strtolower($location);
        
        // Check if we have data for this location
        if (!isset($this->weatherData[$location])) {
            return "I'm sorry, I don't have weather data for $location.";
        }
        
        $weather = $this->weatherData[$location]['current'];
        $tempKey = $this->userPreferences['temperatureUnit'] === 'celsius' ? 'temp_c' : 'temp_f';
        $tempUnit = $this->userPreferences['temperatureUnit'] === 'celsius' ? '°C' : '°F';
        
        $response = "Current weather in " . ucwords($location) . ":\n" .
                    "- Temperature: {$weather[$tempKey]}{$tempUnit}\n" .
                    "- Condition: {$weather['condition']}\n" .
                    "- Humidity: {$weather['humidity']}%\n" .
                    "- Wind: {$weather['wind_kph']} km/h";
        
        return $response;
    }
    
    /**
     * Get forecast for a location
     * 
     * @param string $location Location
     * @param int $days Number of days (1-5)
     * @return string Response with forecast
     */
    private function getForecast($location, $days) {
        $location = strtolower($location);
        
        // Check if we have data for this location
        if (!isset($this->weatherData[$location])) {
            return "I'm sorry, I don't have forecast data for $location.";
        }
        
        // Limit days to 1-5
        $days = max(1, min(5, intval($days)));
        
        $forecast = array_slice($this->weatherData[$location]['forecast'], 0, $days);
        $tempKey = $this->userPreferences['temperatureUnit'] === 'celsius' ? 'temp_c' : 'temp_f';
        $tempUnit = $this->userPreferences['temperatureUnit'] === 'celsius' ? '°C' : '°F';
        
        $response = ucwords($days) . "-day forecast for " . ucwords($location) . ":\n";
        
        foreach ($forecast as $day) {
            $response .= "- {$day['day']}: {$day[$tempKey]}{$tempUnit}, {$day['condition']}\n";
        }
        
        return $response;
    }
    
    /**
     * Get weather-based recommendation
     * 
     * @param string $location Location
     * @return string Recommendation
     */
    private function getRecommendation($location) {
        $location = strtolower($location);
        
        // Check if we have data for this location
        if (!isset($this->weatherData[$location])) {
            return "I'm sorry, I don't have weather data for $location to make recommendations.";
        }
        
        $weather = $this->weatherData[$location]['current'];
        $condition = strtolower($weather['condition']);
        $tempC = $weather['temp_c'];
        
        // Generate recommendation based on weather conditions
        $recommendation = "Based on the current weather in " . ucwords($location) . " (";
        $recommendation .= $tempC . "°C, " . $weather['condition'] . "), ";
        
        if ($tempC < 10) {
            $recommendation .= "you should wear a warm coat, gloves, and a hat. ";
        } elseif ($tempC < 18) {
            $recommendation .= "a light jacket or sweater would be appropriate. ";
        } elseif ($tempC < 25) {
            $recommendation .= "light clothing is suitable, perhaps with a thin layer for the evening. ";
        } else {
            $recommendation .= "wear light, breathable clothing and consider sun protection. ";
        }
        
        if (strpos($condition, 'rain') !== false || strpos($condition, 'drizzle') !== false) {
            $recommendation .= "Don't forget an umbrella or raincoat!";
        } elseif (strpos($condition, 'snow') !== false) {
            $recommendation .= "Waterproof boots are recommended.";
        } elseif (strpos($condition, 'sun') !== false) {
            $recommendation .= "Sunscreen and sunglasses are recommended.";
        }
        
        return $recommendation;
    }
    
    /**
     * Set default location
     * 
     * @param string $location Location
     * @return string Response
     */
    private function setDefaultLocation($location) {
        $location = strtolower($location);
        
        $this->userPreferences['defaultLocation'] = $location;
        $this->savePreferences();
        
        return "I've set " . ucwords($location) . " as your default location.";
    }
    
    /**
     * Save location to favorites
     * 
     * @param string $location Location
     * @return string Response
     */
    private function saveLocation($location) {
        $location = strtolower($location);
        
        if (!in_array($location, $this->userPreferences['savedLocations'])) {
            $this->userPreferences['savedLocations'][] = $location;
            $this->savePreferences();
        }
        
        return "I've saved " . ucwords($location) . " to your favorite locations.";
    }
    
    /**
     * Change temperature unit
     * 
     * @param string $unit Unit ('celsius' or 'fahrenheit')
     * @return string Response
     */
    private function changeTemperatureUnit($unit) {
        $unit = strtolower($unit);
        
        if ($unit === 'celsius' || $unit === 'c') {
            $this->userPreferences['temperatureUnit'] = 'celsius';
            $this->savePreferences();
            return "I've set your temperature unit to Celsius.";
        } elseif ($unit === 'fahrenheit' || $unit === 'f') {
            $this->userPreferences['temperatureUnit'] = 'fahrenheit';
            $this->savePreferences();
            return "I've set your temperature unit to Fahrenheit.";
        } else {
            return "I didn't understand that unit. You can choose 'Celsius' or 'Fahrenheit'.";
        }
    }
    
    /**
     * Generate a response using Venice AI
     * 
     * @param array $analysis Query analysis
     * @return string Response
     */
    private function generateResponse($analysis) {
        // Prepare system message
        $systemPrompt = "You are a helpful weather assistant. ";
        
        if ($this->userPreferences['defaultLocation']) {
            $systemPrompt .= "The user's default location is " . ucwords($this->userPreferences['defaultLocation']) . ". ";
        }
        
        $systemPrompt .= "Respond conversationally to weather-related queries. " .
                         "If the query isn't about weather, politely explain that you focus on weather information.";
        
        // Create messages array
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        
        // Add conversation history (last 5 exchanges)
        $recentHistory = array_slice($this->conversationHistory, -10);
        $messages = array_merge($messages, $recentHistory);
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Return response
            return $response['choices'][0]['message']['content'];
        } catch (Exception $e) {
            return "I'm sorry, I'm having trouble understanding that request. You can ask me about weather in specific locations, or type 'help' for suggestions.";
        }
    }
    
    /**
     * Load user preferences from file
     */
    private function loadPreferences() {
        if (file_exists($this->preferencesFile)) {
            $content = file_get_contents($this->preferencesFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->userPreferences = array_merge($this->userPreferences, $data);
            }
        }
    }
    
    /**
     * Save user preferences to file
     */
    private function savePreferences() {
        file_put_contents($this->preferencesFile, json_encode($this->userPreferences, JSON_PRETTY_PRINT));
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

1. Save the code above as `weather_agent.php`
2. Create a simple CLI interface to interact with the agent:

```php
<?php
// Include the agent class
require_once 'weather_agent.php';

// Replace with your Venice AI API key
$apiKey = 'your_venice_api_key_here';

// Create a new weather agent
$agent = new WeatherAgent($apiKey);

// Simple command-line interface
echo "Weather Forecast Agent (type 'exit' to quit)\n";
echo "---------------------------------------------\n";
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
    $response = $agent->processQuery($input);
    
    // Display response
    echo "Agent: " . $response . "\n\n";
}
```

3. Run the script from the command line:
```
php weather_cli.php
```

## Example Interactions

```
You: What's the weather like in London?
Agent: Current weather in London:
- Temperature: 18°C
- Condition: Rainy
- Humidity: 70%
- Wind: 20 km/h

You: Set my default location to Tokyo
Agent: I've set Tokyo as your default location.

You: What will the weather be like tomorrow?
Agent: 5-day forecast for Tokyo:
- Today: 28°C, Partly cloudy
- Tomorrow: 30°C, Sunny
- Wednesday: 29°C, Sunny
- Thursday: 27°C, Thunderstorm
- Friday: 26°C, Rainy

You: Should I wear a jacket today?
Agent: Based on the current weather in Tokyo (28°C, Partly cloudy), light clothing is suitable, perhaps with a thin layer for the evening. Sunscreen and sunglasses are recommended.

You: Change temperature to Fahrenheit
Agent: I've set your temperature unit to Fahrenheit.

You: What's the weather now?
Agent: Current weather in Tokyo:
- Temperature: 82°F
- Condition: Partly cloudy
- Humidity: 65%
- Wind: 10 km/h
```

## Key Learning Points

1. **Domain Specialization** - The agent focuses on a specific domain (weather) and provides detailed functionality within that domain.

2. **Integration with Data Sources** - The agent integrates with weather data (simulated in this example, but would be an API in a real application).

3. **User Preferences** - The agent stores and applies user preferences like default location and temperature unit.

4. **Contextual Recommendations** - The agent provides recommendations based on weather conditions.

5. **Natural Language Understanding** - The agent understands various ways of asking about weather.

## Extending This Agent

Here are some ways to extend this weather agent:

1. **Real API Integration** - Replace simulated data with a real weather API like OpenWeatherMap or WeatherAPI.

2. **Location Verification** - Add validation for locations to ensure they exist.

3. **More Detailed Forecasts** - Add hourly forecasts and additional weather data.

4. **Weather Alerts** - Add notifications for severe weather conditions.

5. **Location Auto-Detection** - Integrate with geolocation to determine the user's current location.

6. **Weather Maps** - Add the ability to generate or link to weather maps for locations.

7. **Historical Weather Data** - Add the ability to query historical weather for a location.