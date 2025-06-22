<?php

namespace Venice\Tests\Utils;

use PHPUnit\Framework\TestCase;
use Venice\Utils\Validator;
use Venice\Exceptions\ValidationException;

class ValidatorTest extends TestCase {
    public function testValidateChatCompletionSuccess(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello, world!']
        ];

        // Should not throw exception
        Validator::validateChatCompletion($messages, 'gpt-3.5-turbo');
        $this->assertTrue(true);
    }

    public function testValidateChatCompletionEmptyMessages(): void {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Messages array cannot be empty');

        Validator::validateChatCompletion([], 'gpt-3.5-turbo');
    }

    public function testValidateChatCompletionInvalidRole(): void {
        $messages = [
            ['role' => 'invalid', 'content' => 'Hello']
        ];

        $this->expectException(ValidationException::class);
        Validator::validateChatCompletion($messages, 'gpt-3.5-turbo');
    }

    public function testValidateChatCompletionMissingContent(): void {
        $messages = [
            ['role' => 'user']
        ];

        $this->expectException(ValidationException::class);
        Validator::validateChatCompletion($messages, 'gpt-3.5-turbo');
    }

    public function testValidateChatCompletionInvalidTemperature(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];
        $options = ['temperature' => 3.0]; // Invalid: > 2

        $this->expectException(ValidationException::class);
        Validator::validateChatCompletion($messages, 'gpt-3.5-turbo', $options);
    }

    public function testValidateChatCompletionInvalidTopP(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Hello']
        ];
        $options = ['top_p' => 1.5]; // Invalid: > 1

        $this->expectException(ValidationException::class);
        Validator::validateChatCompletion($messages, 'gpt-3.5-turbo', $options);
    }

    public function testValidateImageGenerationSuccess(): void {
        $params = [
            'prompt' => 'A beautiful sunset',
            'width' => 1024,
            'height' => 1024
        ];

        // Should not throw exception
        Validator::validateImageGeneration($params);
        $this->assertTrue(true);
    }

    public function testValidateImageGenerationEmptyPrompt(): void {
        $params = [
            'prompt' => '',
            'width' => 1024,
            'height' => 1024
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Prompt is required and cannot be empty');

        Validator::validateImageGeneration($params);
    }

    public function testValidateImageGenerationInvalidSize(): void {
        $params = [
            'prompt' => 'Test image',
            'width' => 800,
            'height' => 600
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Invalid image size');

        Validator::validateImageGeneration($params);
    }

    public function testValidateImageGenerationLongPrompt(): void {
        $params = [
            'prompt' => str_repeat('a', 1001), // Too long
            'width' => 1024,
            'height' => 1024
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Prompt cannot exceed 1000 characters');

        Validator::validateImageGeneration($params);
    }

    public function testValidateImageGenerationInvalidN(): void {
        $params = [
            'prompt' => 'Test image',
            'width' => 1024,
            'height' => 1024,
            'n' => 15 // Invalid: > 10
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Number of images must be between 1 and 10');

        Validator::validateImageGeneration($params);
    }

    public function testValidateModelParamsSuccess(): void {
        $params = [
            'filter' => ['type' => 'text'],
            'limit' => 10
        ];

        // Should not throw exception
        Validator::validateModelParams($params);
        $this->assertTrue(true);
    }

    public function testValidateModelParamsInvalidFilter(): void {
        $params = [
            'filter' => 'invalid' // Should be array
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Filter must be an array');

        Validator::validateModelParams($params);
    }

    public function testValidateModelParamsInvalidLimit(): void {
        $params = [
            'limit' => -1 // Invalid: < 1
        ];

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Limit must be a positive integer');

        Validator::validateModelParams($params);
    }
}
