<?php

namespace Venice\Utils;

use Venice\Exceptions\ValidationException;

/**
 * Request parameter validation utility
 */
class Validator {
    /**
     * Validate chat completion parameters
     *
     * @param array $messages Messages array
     * @param string $model Model name
     * @param array $options Additional options
     * @throws ValidationException
     */
    public static function validateChatCompletion(array $messages, string $model, array $options = []): void {
        $errors = [];

        // Validate messages
        if (empty($messages)) {
            $errors['messages'] = 'Messages array cannot be empty';
        } else {
            foreach ($messages as $index => $message) {
                if (!isset($message['role'])) {
                    $errors["messages.$index.role"] = 'Role is required';
                } elseif (!in_array($message['role'], ['system', 'user', 'assistant'])) {
                    $errors["messages.$index.role"] = 'Invalid role: ' . $message['role'];
                }

                if (!isset($message['content']) || trim($message['content']) === '') {
                    $errors["messages.$index.content"] = 'Content is required and cannot be empty';
                }
            }
        }

        // Validate model
        if (empty($model)) {
            $errors['model'] = 'Model name is required';
        }

        // Validate optional parameters
        if (isset($options['temperature']) &&
            (!is_numeric($options['temperature']) ||
             $options['temperature'] < 0 ||
             $options['temperature'] > 2)) {
            $errors['temperature'] = 'Temperature must be between 0 and 2';
        }

        if (isset($options['top_p']) &&
            (!is_numeric($options['top_p']) ||
             $options['top_p'] < 0 ||
             $options['top_p'] > 1)) {
            $errors['top_p'] = 'Top P must be between 0 and 1';
        }

        if (isset($options['n']) &&
            (!is_int($options['n']) ||
             $options['n'] < 1 ||
             $options['n'] > 10)) {
            $errors['n'] = 'N must be between 1 and 10';
        }

        if (isset($options['max_tokens']) &&
            (!is_int($options['max_tokens']) ||
             $options['max_tokens'] < 1)) {
            $errors['max_tokens'] = 'Max tokens must be greater than 0';
        }

        if (isset($options['presence_penalty']) &&
            (!is_numeric($options['presence_penalty']) ||
             $options['presence_penalty'] < -2 ||
             $options['presence_penalty'] > 2)) {
            $errors['presence_penalty'] = 'Presence penalty must be between -2 and 2';
        }

        if (isset($options['frequency_penalty']) &&
            (!is_numeric($options['frequency_penalty']) ||
             $options['frequency_penalty'] < -2 ||
             $options['frequency_penalty'] > 2)) {
            $errors['frequency_penalty'] = 'Frequency penalty must be between -2 and 2';
        }

        if (!empty($errors)) {
            throw new ValidationException(
                'Validation failed for chat completion',
                400,
                null,
                ['parameter_errors' => $errors],
                null,
                $errors
            );
        }
    }

    /**
     * Validate image generation parameters
     *
     * @param array $params Image generation parameters
     * @throws ValidationException
     */
    public static function validateImageGeneration(array $params): void {
        $errors = [];

        // Validate prompt
        if (!isset($params['prompt']) || trim($params['prompt']) === '') {
            $errors['prompt'] = 'Prompt is required and cannot be empty';
        } elseif (strlen($params['prompt']) > 1000) {
            $errors['prompt'] = 'Prompt cannot exceed 1000 characters';
        }

        // Validate dimensions
        $validSizes = [
            '256x256',
            '512x512',
            '1024x1024'
        ];

        if (isset($params['width']) && isset($params['height'])) {
            $size = "{$params['width']}x{$params['height']}";
            if (!in_array($size, $validSizes)) {
                $errors['size'] = "Invalid image size. Supported sizes: " . implode(', ', $validSizes);
            }
        }

        // Validate number of images
        if (isset($params['n'])) {
            if (!is_int($params['n']) || $params['n'] < 1 || $params['n'] > 10) {
                $errors['n'] = 'Number of images must be between 1 and 10';
            }
        }

        if (!empty($errors)) {
            throw new ValidationException(
                'Validation failed for image generation',
                400,
                null,
                ['parameter_errors' => $errors],
                null,
                $errors
            );
        }
    }

    /**
     * Validate model parameters
     *
     * @param array $params Model parameters
     * @throws ValidationException
     */
    public static function validateModelParams(array $params): void {
        $errors = [];

        if (isset($params['filter']) && !is_array($params['filter'])) {
            $errors['filter'] = 'Filter must be an array';
        }

        if (isset($params['limit'])) {
            if (!is_int($params['limit']) || $params['limit'] < 1) {
                $errors['limit'] = 'Limit must be a positive integer';
            }
        }

        if (!empty($errors)) {
            throw new ValidationException(
                'Validation failed for model parameters',
                400,
                null,
                ['parameter_errors' => $errors],
                null,
                $errors
            );
        }
    }
}
