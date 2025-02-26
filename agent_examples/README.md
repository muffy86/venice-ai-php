# AI Agent Examples Using Venice AI PHP SDK

This directory contains practical examples of AI agents built with the Venice AI PHP SDK. Each example demonstrates key agentic capabilities at different complexity levels.

## What Makes These Examples "Agentic"?

Each example demonstrates the core properties of AI agents:

1. **Autonomous Decision-Making**: Agents analyze inputs and decide how to respond without predefined rules
2. **Memory & Context Awareness**: Agents maintain state across interactions
3. **Natural Language Understanding**: Agents understand and process human language
4. **Goal-Directed Behavior**: Agents take actions to accomplish specific objectives
5. **Adaptability**: Agents adjust responses based on context and user preferences

## Examples Overview

### 1. [Beginner: Conversational Agent](./01_beginner_conversational_agent.md)

A simple, conversational AI agent perfect for beginners.

**Key Agentic Features:**
- Maintains conversation context
- Extracts and remembers user information
- Handles direct commands
- Generates contextually appropriate responses

**Use Cases:**
- Customer service chatbots
- Information assistants
- Learning tool for AI agent development

**Code Highlights:**
```php
// Intent detection through pattern matching
private function handleCommands($message) {
    $message = strtolower(trim($message));
    
    // Direct command handling
    if ($message === 'help') {
        return "I'm a simple conversational agent...";
    }
    
    // Not a command
    return null;
}

// Memory management
private function extractUserInfo($message) {
    // Extract name (simple pattern matching)
    if (preg_match('/my name is ([a-z\s]+)/i', $message, $matches)) {
        $this->userInfo['name'] = trim($matches[1]);
    }
}
```

### 2. [Intermediate: To-Do List Agent](./02_intermediate_todo_list_agent.md)

A task-oriented agent that helps manage a to-do list with persistent storage.

**Key Agentic Features:**
- AI-powered intent classification
- Natural language task understanding
- Persistent data storage
- Contextual task management

**Use Cases:**
- Personal task managers
- Project management assistants
- Productivity tools

**Code Highlights:**
```php
// AI-based intent determination
private function determineIntent($message) {
    $systemPrompt = "You are a task management assistant...";
    
    $response = $this->venice->createChatCompletion([
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $message]
    ]);
    
    // Parse the AI's response to extract intent
    $intentData = json_decode($response['choices'][0]['message']['content'], true);
    return $intentData;
}

// Function execution based on intent
private function handleIntent($intent, $message) {
    switch ($intent['intent']) {
        case 'add_task':
            return $this->addTask($intent['task_description'] ?? $message);
        case 'list_tasks':
            return $this->listTasks();
        // Other intent handlers...
    }
}
```

### 3. [Intermediate: Weather Forecast Agent](./03_intermediate_weather_agent.md)

A domain-specific agent focused on weather information and user preferences.

**Key Agentic Features:**
- Location-based data processing
- User preference management
- Contextual recommendations
- Multi-intent handling

**Use Cases:**
- Weather information services
- Travel planning assistants
- Outdoor activity recommendations

**Code Highlights:**
```php
// Location extraction and preference management
private function setDefaultLocation($location) {
    $location = strtolower($location);
    
    $this->userPreferences['defaultLocation'] = $location;
    $this->savePreferences();
    
    return "I've set " . ucwords($location) . " as your default location.";
}

// Context-aware recommendations
private function getRecommendation($location) {
    $weather = $this->weatherData[$location]['current'];
    $condition = strtolower($weather['condition']);
    $tempC = $weather['temp_c'];
    
    $recommendation = "Based on the current weather in " . ucwords($location) . ", ";
    
    // Generate recommendations based on temperature and conditions
    if ($tempC < 10) {
        $recommendation .= "you should wear a warm coat...";
    } elseif ($tempC < 18) {
        $recommendation .= "a light jacket or sweater would be appropriate...";
    }
    // More conditional recommendations...
    
    return $recommendation;
}
```

### 4. [Advanced: Multi-Function Personal Assistant](./04_advanced_multifunction_agent.md)

A versatile agent that combines multiple capabilities into one intelligent assistant.

**Key Agentic Features:**
- Complex intent recognition
- Multiple function domains
- Comprehensive memory management
- Natural language generation
- Advanced context handling

**Use Cases:**
- Personal digital assistants
- Smart home controllers
- Executive assistants
- Customer service platforms

**Code Highlights:**
```php
// Sophisticated intent parsing
private function parseIntent($message) {
    $systemPrompt = "You are a personal assistant that analyzes user messages...";
    
    // Add function categories to the prompt
    foreach ($this->functions as $category => $intents) {
        $systemPrompt .= "- $category: " . implode(', ', $intents) . "\n";
    }
    
    // Request structured JSON output from AI
    $response = $this->venice->createChatCompletion([
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $message]
    ]);
    
    // Parse intent data
    $intentData = json_decode($response['choices'][0]['message']['content'], true);
    return $intentData;
}

// Dynamic function execution
private function executeFunction($intentData) {
    $category = $intentData['category'];
    $intent = $intentData['intent'];
    $parameters = $intentData['parameters'] ?? [];
    
    // Route to appropriate function handler
    if ($category === 'calendar') {
        switch ($intent) {
            case 'add_event': return $this->addEvent($parameters);
            case 'list_events': return $this->listEvents($parameters);
            // Other calendar functions...
        }
    }
    // Other categories...
}
```

### 5. [Specialized: Recipe Assistant Agent](./05_specialized_recipe_agent.md)

A highly specialized agent focused on recipes, cooking, and dietary preferences.

**Key Agentic Features:**
- Domain-specific knowledge application
- User preference adaptation
- Complex data filtering
- Personalized recommendations
- Multi-step instruction provision

**Use Cases:**
- Cooking assistants
- Dietary management apps
- Meal planning services
- Recipe recommendation engines

**Code Highlights:**
```php
// Domain-specific intent analysis
private function analyzeIntent($message) {
    $systemPrompt = "You are a recipe assistant. Analyze the user's message...";
    
    $messages = [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $message]
    ];
    
    // Extract structured intent data from AI response
    $response = $this->venice->createChatCompletion($messages);
    $intentData = json_decode($response['choices'][0]['message']['content'], true);
    
    return $intentData;
}

// Personalized recipe recommendations
private function findRecipes($intent) {
    $ingredients = $intent['ingredients'] ?? [];
    $dietaryInfo = $intent['dietary_info'] ?? null;
    
    // Filter recipes based on ingredients and dietary restrictions
    $matchedRecipes = [];
    foreach ($this->recipeDatabase as $recipe) {
        // Count ingredient matches
        $matchedIngredientCount = $this->countMatchedIngredients($ingredients, $recipe);
        
        // Check dietary restrictions
        $meetsRestrictions = $this->checkDietaryRestrictions($recipe, $dietaryInfo);
        
        if ($matchedIngredientCount > 0 && $meetsRestrictions) {
            $matchedRecipes[] = [
                'recipe' => $recipe,
                'score' => $matchedIngredientCount / count($recipe['ingredients']),
                'matched_ingredients' => $matchedIngredientCount
            ];
        }
    }
    
    // Sort and return top matches
    usort($matchedRecipes, function($a, $b) {
        return $b['score'] <=> $a['score'];
    });
    
    return array_slice($matchedRecipes, 0, 3);
}
```

## Common Agentic Patterns

All examples demonstrate these essential patterns that make them true "agents":

### 1. Intent-Action Loop

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│ User Input  │────▶│ Intent Analysis│────▶│ Action      │
└─────────────┘     └───────────────┘     └──────┬──────┘
      ▲                                          │
      │                                          │
      │           ┌─────────────┐                │
      └───────────│  Response   │◀───────────────┘
                  └─────────────┘
```

### 2. Memory Storage and Retrieval

```php
// Storing information
private function addToHistory($role, $content) {
    $this->conversationHistory[] = [
        'role' => $role,
        'content' => $content
    ];
}

// Using stored information
private function prepareMessages() {
    $messages = [
        ['role' => 'system', 'content' => $this->getSystemPrompt()]
    ];
    
    // Add relevant context from history
    $recentHistory = array_slice($this->conversationHistory, -10);
    $messages = array_merge($messages, $recentHistory);
    
    return $messages;
}
```

### 3. Decision Trees with Fallbacks

```php
// Handle user input with multiple fallback options
private function processMessage($message) {
    // Try direct command handling first (most efficient)
    $directResponse = $this->handleDirectCommands($message);
    if ($directResponse !== null) {
        return $directResponse;
    }
    
    // Try AI-based intent classification
    try {
        $intent = $this->analyzeIntent($message);
        $response = $this->handleIntent($intent, $message);
        return $response;
    } catch (Exception $e) {
        // Fall back to simple pattern matching if AI fails
        return $this->fallbackResponseGeneration($message);
    }
}
```

## Implementing Your Own Agent

When building your own agent using these examples:

1. **Choose a Base Example**: Select the example closest to your use case
2. **Identify Core Intents**: Define the main actions your agent will handle
3. **Design Memory Structure**: Determine what information your agent needs to remember
4. **Implement Function Handlers**: Create methods for each action your agent can take
5. **Add Natural Language Processing**: Use Venice AI to understand and generate text
6. **Test and Refine**: Iteratively improve your agent's responses

## SEO-Friendly Keywords for AI Agents

- AI Agent Implementation
- Intelligent Software Agents
- Autonomous Digital Assistants
- PHP AI Development
- Natural Language Agents
- Conversational AI Agents
- Task-Oriented AI Agents
- PHP Chatbot Development
- AI Decision Systems
- Context-Aware AI

## Beyond These Examples

These examples demonstrate the fundamentals, but production AI agents typically include:

- **Web or App Integration**: User interfaces beyond the command line
- **Database Storage**: More robust data persistence
- **User Authentication**: Multi-user support with security
- **API Integrations**: Connections to external services
- **Analytics**: Tracking usage patterns and performance
- **Conversation Management**: More sophisticated dialog handling

## Learning Path

For optimal learning, work through these examples in order:

1. Start with the **Conversational Agent** to understand basic agent structure
2. Explore the **To-Do List Agent** to learn about intent recognition and state
3. Study the **Weather Agent** to see domain-specific implementation
4. Examine the **Multi-Function Assistant** for complex architecture
5. Finally, review the **Recipe Agent** for deep domain specialization

Happy building!