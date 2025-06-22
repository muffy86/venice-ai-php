<?php

namespace Venice\Hardware;

use Venice\Utils\Logger;
use Venice\Exceptions\VeniceException;

/**
 * Hardware Detection and Optimization System
 *
 * Provides automatic hardware detection and optimization for:
 * - NVIDIA RTX 5080 GPU optimizations
 * - Intel i9 CPU optimizations
 * - 240Hz display optimizations
 * - Memory and threading optimizations
 */
class HardwareOptimizer {
    /** @var Logger Logger instance */
    private Logger $logger;

    /** @var array Hardware configuration */
    private array $hardwareConfig = [];

    /** @var array Detected hardware */
    private array $detectedHardware = [];

    /** @var array Performance profiles */
    private const PERFORMANCE_PROFILES = [
        'nvidia_5080_i9_240hz' => [
            'gpu' => [
                'cuda_cores' => 10752,
                'memory_bandwidth' => 896, // GB/s
                'tensor_cores' => 336,
                'rt_cores' => 84,
                'base_clock' => 2230, // MHz
                'boost_clock' => 2550, // MHz
                'memory_size' => 16, // GB
                'memory_type' => 'GDDR6X',
                'pcie_lanes' => 16,
                'power_limit' => 400, // Watts
            ],
            'cpu' => [
                'cores' => 24,
                'threads' => 32,
                'base_clock' => 3200, // MHz
                'boost_clock' => 5800, // MHz
                'cache_l3' => 36, // MB
                'memory_channels' => 2,
                'memory_speed' => 5600, // MHz DDR5
                'tdp' => 125, // Watts
            ],
            'display' => [
                'refresh_rate' => 240, // Hz
                'response_time' => 1, // ms
                'adaptive_sync' => true,
                'hdr' => true,
                'color_depth' => 10, // bits
            ],
            'optimizations' => [
                'parallel_requests' => 16,
                'gpu_acceleration' => true,
                'memory_pooling' => true,
                'cache_optimization' => true,
                'thread_affinity' => true,
                'numa_awareness' => true,
                'frame_pacing' => true,
                'low_latency' => true,
            ]
        ]
    ];

    /** @var array Minimax M1 specific optimizations */
    private const MINIMAX_M1_OPTIMIZATIONS = [
        'model_name' => 'minimax-m1',
        'context_length' => 32768,
        'max_tokens' => 8192,
        'temperature_range' => [0.1, 2.0],
        'top_p_range' => [0.1, 1.0],
        'frequency_penalty_range' => [-2.0, 2.0],
        'presence_penalty_range' => [-2.0, 2.0],
        'gpu_optimizations' => [
            'tensor_parallelism' => true,
            'pipeline_parallelism' => true,
            'mixed_precision' => 'fp16',
            'attention_optimization' => 'flash_attention_2',
            'kv_cache_optimization' => true,
            'dynamic_batching' => true,
        ],
        'cpu_optimizations' => [
            'thread_pool_size' => 16,
            'numa_binding' => true,
            'cpu_affinity' => 'performance_cores',
            'memory_prefetch' => true,
            'vectorization' => 'avx512',
        ],
        'network_optimizations' => [
            'connection_pooling' => 32,
            'request_batching' => true,
            'compression' => 'brotli',
            'keep_alive_timeout' => 300,
            'tcp_nodelay' => true,
            'tcp_quickack' => true,
        ]
    ];

    public function __construct(Logger $logger, array $config = []) {
        $this->logger = $logger;
        $this->hardwareConfig = $config;
        $this->detectHardware();
    }

    /**
     * Detect system hardware capabilities
     */
    public function detectHardware(): array {
        $this->logger->info('Starting hardware detection');

        $hardware = [
            'cpu' => $this->detectCPU(),
            'gpu' => $this->detectGPU(),
            'memory' => $this->detectMemory(),
            'display' => $this->detectDisplay(),
            'network' => $this->detectNetwork(),
        ];

        $this->detectedHardware = $hardware;
        $this->logger->info('Hardware detection completed', $hardware);

        return $hardware;
    }

    /**
     * Get optimized configuration for Minimax M1
     */
    public function getMinimaxM1Config(): array {
        $baseConfig = self::MINIMAX_M1_OPTIMIZATIONS;
        $hardwareProfile = $this->getOptimalProfile();

        return array_merge_recursive($baseConfig, [
            'hardware_profile' => $hardwareProfile,
            'performance_settings' => $this->calculatePerformanceSettings(),
            'memory_settings' => $this->calculateMemorySettings(),
            'threading_settings' => $this->calculateThreadingSettings(),
            'network_settings' => $this->calculateNetworkSettings(),
        ]);
    }

    /**
     * Detect CPU information
     */
    private function detectCPU(): array {
        $cpu = [
            'model' => 'Unknown',
            'cores' => 1,
            'threads' => 1,
            'frequency' => 0,
            'cache' => 0,
            'architecture' => 'Unknown',
            'features' => [],
        ];

        // Windows CPU detection
        if (PHP_OS_FAMILY === 'Windows') {
            $wmic = shell_exec('wmic cpu get Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed /format:csv');
            if ($wmic) {
                $lines = explode("\n", trim($wmic));
                foreach ($lines as $line) {
                    if (strpos($line, 'Intel') !== false || strpos($line, 'AMD') !== false) {
                        $parts = str_getcsv($line);
                        if (count($parts) >= 5) {
                            $cpu['model'] = trim($parts[4]);
                            $cpu['cores'] = (int)$parts[2];
                            $cpu['threads'] = (int)$parts[3];
                            $cpu['frequency'] = (int)$parts[1];
                        }
                    }
                }
            }

            // Detect Intel i9 specifically
            if (strpos($cpu['model'], 'i9') !== false) {
                $cpu['is_i9'] = true;
                $cpu['performance_cores'] = $this->detectIntelPerformanceCores();
                $cpu['efficiency_cores'] = $this->detectIntelEfficiencyCores();
            }
        }

        // Linux CPU detection
        if (PHP_OS_FAMILY === 'Linux') {
            $cpuinfo = file_get_contents('/proc/cpuinfo');
            if ($cpuinfo) {
                preg_match('/model name\s*:\s*(.+)/', $cpuinfo, $matches);
                if ($matches) {
                    $cpu['model'] = trim($matches[1]);
                }

                $cpu['cores'] = (int)shell_exec('nproc --all');
                $cpu['threads'] = (int)shell_exec('nproc');
            }
        }

        return $cpu;
    }

    /**
     * Detect GPU information
     */
    private function detectGPU(): array {
        $gpu = [
            'model' => 'Unknown',
            'memory' => 0,
            'cuda_cores' => 0,
            'compute_capability' => '0.0',
            'driver_version' => 'Unknown',
            'is_nvidia' => false,
            'is_rtx_5080' => false,
        ];

        // NVIDIA GPU detection
        $nvidiaSmi = shell_exec('nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>nul');
        if ($nvidiaSmi) {
            $lines = explode("\n", trim($nvidiaSmi));
            foreach ($lines as $line) {
                $parts = str_getcsv(trim($line));
                if (count($parts) >= 3) {
                    $gpu['model'] = trim($parts[0]);
                    $gpu['memory'] = (int)$parts[1];
                    $gpu['driver_version'] = trim($parts[2]);
                    $gpu['is_nvidia'] = true;

                    // Check for RTX 5080
                    if (strpos($gpu['model'], 'RTX 5080') !== false) {
                        $gpu['is_rtx_5080'] = true;
                        $gpu['cuda_cores'] = 10752;
                        $gpu['tensor_cores'] = 336;
                        $gpu['rt_cores'] = 84;
                        $gpu['memory_bandwidth'] = 896;
                    }
                    break;
                }
            }
        }

        return $gpu;
    }

    /**
     * Detect memory information
     */
    private function detectMemory(): array {
        $memory = [
            'total' => 0,
            'available' => 0,
            'type' => 'Unknown',
            'speed' => 0,
            'channels' => 1,
        ];

        if (PHP_OS_FAMILY === 'Windows') {
            $wmic = shell_exec('wmic memorychip get Capacity,Speed,MemoryType /format:csv');
            if ($wmic) {
                $totalMemory = 0;
                $speeds = [];
                $lines = explode("\n", trim($wmic));
                foreach ($lines as $line) {
                    $parts = str_getcsv($line);
                    if (count($parts) >= 4 && is_numeric($parts[1])) {
                        $totalMemory += (int)$parts[1];
                        $speeds[] = (int)$parts[3];
                    }
                }
                $memory['total'] = $totalMemory;
                $memory['speed'] = !empty($speeds) ? max($speeds) : 0;
            }
        }

        if (PHP_OS_FAMILY === 'Linux') {
            $meminfo = file_get_contents('/proc/meminfo');
            if ($meminfo) {
                preg_match('/MemTotal:\s*(\d+)/', $meminfo, $matches);
                if ($matches) {
                    $memory['total'] = (int)$matches[1] * 1024; // Convert KB to bytes
                }
            }
        }

        return $memory;
    }

    /**
     * Detect display information
     */
    private function detectDisplay(): array {
        $display = [
            'refresh_rate' => 60,
            'resolution' => 'Unknown',
            'is_240hz' => false,
            'adaptive_sync' => false,
            'hdr' => false,
        ];

        if (PHP_OS_FAMILY === 'Windows') {
            // Use PowerShell to get display information
            $ps = 'Get-CimInstance -ClassName Win32_VideoController | Select-Object CurrentRefreshRate,CurrentHorizontalResolution,CurrentVerticalResolution';
            $result = shell_exec("powershell -Command \"$ps\" 2>nul");
            if ($result) {
                preg_match('/CurrentRefreshRate\s*:\s*(\d+)/', $result, $matches);
                if ($matches) {
                    $display['refresh_rate'] = (int)$matches[1];
                    $display['is_240hz'] = $display['refresh_rate'] >= 240;
                }
            }
        }

        return $display;
    }

    /**
     * Detect network capabilities
     */
    private function detectNetwork(): array {
        return [
            'bandwidth' => $this->measureNetworkBandwidth(),
            'latency' => $this->measureNetworkLatency(),
            'mtu' => 1500,
            'tcp_window_scaling' => true,
        ];
    }

    /**
     * Get optimal performance profile based on detected hardware
     */
    private function getOptimalProfile(): string {
        $cpu = $this->detectedHardware['cpu'] ?? [];
        $gpu = $this->detectedHardware['gpu'] ?? [];
        $display = $this->detectedHardware['display'] ?? [];

        // Check for optimal configuration
        if (($cpu['is_i9'] ?? false) &&
            ($gpu['is_rtx_5080'] ?? false) &&
            ($display['is_240hz'] ?? false)) {
            return 'nvidia_5080_i9_240hz';
        }

        return 'default';
    }

    /**
     * Calculate performance settings based on hardware
     */
    private function calculatePerformanceSettings(): array {
        $profile = $this->getOptimalProfile();
        $config = self::PERFORMANCE_PROFILES[$profile] ?? [];

        return [
            'parallel_requests' => min(($this->detectedHardware['cpu']['threads'] ?? 4), 32),
            'gpu_acceleration' => $this->detectedHardware['gpu']['is_nvidia'] ?? false,
            'memory_pooling' => ($this->detectedHardware['memory']['total'] ?? 0) > 16 * 1024 * 1024 * 1024,
            'cache_size' => $this->calculateOptimalCacheSize(),
            'thread_affinity' => $this->detectedHardware['cpu']['is_i9'] ?? false,
            'low_latency_mode' => $this->detectedHardware['display']['is_240hz'] ?? false,
        ];
    }

    /**
     * Calculate memory settings
     */
    private function calculateMemorySettings(): array {
        $totalMemory = $this->detectedHardware['memory']['total'] ?? 0;
        $memoryGB = $totalMemory / (1024 * 1024 * 1024);

        return [
            'heap_size' => min($memoryGB * 0.25, 8), // 25% of RAM, max 8GB
            'buffer_size' => $memoryGB > 32 ? 1024 * 1024 : 512 * 1024, // 1MB for >32GB RAM
            'cache_size' => min($memoryGB * 0.1, 4), // 10% of RAM, max 4GB
            'preallocation' => $memoryGB > 16,
        ];
    }

    /**
     * Calculate threading settings
     */
    private function calculateThreadingSettings(): array {
        $cores = $this->detectedHardware['cpu']['cores'] ?? 4;
        $threads = $this->detectedHardware['cpu']['threads'] ?? 4;

        return [
            'worker_threads' => min($threads, 32),
            'io_threads' => min($cores / 2, 8),
            'compute_threads' => min($cores, 16),
            'thread_pool_size' => $threads * 2,
            'numa_awareness' => $cores > 16,
        ];
    }

    /**
     * Calculate network settings
     */
    private function calculateNetworkSettings(): array {
        return [
            'connection_pool_size' => 32,
            'keep_alive_timeout' => 300,
            'tcp_nodelay' => true,
            'tcp_quickack' => true,
            'socket_buffer_size' => 1024 * 1024, // 1MB
            'compression' => 'brotli',
            'http2_enabled' => true,
            'multiplexing' => true,
        ];
    }

    /**
     * Detect Intel performance cores
     */
    private function detectIntelPerformanceCores(): int {
        // Intel i9 typically has 8 performance cores
        return 8;
    }

    /**
     * Detect Intel efficiency cores
     */
    private function detectIntelEfficiencyCores(): int {
        // Intel i9 typically has 16 efficiency cores
        return 16;
    }

    /**
     * Calculate optimal cache size
     */
    private function calculateOptimalCacheSize(): int {
        $memory = $this->detectedHardware['memory']['total'] ?? 0;
        $memoryGB = $memory / (1024 * 1024 * 1024);

        if ($memoryGB > 64) return 2048; // 2GB cache
        if ($memoryGB > 32) return 1024; // 1GB cache
        if ($memoryGB > 16) return 512;  // 512MB cache
        return 256; // 256MB cache
    }

    /**
     * Measure network bandwidth (simplified)
     */
    private function measureNetworkBandwidth(): int {
        // Simplified bandwidth detection - in real implementation,
        // this would perform actual network tests
        return 1000; // Assume 1Gbps
    }

    /**
     * Measure network latency (simplified)
     */
    private function measureNetworkLatency(): float {
        // Simplified latency detection
        return 1.0; // Assume 1ms
    }

    /**
     * Get hardware information
     */
    public function getHardwareInfo(): array {
        return $this->detectedHardware;
    }

    /**
     * Get performance profile
     */
    public function getPerformanceProfile(string $profile = null): array {
        $profile = $profile ?? $this->getOptimalProfile();
        return self::PERFORMANCE_PROFILES[$profile] ?? [];
    }

    /**
     * Apply hardware optimizations
     */
    public function applyOptimizations(): array {
        $optimizations = [];

        // CPU optimizations
        if ($this->detectedHardware['cpu']['is_i9'] ?? false) {
            $optimizations['cpu'] = $this->applyIntelI9Optimizations();
        }

        // GPU optimizations
        if ($this->detectedHardware['gpu']['is_rtx_5080'] ?? false) {
            $optimizations['gpu'] = $this->applyRTX5080Optimizations();
        }

        // Display optimizations
        if ($this->detectedHardware['display']['is_240hz'] ?? false) {
            $optimizations['display'] = $this->apply240HzOptimizations();
        }

        return $optimizations;
    }

    /**
     * Apply Intel i9 specific optimizations
     */
    private function applyIntelI9Optimizations(): array {
        return [
            'thread_affinity' => true,
            'performance_cores_priority' => true,
            'turbo_boost' => true,
            'hyperthreading' => true,
            'cache_optimization' => true,
        ];
    }

    /**
     * Apply RTX 5080 specific optimizations
     */
    private function applyRTX5080Optimizations(): array {
        return [
            'cuda_acceleration' => true,
            'tensor_cores' => true,
            'rt_cores' => false, // Not needed for AI inference
            'memory_bandwidth_optimization' => true,
            'power_limit' => 400,
            'clock_boost' => true,
        ];
    }

    /**
     * Apply 240Hz display optimizations
     */
    private function apply240HzOptimizations(): array {
        return [
            'low_latency_mode' => true,
            'frame_pacing' => true,
            'vsync_off' => true,
            'response_time_optimization' => true,
            'adaptive_sync' => true,
        ];
    }
}
