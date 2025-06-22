<?php

namespace Venice\Tests\Performance;

use PHPUnit\Framework\TestCase;
use Venice\VeniceAI;
use Venice\Utils\Logger;

class PerformanceTest extends TestCase {
    private VeniceAI $venice;

    protected function setUp(): void {
        $this->venice = new VeniceAI('test-api-key', [
            'debug' => false,
            'log_file' => null
        ]);
    }

    public function testLoggerPerformance(): void {
        $logger = new Logger(null, true);
        $iterations = 10000;

        $start = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            $logger->info("Test message $i", ['iteration' => $i]);
        }

        $duration = microtime(true) - $start;
        $messagesPerSecond = $iterations / $duration;

        // Should handle at least 1000 messages per second
        $this->assertGreaterThan(1000, $messagesPerSecond);

        echo "\nLogger Performance: " . number_format($messagesPerSecond) . " messages/second\n";
    }

    public function testValidatorPerformance(): void {
        $messages = [
            ['role' => 'user', 'content' => 'Test message']
        ];

        $iterations = 1000;
        $start = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            \Venice\Utils\Validator::validateChatCompletion($messages, 'gpt-3.5-turbo');
        }

        $duration = microtime(true) - $start;
        $validationsPerSecond = $iterations / $duration;

        // Should handle at least 100 validations per second
        $this->assertGreaterThan(100, $validationsPerSecond);

        echo "\nValidator Performance: " . number_format($validationsPerSecond) . " validations/second\n";
    }

    public function testTokenCountingPerformance(): void {
        $messages = [
            ['role' => 'system', 'content' => str_repeat('a', 1000)],
            ['role' => 'user', 'content' => str_repeat('b', 1000)],
            ['role' => 'assistant', 'content' => str_repeat('c', 1000)]
        ];

        $iterations = 1000;
        $start = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            $this->venice->chat()->countTokens($messages);
        }

        $duration = microtime(true) - $start;
        $countsPerSecond = $iterations / $duration;

        // Should handle at least 500 token counts per second
        $this->assertGreaterThan(500, $countsPerSecond);

        echo "\nToken Counting Performance: " . number_format($countsPerSecond) . " counts/second\n";
    }

    public function testMessageValidationPerformance(): void {
        $validMessage = ['role' => 'user', 'content' => 'Test message'];

        $iterations = 10000;
        $start = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            $this->venice->chat()->isValidMessage($validMessage);
        }

        $duration = microtime(true) - $start;
        $validationsPerSecond = $iterations / $duration;

        // Should handle at least 5000 message validations per second
        $this->assertGreaterThan(5000, $validationsPerSecond);

        echo "\nMessage Validation Performance: " . number_format($validationsPerSecond) . " validations/second\n";
    }

    public function testMemoryUsageStability(): void {
        $initialMemory = memory_get_usage();

        // Perform many operations
        for ($i = 0; $i < 1000; $i++) {
            $messages = [
                ['role' => 'user', 'content' => "Message $i"]
            ];

            $this->venice->chat()->countTokens($messages);
            $this->venice->chat()->isValidMessage($messages[0]);

            // Force garbage collection periodically
            if ($i % 100 === 0) {
                gc_collect_cycles();
            }
        }

        $finalMemory = memory_get_usage();
        $memoryIncrease = $finalMemory - $initialMemory;

        // Memory increase should be minimal (less than 1MB)
        $this->assertLessThan(1024 * 1024, $memoryIncrease);

        echo "\nMemory Usage: " . number_format($memoryIncrease) . " bytes increase\n";
    }

    public function testExceptionPerformance(): void {
        $iterations = 1000;
        $start = microtime(true);

        for ($i = 0; $i < $iterations; $i++) {
            try {
                throw new \Venice\Exceptions\ValidationException(
                    "Test exception $i",
                    400,
                    null,
                    ['field' => 'value'],
                    "req_$i"
                );
            } catch (\Venice\Exceptions\ValidationException $e) {
                $e->getFormattedMessage();
            }
        }

        $duration = microtime(true) - $start;
        $exceptionsPerSecond = $iterations / $duration;

        // Should handle at least 1000 exceptions per second
        $this->assertGreaterThan(1000, $exceptionsPerSecond);

        echo "\nException Performance: " . number_format($exceptionsPerSecond) . " exceptions/second\n";
    }
}
