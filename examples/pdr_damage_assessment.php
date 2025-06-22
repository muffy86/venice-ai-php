<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Venice\VeniceAI;
use Venice\Exceptions\ValidationException;

/**
 * PDR (Paintless Dent Repair) Industry Example
 * Demonstrates how to use Venice AI SDK for vehicle damage assessment
 */

class PDRDamageAssessment {
    private VeniceAI $venice;
    private array $systemPrompt;

    public function __construct(string $apiKey) {
        // Initialize Venice AI with industry-specific configuration
        $this->venice = new VeniceAI($apiKey, [
            'debug' => true,
            'log_file' => __DIR__ . '/pdr-assessment.log',
            'timeout' => 60, // Extended timeout for image processing
            'max_retries' => 3
        ]);

        // Industry-specific system prompt for damage assessment
        $this->systemPrompt = [
            'role' => 'system',
            'content' => "You are an expert PDR (Paintless Dent Repair) damage assessor with deep knowledge of:
            - Vehicle panel identification and terminology
            - Dent size classification and severity assessment
            - Industry-standard pricing metrics
            - Common hail damage patterns
            - PDR repair techniques and limitations
            - Vehicle make/model specific considerations
            - Insurance claim requirements

            Analyze images/videos for:
            1. Dent count and distribution
            2. Size classification (micro, small, medium, large)
            3. Severity assessment (shallow, medium, deep)
            4. Panel-specific damage mapping
            5. Repair time estimation
            6. Cost calculation based on current industry rates
            7. Additional considerations (access difficulty, metal thickness)

            Provide detailed reports following PDR industry best practices."
        ];
    }

    /**
     * Analyze vehicle damage from image
     *
     * @param string $imagePath Path to image file
     * @param array $options Assessment options
     * @return array Assessment results
     */
    public function analyzeImage(string $imagePath, array $options = []): array {
        // Convert image to base64
        $imageData = base64_encode(file_get_contents($imagePath));

        $messages = [
            $this->systemPrompt,
            [
                'role' => 'user',
                'content' => [
                    'type' => 'image_analysis',
                    'image' => $imageData,
                    'vehicle_info' => $options['vehicle_info'] ?? null,
                    'analysis_type' => 'hail_damage',
                    'requirements' => [
                        'dent_counting' => true,
                        'size_measurement' => true,
                        'panel_mapping' => true,
                        'severity_assessment' => true,
                        'repair_estimation' => true
                    ]
                ]
            ]
        ];

        try {
            $response = $this->venice->chat()->createCompletion($messages, 'pdr-vision-v1', [
                'temperature' => 0.2, // Lower temperature for more consistent analysis
                'max_tokens' => 2000,
                'venice_parameters' => [
                    'vision_mode' => 'high_precision',
                    'measurement_units' => 'mm',
                    'confidence_threshold' => 0.85
                ]
            ]);

            return $this->parseAssessmentResponse($response);
        } catch (ValidationException $e) {
            throw new \Exception("Image analysis failed: " . $e->getMessage());
        }
    }

    /**
     * Analyze video footage of vehicle damage
     *
     * @param string $videoPath Path to video file
     * @param array $options Assessment options
     * @return array Assessment results
     */
    public function analyzeVideo(string $videoPath, array $options = []): array {
        // Process video frames
        $frames = $this->extractKeyFrames($videoPath);
        $assessments = [];

        foreach ($frames as $frame) {
            $frameAssessment = $this->analyzeImage($frame, $options);
            $assessments[] = $frameAssessment;
        }

        return $this->consolidateAssessments($assessments);
    }

    /**
     * Generate comprehensive damage report
     *
     * @param array $assessment Assessment data
     * @return array Formatted report
     */
    public function generateReport(array $assessment): array {
        $report = [
            'summary' => [
                'total_dents' => $assessment['dent_count'],
                'affected_panels' => count($assessment['panel_damage']),
                'severity_distribution' => $assessment['severity_stats'],
                'estimated_repair_time' => $assessment['repair_estimate']['hours'],
                'estimated_cost' => $this->calculateRepairCost($assessment)
            ],
            'detailed_analysis' => [
                'panel_breakdown' => $this->formatPanelBreakdown($assessment['panel_damage']),
                'size_distribution' => $assessment['size_stats'],
                'repair_considerations' => $assessment['repair_notes'],
                'confidence_score' => $assessment['confidence']
            ],
            'visualization' => [
                'damage_map' => $assessment['damage_map'],
                'severity_heatmap' => $assessment['heatmap'],
                'panel_highlights' => $assessment['panel_highlights']
            ],
            'recommendations' => [
                'repair_approach' => $assessment['recommended_approach'],
                'technician_notes' => $assessment['tech_notes'],
                'additional_services' => $assessment['additional_services']
            ]
        ];

        return $report;
    }

    /**
     * Extract key frames from video for analysis
     *
     * @param string $videoPath Path to video file
     * @return array Array of frame paths
     */
    private function extractKeyFrames(string $videoPath): array {
        // Implementation would use FFmpeg or similar tool
        // to extract key frames from video
        return ['frame1.jpg', 'frame2.jpg']; // Placeholder
    }

    /**
     * Consolidate multiple frame assessments
     *
     * @param array $assessments Array of frame assessments
     * @return array Consolidated assessment
     */
    private function consolidateAssessments(array $assessments): array {
        // Merge and deduplicate damage detections
        // Use confidence scores to resolve conflicts
        return []; // Placeholder
    }

    /**
     * Calculate repair cost based on damage assessment
     *
     * @param array $assessment Damage assessment data
     * @return array Cost breakdown
     */
    private function calculateRepairCost(array $assessment): array {
        $rates = [
            'small' => 45,  // Per dent
            'medium' => 65,
            'large' => 95,
            'complex' => 125
        ];

        $costs = [
            'labor' => 0,
            'additional' => 0,
            'total' => 0
        ];

        foreach ($assessment['panel_damage'] as $panel) {
            foreach ($panel['dents'] as $dent) {
                $rate = $rates[$dent['size']];
                $multiplier = $this->getDifficultyMultiplier($panel['location'], $dent['severity']);
                $costs['labor'] += $rate * $multiplier;
            }
        }

        // Add additional costs
        $costs['additional'] = $this->calculateAdditionalCosts($assessment);
        $costs['total'] = $costs['labor'] + $costs['additional'];

        return $costs;
    }

    /**
     * Get difficulty multiplier based on panel location and damage severity
     *
     * @param string $location Panel location
     * @param string $severity Damage severity
     * @return float Difficulty multiplier
     */
    private function getDifficultyMultiplier(string $location, string $severity): float {
        $locationMultipliers = [
            'hood' => 1.0,
            'roof' => 1.2,
            'trunk' => 1.0,
            'quarter_panel' => 1.3,
            'door' => 1.1
        ];

        $severityMultipliers = [
            'shallow' => 1.0,
            'medium' => 1.2,
            'deep' => 1.5
        ];

        return ($locationMultipliers[$location] ?? 1.0) *
               ($severityMultipliers[$severity] ?? 1.0);
    }

    /**
     * Calculate additional costs
     *
     * @param array $assessment Damage assessment data
     * @return float Additional costs
     */
    private function calculateAdditionalCosts(array $assessment): float {
        $additional = 0;

        // Add setup fee
        $additional += 35;

        // Add panel access costs if needed
        if ($assessment['requires_panel_removal']) {
            $additional += 75;
        }

        // Add specialized tool costs if needed
        if ($assessment['requires_special_tools']) {
            $additional += 50;
        }

        return $additional;
    }

    /**
     * Format panel damage breakdown for reporting
     *
     * @param array $panelDamage Panel damage data
     * @return array Formatted breakdown
     */
    private function formatPanelBreakdown(array $panelDamage): array {
        $breakdown = [];

        foreach ($panelDamage as $panel => $data) {
            $breakdown[$panel] = [
                'dent_count' => count($data['dents']),
                'size_distribution' => $this->calculateSizeDistribution($data['dents']),
                'severity_levels' => $this->calculateSeverityLevels($data['dents']),
                'repair_difficulty' => $data['difficulty_rating'],
                'access_notes' => $data['access_notes']
            ];
        }

        return $breakdown;
    }

    /**
     * Calculate size distribution of dents
     *
     * @param array $dents Dent data
     * @return array Size distribution
     */
    private function calculateSizeDistribution(array $dents): array {
        $distribution = [
            'micro' => 0,
            'small' => 0,
            'medium' => 0,
            'large' => 0
        ];

        foreach ($dents as $dent) {
            $distribution[$dent['size']]++;
        }

        return $distribution;
    }

    /**
     * Calculate severity levels of dents
     *
     * @param array $dents Dent data
     * @return array Severity levels
     */
    private function calculateSeverityLevels(array $dents): array {
        $levels = [
            'shallow' => 0,
            'medium' => 0,
            'deep' => 0
        ];

        foreach ($dents as $dent) {
            $levels[$dent['severity']]++;
        }

        return $levels;
    }
}

// Example usage
try {
    // Initialize PDR damage assessment
    $assessor = new PDRDamageAssessment('your-api-key-here');

    // Analyze image
    $assessment = $assessor->analyzeImage('vehicle_damage.jpg', [
        'vehicle_info' => [
            'make' => 'Toyota',
            'model' => 'Camry',
            'year' => 2022,
            'color' => 'Silver'
        ]
    ]);

    // Generate report
    $report = $assessor->generateReport($assessment);

    // Output results
    echo "PDR Damage Assessment Report\n";
    echo "===========================\n";
    echo "Total Dents: " . $report['summary']['total_dents'] . "\n";
    echo "Affected Panels: " . $report['summary']['affected_panels'] . "\n";
    echo "Estimated Repair Time: " . $report['summary']['estimated_repair_time'] . " hours\n";
    echo "Estimated Cost: $" . $report['summary']['estimated_cost']['total'] . "\n\n";

    echo "Panel Breakdown:\n";
    foreach ($report['detailed_analysis']['panel_breakdown'] as $panel => $data) {
        echo "$panel: {$data['dent_count']} dents\n";
    }

    echo "\nRecommendations:\n";
    echo $report['recommendations']['repair_approach'] . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
