<?php

namespace Venice\Chat;

use Venice\VeniceAI;

/**
 * Service for interacting with Venice AI's chat endpoints
 */
class ChatService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;
    }

    /**
     * Create a chat completion
     *
     * @param array $messages Array of message objects
     * @param string $model Model to use (defaults to 'default' which maps to Venice's recommended model)
     * @param array $options Additional options
     * @return array|string The API response (array for regular responses, string for streaming)
     * @throws \InvalidArgumentException If parameters are invalid
     * @throws \Exception If the request fails
     */
    public function createCompletion(array $messages, string $model = 'default', array $options = []): array|string {
        if (empty($messages)) {
            throw new \InvalidArgumentException('messages array is required');
        }

        // Validate each message
        foreach ($messages as $message) {
            if (!isset($message['role'])) {
                throw new \InvalidArgumentException('Each message must have a role');
            }
            if (!in_array($message['role'], ['system', 'user', 'assistant'])) {
                throw new \InvalidArgumentException('Invalid role: ' . $message['role']);
            }
            if (!isset($message['content'])) {
                throw new \InvalidArgumentException('Each message must have content');
            }
        }

        // Build request data
        $data = [
            'model' => $model,
            'messages' => $messages
        ];

        // Add optional parameters
        $optionalParams = [
            'temperature',
            'top_p',
            'n',
            'stream',
            'stop',
            'max_tokens',
            'presence_penalty',
            'frequency_penalty',
            'logit_bias',
            'user'
        ];

        foreach ($optionalParams as $param) {
            if (isset($options[$param])) {
                $data[$param] = $options[$param];
            }
        }

        // Add Venice-specific parameters
        if (isset($options['venice_parameters'])) {
            $data['venice_parameters'] = $options['venice_parameters'];
        }
        
        // Handle include_venice_system_prompt parameter separately for convenience
        if (isset($options['include_venice_system_prompt'])) {
            if (!isset($data['venice_parameters'])) {
                $data['venice_parameters'] = [];
            }
            $data['venice_parameters']['include_venice_system_prompt'] =
                (bool)$options['include_venice_system_prompt'];
        }

        // Make the request
        return $this->client->request('POST', '/chat/completions', $data);
    }
}