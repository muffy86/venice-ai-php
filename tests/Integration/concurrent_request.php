<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Exceptions\AuthenticationException;

// Helper script for concurrent request testing
try {
    $venice = new VeniceAI(getenv('VENICE_API_KEY') ?: 'test-api-key', [
        'timeout' => 10,
        'max_retries' => 1
    ]);

    $messages = [
        ['role' => 'user', 'content' => 'Test message ' . uniqid()]
    ];

    $response = $venice->chat()->createCompletion($messages);
    echo "SUCCESS\n";
} catch (AuthenticationException $e) {
    echo "AUTH_ERROR\n";
} catch (\Exception $e) {
    echo "ERROR\n";
}
