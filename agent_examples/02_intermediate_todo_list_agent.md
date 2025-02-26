# Intermediate Example: To-Do List Management Agent

This example demonstrates a task-oriented agent that helps manage a to-do list. It shows how to build an agent focused on a specific practical application.

## What This Agent Does

- Manages a to-do list (add, complete, list, and delete tasks)
- Stores tasks in a JSON file for persistence
- Understands natural language commands related to task management
- Provides helpful suggestions based on task history
- Uses Venice AI to understand user intent and respond naturally

## The Code

```php
<?php
/**
 * To-Do List Management Agent
 * 
 * An intermediate-level example of an AI agent that helps users
 * manage their tasks through natural language interaction.
 */

// Load the Venice AI SDK
require_once __DIR__ . '/VeniceAI.php';

/**
 * TodoAgent Class
 */
class TodoAgent {
    // Venice AI client
    private $venice;
    
    // File to store tasks
    private $taskFile;
    
    // Loaded tasks
    private $tasks = [];
    
    // Conversation history
    private $conversationHistory = [];
    
    /**
     * Constructor
     * 
     * @param string $apiKey Venice AI API key
     * @param string $taskFile File path to store tasks
     */
    public function __construct($apiKey, $taskFile = 'tasks.json') {
        // Initialize the Venice AI client
        $this->venice = new VeniceAI($apiKey);
        
        // Set task file
        $this->taskFile = $taskFile;
        
        // Load existing tasks
        $this->loadTasks();
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
        
        // Check for direct commands first
        $commandResponse = $this->handleDirectCommands($message);
        if ($commandResponse !== null) {
            $this->addToHistory('assistant', $commandResponse);
            return $commandResponse;
        }
        
        // Try to understand intent using Venice AI
        $intent = $this->determineIntent($message);
        
        // Handle the intent
        $response = $this->handleIntent($intent, $message);
        
        // Add response to history
        $this->addToHistory('assistant', $response);
        
        return $response;
    }
    
    /**
     * Handle direct commands without using AI
     * 
     * @param string $message User message
     * @return string|null Response or null if not a direct command
     */
    private function handleDirectCommands($message) {
        $message = strtolower(trim($message));
        
        // List all tasks
        if ($message === 'list tasks' || $message === 'show tasks' || $message === 'list all tasks') {
            return $this->listTasks();
        }
        
        // Help command
        if ($message === 'help') {
            return "I can help you manage your to-do list. You can say things like:\n" .
                   "- Add a task: Buy groceries\n" .
                   "- List my tasks\n" .
                   "- Mark task 2 as complete\n" .
                   "- Delete task 3\n" .
                   "- What are my pending tasks?";
        }
        
        // Clear all tasks
        if ($message === 'clear all tasks' || $message === 'delete all tasks') {
            $this->tasks = [];
            $this->saveTasks();
            return "I've cleared all your tasks.";
        }
        
        return null; // Not a direct command
    }
    
    /**
     * Determine the user's intent using Venice AI
     * 
     * @param string $message User message
     * @return array Intent information
     */
    private function determineIntent($message) {
        // Prepare system message to instruct the AI
        $systemPrompt = "You are a task management assistant. " .
                        "Analyze the user message and determine their intent. " .
                        "Respond with a JSON object with the following structure:\n" .
                        "{\n" .
                        "  \"intent\": \"add_task|complete_task|list_tasks|delete_task|other\",\n" .
                        "  \"task_id\": null or task number if specified,\n" .
                        "  \"task_description\": task description if adding a task,\n" .
                        "  \"confidence\": 0-1 indicating confidence in the intent classification\n" .
                        "}\n" .
                        "Provide only the JSON without any additional text.";
        
        // Create messages array
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $message]
        ];
        
        try {
            // Get response from Venice AI
            $response = $this->venice->createChatCompletion($messages);
            
            // Extract content
            $content = $response['choices'][0]['message']['content'];
            
            // Parse JSON
            $intentData = json_decode($content, true);
            
            // Validate and return
            if (is_array($intentData) && isset($intentData['intent'])) {
                return $intentData;
            }
            
            // If JSON parsing failed or structure is invalid
            return [
                'intent' => 'other',
                'confidence' => 0.5
            ];
        } catch (Exception $e) {
            // If AI request fails
            return [
                'intent' => 'other',
                'confidence' => 0.5
            ];
        }
    }
    
    /**
     * Handle the intent
     * 
     * @param array $intent Intent information
     * @param string $message Original user message
     * @return string Response
     */
    private function handleIntent($intent, $message) {
        switch ($intent['intent']) {
            case 'add_task':
                return $this->addTask($intent['task_description'] ?? $message);
                
            case 'complete_task':
                return $this->completeTask($intent['task_id'] ?? null);
                
            case 'list_tasks':
                return $this->listTasks();
                
            case 'delete_task':
                return $this->deleteTask($intent['task_id'] ?? null);
                
            default:
                // For unknown intents, use AI to generate a response
                return $this->generateResponse($message);
        }
    }
    
    /**
     * Add a new task
     * 
     * @param string $description Task description
     * @return string Response
     */
    private function addTask($description) {
        // Clean description
        $description = trim(preg_replace('/^(add|create|new) (task|to-?do)?\s*:?\s*/i', '', $description));
        
        // Add task
        $this->tasks[] = [
            'id' => count($this->tasks) + 1,
            'description' => $description,
            'completed' => false,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Save tasks
        $this->saveTasks();
        
        return "I've added \"$description\" to your to-do list.";
    }
    
    /**
     * Complete a task
     * 
     * @param int|null $taskId Task ID
     * @return string Response
     */
    private function completeTask($taskId) {
        // If task ID is not provided
        if ($taskId === null) {
            return "Which task would you like to mark as complete? Please specify the task number.";
        }
        
        // Find and update task
        foreach ($this->tasks as &$task) {
            if ($task['id'] == $taskId) {
                $task['completed'] = true;
                $this->saveTasks();
                return "I've marked task $taskId: \"{$task['description']}\" as complete.";
            }
        }
        
        return "I couldn't find task $taskId. Please check the task number and try again.";
    }
    
    /**
     * List all tasks
     * 
     * @return string Response
     */
    private function listTasks() {
        if (empty($this->tasks)) {
            return "You don't have any tasks yet. You can add one by saying 'Add a task: [description]'.";
        }
        
        $pendingTasks = array_filter($this->tasks, function($task) {
            return !$task['completed'];
        });
        
        $completedTasks = array_filter($this->tasks, function($task) {
            return $task['completed'];
        });
        
        $response = "Here are your tasks:\n\n";
        
        // Pending tasks
        if (!empty($pendingTasks)) {
            $response .= "Pending Tasks:\n";
            foreach ($pendingTasks as $task) {
                $response .= "- {$task['id']}: {$task['description']}\n";
            }
            $response .= "\n";
        }
        
        // Completed tasks
        if (!empty($completedTasks)) {
            $response .= "Completed Tasks:\n";
            foreach ($completedTasks as $task) {
                $response .= "- {$task['id']}: {$task['description']} ✓\n";
            }
        }
        
        // Add summary
        $response .= "\nSummary: " . count($pendingTasks) . " pending, " . count($completedTasks) . " completed";
        
        return $response;
    }
    
    /**
     * Delete a task
     * 
     * @param int|null $taskId Task ID
     * @return string Response
     */
    private function deleteTask($taskId) {
        // If task ID is not provided
        if ($taskId === null) {
            return "Which task would you like to delete? Please specify the task number.";
        }
        
        // Find and remove task
        foreach ($this->tasks as $index => $task) {
            if ($task['id'] == $taskId) {
                $description = $task['description'];
                unset($this->tasks[$index]);
                $this->tasks = array_values($this->tasks); // Re-index array
                $this->saveTasks();
                return "I've deleted task $taskId: \"$description\".";
            }
        }
        
        return "I couldn't find task $taskId. Please check the task number and try again.";
    }
    
    /**
     * Generate a response using Venice AI
     * 
     * @param string $message User message
     * @return string Response
     */
    private function generateResponse($message) {
        // Prepare system message
        $systemPrompt = "You are a helpful to-do list manager. " .
                        "The user has " . count($this->tasks) . " tasks in their list. " .
                        "If they're asking about tasks, suggest using specific commands like 'list tasks', " .
                        "'add a task', 'complete task [number]', or 'delete task [number]'.";
        
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
            return "I'm sorry, I encountered an error. Please try again or use a specific command like 'list tasks'.";
        }
    }
    
    /**
     * Load tasks from file
     */
    private function loadTasks() {
        if (file_exists($this->taskFile)) {
            $content = file_get_contents($this->taskFile);
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $this->tasks = $data;
            }
        }
    }
    
    /**
     * Save tasks to file
     */
    private function saveTasks() {
        file_put_contents($this->taskFile, json_encode($this->tasks, JSON_PRETTY_PRINT));
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
    }
}
```

## How to Use This Agent

1. Save the code above as `todo_agent.php`
2. Create a simple CLI interface to interact with the agent:

```php
<?php
// Include the agent class
require_once 'todo_agent.php';

// Replace with your Venice AI API key
$apiKey = 'your_venice_api_key_here';

// Create a new agent (tasks will be saved to tasks.json)
$agent = new TodoAgent($apiKey);

// Simple command-line interface
echo "Todo List Management Agent (type 'exit' to quit)\n";
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
    $response = $agent->processMessage($input);
    
    // Display response
    echo "Agent: " . $response . "\n\n";
}
```

3. Run the script from the command line:
```
php todo_cli.php
```

## Example Interactions

Here are some example interactions with the agent:

```
You: add task buy groceries
Agent: I've added "buy groceries" to your to-do list.

You: add task finish project report by Friday
Agent: I've added "finish project report by Friday" to your to-do list.

You: list tasks
Agent: Here are your tasks:

Pending Tasks:
- 1: buy groceries
- 2: finish project report by Friday

Summary: 2 pending, 0 completed

You: mark task 1 as complete
Agent: I've marked task 1: "buy groceries" as complete.

You: what's on my list?
Agent: Here are your tasks:

Pending Tasks:
- 2: finish project report by Friday

Completed Tasks:
- 1: buy groceries ✓

Summary: 1 pending, 1 completed
```

## Key Learning Points

1. **Intent Recognition** - The agent uses Venice AI to determine the user's intent.

2. **Task Persistence** - Tasks are saved to a JSON file for persistence between sessions.

3. **Direct Command Handling** - The agent handles common commands directly for efficiency.

4. **Natural Language Understanding** - The agent understands various ways of expressing the same intent.

5. **Context-Aware Responses** - The agent provides responses based on the current state of the task list.

## Extending This Agent

Here are some ways to extend this agent:

1. **Add Due Dates** - Enhance tasks with due dates and add reminders.

2. **Task Categories** - Allow users to categorize tasks and filter by category.

3. **Priority Levels** - Add priority levels to tasks and sort by priority.

4. **Multi-User Support** - Extend the agent to support multiple users with different task lists.

5. **Web Interface** - Create a web interface to interact with the agent.

6. **Task Analytics** - Add analytics to show completion rates, patterns, etc.