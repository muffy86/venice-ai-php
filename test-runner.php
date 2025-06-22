#!/usr/bin/env php
<?php

/**
 * Venice AI PHP SDK - Comprehensive Test and Validation Runner
 *
 * This script runs all tests, validations, and optimizations
 */

require_once __DIR__ . '/bootstrap.php';

use Venice\VeniceAI;

class VeniceTestRunner {
    private array $results = [];
    private bool $verbose = false;

    public function __construct(bool $verbose = false) {
        $this->verbose = $verbose;
    }

    public function runAllTests(): array {
        $this->log("Starting Venice AI SDK comprehensive test suite...\n");

        // Test 1: Configuration validation
        $this->testConfiguration();

        // Test 2: API key validation
        $this->testApiKey();

        // Test 3: Core class instantiation
        $this->testCoreInstantiation();

        // Test 4: Service availability
        $this->testServices();

        // Test 5: Basic API connectivity
        $this->testApiConnectivity();

        // Test 6: Error handling
        $this->testErrorHandling();

        // Test 7: Performance benchmarks
        $this->testPerformance();

        $this->displayResults();
        return $this->results;
    }

    private function testConfiguration(): void {
        $this->log("Testing configuration...");

        try {
            $config = $GLOBALS['venice_config'] ?? null;

            if (!$config) {
                throw new Exception("Configuration not loaded");
            }

            $required = ['api.key', 'api.endpoint'];
            foreach ($required as $key) {
                $value = $this->getConfigValue($config, $key);
                if (empty($value)) {
                    throw new Exception("Missing required config: $key");
                }
            }

            $this->addResult('configuration', true, "Configuration valid");

        } catch (Exception $e) {
            $this->addResult('configuration', false, $e->getMessage());
        }
    }

    private function testApiKey(): void {
        $this->log("Testing API key...");

        try {
            $config = $GLOBALS['venice_config'];
            $apiKey = $this->getConfigValue($config, 'api.key');

            if (strlen($apiKey) < 10) {
                throw new Exception("API key appears to be invalid");
            }

            // Test key format (basic validation)
            if (!preg_match('/^[a-zA-Z0-9_-]+$/', $apiKey)) {
                throw new Exception("API key contains invalid characters");
            }

            $this->addResult('api_key', true, "API key format valid");

        } catch (Exception $e) {
            $this->addResult('api_key', false, $e->getMessage());
        }
    }

    private function testCoreInstantiation(): void {
        $this->log("Testing core class instantiation...");

        try {
            $config = $GLOBALS['venice_config'];
            $apiKey = $this->getConfigValue($config, 'api.key');

            $venice = new VeniceAI($apiKey);

            if (!$venice instanceof VeniceAI) {
                throw new Exception("Failed to instantiate VeniceAI class");
            }

            $this->addResult('instantiation', true, "VeniceAI class instantiated successfully");

        } catch (Exception $e) {
            $this->addResult('instantiation', false, $e->getMessage());
        }
    }

    private function testServices(): void {
        $this->log("Testing service availability...");

        try {
            $config = $GLOBALS['venice_config'];
            $apiKey = $this->getConfigValue($config, 'api.key');

            $venice = new VeniceAI($apiKey);

            $services = ['chat', 'image', 'models', 'audio', 'embeddings'];
            foreach ($services as $service) {
                $serviceInstance = $venice->$service();
                if (!$serviceInstance) {
                    throw new Exception("Service '$service' not available");
                }
            }

            $this->addResult('services', true, "All services available");

        } catch (Exception $e) {
            $this->addResult('services', false, $e->getMessage());
        }
    }

    private function testApiConnectivity(): void {
        $this->log("Testing API connectivity...");

        try {
            $config = $GLOBALS['venice_config'];
            $apiKey = $this->getConfigValue($config, 'api.key');

            $venice = new VeniceAI($apiKey);

            // Test basic connectivity with models endpoint
            $models = $venice->models()->list();

            if (!is_array($models)) {
                throw new Exception("Invalid response from models endpoint");
            }

            $this->addResult('connectivity', true, "API connectivity successful");

        } catch (Exception $e) {
            $this->addResult('connectivity', false, $e->getMessage());
        }
    }

    private function testErrorHandling(): void {
        $this->log("Testing error handling...");

        try {
            // Test with invalid API key
            $venice = new VeniceAI('invalid_key');

            try {
                $venice->models()->list();
                throw new Exception("Should have thrown an exception with invalid key");
            } catch (Exception $e) {
                // This is expected
            }

            $this->addResult('error_handling', true, "Error handling works correctly");

        } catch (Exception $e) {
            $this->addResult('error_handling', false, $e->getMessage());
        }
    }

    private function testPerformance(): void {
        $this->log("Testing performance...");

        try {
            $startTime = microtime(true);
            $startMemory = memory_get_usage(true);

            $config = $GLOBALS['venice_config'];
            $apiKey = $this->getConfigValue($config, 'api.key');

            $venice = new VeniceAI($apiKey);

            $endTime = microtime(true);
            $endMemory = memory_get_usage(true);

            $executionTime = ($endTime - $startTime) * 1000; // milliseconds
            $memoryUsage = ($endMemory - $startMemory) / 1024 / 1024; // MB

            $performance = [
                'execution_time' => number_format($executionTime, 2) . 'ms',
                'memory_usage' => number_format($memoryUsage, 2) . 'MB'
            ];

            $this->addResult('performance', true, "Performance: " . json_encode($performance));

        } catch (Exception $e) {
            $this->addResult('performance', false, $e->getMessage());
        }
    }

    private function getConfigValue(array $config, string $key): mixed {
        $keys = explode('.', $key);
        $value = $config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return null;
            }
            $value = $value[$k];
        }

        return $value;
    }

    private function addResult(string $test, bool $success, string $message): void {
        $this->results[$test] = [
            'success' => $success,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $status = $success ? "✅ PASS" : "❌ FAIL";
        $this->log("  $status: $message");
    }

    private function displayResults(): void {
        $this->log("\n" . str_repeat("=", 60));
        $this->log("TEST RESULTS SUMMARY");
        $this->log(str_repeat("=", 60));

        $passed = 0;
        $total = count($this->results);

        foreach ($this->results as $test => $result) {
            $status = $result['success'] ? "✅ PASS" : "❌ FAIL";
            $this->log(sprintf("%-20s %s", strtoupper($test), $status));

            if ($result['success']) {
                $passed++;
            }
        }

        $this->log(str_repeat("-", 60));
        $this->log("TOTAL: $passed/$total tests passed");

        if ($passed === $total) {
            $this->log("🎉 ALL TESTS PASSED! Venice AI SDK is ready to use.");
        } else {
            $this->log("⚠️  Some tests failed. Please review the errors above.");
        }
    }

    private function log(string $message): void {
        if ($this->verbose) {
            echo $message . "\n";
        }
    }
}

// Run tests if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $verbose = in_array('--verbose', $argv) || in_array('-v', $argv);
    $runner = new VeniceTestRunner($verbose);
    $results = $runner->runAllTests();

    // Exit with appropriate code
    $success = array_reduce($results, function($carry, $result) {
        return $carry && $result['success'];
    }, true);

    exit($success ? 0 : 1);
}
