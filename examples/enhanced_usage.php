<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Exceptions\AuthenticationException;
use Venice\Exceptions\RateLimitException;
use Venice\Exceptions\ValidationException;
use Venice\Exceptions\VeniceException;

// Example 1: Enhanced initialization with configuration
echo "=== Enhanced Venice AI SDK Usage Examples ===\n\n";

try {
    // Initialize with enhanced configuration
    $venice = new VeniceAI('your-api-key-here', [
        'debug' => true,
        'log_file' => __DIR__ . '/venice-sdk.log',
        'timeout' => 30,
        'max_retries' => 3,
        'base_delay' => 1000
    ]);

    echo "✓ Venice AI SDK initialized successfully\n";
    echo "✓ Logger configured: " . $venice->getLogger()->setLogFile(__DIR__ . '/venice-sdk.log') . "\n";
    echo "✓ Configuration loaded\n\n";

} catch (VeniceException $e) {
    echo "✗ Initialization failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Example 2: Enhanced error handling
echo "=== Error Handling Examples ===\n";

try {
    // This will trigger validation error
    $venice->chat()->createCompletion([], 'gpt-3.5-turbo');
} catch (ValidationException $e) {
    echo "✓ Validation error caught: " . $e->getMessage() . "\n";
    echo "  Errors: " . json_encode($e->getErrors()) . "\n";
}

try {
    // This will trigger authentication error (invalid API key)
    $invalidVenice = new VeniceAI('invalid-key');
    $invalidVenice->validateApiKey();
} catch (AuthenticationException $e) {
    echo "✓ Authentication error caught: " . $e->getMessage() . "\n";
}

echo "\n";

// Example 3: Enhanced chat completions with validation
echo "=== Enhanced Chat Completions ===\n";

try {
    // Create messages using helper methods
    $messages = [
        $venice->chat()->createSystemMessage('You are a helpful assistant that responds concisely.'),
        $venice->chat()->createUserMessage('What is the capital of France?')
    ];

    // Validate messages before sending
    foreach ($messages as $message) {
        if (!$venice->chat()->isValidMessage($message)) {
            throw new ValidationException('Invalid message format');
        }
    }

    // Count tokens
    $tokenCount = $venice->chat()->countTokens($messages);
    echo "✓ Estimated tokens: $tokenCount\n";

    // Create completion with enhanced options
    $response = $venice->chat()->createCompletion($messages, 'gpt-3.5-turbo', [
        'temperature' => 0.7,
        'max_tokens' => 100,
        'presence_penalty' => 0.1
    ]);

    echo "✓ Chat completion successful\n";
    echo "  Response: " . $response['choices'][0]['message']['content'] . "\n";

} catch (ValidationException $e) {
    echo "✗ Validation failed: " . $e->getMessage() . "\n";
    print_r($e->getErrors());
} catch (RateLimitException $e) {
    echo "✗ Rate limited. Retry after: " . $e->getRetryAfter() . " seconds\n";
} catch (VeniceException $e) {
    echo "✗ API error: " . $e->getFormattedMessage() . "\n";
}

echo "\n";

// Example 4: Streaming completions
echo "=== Streaming Completions ===\n";

try {
    $messages = [
        $venice->chat()->createUserMessage('Write a short poem about technology.')
    ];

    echo "✓ Starting streaming completion...\n";
    $generator = $venice->chat()->createStreamingCompletion($messages);

    echo "  Stream: ";
    foreach ($generator as $chunk) {
        if (isset($chunk['choices'][0]['delta']['content'])) {
            echo $chunk['choices'][0]['delta']['content'];
        }
    }
    echo "\n✓ Streaming completed\n";

} catch (VeniceException $e) {
    echo "✗ Streaming failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Example 5: Enhanced logging
echo "=== Enhanced Logging ===\n";

$logger = $venice->getLogger();

// Log at different levels
$logger->debug('Debug message with context', ['user_id' => 123, 'action' => 'test']);
$logger->info('Info message: Operation completed successfully');
$logger->warning('Warning message: Rate limit approaching');
$logger->error('Error message: Request failed', ['error_code' => 500]);
$logger->critical('Critical message: System failure detected');

echo "✓ Logged messages at all levels\n";
echo "✓ Check log file: " . __DIR__ . "/venice-sdk.log\n";

// Example 6: Configuration management
echo "\n=== Configuration Management ===\n";

// Get configuration values
echo "✓ Debug mode: " . ($venice->getConfig('debug') ? 'enabled' : 'disabled') . "\n";
echo "✓ Timeout: " . $venice->getConfig('timeout') . " seconds\n";
echo "✓ Max retries: " . $venice->getConfig('max_retries') . "\n";

// Set custom configuration
$venice->setConfig('custom_option', 'custom_value');
echo "✓ Custom option set: " . $venice->getConfig('custom_option') . "\n";

echo "\n";

// Example 7: API key validation
echo "=== API Key Validation ===\n";

if ($venice->validateApiKey()) {
    echo "✓ API key is valid\n";
} else {
    echo "✗ API key is invalid\n";
}

echo "\n";

// Example 8: Message validation and helpers
echo "=== Message Validation and Helpers ===\n";

// Test message validation
$validMessage = $venice->chat()->createUserMessage('This is a valid message');
$invalidMessage = ['role' => 'invalid', 'content' => ''];

echo "✓ Valid message: " . ($venice->chat()->isValidMessage($validMessage) ? 'true' : 'false') . "\n";
echo "✓ Invalid message: " . ($venice->chat()->isValidMessage($invalidMessage) ? 'true' : 'false') . "\n";

// Create different message types
$systemMsg = $venice->chat()->createSystemMessage('System prompt');
$userMsg = $venice->chat()->createUserMessage('User message');
$assistantMsg = $venice->chat()->createAssistantMessage('Assistant response');

echo "✓ Created system message: " . json_encode($systemMsg) . "\n";
echo "✓ Created user message: " . json_encode($userMsg) . "\n";
echo "✓ Created assistant message: " . json_encode($assistantMsg) . "\n";

echo "\n";

// Example 9: Exception context and request tracking
echo "=== Exception Context and Request Tracking ===\n";

try {
    // Simulate an error with context
    throw new VeniceException(
        'Sample error with context',
        500,
        null,
        ['request_id' => 'req_123', 'endpoint' => '/chat/completions'],
        'req_123'
    );
} catch (VeniceException $e) {
    echo "✓ Exception caught with context:\n";
    echo "  Message: " . $e->getMessage() . "\n";
    echo "  Request ID: " . $e->getRequestId() . "\n";
    echo "  Context: " . json_encode($e->getContext()) . "\n";
    echo "  Formatted: " . $e->getFormattedMessage() . "\n";
}

echo "\n=== All examples completed ===\n";

// Clean up
if (file_exists(__DIR__ . '/venice-sdk.log')) {
    echo "\nLog file contents:\n";
    echo "==================\n";
    echo file_get_contents(__DIR__ . '/venice-sdk.log');
    echo "==================\n";
}
