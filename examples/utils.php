<?php

/**
 * Shared utility functions for Venice AI examples
 */

/**
 * Helper function to print section headers
 */
function printSection(string $title) {
    echo "\n", str_repeat("=", 80), "\n";
    echo $title, "\n";
    echo str_repeat("=", 80), "\n";
}

/**
 * Helper function to print responses
 */
function printResponse($response, $label = '') {
    if ($label) echo "\n$label:\n";
    if (is_string($response)) {
        echo $response, "\n";
    } else {
        // Special handling for image generation responses
        if (isset($response['data']) && isset($response['data'][0]['b64_json'])) {
            $imageData = $response['data'][0];
            echo "Image generated successfully:\n";
            echo "- Format: " . ($imageData['format'] ?? 'unknown') . "\n";
            echo "- Size: " . strlen($imageData['b64_json']) . " bytes\n";
            // Omit the actual base64 data to avoid overwhelming output
        } else {
            echo json_encode($response, JSON_PRETTY_PRINT), "\n";
        }
    }
}

/**
 * Helper function to handle streaming responses
 */
function handleStreamingResponse($response, $progressCallback = null) {
    $fullResponse = '';
    
    foreach ($response as $chunk) {
        if (isset($chunk['choices'][0]['message']['content'])) {
            $text = $chunk['choices'][0]['message']['content'];
            echo $text;
            $fullResponse .= $text;
            
            if ($progressCallback) {
                $progressCallback($text);
            }
            
            // Flush output buffer to show text immediately
            ob_flush();
            flush();
        }
    }
    
    return $fullResponse;
}

/**
 * Helper function to save base64 image data to a file
 */
function saveImage($base64Data, $filename) {
    $imageData = base64_decode($base64Data);
    file_put_contents($filename, $imageData);
    echo "Image saved as: $filename\n";
    return $filename;
}

/**
 * Helper function to ensure output directory exists
 */
function ensureOutputDirectory($dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    return $dir;
}