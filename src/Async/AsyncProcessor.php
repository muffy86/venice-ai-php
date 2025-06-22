<?php

namespace Venice\Async;

use Spatie\Async\Pool;
use Spatie\Async\Process\SynchronousProcess;
use Spatie\Async\Process\ParallelProcess;
use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;
use React\EventLoop\Loop;
use React\Promise\Promise;
use React\Promise\Deferred;

/**
 * Advanced asynchronous processing system for Venice AI SDK
 *
 * Provides:
 * - Parallel request processing
 * - Async task management
 * - Promise-based operations
 * - Worker pool management
 * - Background job processing
 * - Real-time streaming
 * - Load balancing
 */
class AsyncProcessor {
    /** @var Pool Worker pool */
    private Pool $pool;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var array Configuration */
    private array $config;

    /** @var array Active tasks */
    private array $activeTasks = [];

    /** @var array Task statistics */
    private array $stats = [
        'completed' => 0,
        'failed' => 0,
        'pending' => 0,
        'total_time' => 0
    ];

    /** @var array Task priorities */
    private const PRIORITIES = [
        'low' => 1,
        'normal' => 5,
        'high' => 10,
        'critical' => 20
    ];

    /**
     * Constructor
     *
     * @param array $config Async configuration
     * @param Logger $logger Logger instance
     */
    public function __construct(array $config, Logger $logger) {
        $this->config = array_merge([
            'max_workers' => 4,
            'timeout' => 30,
            'memory_limit' => '256M',
            'enable_parallel' => true,
            'queue_size' => 100,
            'retry_attempts' => 3,
            'retry_delay' => 1000
        ], $config);

        $this->logger = $logger;
        $this->setupPool();
    }

    /**
     * Process task asynchronously
     *
     * @param callable $task Task to execute
     * @param array $options Task options
     * @return Promise Task promise
     */
    public function processAsync(callable $task, array $options = []): Promise {
        $taskId = $this->generateTaskId();
        $priority = $options['priority'] ?? 'normal';
        $timeout = $options['timeout'] ?? $this->config['timeout'];

        $this->logger->debug('Starting async task', [
            'task_id' => $taskId,
            'priority' => $priority,
            'timeout' => $timeout
        ]);

        $deferred = new Deferred();
        $startTime = microtime(true);

        $this->activeTasks[$taskId] = [
            'id' => $taskId,
            'priority' => $priority,
            'start_time' => $startTime,
            'timeout' => $timeout,
            'deferred' => $deferred,
            'status' => 'pending'
        ];

        $this->stats['pending']++;

        // Add task to pool
        $this->pool->add(function() use ($task, $taskId) {
            try {
                $result = $task();
                return ['success' => true, 'result' => $result, 'task_id' => $taskId];
            } catch (\Exception $e) {
                return ['success' => false, 'error' => $e->getMessage(), 'task_id' => $taskId];
            }
        })->then(function($result) use ($taskId, $startTime, $deferred) {
            $this->handleTaskCompletion($taskId, $result, $startTime, $deferred);
        })->catch(function($error) use ($taskId, $startTime, $deferred) {
            $this->handleTaskError($taskId, $error, $startTime, $deferred);
        });

        return $deferred->promise();
    }

    /**
     * Process multiple tasks in parallel
     *
     * @param array $tasks Array of tasks
     * @param array $options Processing options
     * @return Promise Promise resolving to array of results
     */
    public function processParallel(array $tasks, array $options = []): Promise {
        $maxConcurrency = $options['max_concurrency'] ?? $this->config['max_workers'];
        $failFast = $options['fail_fast'] ?? false;

        $this->logger->info('Starting parallel processing', [
            'task_count' => count($tasks),
            'max_concurrency' => $maxConcurrency
        ]);

        $promises = [];
        $chunks = array_chunk($tasks, $maxConcurrency);

        foreach ($chunks as $chunk) {
            foreach ($chunk as $index => $task) {
                $promises[$index] = $this->processAsync($task, $options);
            }
        }

        if ($failFast) {
            return \React\Promise\all($promises);
        } else {
            return \React\Promise\settle($promises);
        }
    }

    /**
     * Process tasks in batches
     *
     * @param array $tasks Array of tasks
     * @param array $options Batch options
     * @return \Generator Generator yielding batch results
     */
    public function processBatches(array $tasks, array $options = []): \Generator {
        $batchSize = $options['batch_size'] ?? 10;
        $delay = $options['delay'] ?? 0;

        $batches = array_chunk($tasks, $batchSize);

        foreach ($batches as $index => $batch) {
            $this->logger->debug('Processing batch', [
                'batch' => $index + 1,
                'size' => count($batch)
            ]);

            $results = $this->processParallel($batch, $options);
            yield $results;

            if ($delay > 0 && $index < count($batches) - 1) {
                usleep($delay * 1000);
            }
        }
    }

    /**
     * Create streaming processor
     *
     * @param callable $processor Stream processor function
     * @param array $options Stream options
     * @return StreamProcessor Stream processor instance
     */
    public function createStream(callable $processor, array $options = []): StreamProcessor {
        return new StreamProcessor($processor, $options, $this->logger);
    }

    /**
     * Schedule recurring task
     *
     * @param callable $task Task to execute
     * @param int $interval Interval in seconds
     * @param array $options Task options
     * @return string Task ID
     */
    public function scheduleRecurring(callable $task, int $interval, array $options = []): string {
        $taskId = $this->generateTaskId();

        $this->logger->info('Scheduling recurring task', [
            'task_id' => $taskId,
            'interval' => $interval
        ]);

        // Use React event loop for scheduling
        $loop = Loop::get();
        $timer = $loop->addPeriodicTimer($interval, function() use ($task, $taskId) {
            $this->processAsync($task, ['task_id' => $taskId]);
        });

        $this->activeTasks[$taskId] = [
            'id' => $taskId,
            'type' => 'recurring',
            'interval' => $interval,
            'timer' => $timer,
            'status' => 'scheduled'
        ];

        return $taskId;
    }

    /**
     * Cancel task
     *
     * @param string $taskId Task ID
     * @return bool Success status
     */
    public function cancelTask(string $taskId): bool {
        if (!isset($this->activeTasks[$taskId])) {
            return false;
        }

        $task = $this->activeTasks[$taskId];

        if (isset($task['timer'])) {
            Loop::get()->cancelTimer($task['timer']);
        }

        if (isset($task['deferred'])) {
            $task['deferred']->reject(new VeniceException('Task cancelled'));
        }

        unset($this->activeTasks[$taskId]);

        $this->logger->debug('Task cancelled', ['task_id' => $taskId]);
        return true;
    }

    /**
     * Get task status
     *
     * @param string $taskId Task ID
     * @return array|null Task status
     */
    public function getTaskStatus(string $taskId): ?array {
        return $this->activeTasks[$taskId] ?? null;
    }

    /**
     * Get all active tasks
     *
     * @return array Active tasks
     */
    public function getActiveTasks(): array {
        return $this->activeTasks;
    }

    /**
     * Get processing statistics
     *
     * @return array Processing statistics
     */
    public function getStats(): array {
        return array_merge($this->stats, [
            'active_tasks' => count($this->activeTasks),
            'average_time' => $this->stats['completed'] > 0
                ? $this->stats['total_time'] / $this->stats['completed']
                : 0
        ]);
    }

    /**
     * Wait for all tasks to complete
     *
     * @param int $timeout Timeout in seconds
     * @return bool True if all tasks completed
     */
    public function waitForCompletion(int $timeout = 30): bool {
        $startTime = time();

        while (!empty($this->activeTasks) && (time() - $startTime) < $timeout) {
            usleep(100000); // 100ms
        }

        return empty($this->activeTasks);
    }

    /**
     * Wait for all promises to complete
     *
     * @param array $promises Array of promises
     * @param int $timeout Timeout in seconds
     * @return array Results of all promises
     */
    public function waitAll(array $promises, int $timeout = 30): array {
        $results = [];
        $startTime = time();

        foreach ($promises as $index => $promise) {
            if (time() - $startTime > $timeout) {
                throw new VeniceException("Timeout waiting for promises to complete");
            }

            try {
                // If it's a Promise object, wait for it
                if ($promise instanceof Promise) {
                    $results[$index] = $promise->wait();
                } else {
                    // If it's already a result, use it
                    $results[$index] = $promise;
                }
            } catch (\Exception $e) {
                $this->logger->error("Promise failed", ['error' => $e->getMessage()]);
                $results[$index] = null;
            }
        }

        return $results;
    }

    /**
     * Shutdown processor
     */
    public function shutdown(): void {
        $this->logger->info('Shutting down async processor');

        // Cancel all active tasks
        foreach (array_keys($this->activeTasks) as $taskId) {
            $this->cancelTask($taskId);
        }

        // Wait for pool to finish
        $this->pool->wait();
    }

    /**
     * Setup worker pool
     */
    private function setupPool(): void {
        $this->pool = Pool::create();

        if ($this->config['enable_parallel']) {
            $this->pool->concurrency($this->config['max_workers']);
            $this->pool->timeout($this->config['timeout']);
        }

        $this->logger->debug('Async pool initialized', [
            'max_workers' => $this->config['max_workers'],
            'parallel_enabled' => $this->config['enable_parallel']
        ]);
    }

    /**
     * Handle task completion
     *
     * @param string $taskId Task ID
     * @param array $result Task result
     * @param float $startTime Start time
     * @param Deferred $deferred Promise deferred
     */
    private function handleTaskCompletion(string $taskId, array $result, float $startTime, Deferred $deferred): void {
        $duration = microtime(true) - $startTime;

        if (isset($this->activeTasks[$taskId])) {
            $this->activeTasks[$taskId]['status'] = 'completed';
            $this->activeTasks[$taskId]['duration'] = $duration;
        }

        $this->stats['completed']++;
        $this->stats['pending']--;
        $this->stats['total_time'] += $duration;

        if ($result['success']) {
            $deferred->resolve($result['result']);
            $this->logger->debug('Task completed successfully', [
                'task_id' => $taskId,
                'duration' => $duration
            ]);
        } else {
            $deferred->reject(new VeniceException($result['error']));
            $this->stats['failed']++;
            $this->logger->error('Task failed', [
                'task_id' => $taskId,
                'error' => $result['error'],
                'duration' => $duration
            ]);
        }

        unset($this->activeTasks[$taskId]);
    }

    /**
     * Handle task error
     *
     * @param string $taskId Task ID
     * @param \Exception $error Error
     * @param float $startTime Start time
     * @param Deferred $deferred Promise deferred
     */
    private function handleTaskError(string $taskId, \Exception $error, float $startTime, Deferred $deferred): void {
        $duration = microtime(true) - $startTime;

        if (isset($this->activeTasks[$taskId])) {
            $this->activeTasks[$taskId]['status'] = 'failed';
            $this->activeTasks[$taskId]['duration'] = $duration;
        }

        $this->stats['failed']++;
        $this->stats['pending']--;
        $this->stats['total_time'] += $duration;

        $deferred->reject($error);

        $this->logger->error('Task error', [
            'task_id' => $taskId,
            'error' => $error->getMessage(),
            'duration' => $duration
        ]);

        unset($this->activeTasks[$taskId]);
    }

    /**
     * Generate unique task ID
     *
     * @return string Task ID
     */
    private function generateTaskId(): string {
        return 'task_' . uniqid() . '_' . bin2hex(random_bytes(4));
    }
}

/**
 * Stream processor for real-time data processing
 */
class StreamProcessor {
    /** @var callable Stream processor function */
    private $processor;

    /** @var array Stream options */
    private array $options;

    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var bool Stream status */
    private bool $active = false;

    /**
     * Constructor
     *
     * @param callable $processor Stream processor function
     * @param array $options Stream options
     * @param Logger $logger Logger instance
     */
    public function __construct(callable $processor, array $options, Logger $logger) {
        $this->processor = $processor;
        $this->options = array_merge([
            'buffer_size' => 1024,
            'timeout' => 30,
            'auto_flush' => true
        ], $options);
        $this->logger = $logger;
    }

    /**
     * Start stream processing
     *
     * @param resource $stream Input stream
     * @return \Generator Generator yielding processed chunks
     */
    public function process($stream): \Generator {
        $this->active = true;
        $buffer = '';

        $this->logger->info('Starting stream processing');

        while ($this->active && !feof($stream)) {
            $chunk = fread($stream, $this->options['buffer_size']);

            if ($chunk === false) {
                break;
            }

            $buffer .= $chunk;

            // Process complete chunks
            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = substr($buffer, 0, $pos);
                $buffer = substr($buffer, $pos + 1);

                $processed = call_user_func($this->processor, $line);
                if ($processed !== null) {
                    yield $processed;
                }
            }
        }

        // Process remaining buffer
        if (!empty($buffer)) {
            $processed = call_user_func($this->processor, $buffer);
            if ($processed !== null) {
                yield $processed;
            }
        }

        $this->logger->info('Stream processing completed');
    }

    /**
     * Stop stream processing
     */
    public function stop(): void {
        $this->active = false;
    }

    /**
     * Check if stream is active
     *
     * @return bool Stream status
     */
    public function isActive(): bool {
        return $this->active;
    }
}
