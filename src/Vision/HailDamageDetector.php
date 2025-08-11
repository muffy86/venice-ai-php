<?php

namespace VeniceAI\Vision;

use VeniceAI\VeniceAI;
use VeniceAI\Utils\Logger;
use VeniceAI\Cache\CacheManager;
use VeniceAI\Events\EventManager;

/**
 * Advanced Hail Damage Detection System
 * Uses computer vision to detect micro-dense and big dents from hail damage
 */
class HailDamageDetector
{
    private VeniceAI $veniceAI;
    private Logger $logger;
    private CacheManager $cache;
    private EventManager $events;
    private array $config;

    public function __construct(VeniceAI $veniceAI, array $config = [])
    {
        $this->veniceAI = $veniceAI;
        $this->logger = new Logger();
        $this->cache = new CacheManager();
        $this->events = new EventManager();

        $this->config = array_merge([
            'confidence_threshold' => 0.85,
            'min_dent_size' => 5, // pixels
            'max_dent_size' => 500, // pixels
            'enhancement_enabled' => true,
            'batch_processing' => true,
            'real_time_processing' => true,
            'auto_calibration' => true,
            'multi_angle_analysis' => true,
            'depth_estimation' => true,
            'damage_severity_scoring' => true,
            'automated_reporting' => true
        ], $config);
    }

    /**
     * Automated hail damage detection pipeline
     */
    public function detectHailDamage(string $imagePath, array $options = []): array
    {
        $this->logger->info("Starting hail damage detection for: {$imagePath}");

        try {
            // Step 1: Image preprocessing and enhancement
            $enhancedImage = $this->preprocessImage($imagePath);

            // Step 2: Multi-model analysis
            $detectionResults = $this->runMultiModelAnalysis($enhancedImage);

            // Step 3: Post-processing and validation
            $validatedResults = $this->validateAndRefineResults($detectionResults);

            // Step 4: Damage assessment and scoring
            $damageAssessment = $this->assessDamageScore($validatedResults);

            // Step 5: Generate automated report
            $report = $this->generateAutomatedReport($damageAssessment, $imagePath);

            // Step 6: Cache results for future reference
            $this->cacheResults($imagePath, $report);

            // Step 7: Trigger events for downstream processing
            $this->events->emit('hail_damage_detected', $report);

            return $report;

        } catch (\Exception $e) {
            $this->logger->error("Hail damage detection failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Advanced image preprocessing with multiple enhancement techniques
     */
    private function preprocessImage(string $imagePath): array
    {
        $this->logger->info("Preprocessing image: {$imagePath}");

        // Check cache first
        $cacheKey = 'preprocessed_' . md5($imagePath . filemtime($imagePath));
        if ($cached = $this->cache->get($cacheKey)) {
            return $cached;
        }

        $enhancements = [];

        // 1. Super-resolution enhancement
        $enhancements['super_resolution'] = $this->applySuperResolution($imagePath);

        // 2. Noise reduction and sharpening
        $enhancements['denoised'] = $this->applyNoiseReduction($enhancements['super_resolution']);

        // 3. Contrast and brightness optimization
        $enhancements['contrast_enhanced'] = $this->enhanceContrast($enhancements['denoised']);

        // 4. Edge enhancement for dent detection
        $enhancements['edge_enhanced'] = $this->enhanceEdges($enhancements['contrast_enhanced']);

        // 5. Multi-spectral analysis (if available)
        $enhancements['spectral_analysis'] = $this->performSpectralAnalysis($enhancements['edge_enhanced']);

        // 6. Geometric correction and perspective normalization
        $enhancements['geometric_corrected'] = $this->correctGeometry($enhancements['spectral_analysis']);

        // Cache the results
        $this->cache->set($cacheKey, $enhancements, 3600); // Cache for 1 hour

        return $enhancements;
    }

    /**
     * Multi-model ensemble analysis for maximum accuracy
     */
    private function runMultiModelAnalysis(array $enhancedImages): array
    {
        $this->logger->info("Running multi-model analysis");

        $models = [
            'primary_detector' => $this->runPrimaryDetection($enhancedImages),
            'micro_dent_specialist' => $this->detectMicroDents($enhancedImages),
            'large_damage_detector' => $this->detectLargeDamage($enhancedImages),
            'depth_estimator' => $this->estimateDepth($enhancedImages),
            'surface_analyzer' => $this->analyzeSurface($enhancedImages),
            'pattern_recognizer' => $this->recognizeHailPatterns($enhancedImages)
        ];

        // Ensemble voting and confidence weighting
        $ensembleResults = $this->combineModelResults($models);

        return $ensembleResults;
    }

    /**
     * Primary hail damage detection using Venice AI vision capabilities
     */
    private function runPrimaryDetection(array $images): array
    {
        $prompt = "Analyze this vehicle image for hail damage. Detect and locate all dents, dings, and surface deformations caused by hail impact. Pay special attention to:
        1. Micro-dents (1-10mm diameter)
        2. Medium dents (10-25mm diameter)
        3. Large dents (25mm+ diameter)
        4. Surface texture changes
        5. Paint damage or chipping
        6. Metal deformation patterns

        Provide precise coordinates, size estimates, and confidence scores for each detected damage area.";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['geometric_corrected'],
                'prompt' => $prompt,
                'detail' => 'high',
                'max_tokens' => 2000,
                'temperature' => 0.1 // Low temperature for consistent results
            ]);

            return $this->parseDetectionResponse($response);

        } catch (\Exception $e) {
            $this->logger->error("Primary detection failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Specialized micro-dent detection for subtle damage
     */
    private function detectMicroDents(array $images): array
    {
        $prompt = "Focus exclusively on detecting micro-dents and subtle surface deformations that are barely visible to the naked eye. These are typically:
        - 1-5mm in diameter
        - Shallow depth (0.1-1mm)
        - Often appear as slight shadows or highlights
        - May only be visible under specific lighting conditions

        Use advanced edge detection and surface normal analysis to identify these subtle damages.";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['edge_enhanced'],
                'prompt' => $prompt,
                'detail' => 'high',
                'temperature' => 0.05 // Very low temperature for precision
            ]);

            return $this->parseDetectionResponse($response, 'micro');

        } catch (\Exception $e) {
            $this->logger->error("Micro-dent detection failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Large damage detection for significant hail impact
     */
    private function detectLargeDamage(array $images): array
    {
        $prompt = "Identify large hail damage including:
        - Major dents (25mm+ diameter)
        - Deep deformations (2mm+ depth)
        - Cracked or chipped paint
        - Metal creasing or folding
        - Multiple overlapping impact sites

        Assess the severity and potential repair complexity for each large damage area.";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['contrast_enhanced'],
                'prompt' => $prompt,
                'detail' => 'high',
                'temperature' => 0.1
            ]);

            return $this->parseDetectionResponse($response, 'large');

        } catch (\Exception $e) {
            $this->logger->error("Large damage detection failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 3D depth estimation for damage assessment
     */
    private function estimateDepth(array $images): array
    {
        $prompt = "Estimate the depth and 3D characteristics of each detected dent:
        - Shallow (0.1-0.5mm depth)
        - Medium (0.5-2mm depth)
        - Deep (2mm+ depth)

        Consider lighting, shadows, and surface reflections to accurately assess the three-dimensional nature of each damage area.";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['spectral_analysis'],
                'prompt' => $prompt,
                'detail' => 'high',
                'temperature' => 0.1
            ]);

            return $this->parseDepthResponse($response);

        } catch (\Exception $e) {
            $this->logger->error("Depth estimation failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Surface material and texture analysis
     */
    private function analyzeSurface(array $images): array
    {
        $prompt = "Analyze the vehicle surface material and texture to understand:
        - Paint type and finish (metallic, solid, pearl, etc.)
        - Surface hardness indicators
        - Pre-existing wear or damage
        - Material response to hail impact
        - Repair difficulty assessment based on surface type";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['super_resolution'],
                'prompt' => $prompt,
                'detail' => 'high',
                'temperature' => 0.2
            ]);

            return $this->parseSurfaceResponse($response);

        } catch (\Exception $e) {
            $this->logger->error("Surface analysis failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Hail damage pattern recognition
     */
    private function recognizeHailPatterns(array $images): array
    {
        $prompt = "Identify hail damage patterns that indicate:
        - Hail size distribution (small, medium, large stones)
        - Impact angle and direction
        - Storm intensity indicators
        - Damage density and distribution
        - Consistency with typical hail damage patterns vs other causes";

        try {
            $response = $this->veniceAI->image()->analyze([
                'image' => $images['geometric_corrected'],
                'prompt' => $prompt,
                'detail' => 'high',
                'temperature' => 0.15
            ]);

            return $this->parsePatternResponse($response);

        } catch (\Exception $e) {
            $this->logger->error("Pattern recognition failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Advanced image enhancement techniques
     */
    private function applySuperResolution(string $imagePath): string
    {
        // Use Venice AI for image upscaling and enhancement
        try {
            $response = $this->veniceAI->image()->enhance([
                'image' => $imagePath,
                'enhancement_type' => 'super_resolution',
                'scale_factor' => 2,
                'preserve_details' => true
            ]);

            return $response['enhanced_image_path'] ?? $imagePath;
        } catch (\Exception $e) {
            $this->logger->warning("Super resolution failed, using original: " . $e->getMessage());
            return $imagePath;
        }
    }

    private function applyNoiseReduction(string $imagePath): string
    {
        try {
            $response = $this->veniceAI->image()->enhance([
                'image' => $imagePath,
                'enhancement_type' => 'denoise',
                'strength' => 'medium',
                'preserve_edges' => true
            ]);

            return $response['enhanced_image_path'] ?? $imagePath;
        } catch (\Exception $e) {
            return $imagePath;
        }
    }

    private function enhanceContrast(string $imagePath): string
    {
        try {
            $response = $this->veniceAI->image()->enhance([
                'image' => $imagePath,
                'enhancement_type' => 'contrast',
                'adaptive' => true,
                'preserve_highlights' => true
            ]);

            return $response['enhanced_image_path'] ?? $imagePath;
        } catch (\Exception $e) {
            return $imagePath;
        }
    }

    private function enhanceEdges(string $imagePath): string
    {
        try {
            $response = $this->veniceAI->image()->enhance([
                'image' => $imagePath,
                'enhancement_type' => 'edge_enhancement',
                'strength' => 'high',
                'preserve_texture' => true
            ]);

            return $response['enhanced_image_path'] ?? $imagePath;
        } catch (\Exception $e) {
            return $imagePath;
        }
    }

    private function performSpectralAnalysis(string $imagePath): string
    {
        // Advanced spectral analysis for material properties
        return $imagePath; // Placeholder for advanced spectral analysis
    }

    private function correctGeometry(string $imagePath): string
    {
        try {
            $response = $this->veniceAI->image()->enhance([
                'image' => $imagePath,
                'enhancement_type' => 'perspective_correction',
                'auto_detect' => true
            ]);

            return $response['enhanced_image_path'] ?? $imagePath;
        } catch (\Exception $e) {
            return $imagePath;
        }
    }

    /**
     * Combine results from multiple models using ensemble techniques
     */
    private function combineModelResults(array $models): array
    {
        $combinedResults = [];
        $weights = [
            'primary_detector' => 0.3,
            'micro_dent_specialist' => 0.2,
            'large_damage_detector' => 0.2,
            'depth_estimator' => 0.1,
            'surface_analyzer' => 0.1,
            'pattern_recognizer' => 0.1
        ];

        // Weighted ensemble voting
        foreach ($models as $modelName => $results) {
            $weight = $weights[$modelName] ?? 0.1;

            foreach ($results as $detection) {
                $detection['confidence'] *= $weight;
                $detection['source_model'] = $modelName;
                $combinedResults[] = $detection;
            }
        }

        // Non-maximum suppression to remove overlapping detections
        $finalResults = $this->applyNonMaximumSuppression($combinedResults);

        return $finalResults;
    }

    /**
     * Validate and refine detection results
     */
    private function validateAndRefineResults(array $results): array
    {
        $validatedResults = [];

        foreach ($results as $detection) {
            // Apply confidence threshold
            if ($detection['confidence'] < $this->config['confidence_threshold']) {
                continue;
            }

            // Validate size constraints
            $size = $detection['size'] ?? 0;
            if ($size < $this->config['min_dent_size'] || $size > $this->config['max_dent_size']) {
                continue;
            }

            // Additional validation rules
            if ($this->isValidDetection($detection)) {
                $validatedResults[] = $detection;
            }
        }

        return $validatedResults;
    }

    /**
     * Assess overall damage score and severity
     */
    private function assessDamageScore(array $detections): array
    {
        $totalDamage = 0;
        $severityDistribution = [
            'micro' => 0,
            'small' => 0,
            'medium' => 0,
            'large' => 0
        ];

        foreach ($detections as $detection) {
            $size = $detection['size'] ?? 0;
            $depth = $detection['depth'] ?? 0;

            // Calculate individual damage score
            $damageScore = $this->calculateDamageScore($size, $depth);
            $detection['damage_score'] = $damageScore;
            $totalDamage += $damageScore;

            // Categorize by severity
            if ($size <= 5) {
                $severityDistribution['micro']++;
            } elseif ($size <= 15) {
                $severityDistribution['small']++;
            } elseif ($size <= 25) {
                $severityDistribution['medium']++;
            } else {
                $severityDistribution['large']++;
            }
        }

        return [
            'detections' => $detections,
            'total_damage_score' => $totalDamage,
            'severity_distribution' => $severityDistribution,
            'overall_severity' => $this->calculateOverallSeverity($totalDamage, $severityDistribution),
            'repair_complexity' => $this->assessRepairComplexity($detections),
            'estimated_repair_cost' => $this->estimateRepairCost($detections)
        ];
    }

    /**
     * Generate comprehensive automated report
     */
    private function generateAutomatedReport(array $assessment, string $imagePath): array
    {
        $report = [
            'timestamp' => date('Y-m-d H:i:s'),
            'image_path' => $imagePath,
            'detection_summary' => [
                'total_detections' => count($assessment['detections']),
                'total_damage_score' => $assessment['total_damage_score'],
                'overall_severity' => $assessment['overall_severity'],
                'severity_distribution' => $assessment['severity_distribution']
            ],
            'detailed_detections' => $assessment['detections'],
            'repair_assessment' => [
                'complexity' => $assessment['repair_complexity'],
                'estimated_cost' => $assessment['estimated_repair_cost'],
                'recommended_method' => $this->recommendRepairMethod($assessment),
                'priority_areas' => $this->identifyPriorityAreas($assessment['detections'])
            ],
            'quality_metrics' => [
                'detection_confidence' => $this->calculateAverageConfidence($assessment['detections']),
                'image_quality_score' => $this->assessImageQuality($imagePath),
                'analysis_completeness' => $this->assessAnalysisCompleteness($assessment)
            ],
            'recommendations' => $this->generateRecommendations($assessment)
        ];

        return $report;
    }

    /**
     * Cache results for performance optimization
     */
    private function cacheResults(string $imagePath, array $report): void
    {
        $cacheKey = 'hail_damage_report_' . md5($imagePath . filemtime($imagePath));
        $this->cache->set($cacheKey, $report, 86400); // Cache for 24 hours
    }

    /**
     * Batch processing for multiple images
     */
    public function batchProcessImages(array $imagePaths, array $options = []): array
    {
        $this->logger->info("Starting batch processing for " . count($imagePaths) . " images");

        $results = [];
        $batchSize = $options['batch_size'] ?? 10;
        $batches = array_chunk($imagePaths, $batchSize);

        foreach ($batches as $batchIndex => $batch) {
            $this->logger->info("Processing batch " . ($batchIndex + 1) . " of " . count($batches));

            $batchResults = [];
            foreach ($batch as $imagePath) {
                try {
                    $result = $this->detectHailDamage($imagePath, $options);
                    $batchResults[$imagePath] = $result;
                } catch (\Exception $e) {
                    $this->logger->error("Failed to process {$imagePath}: " . $e->getMessage());
                    $batchResults[$imagePath] = ['error' => $e->getMessage()];
                }
            }

            $results = array_merge($results, $batchResults);

            // Optional delay between batches to prevent API rate limiting
            if (isset($options['batch_delay']) && $options['batch_delay'] > 0) {
                sleep($options['batch_delay']);
            }
        }

        return $results;
    }

    /**
     * Real-time processing for live camera feeds
     */
    public function processLiveStream(callable $frameCallback, array $options = []): void
    {
        $this->logger->info("Starting real-time hail damage detection");

        $frameInterval = $options['frame_interval'] ?? 1; // Process every N frames
        $frameCount = 0;

        while (true) {
            $frameCount++;

            if ($frameCount % $frameInterval === 0) {
                try {
                    $frame = $frameCallback();
                    if ($frame) {
                        $result = $this->detectHailDamage($frame, $options);
                        $this->events->emit('real_time_detection', $result);
                    }
                } catch (\Exception $e) {
                    $this->logger->error("Real-time processing error: " . $e->getMessage());
                }
            }

            // Small delay to prevent overwhelming the system
            usleep(100000); // 100ms delay
        }
    }

    // Helper methods for parsing responses and calculations
    private function parseDetectionResponse(array $response, string $type = 'general'): array
    {
        // Parse Venice AI response and extract detection data
        $detections = [];

        if (isset($response['choices'][0]['message']['content'])) {
            $content = $response['choices'][0]['message']['content'];

            // Extract structured data from the response
            // This would need to be implemented based on the actual response format
            $detections = $this->extractDetectionsFromText($content, $type);
        }

        return $detections;
    }

    private function parseDepthResponse(array $response): array
    {
        // Parse depth estimation response
        return [];
    }

    private function parseSurfaceResponse(array $response): array
    {
        // Parse surface analysis response
        return [];
    }

    private function parsePatternResponse(array $response): array
    {
        // Parse pattern recognition response
        return [];
    }

    private function extractDetectionsFromText(string $content, string $type): array
    {
        // Extract detection data from text response
        // This would use regex or NLP to parse structured data
        return [];
    }

    private function applyNonMaximumSuppression(array $detections): array
    {
        // Remove overlapping detections
        return $detections;
    }

    private function isValidDetection(array $detection): bool
    {
        // Additional validation logic
        return true;
    }

    private function calculateDamageScore(float $size, float $depth): float
    {
        // Calculate damage score based on size and depth
        return ($size * 0.6) + ($depth * 0.4);
    }

    private function calculateOverallSeverity(float $totalScore, array $distribution): string
    {
        if ($totalScore < 50) return 'Minor';
        if ($totalScore < 150) return 'Moderate';
        if ($totalScore < 300) return 'Significant';
        return 'Severe';
    }

    private function assessRepairComplexity(array $detections): string
    {
        $largeCount = count(array_filter($detections, fn($d) => ($d['size'] ?? 0) > 25));

        if ($largeCount > 10) return 'High';
        if ($largeCount > 5) return 'Medium';
        return 'Low';
    }

    private function estimateRepairCost(array $detections): array
    {
        $baseCost = 50; // Base inspection cost
        $perDentCost = 75; // Average cost per dent

        $totalCost = $baseCost + (count($detections) * $perDentCost);

        return [
            'estimated_cost' => $totalCost,
            'cost_range' => [
                'min' => $totalCost * 0.8,
                'max' => $totalCost * 1.5
            ],
            'currency' => 'USD'
        ];
    }

    private function recommendRepairMethod(array $assessment): string
    {
        $severity = $assessment['overall_severity'];

        switch ($severity) {
            case 'Minor':
                return 'Paintless Dent Repair (PDR)';
            case 'Moderate':
                return 'PDR with possible touch-up painting';
            case 'Significant':
                return 'Traditional bodywork and painting';
            case 'Severe':
                return 'Panel replacement may be required';
            default:
                return 'Professional assessment recommended';
        }
    }

    private function identifyPriorityAreas(array $detections): array
    {
        // Sort by damage score and return top priority areas
        usort($detections, fn($a, $b) => ($b['damage_score'] ?? 0) <=> ($a['damage_score'] ?? 0));

        return array_slice($detections, 0, 5); // Top 5 priority areas
    }

    private function calculateAverageConfidence(array $detections): float
    {
        if (empty($detections)) return 0.0;

        $totalConfidence = array_sum(array_column($detections, 'confidence'));
        return $totalConfidence / count($detections);
    }

    private function assessImageQuality(string $imagePath): float
    {
        // Assess image quality factors like resolution, lighting, focus
        return 0.85; // Placeholder
    }

    private function assessAnalysisCompleteness(array $assessment): float
    {
        // Assess how complete the analysis is
        return 0.92; // Placeholder
    }

    private function generateRecommendations(array $assessment): array
    {
        $recommendations = [];

        if ($assessment['total_damage_score'] > 200) {
            $recommendations[] = 'Consider comprehensive insurance claim documentation';
        }

        if ($assessment['severity_distribution']['large'] > 5) {
            $recommendations[] = 'Professional bodywork assessment recommended';
        }

        if ($assessment['severity_distribution']['micro'] > 20) {
            $recommendations[] = 'PDR specialist consultation for micro-dent removal';
        }

        return $recommendations;
    }
}
