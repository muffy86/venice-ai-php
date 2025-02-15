<?php
/**
 * Venice AI API Example: Image Upscaling
 * 
 * This example demonstrates EVERY parameter available in the upscaling API:
 * 
 * Required Parameters:
 * - image (file): The image to upscale. Must be a PNG file.
 * - scale (string): Scale factor, must be "2" or "4"
 * 
 * Optional Parameters:
 * - return_binary (boolean, default: false): Return raw binary data instead of base64
 * 
 * Response Headers:
 * - x-ratelimit-limit-requests: Rate limit for requests
 * - x-ratelimit-remaining-requests: Remaining requests
 * - x-ratelimit-reset-requests: Reset time for rate limit
 * 
 * Limitations:
 * - Maximum input file size: 5MB
 * - Input format: PNG only
 * - Content-Type: multipart/form-data
 * 
 * Error Responses:
 * - 400: Invalid content-type or corrupt image
 * - 401: Authentication failed
 * - 413: File too large (>5MB)
 * - 415: Unsupported media type
 * - 429: Rate limit exceeded
 * - 500: Inference failed
 * - 503: Model at capacity
 * 
 * Source: https://github.com/veniceai/api-docs/
 * Postman: https://www.postman.com/veniceai/venice-ai-workspace/
 */

require_once __DIR__ . '/../../VeniceAI.php';

// Parse command line arguments for debug mode
$debug = in_array('--debug', $argv) || in_array('-d', $argv);

// Initialize the Venice AI client
$venice = new VeniceAI($debug);

// Create output directory if it doesn't exist
$outputDir = __DIR__ . '/output';
if (!file_exists($outputDir)) {
    if (!mkdir($outputDir, 0777, true)) {
        die("Failed to create output directory: $outputDir\n");
    }
    echo "Created output directory: $outputDir\n";
}

// Helper function to save image data
function saveImage($imageData, $filename) {
    // Check if data is base64 encoded
    if (preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $imageData)) {
        $imageData = base64_decode($imageData);
    }
    
    if (!$imageData) {
        throw new Exception("Failed to process image data");
    }
    
    if (file_put_contents($filename, $imageData) === false) {
        throw new Exception("Failed to save image to: $filename");
    }
    
    echo "Image saved as: $filename\n";
}

try {
    // Example 1: Basic 2x upscaling with base64 response
    echo "Example 1: Basic 2x Upscaling (base64 response)\n";
    echo str_repeat("-", 50) . "\n";
    
    // First generate a test image
    echo "Generating initial image...\n";
    $response = $venice->generateImage([
        'model' => 'fluently-xl',
        'prompt' => 'A simple geometric pattern with circles and squares',
        'width' => 1024,    // Use standard size
        'height' => 1024,
        'steps' => 30,      // Default steps
        'cfg_scale' => 7.5  // Default guidance scale
    ]);

    if (isset($response['data'])) {
        // Save the original image
        saveImage(
            $response['data'],
            $outputDir . '/pattern_original.png'
        );
        
        echo "Upscaling with 2x scale (base64 response)...\n";
        $upscaledResponse = $venice->upscaleImage([
            'image' => $outputDir . '/pattern_original.png',
            'scale' => '2',  // Must be string "2" or "4"
            'return_binary' => false  // Get base64 response
        ]);
        
        // Save the upscaled result
        if (isset($upscaledResponse['data'])) {
            saveImage(
                $upscaledResponse['data'],
                $outputDir . '/pattern_upscaled_2x.png'
            );
        }
    }

    // Example 2: 4x upscaling with binary response
    echo "\nExample 2: 4x Upscaling (binary response)\n";
    echo str_repeat("-", 50) . "\n";
    
    $imagePath = $outputDir . '/pattern_original.png';
    if (file_exists($imagePath)) {
        echo "Upscaling with 4x scale (binary response)...\n";
        try {
            $response = $venice->upscaleImage([
                'image' => $imagePath,
                'scale' => '4',  // Must be string "4"
                'return_binary' => true  // Get binary response
            ]);
            
            if (isset($response['data'])) {
                saveImage(
                    $response['data'],
                    $outputDir . '/pattern_upscaled_4x.png'
                );
            }
        } catch (Exception $e) {
            echo "Upscaling error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Error: Source image not found.\n";
    }

    // Example 3: Error handling - invalid scale value
    echo "\nExample 3: Error Handling - Invalid Scale\n";
    echo str_repeat("-", 50) . "\n";
    
    try {
        $venice->upscaleImage([
            'image' => $outputDir . '/pattern_original.png',
            'scale' => '3'  // Invalid scale value
        ]);
    } catch (InvalidArgumentException $e) {
        echo "Expected error caught: Scale must be '2' or '4'\n";
    }

    // Example 4: Error handling - file too large
    echo "\nExample 4: Error Handling - File Size\n";
    echo str_repeat("-", 50) . "\n";
    
    try {
        // This would trigger a 413 error if file > 5MB
        if (filesize($outputDir . '/pattern_original.png') > 5 * 1024 * 1024) {
            throw new Exception("File too large (max 5MB)");
        } else {
            echo "File size check passed (under 5MB)\n";
        }
    } catch (Exception $e) {
        echo "Expected error caught: " . $e->getMessage() . "\n";
    }

    // Example 5: Error handling - wrong file type
    echo "\nExample 5: Error Handling - File Type\n";
    echo str_repeat("-", 50) . "\n";
    
    try {
        // This would trigger a 415 error if not PNG
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $outputDir . '/pattern_original.png');
        finfo_close($finfo);
        
        if ($mimeType !== 'image/png') {
            throw new Exception("Invalid file type (must be PNG)");
        } else {
            echo "File type check passed (is PNG)\n";
        }
    } catch (Exception $e) {
        echo "Expected error caught: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Output comprehensive tips
echo "\nUpscaling Parameters:\n";
echo "1. Required:\n";
echo "   • image: PNG file to upscale (max 5MB)\n";
echo "   • scale: Must be '2' or '4' (as string)\n";
echo "\n2. Optional:\n";
echo "   • return_binary: true for raw data, false for base64\n";
echo "\n3. Technical Requirements:\n";
echo "   • Content-Type: multipart/form-data\n";
echo "   • File format: PNG only\n";
echo "   • Maximum size: 5MB\n";
echo "\n4. Response Headers:\n";
echo "   • x-ratelimit-limit-requests: Your rate limit\n";
echo "   • x-ratelimit-remaining-requests: Requests left\n";
echo "   • x-ratelimit-reset-requests: Reset timestamp\n";
echo "\n5. Best Practices:\n";
echo "   • Verify file type before uploading\n";
echo "   • Check file size before uploading\n";
echo "   • Monitor rate limits in response headers\n";
echo "   • Use return_binary=true for efficiency\n";
echo "   • Clean up temporary files\n";
echo "   • Validate upscaled results\n";
echo "\n6. Common Use Cases:\n";
echo "   • Enhance AI-generated images\n";
echo "   • Prepare images for printing\n";
echo "   • Create high-resolution versions\n";
echo "   • Batch process multiple images\n";
echo "\n7. Debug Options:\n";
echo "   • --debug (-d): Show detailed HTTP output\n";
