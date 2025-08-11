<?php

require_once __DIR__ . '/../bootstrap.php';

use Venice\N8n\N8nService;

// Initialize N8N service
$n8n = new N8nService('http://localhost:5678', 'n8n_api_key_venice_2024');

// Create AI workflow
$workflow = [
    'name' => 'Venice AI Automation',
    'nodes' => [
        [
            'name' => 'Webhook',
            'type' => 'n8n-nodes-base.webhook',
            'position' => [250, 300],
            'parameters' => [
                'httpMethod' => 'POST',
                'path' => 'venice-ai-trigger'
            ]
        ],
        [
            'name' => 'Venice AI',
            'type' => 'n8n-nodes-base.httpRequest',
            'position' => [450, 300],
            'parameters' => [
                'url' => 'https://api.venice.ai/v2/chat/completions',
                'method' => 'POST',
                'headers' => [
                    'Authorization' => 'Bearer vBgTDh77ba5HlsADmHN8WsQIBke27dN04_RoNxgk8S'
                ],
                'body' => [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [['role' => 'user', 'content' => '{{$json["prompt"]}}']]
                ]
            ]
        ]
    ],
    'connections' => [
        'Webhook' => [
            'main' => [['node' => 'Venice AI', 'type' => 'main', 'index' => 0]]
        ]
    ]
];

try {
    $result = $n8n->createWorkflow($workflow);
    echo "Workflow created: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
    // Execute workflow
    if (isset($result['id'])) {
        $execution = $n8n->executeWorkflow($result['id'], ['prompt' => 'Hello AI!']);
        echo "Execution result: " . json_encode($execution, JSON_PRETTY_PRINT) . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}