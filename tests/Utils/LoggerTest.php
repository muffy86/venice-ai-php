<?php

namespace Venice\Tests\Utils;

use PHPUnit\Framework\TestCase;
use Venice\Utils\Logger;

class LoggerTest extends TestCase {
    private string $logFile;
    private Logger $logger;

    protected function setUp(): void {
        $this->logFile = sys_get_temp_dir() . '/venice-test-' . uniqid() . '.log';
        $this->logger = new Logger($this->logFile, true);
    }

    protected function tearDown(): void {
        if (file_exists($this->logFile)) {
            unlink($this->logFile);
        }
    }

    public function testDebugLogging(): void {
        $message = 'Debug test message';
        $context = ['test' => 'value'];

        $this->logger->debug($message, $context);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString('DEBUG', $logContent);
        $this->assertStringContainsString($message, $logContent);
        $this->assertStringContainsString(json_encode($context), $logContent);
    }

    public function testInfoLogging(): void {
        $message = 'Info test message';
        $this->logger->info($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString('INFO', $logContent);
        $this->assertStringContainsString($message, $logContent);
    }

    public function testWarningLogging(): void {
        $message = 'Warning test message';
        $this->logger->warning($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString('WARNING', $logContent);
        $this->assertStringContainsString($message, $logContent);
    }

    public function testErrorLogging(): void {
        $message = 'Error test message';
        $this->logger->error($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString('ERROR', $logContent);
        $this->assertStringContainsString($message, $logContent);
    }

    public function testCriticalLogging(): void {
        $message = 'Critical test message';
        $this->logger->critical($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString('CRITICAL', $logContent);
        $this->assertStringContainsString($message, $logContent);
    }

    public function testDebugDisabled(): void {
        $logger = new Logger($this->logFile, false);
        $message = 'Should not appear in log';

        $logger->debug($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringNotContainsString($message, $logContent);
    }

    public function testLogLevelSeverity(): void {
        $this->assertGreaterThan(
            Logger::getLevelSeverity('DEBUG'),
            Logger::getLevelSeverity('INFO')
        );

        $this->assertGreaterThan(
            Logger::getLevelSeverity('INFO'),
            Logger::getLevelSeverity('WARNING')
        );

        $this->assertGreaterThan(
            Logger::getLevelSeverity('WARNING'),
            Logger::getLevelSeverity('ERROR')
        );

        $this->assertGreaterThan(
            Logger::getLevelSeverity('ERROR'),
            Logger::getLevelSeverity('CRITICAL')
        );
    }

    public function testSetLogFile(): void {
        $newLogFile = sys_get_temp_dir() . '/venice-test-new.log';
        $this->logger->setLogFile($newLogFile);

        $message = 'Test new log file';
        $this->logger->info($message);

        $this->assertFileExists($newLogFile);
        $logContent = file_get_contents($newLogFile);
        $this->assertStringContainsString($message, $logContent);

        unlink($newLogFile);
    }

    public function testSetDebug(): void {
        $logger = new Logger($this->logFile, false);
        $debugMessage = 'Debug message';

        // Debug disabled
        $logger->debug($debugMessage);
        $logContent = file_get_contents($this->logFile);
        $this->assertStringNotContainsString($debugMessage, $logContent);

        // Enable debug
        $logger->setDebug(true);
        $logger->debug($debugMessage);
        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString($debugMessage, $logContent);
    }

    public function testClear(): void {
        $this->logger->info('Test message');
        $this->assertFileExists($this->logFile);

        $this->logger->clear();
        $this->assertFileDoesNotExist($this->logFile);
    }

    public function testLogWithEmptyContext(): void {
        $message = 'Test message without context';
        $this->logger->info($message);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString($message, $logContent);
        $this->assertStringNotContainsString('[]', $logContent);
    }

    public function testLogWithComplexContext(): void {
        $message = 'Test message with complex context';
        $context = [
            'array' => [1, 2, 3],
            'object' => new \stdClass(),
            'null' => null,
            'bool' => true
        ];

        $this->logger->info($message, $context);

        $logContent = file_get_contents($this->logFile);
        $this->assertStringContainsString($message, $logContent);
        $this->assertStringContainsString(json_encode($context), $logContent);
    }
}
