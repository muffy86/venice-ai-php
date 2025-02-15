<?php

require_once __DIR__ . '/../VeniceAI.php';

// Initialize with debug mode on to see improved output
$venice = new VeniceAI(true);

// Test 1: Image Size Validation
echo "\nTest 1: Image Size Validation\n";
echo "============================\n";

try {
    // Test invalid size
    $venice->generateImage([
        'prompt' => 'test image',
        'width' => 800,
        'height' => 600
    ]);
} catch (Exception $e) {
    // Should show available sizes with descriptive names
    echo "Expected error: " . $e->getMessage() . "\n";
}

// Test 2: Error Handling
echo "\nTest 2: Error Handling\n";
echo "=====================\n";

require_once __DIR__ . '/HttpClient.php';

// Test authentication error
try {
    HttpClient::request(
        'https://api.venice.ai/api/v1/models',
        'GET',
        ['Authorization' => 'Bearer invalid-key'],
        [],
        true
    );
} catch (Exception $e) {
    // Error message will be shown by HttpClient debug
}

// Test rate limit error
try {
    HttpClient::request(
        'https://api.venice.ai/api/v1/models',
        'GET',
        ['Authorization' => 'Bearer test-key'],
        [],
        true,
        null,
        429
    );
} catch (Exception $e) {
    // Error message will be shown by HttpClient debug
}

// Test 3: Valid Request
echo "\nTest 3: Valid Request\n";
echo "===================\n";

try {
    $venice->generateImage([
        'prompt' => 'test image',
        'width' => 1024,
        'height' => 1024
    ]);
} catch (Exception $e) {
    echo $e->getMessage() . "\n";
}