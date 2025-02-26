# AI Agents with Venice AI PHP SDK

## Build Intelligent PHP Agents with Advanced AI Capabilities

This repository provides a comprehensive collection of AI agent examples and implementation guides using the Venice AI PHP SDK. Whether you're new to AI agents or looking to build sophisticated applications, these examples demonstrate how to leverage AI for decision-making, autonomous actions, and natural language understanding.

## What Are AI Agents?

AI agents are software programs that use artificial intelligence to:
- Process and understand user inputs
- Make autonomous decisions
- Perform actions based on those decisions
- Maintain state and context across interactions
- Provide natural language responses

Unlike traditional scripts with predefined logic paths, AI agents use large language models to understand context, determine intent, and generate dynamic responses.

## Example Agents (From Simple to Complex)

This repository includes ready-to-use examples at various complexity levels:

### 1. [Conversational Agent](./agent_examples/01_beginner_conversational_agent.md)
A beginner-friendly chat agent that maintains conversations and remembers basic user information.

**Key features:**
- Basic conversation management
- Simple memory system
- Pattern-based command recognition
- Natural language responses

### 2. [To-Do List Agent](./agent_examples/02_intermediate_todo_list_agent.md)
A task-oriented agent that helps manage a to-do list with persistent storage.

**Key features:**
- Task creation, completion, and deletion
- Data persistence using JSON storage
- Intent classification with AI
- Natural language task understanding

### 3. [Weather Forecast Agent](./agent_examples/03_intermediate_weather_agent.md)
A domain-specific agent that provides weather information and remembers user preferences.

**Key features:**
- Location-based weather forecasts
- User preference storage
- Weather-based recommendations
- Multi-day forecasts

### 4. [Multi-Function Personal Assistant](./agent_examples/04_advanced_multifunction_agent.md)
A versatile agent that combines multiple capabilities into one intelligent assistant.

**Key features:**
- Calendar management
- Note taking and retrieval
- Weather forecasts
- Web search functionality
- User preference management
- Advanced intent classification

### 5. [Recipe and Cooking Agent](./agent_examples/05_specialized_recipe_agent.md)
A highly specialized agent focused on recipes, cooking, and dietary preferences.

**Key features:**
- Recipe suggestions based on ingredients
- Dietary restriction handling
- Step-by-step cooking instructions
- Ingredient substitutions
- Recipe scaling
- User food preference tracking

## Implementation Guides

In addition to the examples, this repository includes detailed guides to help you understand and build your own AI agents:

- [Simple Agent Concept](./simple_agent_concept.md) - Clear explanation of what makes software "agentic"
- [Agent Demo Plan](./agent_demo_plan.md) - Comprehensive plan for building a full-featured agent
- [Venice Agent Implementation Guide](./venice-agent_implementation_guide.md) - Step-by-step implementation instructions
- [Simple Venice Agent](./simple_venice_agent.md) - A complete, single-file agent implementation
- [Agent Implementation Roadmap](./agent_implementation_roadmap.md) - A guided path to building agents of increasing complexity

## Key Agentic Capabilities Demonstrated

All examples showcase key capabilities that define true AI agents:

### 1. Intent Recognition
Using AI to understand what users want to accomplish, beyond simple command matching.

```php
// Example of AI-based intent recognition
private function determineIntent($message) {
    // Create system prompt for intent classification
    $systemPrompt = "Analyze the user message and determine their intent...";
    
    // Get response from Venice AI
    $response = $this->venice->createChatCompletion([
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $message]
    ]);
    
    // Extract and parse intent
    $intentData = json_decode($response['choices'][0]['message']['content'], true);
    return $intentData;
}
```

### 2. Autonomous Decision Making
Agents make decisions about how to handle inputs rather than following predefined logic paths.

```php
// Example of autonomous decision making
private function handleIntent($intent, $message) {
    switch ($intent['intent']) {
        case 'add_task':
            return $this->addTask($intent['parameters']);
        case 'list_tasks':
            return $this->listTasks();
        case 'find_task':
            return $this->findTask($intent['parameters']);
        default:
            // Generate a conversational response when no specific intent is matched
            return $this->generateConversationalResponse($message);
    }
}
```

### 3. Memory and Context Management
Agents maintain state across interactions to provide contextual responses.

```php
// Example of memory management
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
```

### 4. Natural Language Understanding
Agents process natural language input without requiring specific command formats.

```php
// Example of extracting information from natural language
private function extractUserInfo($message) {
    if (preg_match('/my name is ([a-z\s]+)/i', $message, $matches)) {
        $this->userInfo['name'] = trim($matches[1]);
    }
    
    if (preg_match('/i (?:live|am) (?:in|from) ([a-z\s]+)/i', $message, $matches)) {
        $this->userInfo['location'] = trim($matches[1]);
    }
}
```

### 5. Function Execution
Agents perform actions based on their understanding of user intent.

```php
// Example of function execution based on intent
private function addTask($parameters) {
    $title = $parameters['title'] ?? null;
    $dueDate = $parameters['due_date'] ?? null;
    
    if (!$title) {
        return "I need a title for your task. What would you like to add?";
    }
    
    $task = [
        'id' => uniqid(),
        'title' => $title,
        'completed' => false,
        'created_at' => date('Y-m-d H:i:s'),
        'due_date' => $dueDate
    ];
    
    $this->tasks[] = $task;
    $this->saveTasks();
    
    return "I've added \"$title\" to your task list" . 
           ($dueDate ? " with due date $dueDate" : "") . ".";
}
```

## Getting Started

### Prerequisites

- PHP 7.4 or higher
- Venice AI API key
- Basic understanding of PHP programming

### Quick Start

1. Clone this repository:
```
git clone https://github.com/yourusername/venice-ai-php-agents.git
```

2. Copy configuration file:
```
cp config.example.php config.php
```

3. Edit config.php to add your Venice AI API key:
```php
return [
    'api_key' => 'your-venice-api-key-here',
];
```

4. Choose an example that matches your needs and run it:
```
php path/to/example/file.php
```

## Building Your Own Agent

Follow these steps to build your own custom agent:

1. **Define your agent's purpose**: What specific tasks will it help with?
2. **Choose a complexity level**: Start simple and add capabilities as needed
3. **Select relevant examples**: Use the provided examples as starting points
4. **Implement core functions**: Intent recognition, memory management, etc.
5. **Test and refine**: Iterate based on user interactions

Refer to the [Agent Implementation Roadmap](./agent_implementation_roadmap.md) for detailed guidance.

## Use Cases for AI Agents

These agent examples can be adapted for various real-world applications:

- **Customer Service**: Automated support agents that understand and resolve issues
- **Personal Productivity**: Task management, scheduling, and information retrieval
- **Content Creation**: Assistants that help generate or organize content
- **E-commerce**: Shopping assistants that help users find products
- **Education**: Tutors that provide personalized learning assistance
- **Healthcare**: Assistants that help with medical information or appointment scheduling

## Advanced Implementation Techniques

For more sophisticated agents, consider these advanced techniques:

- **Tool Integration**: Allow your agent to use external tools and APIs
- **Multi-step Reasoning**: Break complex tasks into smaller reasoning steps
- **Feedback Learning**: Improve agent responses based on user feedback
- **Context Windowing**: Manage larger conversation contexts efficiently
- **Function Calling**: Implement structured function calling with parameter validation

## Resources

- [Venice AI Documentation](https://docs.venice.ai/)
- [Venice AI PHP SDK](https://github.com/veniceai/venice-ai-php)
- [Agent Examples Directory](./agent_examples/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.