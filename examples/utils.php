<?php

/**
 * Shared utility functions for Venice AI examples
 * @deprecated Use ResponseFormatter class instead
 */

require_once __DIR__ . '/ResponseFormatter.php';

/**
 * Helper function to print section headers
 * @deprecated Use ResponseFormatter::printSection() instead
 */
function printSection(string $title) {
    return ResponseFormatter::printSection($title);
}

/**
 * Helper function to print responses
 * @deprecated Use ResponseFormatter::printResponse() instead
 */
function printResponse($response, $label = '') {
    return ResponseFormatter::printResponse($response, $label);
}

/**
 * Helper function to handle streaming responses
 * @deprecated Use ResponseFormatter::handleStreamingResponse() instead
 */
function handleStreamingResponse($response, $progressCallback = null) {
    return ResponseFormatter::handleStreamingResponse($response, $progressCallback);
}

/**
 * Helper function to save base64 image data to a file
 * @deprecated Use ResponseFormatter::saveImage() instead
 */
function saveImage($base64Data, $filename) {
    return ResponseFormatter::saveImage($base64Data, $filename);
}

/**
 * Helper function to ensure output directory exists
 * @deprecated Use ResponseFormatter::ensureOutputDirectory() instead
 */
function ensureOutputDirectory($dir) {
    return ResponseFormatter::ensureOutputDirectory($dir);
}