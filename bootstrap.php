<?php

/**
 * Venice AI PHP SDK - Enhanced Autoloader and Optimization
 *
 * This script provides:
 * - Optimized autoloading
 * - Error checking and validation
 * - Performance monitoring
 * - Dependency validation
 */

// Error reporting for development
$debugMode = getenv('VENICE_DEBUG') === 'true';
if ($debugMode) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    define('VENICE_DEBUG', true);
}

// Performance optimization
if (extension_loaded('opcache')) {
    ini_set('opcache.enable', 1);
    ini_set('opcache.validate_timestamps', 0);
    ini_set('opcache.max_accelerated_files', 10000);
}

// Memory optimization
ini_set('memory_limit', '256M');

// Composer autoloader
$autoloader = require_once __DIR__ . '/vendor/autoload.php';

// Enhanced autoloader for Venice classes
spl_autoload_register(function ($class) {
    $prefix = 'Venice\\';
    $baseDir = __DIR__ . '/src/';

    // Check if the class uses the Venice namespace
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get the relative class name
    $relativeClass = substr($class, $len);

    // Replace namespace separators with directory separators
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});

// Validation function for required extensions
function validateExtensions(): array {
    $required = ['curl', 'json', 'openssl', 'mbstring', 'fileinfo'];
    $missing = [];

    foreach ($required as $ext) {
        if (!extension_loaded($ext)) {
            $missing[] = $ext;
        }
    }

    return $missing;
}

// Check required extensions
$missingExtensions = validateExtensions();
if (!empty($missingExtensions)) {
    throw new \RuntimeException(
        'Missing required PHP extensions: ' . implode(', ', $missingExtensions)
    );
}

// Configuration loader with caching
function loadConfiguration(): array {
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/config.php';
    if (!file_exists($configFile)) {
        $configFile = __DIR__ . '/config/config.php';
    }

    if (!file_exists($configFile)) {
        throw new \RuntimeException(
            'Configuration file not found. Please create config.php or config/config.php'
        );
    }

    $config = require $configFile;

    // Validate configuration
    if (!isset($config['api']['key']) || empty($config['api']['key'])) {
        throw new \RuntimeException('API key not configured');
    }

    return $config;
}

// Performance monitoring
class PerformanceMonitor {
    private static $startTime;
    private static $memoryStart;

    public static function start(): void {
        self::$startTime = microtime(true);
        self::$memoryStart = memory_get_usage(true);
    }

    public static function getStats(): array {
        return [
            'execution_time' => microtime(true) - self::$startTime,
            'memory_usage' => memory_get_usage(true) - self::$memoryStart,
            'peak_memory' => memory_get_peak_usage(true),
            'included_files' => count(get_included_files())
        ];
    }
}

// Start performance monitoring
PerformanceMonitor::start();

// Global error handler for Venice SDK
set_error_handler(function ($severity, $message, $file, $line) {
    if (strpos($file, 'vendor/') !== false) {
        return false; // Let vendor libraries handle their own errors
    }

    if (error_reporting() & $severity) {
        throw new \ErrorException($message, 0, $severity, $file, $line);
    }

    return false;
});

// Global exception handler
set_exception_handler(function (\Throwable $exception) {
    $debugMode = defined('VENICE_DEBUG') ? VENICE_DEBUG : false;
    if ($debugMode) {
        echo "Venice AI SDK Error: " . $exception->getMessage() . "\n";
        echo "File: " . $exception->getFile() . ":" . $exception->getLine() . "\n";
        echo "Trace:\n" . $exception->getTraceAsString() . "\n";
    } else {
        error_log("Venice AI SDK Error: " . $exception->getMessage());
    }
});

// Cache directory setup
function setupCacheDirectory(): void {
    $cacheDir = __DIR__ . '/cache';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }

    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
}

setupCacheDirectory();

// Load and validate configuration
$config = loadConfiguration();

// Export config for use by other scripts
if (!defined('VENICE_CONFIG_LOADED')) {
    define('VENICE_CONFIG_LOADED', true);
    $GLOBALS['venice_config'] = $config;
}

// Cleanup function
register_shutdown_function(function () {
    $stats = PerformanceMonitor::getStats();

    $debugMode = defined('VENICE_DEBUG') ? VENICE_DEBUG : false;
    if ($debugMode) {
        echo "\n--- Venice AI SDK Performance Stats ---\n";
        echo "Execution Time: " . number_format($stats['execution_time'] * 1000, 2) . "ms\n";
        echo "Memory Usage: " . number_format($stats['memory_usage'] / 1024 / 1024, 2) . "MB\n";
        echo "Peak Memory: " . number_format($stats['peak_memory'] / 1024 / 1024, 2) . "MB\n";
        echo "Included Files: " . $stats['included_files'] . "\n";
    }
});

return $autoloader;
