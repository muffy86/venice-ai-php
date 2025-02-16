<?php

/**
 * Static utility class for formatting API responses
 */
class ResponseFormatter {
    /**
     * Filter sensitive data from debug output
     * 
     * @param mixed $data The data to filter
     * @return mixed Filtered data safe for debug output
     */
    public static function filterDebugData($data) {
        if (is_array($data)) {
            $filtered = [];
            foreach ($data as $key => $value) {
                if ($key === 'messages') {
                    $filtered[$key] = array_map(function($msg) {
                        if (isset($msg['content']) && is_array($msg['content'])) {
                            $msg['content'] = array_map(function($item) {
                                if (isset($item['image_url']['url']) && strpos($item['image_url']['url'], 'base64') !== false) {
                                    $item['image_url']['url'] = '[base64 image data]';
                                }
                                return $item;
                            }, $msg['content']);
                        }
                        return $msg;
                    }, $value);
                } else {
                    $filtered[$key] = self::filterDebugData($value);
                }
            }
            return $filtered;
        } elseif (is_string($data)) {
            if (strpos($data, 'base64') !== false || strlen($data) > 100) {
                return '[long string/base64 data]';
            }
        }
        return $data;
    }

    /**
     * Filter sensitive data from response output
     * 
     * @param mixed $data The data to filter
     * @return mixed Filtered data safe for output
     */
    public static function filterResponseData($data) {
        if (is_array($data)) {
            $filtered = [];
            foreach ($data as $key => $value) {
                if ($key === 'content' && is_array($value)) {
                    $filtered[$key] = array_map(function($item) {
                        if (isset($item['image_url']['url']) && strpos($item['image_url']['url'], 'base64') !== false) {
                            $item['image_url']['url'] = '[base64 image data]';
                        }
                        return $item;
                    }, $value);
                } elseif ($key === 'b64_json' || $key === 'base64') {
                    $filtered[$key] = '[base64 data]';
                } else {
                    $filtered[$key] = self::filterResponseData($value);
                }
            }
            return $filtered;
        } elseif (is_string($data)) {
            if (strpos($data, 'base64') !== false || strlen($data) > 100) {
                return '[long string/base64 data]';
            }
        }
        return $data;
    }

    /**
     * Print a section header
     * 
     * @param string $title The section title
     */
    public static function printSection(string $title) {
        echo "\n", str_repeat("=", 80), "\n";
        echo $title, "\n";
        echo str_repeat("=", 80), "\n";
    }

    /**
     * Print a response with optional label
     * 
     * @param mixed $response The response to print
     * @param string $label Optional label for the response
     */
    public static function printResponse($response, $label = '') {
        if ($label) echo "\n$label:\n";
        if (is_string($response)) {
            echo $response, "\n";
        } else {
            // Special handling for image generation responses
            if (isset($response['data']) && isset($response['data'][0]['b64_json'])) {
                echo "Image generated successfully\n";
            } else {
                echo json_encode(self::filterResponseData($response), JSON_PRETTY_PRINT), "\n";
            }
        }
    }

    /**
     * Handle a streaming response
     * 
     * @param mixed $response The streaming response
     * @param callable|null $progressCallback Optional callback for progress updates
     * @return string The full response text
     */
    public static function handleStreamingResponse($response, $progressCallback = null, $debug = false) {
        $fullResponse = '';
        
        if ($debug) {
            echo "\n[Debug] Processing streaming response...\n";
            echo "[Debug] Response length: " . strlen($response) . " bytes\n";
        }
        
        // Split response into chunks by newlines
        $chunks = explode("\n", $response);
        
        if ($debug) {
            echo "[Debug] Found " . count($chunks) . " chunks\n";
        }
        
        foreach ($chunks as $i => $chunk) {
            // Look for "data: " prefix
            if (strpos($chunk, 'data: ') === 0) {
                $json = substr($chunk, 6); // Remove "data: " prefix
                
                if ($debug) {
                    echo "[Debug] Processing chunk " . ($i + 1) . ":\n";
                    echo "[Debug] Raw chunk: " . $chunk . "\n";
                }
                
                // Check for end of stream
                if ($json === '[DONE]') {
                    if ($debug) {
                        echo "[Debug] End of stream marker found\n";
                    }
                    continue;
                }
                
                // Fix malformed JSON by adding missing commas
                $json = preg_replace('/"([^"]+)""/', '"$1","', $json);
                $data = json_decode($json, true);
                
                if ($debug) {
                    if ($data === null) {
                        echo "[Debug] Failed to parse JSON: " . json_last_error_msg() . "\n";
                        echo "[Debug] Attempted to parse: " . $json . "\n";
                    } else {
                        echo "[Debug] Successfully parsed JSON\n";
                    }
                }
                if ($data && isset($data['choices'][0]['delta']['content'])) {
                    $text = $data['choices'][0]['delta']['content'];
                    
                    if ($debug) {
                        echo "\n[Debug] Content received: " . json_encode($text) . "\n";
                        echo "[Debug] Content length: " . strlen($text) . " characters\n";
                    }
                    
                    echo $text;
                    $fullResponse .= $text;
                    
                    if ($progressCallback) {
                        if ($debug) {
                            echo "[Debug] Calling progress callback\n";
                        }
                        $progressCallback($text);
                    }
                    
                    // Only try to flush if output buffering is active
                    if (ob_get_level() > 0) {
                        if ($debug) {
                            echo "[Debug] Output buffering active (level " . ob_get_level() . ")\n";
                        }
                        @ob_flush();
                    } else if ($debug) {
                        echo "[Debug] No output buffering active\n";
                    }
                    @flush();
                    
                    if ($debug) {
                        echo "[Debug] Output flushed\n";
                        echo "[Debug] Current response length: " . strlen($fullResponse) . " characters\n";
                        echo "----------------------------------------\n";
                    }
                } else if ($debug) {
                    echo "[Debug] No content in delta\n";
                }
            }
        }
        
        return $fullResponse;
    }

    /**
     * Save base64 image data to a file
     * 
     * @param string $base64Data The base64 encoded image data
     * @param string $filename The filename to save to
     * @return string The saved filename
     */
    public static function saveImage($base64Data, $filename) {
        $imageData = base64_decode($base64Data);
        file_put_contents($filename, $imageData);
        echo "Image saved as: $filename\n";
        return $filename;
    }

    /**
     * Ensure an output directory exists
     * 
     * @param string $dir The directory path
     * @return string The directory path
     */
    public static function ensureOutputDirectory($dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }
        return $dir;
    }
}