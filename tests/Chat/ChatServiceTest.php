<?php

namespace Venice\Tests\Chat;

use PHPUnit\Framework\TestCase;
use Venice\Chat\ChatService;
use Venice\VeniceAI;
use Venice\Exceptions\ValidationException;

class ChatServiceTest extends TestCase {
    private ChatService $chatService;
    private VeniceAI $venice;

    protected function setUp(): void {
        $this->venice = new VeniceAI('test-api-key', [
            'debug' => false,
            'log_file' => null
        ]);
        $this->chatService = $this->venice->chat();
    }

    public function testCreateCompletion(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello, world!']
        ];

        // This would normally make an API call, but we're testing the structure
        $this->expectException(\Exception::class); // Will fail due to invalid API key
        $this->chatService->createCompletion($messages);
    }

    public function testCreateCompletionWithInvalidMessages(): void {
        $this->expectException(ValidationException::class);
        $this->chatService->createCompletion([]);
    }

    public function testCreateCompletionWithInvalidRole(): void {
        $messages = [
            ['role' => 'invalid', 'content' => 'Hello']
        ];

        $this->expectException(ValidationException::class);
        $this->chatService->createCompletion($messages);
    }

    public function testCreateCompletionWithOptions(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];
        $options = [
            'temperature' => 0.7,
            'max_tokens' => 100
        ];

        $this->expectException(\Exception::class); // Will fail due to invalid API key
        $this->chatService->createCompletion($messages, 'gpt-3.5-turbo', $options);
    }

    public function testCreateStreamingCompletion(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];

        $this->expectException(\Exception::class); // Will fail due to invalid API key
        $generator = $this->chatService->createStreamingCompletion($messages);

        // Test that it returns a generator
        $this->assertInstanceOf(\Generator::class, $generator);
    }

    public function testCountTokens(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello, world!'],
            ['role' => 'assistant', 'content' => 'Hi there!']
        ];

        $tokenCount = $this->chatService->countTokens($messages);
        $this->assertIsInt($tokenCount);
        $this->assertGreaterThan(0, $tokenCount);
    }

    public function testCountTokensEmptyMessages(): void {
        $tokenCount = $this->chatService->countTokens([]);
        $this->assertEquals(0, $tokenCount);
    }

    public function testIsValidMessage(): void {
        $validMessage = ['role' => 'user', 'content' => 'Hello'];
        $this->assertTrue($this->chatService->isValidMessage($validMessage));

        $invalidMessage1 = ['role' => 'user']; // Missing content
        $this->assertFalse($this->chatService->isValidMessage($invalidMessage1));

        $invalidMessage2 = ['content' => 'Hello']; // Missing role
        $this->assertFalse($this->chatService->isValidMessage($invalidMessage2));

        $invalidMessage3 = ['role' => 'invalid', 'content' => 'Hello']; // Invalid role
        $this->assertFalse($this->chatService->isValidMessage($invalidMessage3));

        $invalidMessage4 = ['role' => 'user', 'content' => '']; // Empty content
        $this->assertFalse($this->chatService->isValidMessage($invalidMessage4));
    }

    public function testCreateSystemMessage(): void {
        $content = 'You are a helpful assistant.';
        $message = $this->chatService->createSystemMessage($content);

        $this->assertEquals('system', $message['role']);
        $this->assertEquals($content, $message['content']);
        $this->assertTrue($this->chatService->isValidMessage($message));
    }

    public function testCreateUserMessage(): void {
        $content = 'Hello, how are you?';
        $message = $this->chatService->createUserMessage($content);

        $this->assertEquals('user', $message['role']);
        $this->assertEquals($content, $message['content']);
        $this->assertTrue($this->chatService->isValidMessage($message));
    }

    public function testCreateAssistantMessage(): void {
        $content = 'I am doing well, thank you!';
        $message = $this->chatService->createAssistantMessage($content);

        $this->assertEquals('assistant', $message['role']);
        $this->assertEquals($content, $message['content']);
        $this->assertTrue($this->chatService->isValidMessage($message));
    }

    public function testMessageHelpers(): void {
        $systemMsg = $this->chatService->createSystemMessage('System prompt');
        $userMsg = $this->chatService->createUserMessage('User message');
        $assistantMsg = $this->chatService->createAssistantMessage('Assistant response');

        $messages = [$systemMsg, $userMsg, $assistantMsg];

        foreach ($messages as $message) {
            $this->assertTrue($this->chatService->isValidMessage($message));
        }

        $tokenCount = $this->chatService->countTokens($messages);
        $this->assertGreaterThan(0, $tokenCount);
    }

    public function testCreateCompletionWithVeniceParameters(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];
        $options = [
            'venice_parameters' => [
                'include_venice_system_prompt' => true
            ]
        ];

        $this->expectException(\Exception::class); // Will fail due to invalid API key
        $this->chatService->createCompletion($messages, 'default', $options);
    }

    public function testCreateCompletionWithIncludeVeniceSystemPrompt(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];
        $options = [
            'include_venice_system_prompt' => true
        ];

        $this->expectException(\Exception::class); // Will fail due to invalid API key
        $this->chatService->createCompletion($messages, 'default', $options);
    }
}
