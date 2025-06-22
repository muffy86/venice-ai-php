<?php

namespace Venice\Utils;

/**
 * Simple logging utility for Venice AI SDK
 */
class Logger {
    /** @var string Log file path */
    private string $logFile;

    /** @var bool Enable debug logging */
    private bool $debug;

    /** @var array Log levels */
    private const LEVELS = [
        'DEBUG' => 100,
        'INFO' => 200,
        'WARNING' => 300,
        'ERROR' => 400,
        'CRITICAL' => 500
    ];

    /** @var array Level colors for console output */
    private const COLORS = [
        'DEBUG' => '37', // White
        'INFO' => '32',  // Green
        'WARNING' => '33', // Yellow
        'ERROR' => '31',   // Red
        'CRITICAL' => '41;37' // White on red background
    ];

    /**
     * Constructor
     *
     * @param string|null $logFile Path to log file (null for console only)
     * @param bool $debug Enable debug logging
     */
    public function __construct(?string $logFile = null, bool $debug = false) {
        $this->logFile = $logFile ?? sys_get_temp_dir() . '/venice-ai-sdk.log';
        $this->debug = $debug;
    }

    /**
     * Log debug message
     *
     * @param string $message
     * @param array $context
     */
    public function debug(string $message, array $context = []): void {
        if ($this->debug) {
            $this->log('DEBUG', $message, $context);
        }
    }

    /**
     * Log info message
     *
     * @param string $message
     * @param array $context
     */
    public function info(string $message, array $context = []): void {
        $this->log('INFO', $message, $context);
    }

    /**
     * Log warning message
     *
     * @param string $message
     * @param array $context
     */
    public function warning(string $message, array $context = []): void {
        $this->log('WARNING', $message, $context);
    }

    /**
     * Log error message
     *
     * @param string $message
     * @param array $context
     */
    public function error(string $message, array $context = []): void {
        $this->log('ERROR', $message, $context);
    }

    /**
     * Log critical message
     *
     * @param string $message
     * @param array $context
     */
    public function critical(string $message, array $context = []): void {
        $this->log('CRITICAL', $message, $context);
    }

    /**
     * Internal logging method
     *
     * @param string $level
     * @param string $message
     * @param array $context
     */
    private function log(string $level, string $message, array $context = []): void {
        $timestamp = date('Y-m-d H:i:s');
        $pid = getmypid();

        // Format context data
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);

        // Create log entry
        $entry = sprintf(
            '[%s] %s.%d: %s%s',
            $timestamp,
            $level,
            $pid,
            $message,
            $contextStr
        );

        // Write to console with colors
        if (php_sapi_name() === 'cli') {
            $color = self::COLORS[$level] ?? '0';
            echo "\033[{$color}m{$entry}\033[0m\n";
        }

        // Write to log file
        if ($this->logFile) {
            $entry .= PHP_EOL;
            error_log($entry, 3, $this->logFile);
        }
    }

    /**
     * Set log file path
     *
     * @param string $path
     * @return self
     */
    public function setLogFile(string $path): self {
        $this->logFile = $path;
        return $this;
    }

    /**
     * Enable/disable debug logging
     *
     * @param bool $debug
     * @return self
     */
    public function setDebug(bool $debug): self {
        $this->debug = $debug;
        return $this;
    }

    /**
     * Get current log level
     *
     * @param string $level
     * @return int
     */
    public static function getLevelSeverity(string $level): int {
        return self::LEVELS[strtoupper($level)] ?? 0;
    }

    /**
     * Clear log file
     */
    public function clear(): void {
        if ($this->logFile && file_exists($this->logFile)) {
            unlink($this->logFile);
        }
    }
}
