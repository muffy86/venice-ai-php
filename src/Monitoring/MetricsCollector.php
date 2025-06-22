<?php

namespace Venice\Monitoring;

use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;

/**
 * Advanced metrics collection and monitoring system
 *
 * Provides comprehensive monitoring capabilities including:
 * - Real-time performance metrics
 * - Resource usage tracking
 * - Custom metric collection
 * - Alerting and notifications
 * - Historical data analysis
 * - Anomaly detection
 */
class MetricsCollector {
    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var EventManager Event manager */
    private EventManager $events;

    /** @var array Collected metrics */
    private array $metrics = [];

    /** @var array Metric thresholds */
    private array $thresholds = [];

    /** @var array Alert handlers */
    private array $alertHandlers = [];

    /** @var float Start time for tracking */
    private float $startTime;

    /** @var array Performance counters */
    private array $counters = [
        'api_calls' => 0,
        'cache_hits' => 0,
        'cache_misses' => 0,
        'errors' => 0,
        'warnings' => 0
    ];

    /** @var array Resource usage tracking */
    private array $resources = [
        'memory_peak' => 0,
        'memory_current' => 0,
        'cpu_time' => 0,
        'io_operations' => 0
    ];

    /**
     * Constructor
     */
    public function __construct(Logger $logger, EventManager $events) {
        $this->logger = $logger;
        $this->events = $events;
        $this->startTime = microtime(true);

        // Set default thresholds
        $this->thresholds = [
            'response_time' => 5.0,
            'memory_usage' => 256 * 1024 * 1024, // 256MB
            'error_rate' => 0.05, // 5%
            'cache_hit_rate' => 0.8 // 80%
        ];

        $this->startResourceTracking();
    }

    /**
     * Record a metric
     */
    public function record(string $name, $value, array $tags = []): void {
        $timestamp = microtime(true);

        $this->metrics[] = [
            'name' => $name,
            'value' => $value,
            'tags' => $tags,
            'timestamp' => $timestamp
        ];

        // Check thresholds
        $this->checkThresholds($name, $value);

        // Dispatch metric event
        $this->events->dispatch(new Event('metrics.recorded', [
            'name' => $name,
            'value' => $value,
            'tags' => $tags
        ]));
    }

    /**
     * Increment a counter
     */
    public function increment(string $counter, int $amount = 1): void {
        if (!isset($this->counters[$counter])) {
            $this->counters[$counter] = 0;
        }

        $this->counters[$counter] += $amount;
        $this->record($counter, $this->counters[$counter]);
    }

    /**
     * Record timing information
     */
    public function timing(string $name, float $duration, array $tags = []): void {
        $this->record($name . '.duration', $duration, $tags);
        $this->record($name . '.count', 1, $tags);
    }

    /**
     * Start timing an operation
     */
    public function startTiming(string $name): string {
        $timerId = uniqid($name . '_');
        $this->record($timerId . '.start', microtime(true));
        return $timerId;
    }

    /**
     * End timing an operation
     */
    public function endTiming(string $timerId, array $tags = []): float {
        $endTime = microtime(true);
        $startMetric = null;

        // Find start time
        foreach ($this->metrics as $metric) {
            if ($metric['name'] === $timerId . '.start') {
                $startMetric = $metric;
                break;
            }
        }

        if ($startMetric) {
            $duration = $endTime - $startMetric['value'];
            $name = str_replace('_' . substr($timerId, -13), '', $timerId);
            $this->timing($name, $duration, $tags);
            return $duration;
        }

        return 0.0;
    }

    /**
     * Record gauge metric
     */
    public function gauge(string $name, $value, array $tags = []): void {
        $this->record($name, $value, array_merge($tags, ['type' => 'gauge']));
    }

    /**
     * Record histogram metric
     */
    public function histogram(string $name, $value, array $tags = []): void {
        $this->record($name, $value, array_merge($tags, ['type' => 'histogram']));
    }

    /**
     * Get current metrics snapshot
     */
    public function getMetrics(): array {
        $this->updateResourceMetrics();

        return [
            'counters' => $this->counters,
            'resources' => $this->resources,
            'metrics' => $this->metrics,
            'uptime' => microtime(true) - $this->startTime,
            'timestamp' => time()
        ];
    }

    /**
     * Get performance summary
     */
    public function getPerformanceSummary(): array {
        $totalCalls = $this->counters['api_calls'];
        $totalErrors = $this->counters['errors'];
        $cacheHits = $this->counters['cache_hits'];
        $cacheMisses = $this->counters['cache_misses'];

        return [
            'error_rate' => $totalCalls > 0 ? $totalErrors / $totalCalls : 0,
            'cache_hit_rate' => ($cacheHits + $cacheMisses) > 0
                ? $cacheHits / ($cacheHits + $cacheMisses) : 0,
            'requests_per_second' => $totalCalls / (microtime(true) - $this->startTime),
            'memory_efficiency' => $this->calculateMemoryEfficiency(),
            'uptime' => microtime(true) - $this->startTime
        ];
    }

    /**
     * Set threshold for metric
     */
    public function setThreshold(string $metric, $threshold): void {
        $this->thresholds[$metric] = $threshold;
    }

    /**
     * Add alert handler
     */
    public function addAlertHandler(string $metric, callable $handler): void {
        if (!isset($this->alertHandlers[$metric])) {
            $this->alertHandlers[$metric] = [];
        }
        $this->alertHandlers[$metric][] = $handler;
    }

    /**
     * Generate health report
     */
    public function getHealthReport(): array {
        $summary = $this->getPerformanceSummary();
        $health = 'healthy';
        $issues = [];

        // Check error rate
        if ($summary['error_rate'] > $this->thresholds['error_rate']) {
            $health = 'warning';
            $issues[] = 'High error rate: ' . round($summary['error_rate'] * 100, 2) . '%';
        }

        // Check cache hit rate
        if ($summary['cache_hit_rate'] < $this->thresholds['cache_hit_rate']) {
            $health = 'warning';
            $issues[] = 'Low cache hit rate: ' . round($summary['cache_hit_rate'] * 100, 2) . '%';
        }

        // Check memory usage
        if ($this->resources['memory_current'] > $this->thresholds['memory_usage']) {
            $health = 'critical';
            $issues[] = 'High memory usage: ' . $this->formatBytes($this->resources['memory_current']);
        }

        return [
            'status' => $health,
            'issues' => $issues,
            'summary' => $summary,
            'timestamp' => time()
        ];
    }

    /**
     * Export metrics in Prometheus format
     */
    public function exportPrometheus(): string {
        $output = [];

        foreach ($this->counters as $name => $value) {
            $output[] = "# TYPE venice_{$name} counter";
            $output[] = "venice_{$name} {$value}";
        }

        foreach ($this->resources as $name => $value) {
            $output[] = "# TYPE venice_{$name} gauge";
            $output[] = "venice_{$name} {$value}";
        }

        return implode("\n", $output) . "\n";
    }

    /**
     * Reset all metrics
     */
    public function reset(): void {
        $this->metrics = [];
        $this->counters = array_fill_keys(array_keys($this->counters), 0);
        $this->resources = array_fill_keys(array_keys($this->resources), 0);
        $this->startTime = microtime(true);
    }

    /**
     * Start resource tracking
     */
    private function startResourceTracking(): void {
        // Register shutdown function to capture final metrics
        register_shutdown_function([$this, 'captureShutdownMetrics']);

        // Start periodic resource updates
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGALRM, [$this, 'updateResourceMetrics']);
            pcntl_alarm(1); // Update every second
        }
    }

    /**
     * Update resource metrics
     */
    public function updateResourceMetrics(): void {
        $this->resources['memory_current'] = memory_get_usage(true);
        $this->resources['memory_peak'] = memory_get_peak_usage(true);

        if (function_exists('getrusage')) {
            $usage = getrusage();
            $this->resources['cpu_time'] = $usage['ru_utime.tv_sec'] + $usage['ru_stime.tv_sec'];
        }
    }

    /**
     * Capture shutdown metrics
     */
    public function captureShutdownMetrics(): void {
        $this->updateResourceMetrics();
        $this->record('shutdown.memory_peak', $this->resources['memory_peak']);
        $this->record('shutdown.uptime', microtime(true) - $this->startTime);

        $this->logger->info('Application shutdown metrics captured', [
            'uptime' => microtime(true) - $this->startTime,
            'memory_peak' => $this->resources['memory_peak'],
            'total_requests' => $this->counters['api_calls']
        ]);
    }

    /**
     * Check metric thresholds
     */
    private function checkThresholds(string $name, $value): void {
        if (isset($this->thresholds[$name]) && $value > $this->thresholds[$name]) {
            $this->triggerAlert($name, $value, $this->thresholds[$name]);
        }
    }

    /**
     * Trigger alert
     */
    private function triggerAlert(string $metric, $value, $threshold): void {
        $alert = [
            'metric' => $metric,
            'value' => $value,
            'threshold' => $threshold,
            'timestamp' => time()
        ];

        $this->logger->warning('Metric threshold exceeded', $alert);

        // Call alert handlers
        if (isset($this->alertHandlers[$metric])) {
            foreach ($this->alertHandlers[$metric] as $handler) {
                call_user_func($handler, $alert);
            }
        }

        // Dispatch alert event
        $this->events->dispatch(new Event('metrics.alert', $alert));
    }

    /**
     * Calculate memory efficiency
     */
    private function calculateMemoryEfficiency(): float {
        $current = $this->resources['memory_current'];
        $peak = $this->resources['memory_peak'];

        return $peak > 0 ? 1 - ($current / $peak) : 1.0;
    }

    /**
     * Format bytes for human reading
     */
    private function formatBytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
