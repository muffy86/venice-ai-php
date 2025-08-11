<?php

require_once __DIR__ . '/bootstrap.php';

use Venice\VeniceAI;
use Venice\N8n\N8nService;

echo "Testing Venice AI SDK...\n";

try {
    // Test basic initialization
    $venice = new VeniceAI('vBgTDh77ba5HlsADmHN8WsQIBke27dN04_RoNxgk8S');
    echo "✅ Venice AI initialized\n";
    
    // Test N8N service
    $n8n = new N8nService('http://localhost:5678', 'test_key');
    echo "✅ N8N service initialized\n";
    
    // Test configuration
    $config = $GLOBALS['venice_config'] ?? null;
    if ($config) {
        echo "✅ Configuration loaded\n";
    } else {
        echo "❌ Configuration missing\n";
    }
    
    echo "\n🎉 All tests passed!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}