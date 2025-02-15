<?php
require_once __DIR__ . '/VeniceAI.php';

// Initialize the Venice AI client
$venice = new VeniceAI('qmiRR9vbf18QlgLJhaXLlIutf0wJuzdUgPr24dcBtD', true);

// List all models
$models = $venice->listModels();
print_r($models);