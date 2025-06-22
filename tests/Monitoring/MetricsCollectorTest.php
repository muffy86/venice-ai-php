<?php

namespace Venice\Tests\Monitoring;

use PHPUnit\Framework\TestCase;
use Venice\Monitoring\MetricsCollector;
use Venice\Utils\Logger;
use Venice\Events\EventManager;
use Venice\Events\Event;

class MetricsCollectorTest extends TestCase {
    private MetricsCollector $metrics;
    private Logger $logger;
    private EventManager $events;
    private array $dispatchedEvents = [];

    protected function setUp(): void {
        $this->logger = $this->createMock(Logger::class);
        $this->events = $this->createMock(EventManager::class);

        // Track dispatched events
        $this->events->method('dispatch')
            ->willReturnCallback(function(Event $event) {
                $this->dispatchedEvents[] = [
                    'name' => $event->getName(),
                    'data' => $event->getData()
                ];
            });

        $this->metrics = new MetricsCollector($this->logger, $this->events);
    }

    public function testBasicMetricRecording(): void {
        $this->metrics->record('test_metric', 100, ['tag' => 'value']);

        $metrics = $this->metrics->getMetrics();
        $this->assertArrayHasKey('metrics', $metrics);

        $lastMetric = end($metrics['metrics']);
        $this->assertEquals('test_metric', $lastMetric['name']);
        $this->assertEquals(100, $lastMetric['value']);
        $this->assertEquals(['tag' => 'value'], $lastMetric['tags']);
    }

    public function testCounterIncrement(): void {
        $this->metrics->increment('api_calls', 5);
        $this->metrics->increment('api_calls');

        $metrics = $this->metrics->getMetrics();
        $this->assertEquals(6, $metrics['counters']['api_calls']);
    }

    public function testTimingOperations(): void {
        $timerId = $this->metrics->startTiming('operation');
        usleep(10000); // 10ms delay
        $duration = $this->metrics->endTiming($timerId, ['type' => 'test']);

        $this->assertGreaterThan(0.009, $duration); // At least 9ms
        $this->assertLessThan(0.5, $duration); // Less than 500ms
    }

    public function testGaugeMetrics(): void {
        $this->metrics->gauge('memory_usage', 1024, ['unit' => 'MB']);

        $metrics = $this->metrics->getMetrics();
        $lastMetric = end($metrics['metrics']);

        $this->assertEquals('memory_usage', $lastMetric['name']);
        $this->assertEquals(1024, $lastMetric['value']);
        $this->assertEquals(['unit' => 'MB', 'type' => 'gauge'], $lastMetric['tags']);
    }

    public function testHistogramMetrics(): void {
        $this->metrics->histogram('response_time', 0.45, ['endpoint' => 'api']);

        $metrics = $this->metrics->getMetrics();
        $lastMetric = end($metrics['metrics']);

        $this->assertEquals('response_time', $lastMetric['name']);
        $this->assertEquals(0.45, $lastMetric['value']);
        $this->assertEquals(['endpoint' => 'api', 'type' => 'histogram'], $lastMetric['tags']);
    }

    public function testPerformanceSummary(): void {
        // Simulate some activity
        $this->metrics->increment('api_calls', 100);
        $this->metrics->increment('errors', 5);
        $this->metrics->increment('cache_hits', 80);
        $this->metrics->increment('cache_misses', 20);

        $summary = $this->metrics->getPerformanceSummary();

        $this->assertEquals(0.05, $summary['error_rate']); // 5/100
        $this->assertEquals(0.8, $summary['cache_hit_rate']); // 80/100
        $this->assertArrayHasKey('requests_per_second', $summary);
        $this->assertArrayHasKey('memory_efficiency', $summary);
        $this->assertArrayHasKey('uptime', $summary);
    }

    public function testThresholdAlerts(): void {
        $alertTriggered = false;
        $alertData = null;

        // Set up alert handler
        $this->metrics->addAlertHandler('error_rate', function($alert) use (&$alertTriggered, &$alertData) {
            $alertTriggered = true;
            $alertData = $alert;
        });

        // Set threshold and trigger alert
        $this->metrics->setThreshold('error_rate', 0.1); // 10%

        // Simulate high error rate
        $this->metrics->increment('api_calls', 100);
        $this->metrics->increment('errors', 15);

        $summary = $this->metrics->getPerformanceSummary();

        $this->assertTrue($alertTriggered);
        $this->assertNotNull($alertData);
        $this->assertEquals('error_rate', $alertData['metric']);
        $this->assertGreaterThan(0.1, $alertData['value']);
    }

    public function testHealthReport(): void {
        // Simulate healthy state
        $this->metrics->increment('api_calls', 1000);
        $this->metrics->increment('errors', 10);
        $this->metrics->increment('cache_hits', 800);
        $this->metrics->increment('cache_misses', 200);

        $health = $this->metrics->getHealthReport();

        $this->assertEquals('healthy', $health['status']);
        $this->assertEmpty($health['issues']);
        $this->assertArrayHasKey('summary', $health);
        $this->assertArrayHasKey('timestamp', $health);

        // Simulate unhealthy state
        $this->metrics->increment('errors', 90); // Now 100 errors out of 1000 calls

        $health = $this->metrics->getHealthReport();

        $this->assertEquals('warning', $health['status']);
        $this->assertNotEmpty($health['issues']);
        $this->assertStringContainsString('High error rate', $health['issues'][0]);
    }

    public function testPrometheusExport(): void {
        $this->metrics->increment('api_calls', 50);
        $this->metrics->gauge('memory_usage', 256 * 1024 * 1024);

        $output = $this->metrics->exportPrometheus();

        $this->assertStringContainsString('# TYPE venice_api_calls counter', $output);
        $this->assertStringContainsString('venice_api_calls 50', $output);
        $this->assertStringContainsString('# TYPE venice_memory_current gauge', $output);
    }

    public function testMetricsReset(): void {
        // Record some metrics
        $this->metrics->increment('api_calls', 100);
        $this->metrics->record('test_metric', 50);

        // Verify metrics exist
        $beforeReset = $this->metrics->getMetrics();
        $this->assertEquals(100, $beforeReset['counters']['api_calls']);

        // Reset metrics
        $this->metrics->reset();

        // Verify metrics are reset
        $afterReset = $this->metrics->getMetrics();
        $this->assertEquals(0, $afterReset['counters']['api_calls']);
        $this->assertEmpty($afterReset['metrics']);
    }

    public function testResourceTracking(): void {
        // Force resource update
        $this->metrics->updateResourceMetrics();

        $metrics = $this->metrics->getMetrics();

        $this->assertArrayHasKey('memory_current', $metrics['resources']);
        $this->assertArrayHasKey('memory_peak', $metrics['resources']);
        $this->assertGreaterThan(0, $metrics['resources']['memory_current']);
        $this->assertGreaterThan(0, $metrics['resources']['memory_peak']);
    }

    public function testEventDispatch(): void {
        $this->metrics->record('test_metric', 100);

        $this->assertNotEmpty($this->dispatchedEvents);
        $lastEvent = end($this->dispatchedEvents);

        $this->assertEquals('metrics.recorded', $lastEvent['name']);
        $this->assertEquals('test_metric', $lastEvent['data']['name']);
        $this->assertEquals(100, $lastEvent['data']['value']);
    }

    public function testMemoryEfficiencyCalculation(): void {
        // Force memory metrics update
        $this->metrics->updateResourceMetrics();

        $summary = $this->metrics->getPerformanceSummary();

        $this->assertArrayHasKey('memory_efficiency', $summary);
        $this->assertIsFloat($summary['memory_efficiency']);
        $this->assertGreaterThanOrEqual(0, $summary['memory_efficiency']);
        $this->assertLessThanOrEqual(1, $summary['memory_efficiency']);
    }

    public function testConcurrentMetricRecording(): void {
        // Simulate concurrent requests
        $operations = [];
        for ($i = 0; $i < 10; $i++) {
            $operations[] = function() use ($i) {
                $timerId = $this->metrics->startTiming("operation_$i");
                usleep(rand(1000, 5000)); // Random delay
                $this->metrics->endTiming($timerId);
                $this->metrics->increment('api_calls');
            };
        }

        // Execute operations
        array_map(function($op) { $op(); }, $operations);

        $metrics = $this->metrics->getMetrics();
        $this->assertEquals(10, $metrics['counters']['api_calls']);
    }

    protected function tearDown(): void {
        $this->metrics->reset();
    }
}
