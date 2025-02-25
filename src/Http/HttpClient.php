<?php

namespace Venice\Http;

/**
 * Static utility class for handling HTTP requests
 */
class HttpClient {
    /**
     * Make an HTTP request
     * 
     * @param string $url The URL to request
     * @param string $method HTTP method (GET, POST, etc.)
     * @param array $headers Request headers
     * @param array $data Request data (optional)
     * @param bool $debug Enable debug output
     * @param resource|null $debugHandle Debug output handle
     * @return array|string The response (array for JSON, string for binary)
     * @throws \Exception If the request fails
     */
    public static function request(
        string $url,
        string $method,
        array $headers,
        array $data = [],
        bool $debug = false,
        $debugHandle = null,
        ?int $testStatusCode = null
    ): array|string {
        $ch = curl_init($url);
        
        $headersList = [];
        foreach ($headers as $key => $value) {
            $headersList[] = "$key: $value";
        }

        // Set up CURL options with debug settings
        $options = [
            CURLOPT_HTTPHEADER => $headersList,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HEADER => false
        ];

        // For streaming responses, set appropriate headers
        if (isset($data['stream']) && $data['stream']) {
            $options[CURLOPT_HTTPHEADER][] = 'Accept: text/event-stream';
            $options[CURLOPT_RETURNTRANSFER] = true;
        } else {
            $options[CURLOPT_RETURNTRANSFER] = true;
        }

        // Set debug handle if in debug mode
        if ($debug) {
            $options[CURLOPT_STDERR] = $debugHandle;
        }

        // Show concise debug output focusing on key information
        if ($debug) {
            echo "\n[Request] $method $url\n";
            if (!empty($data)) {
                $debugData = self::filterDebugData($data);
                echo "[Payload] " . json_encode($debugData, JSON_PRETTY_PRINT) . "\n";
            }
        }

        if (!empty($data)) {
            // If we're sending an image file, use multipart form data
            if (isset($data['image']) && file_exists($data['image'])) {
                $postFields = [];
                
                // Add image file
                $postFields['image'] = new \CURLFile(
                    $data['image'],
                    'image/png',
                    basename($data['image'])
                );
                
                // Add all other fields except 'image'
                foreach ($data as $key => $value) {
                    if ($key !== 'image') {
                        $postFields[$key] = (string)$value;
                    }
                }
                
                $options[CURLOPT_POSTFIELDS] = $postFields;
                
                // Update headers for multipart form data
                $headersList = array_filter($headersList, function($header) {
                    return !preg_match('/^(Content-Type:|Accept:)/i', $header);
                });
                $headersList[] = 'Content-Type: multipart/form-data';
                if (strpos($url, '/image/') === 0) {
                    $headersList[] = 'Accept: image/*';
                }
                $options[CURLOPT_HTTPHEADER] = $headersList;
            } else {
                $options[CURLOPT_POSTFIELDS] = json_encode($data);
            }
        }

        // Try up to 3 times for connection errors
        $maxRetries = 3;
        $attempt = 1;
        $response = null;
        $statusCode = null;
        $contentType = null;
        $lastError = null;

        while ($attempt <= $maxRetries) {
            curl_setopt_array($ch, $options);
            $response = curl_exec($ch);
            if ($testStatusCode !== null) {
                // For testing: simulate API response
                $statusCode = $testStatusCode;
                $contentType = 'application/json';
                $response = json_encode([
                    'error' => [
                        'message' => 'Test error message',
                        'type' => 'test_error'
                    ]
                ]);
                break;
            } else {
                $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

                if (!curl_errno($ch)) {
                    // Success
                    break;
                }
            }

            $lastError = curl_error($ch);
            if ($debug) {
                echo "\nAttempt $attempt failed: " . $lastError . "\n";
            }

            // Only retry on connection errors
            if (!in_array(curl_errno($ch), [
                CURLE_COULDNT_CONNECT,
                CURLE_COULDNT_RESOLVE_HOST,
                CURLE_OPERATION_TIMEOUTED,
                CURLE_GOT_NOTHING,
                CURLE_RECV_ERROR,
                CURLE_SEND_ERROR
            ])) {
                break;
            }

            $attempt++;
            if ($attempt <= $maxRetries) {
                // Wait before retrying (exponential backoff)
                $delay = pow(2, $attempt - 1);
                if ($debug) {
                    echo "Waiting {$delay}s before retry...\n";
                }
                sleep($delay);
            }
        }

        if ($lastError) {
            curl_close($ch);
            $errorMsg = 'Request failed after ' . ($attempt - 1) . ' retries: ' . $lastError;
            if ($debug) {
                echo "\nFinal Error: " . $errorMsg . "\n";
                echo "Status Code: " . $statusCode . "\n";
                if ($response) {
                    echo "Response: " . substr($response, 0, 1000) . "\n";
                }
            }
            throw new \Exception($errorMsg);
        }
        
        curl_close($ch);

        if (!$response) {
            throw new \Exception('Empty response received from API');
        }

        if ($statusCode >= 400) {
            // Try to parse error response
            $errorData = json_decode($response, true);
            if ($errorData && isset($errorData['error'])) {
                $error = $errorData['error'];
                $message = is_array($error) ? $error['message'] : $error;
                $errorContext = '';
                
                // Add HTTP status context
                switch ($statusCode) {
                    case 401:
                        $errorContext = 'Authentication failed. Please check your API key.';
                        break;
                    case 429:
                        $errorContext = 'Rate limit exceeded. Please wait before retrying.';
                        break;
                    case 500:
                        $errorContext = 'Server error encountered. Please try again later.';
                        break;
                }
                
                $fullMessage = $message . ($errorContext ? " ($errorContext)" : '');
                
                if ($debug) {
                    echo "\n[Error] " . $fullMessage . "\n";
                }
                
                throw new \Exception($fullMessage);
            }
            throw new \Exception("API request failed (HTTP $statusCode): " . substr($response, 0, 200));
        }

        // Handle binary responses (images)
        if (strpos($contentType, 'image/') === 0) {
            // Verify we got image data
            if (empty($response)) {
                throw new \Exception('No data received from API');
            }
            
            // Check if response starts with PNG or JPEG magic numbers
            $isPNG = substr($response, 0, 8) === "\x89PNG\r\n\x1a\n";
            $isJPEG = substr($response, 0, 2) === "\xFF\xD8";
            
            if (!$isPNG && !$isJPEG) {
                // If not an image, try to parse as JSON error response
                $errorData = json_decode($response, true);
                if ($errorData && isset($errorData['error'])) {
                    throw new \Exception($errorData['error']);
                }
                throw new \Exception('Invalid image data received');
            }
            
            // Return binary image data
            return $response;
        }

        // Debug response info
        if ($debug && $statusCode === 200) {
            echo "\n[Success] HTTP " . $statusCode . "\n";
        }

        // Handle JSON responses
        if (strpos($contentType, 'application/json') !== false || strpos($contentType, 'text/json') !== false) {
            $responseData = json_decode($response, true);
            if ($responseData === null) {
                if ($debug) {
                    echo "\nFailed to parse JSON response. Raw response (first 100 chars):\n";
                    echo substr($response, 0, 100) . "...\n";
                }
                throw new \Exception('Failed to parse JSON response: ' . json_last_error_msg());
            }
            return $responseData;
        }

        // For non-JSON responses, try to decode as JSON first
        $responseData = json_decode($response, true);
        if ($responseData !== null) {
            return $responseData;
        }

        return $response;
    }

    /**
     * Filter sensitive or large data from debug output
     *
     * @param array $data Data to filter
     * @return array Filtered data
     */
    public static function filterDebugData(array $data): array {
        $filtered = [];
        foreach ($data as $key => $value) {
            if ($key === 'image' && is_string($value) && file_exists($value)) {
                $filtered[$key] = '[FILE: ' . basename($value) . ']';
            } elseif (is_string($value) && strlen($value) > 100) {
                $filtered[$key] = substr($value, 0, 97) . '...';
            } elseif (is_array($value)) {
                $filtered[$key] = self::filterDebugData($value);
            } else {
                $filtered[$key] = $value;
            }
        }
        return $filtered;
    }
}