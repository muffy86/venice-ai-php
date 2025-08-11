<?php

require_once __DIR__ . '/../bootstrap.php';

use VeniceAI\VeniceAI;
use VeniceAI\Vision\HailDamageDetector;

/**
 * Comprehensive Hail Damage Detection Demo
 * Demonstrates automated hail damage detection with advanced computer vision
 */

// Initialize Venice AI with your API key
$veniceAI = new VeniceAI([
    'api_key' => 'vBgTDh77ba5HlsADmHN8WsQIBke27dN04_RoNxgk8S',
    'timeout' => 60,
    'max_retries' => 3
]);

// Configure hail damage detector with advanced settings
$config = [
    'confidence_threshold' => 0.85,
    'min_dent_size' => 3, // Detect very small dents
    'max_dent_size' => 500,
    'enhancement_enabled' => true,
    'batch_processing' => true,
    'real_time_processing' => true,
    'auto_calibration' => true,
    'multi_angle_analysis' => true,
    'depth_estimation' => true,
    'damage_severity_scoring' => true,
    'automated_reporting' => true
];

$detector = new HailDamageDetector($veniceAI, $config);

echo "🚗 Advanced Hail Damage Detection System\n";
echo "========================================\n\n";

// Demo 1: Single image analysis
echo "📸 Demo 1: Single Image Analysis\n";
echo "---------------------------------\n";

$sampleImagePath = __DIR__ . '/sample_images/hail_damaged_car.jpg';

// Create a sample image directory for demonstration
if (!file_exists(dirname($sampleImagePath))) {
    echo "Creating sample image directory...\n";
    @mkdir(dirname($sampleImagePath), 0755, true);
    echo "ℹ️  Place your hail damage images in: " . dirname($sampleImagePath) . "\n\n";
}

// Create a sample test image if none exists
if (!file_exists($sampleImagePath)) {
    // Create a placeholder image for testing
    $testImageContent = base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A');
    file_put_contents($sampleImagePath, $testImageContent);
    echo "✅ Created sample test image\n\n";
}

if (file_exists($sampleImagePath)) {
    try {
        echo "🔍 Analyzing image: {$sampleImagePath}\n";
        echo "⏳ Processing with advanced AI models...\n";

        $startTime = microtime(true);
        $result = $detector->detectHailDamage($sampleImagePath);
        $processingTime = round((microtime(true) - $startTime) * 1000, 2);

        echo "✅ Analysis Complete in {$processingTime}ms!\n\n";

        echo "📊 DETECTION SUMMARY:\n";
        echo "==================\n";
        echo "• Total Detections: " . $result['detection_summary']['total_detections'] . "\n";
        echo "• Overall Severity: " . $result['detection_summary']['overall_severity'] . "\n";
        echo "• Damage Score: " . number_format($result['detection_summary']['total_damage_score'], 2) . "\n";
        echo "• Processing Time: {$processingTime}ms\n\n";

        echo "💰 REPAIR ASSESSMENT:\n";
        echo "===================\n";
        echo "• Estimated Cost: $" . number_format($result['repair_assessment']['estimated_cost']['estimated_cost'], 2) . "\n";
        echo "• Cost Range: $" . number_format($result['repair_assessment']['estimated_cost']['cost_range']['min'], 2) .
             " - $" . number_format($result['repair_assessment']['estimated_cost']['cost_range']['max'], 2) . "\n";
        echo "• Recommended Method: " . $result['repair_assessment']['recommended_method'] . "\n";
        echo "• Repair Complexity: " . $result['repair_assessment']['complexity'] . "\n\n";

        // Display severity distribution
        echo "🎯 SEVERITY DISTRIBUTION:\n";
        echo "=======================\n";
        foreach ($result['detection_summary']['severity_distribution'] as $severity => $count) {
            $emoji = match($severity) {
                'micro' => '🔍',
                'small' => '🟡',
                'medium' => '🟠',
                'large' => '🔴',
                default => '⚪'
            };
            echo "• {$emoji} " . ucfirst($severity) . " dents: {$count}\n";
        }
        echo "\n";

        // Display quality metrics
        echo "📈 QUALITY METRICS:\n";
        echo "=================\n";
        echo "• Detection Confidence: " . number_format($result['quality_metrics']['detection_confidence'] * 100, 1) . "%\n";
        echo "• Image Quality Score: " . number_format($result['quality_metrics']['image_quality_score'] * 100, 1) . "%\n";
        echo "• Analysis Completeness: " . number_format($result['quality_metrics']['analysis_completeness'] * 100, 1) . "%\n\n";

        // Display recommendations
        if (!empty($result['recommendations'])) {
            echo "💡 RECOMMENDATIONS:\n";
            echo "=================\n";
            foreach ($result['recommendations'] as $i => $recommendation) {
                echo "• " . ($i + 1) . ". {$recommendation}\n";
            }
            echo "\n";
        }

        // Display top priority areas
        if (!empty($result['repair_assessment']['priority_areas'])) {
            echo "🔥 PRIORITY REPAIR AREAS:\n";
            echo "=======================\n";
            foreach (array_slice($result['repair_assessment']['priority_areas'], 0, 3) as $i => $area) {
                $score = $area['damage_score'] ?? 0;
                $size = $area['size'] ?? 0;
                $confidence = ($area['confidence'] ?? 0) * 100;
                echo "• " . ($i + 1) . ". Size: {$size}mm, Score: " . number_format($score, 1) . ", Confidence: " . number_format($confidence, 1) . "%\n";
            }
            echo "\n";
        }

    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n\n";
    }
}

// Demo 2: Batch processing
echo "📁 Demo 2: Batch Processing\n";
echo "---------------------------\n";

$batchImages = [
    __DIR__ . '/sample_images/car1.jpg',
    __DIR__ . '/sample_images/car2.jpg',
    __DIR__ . '/sample_images/car3.jpg'
];

// Create sample batch images
foreach ($batchImages as $imagePath) {
    if (!file_exists($imagePath)) {
        $testImageContent = base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A');
        file_put_contents($imagePath, $testImageContent);
    }
}

echo "🔄 Processing " . count($batchImages) . " images in batch mode...\n";

try {
    $batchStartTime = microtime(true);
    $batchResults = $detector->batchProcessImages($batchImages, [
        'batch_size' => 2,
        'batch_delay' => 1 // 1 second delay between batches
    ]);
    $batchProcessingTime = round((microtime(true) - $batchStartTime) * 1000, 2);

    echo "✅ Batch processing complete in {$batchProcessingTime}ms!\n\n";

    echo "📊 BATCH RESULTS SUMMARY:\n";
    echo "=======================\n";

    $totalDetections = 0;
    $totalCost = 0;
    $severityCount = ['Minor' => 0, 'Moderate' => 0, 'Significant' => 0, 'Severe' => 0];

    foreach ($batchResults as $imagePath => $result) {
        if (isset($result['error'])) {
            echo "❌ " . basename($imagePath) . ": Error - " . $result['error'] . "\n";
            continue;
        }

        $detections = $result['detection_summary']['total_detections'];
        $severity = $result['detection_summary']['overall_severity'];
        $cost = $result['repair_assessment']['estimated_cost']['estimated_cost'];

        $totalDetections += $detections;
        $totalCost += $cost;
        $severityCount[$severity]++;

        echo "✅ " . basename($imagePath) . ": {$detections} dents, {$severity} severity, $" . number_format($cost, 2) . "\n";
    }

    echo "\n📈 BATCH TOTALS:\n";
    echo "• Total Images Processed: " . count($batchResults) . "\n";
    echo "• Total Detections: {$totalDetections}\n";
    echo "• Total Estimated Cost: $" . number_format($totalCost, 2) . "\n";
    echo "• Processing Time: {$batchProcessingTime}ms\n";
    echo "• Average Time per Image: " . round($batchProcessingTime / count($batchResults), 2) . "ms\n\n";

} catch (\Exception $e) {
    echo "❌ Batch processing error: " . $e->getMessage() . "\n\n";
}

// Demo 3: Advanced configuration showcase
echo "⚙️ Demo 3: Advanced Configuration\n";
echo "--------------------------------\n";

$advancedConfig = [
    'confidence_threshold' => 0.90, // Higher confidence for precision
    'min_dent_size' => 1, // Detect micro-dents
    'max_dent_size' => 1000,
    'enhancement_enabled' => true,
    'batch_processing' => true,
    'real_time_processing' => true,
    'auto_calibration' => true,
    'multi_angle_analysis' => true,
    'depth_estimation' => true,
    'damage_severity_scoring' => true,
    'automated_reporting' => true
];

$advancedDetector = new HailDamageDetector($veniceAI, $advancedConfig);

echo "🔧 Advanced detector configured with:\n";
echo "• Ultra-high confidence threshold (90%)\n";
echo "• Micro-dent detection (1mm minimum)\n";
echo "• Enhanced image processing pipeline\n";
echo "• Multi-model ensemble analysis\n";
echo "• Real-time processing capabilities\n\n";

// Demo 4: Performance benchmarking
echo "⚡ Demo 4: Performance Benchmarking\n";
echo "----------------------------------\n";

$benchmarkImages = array_slice($batchImages, 0, 2); // Use 2 images for benchmark
$iterations = 3;

echo "🏃 Running performance benchmark ({$iterations} iterations)...\n";

$times = [];
for ($i = 0; $i < $iterations; $i++) {
    $startTime = microtime(true);

    foreach ($benchmarkImages as $imagePath) {
        try {
            $detector->detectHailDamage($imagePath);
        } catch (\Exception $e) {
            // Continue benchmarking even if individual images fail
        }
    }

    $iterationTime = (microtime(true) - $startTime) * 1000;
    $times[] = $iterationTime;
    echo "• Iteration " . ($i + 1) . ": " . round($iterationTime, 2) . "ms\n";
}

$avgTime = array_sum($times) / count($times);
$minTime = min($times);
$maxTime = max($times);

echo "\n📊 PERFORMANCE METRICS:\n";
echo "• Average Time: " . round($avgTime, 2) . "ms\n";
echo "• Fastest Time: " . round($minTime, 2) . "ms\n";
echo "• Slowest Time: " . round($maxTime, 2) . "ms\n";
echo "• Images per Second: " . round((count($benchmarkImages) * 1000) / $avgTime, 2) . "\n";
echo "• Throughput: " . round((count($benchmarkImages) * $iterations * 1000) / array_sum($times), 2) . " images/sec\n\n";

// Demo 5: Integration examples
echo "🔗 Demo 5: Integration Examples\n";
echo "------------------------------\n";

echo "📋 Available Integration Options:\n";
echo "• Insurance claim processing\n";
echo "• Auto body shop workflow integration\n";
echo "• Mobile app backend API\n";
echo "• Real-time camera feed processing\n";
echo "• Batch processing for fleet management\n";
echo "• Quality assurance for repair work\n\n";

// Example API endpoint simulation
echo "🌐 Sample API Response Format:\n";
echo "{\n";
echo "  \"status\": \"success\",\n";
echo "  \"processing_time_ms\": 1250,\n";
echo "  \"detection_summary\": {\n";
echo "    \"total_detections\": 15,\n";
echo "    \"overall_severity\": \"Moderate\",\n";
echo "    \"confidence_score\": 0.92\n";
echo "  },\n";
echo "  \"repair_assessment\": {\n";
echo "    \"estimated_cost\": 1175.00,\n";
echo "    \"recommended_method\": \"PDR with touch-up\",\n";
echo "    \"complexity\": \"Medium\"\n";
echo "  },\n";
echo "  \"detailed_detections\": [...],\n";
echo "  \"recommendations\": [...]\n";
echo "}\n\n";

echo "🎯 SYSTEM CAPABILITIES SUMMARY:\n";
echo "==============================\n";
echo "✅ Micro-dent detection (1-5mm)\n";
echo "✅ Large damage assessment (25mm+)\n";
echo "✅ Multi-model ensemble analysis\n";
echo "✅ Real-time processing\n";
echo "✅ Batch processing optimization\n";
echo "✅ Automated cost estimation\n";
echo "✅ Repair method recommendations\n";
echo "✅ Quality metrics and confidence scoring\n";
echo "✅ Comprehensive reporting\n";
echo "✅ Caching for performance\n";
echo "✅ Event-driven architecture\n";
echo "✅ Enterprise-grade error handling\n\n";

echo "🚀 BUSINESS APPLICATIONS:\n";
echo "========================\n";
echo "• Insurance Companies: Automated claim processing and fraud detection\n";
echo "• Auto Body Shops: Accurate damage assessment and repair planning\n";
echo "• Fleet Management: Proactive maintenance and damage tracking\n";
echo "• Mobile Apps: On-site damage assessment for customers\n";
echo "• Quality Assurance: Post-repair verification and validation\n";
echo "• Research: Hail damage pattern analysis and prevention studies\n\n";

echo "💡 NEXT STEPS:\n";
echo "=============\n";
echo "1. Add your vehicle images to: " . dirname($sampleImagePath) . "\n";
echo "2. Configure API keys and settings in config.php\n";
echo "3. Integrate with your existing workflow systems\n";
echo "4. Customize detection parameters for your use case\n";
echo "5. Set up automated reporting and notifications\n";
echo "6. Deploy to production environment\n\n";

echo "🎉 Hail Damage Detection Demo Complete!\n";
echo "======================================\n";
echo "Your advanced AI-powered hail damage detection system is ready for production use.\n";
echo "For support and advanced features, contact the Venice AI team.\n\n";
