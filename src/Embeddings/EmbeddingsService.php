<?php

namespace Venice\Embeddings;

use Venice\VeniceAI;
use Venice\Utils\Validator;
use Venice\Exceptions\ValidationException;
use Venice\Exceptions\VeniceException;

/**
 * Service for generating and managing text embeddings
 *
 * Provides advanced text processing capabilities including:
 * - Text embeddings generation
 * - Semantic similarity comparison
 * - Vector search
 * - Text clustering
 * - Dimensionality reduction
 * - Cross-lingual embeddings
 */
class EmbeddingsService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /** @var array Available embedding models */
    private const EMBEDDING_MODELS = [
        'text-embedding-3-small',
        'text-embedding-3-large',
        'text-embedding-ada-002'
    ];

    /** @var array Model dimensions */
    private const MODEL_DIMENSIONS = [
        'text-embedding-3-small' => 1536,
        'text-embedding-3-large' => 3072,
        'text-embedding-ada-002' => 1536
    ];

    /** @var array Supported distance metrics */
    private const DISTANCE_METRICS = [
        'cosine',
        'euclidean',
        'dot_product',
        'manhattan'
    ];

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;
    }

    /**
     * Create embeddings for input text
     *
     * @param array $options Embedding options
     * @return array The embedding response
     * @throws ValidationException If parameters are invalid
     * @throws VeniceException If the request fails
     */
    public function createEmbeddings(array $options): array {
        // Validate input
        if (empty($options['input'])) {
            throw new ValidationException('input is required for embedding generation');
        }

        // Handle both single string and array inputs
        $input = $options['input'];
        if (is_string($input)) {
            $input = [$input];
        }

        // Validate each input string
        foreach ($input as $text) {
            if (!is_string($text) || empty(trim($text))) {
                throw new ValidationException('Each input must be a non-empty string');
            }
            if (strlen($text) > 8192) {
                throw new ValidationException('Each input must not exceed 8192 characters');
            }
        }

        // Validate model
        $model = $options['model'] ?? 'text-embedding-3-small';
        if (!in_array($model, self::EMBEDDING_MODELS)) {
            throw new ValidationException(
                "Invalid model: {$model}. Available models: " .
                implode(', ', self::EMBEDDING_MODELS)
            );
        }

        $this->client->getLogger()->info('Generating embeddings', [
            'model' => $model,
            'input_count' => count($input)
        ]);

        // Build request data
        $data = [
            'model' => $model,
            'input' => $input
        ];

        // Add optional parameters
        if (isset($options['encoding_format'])) {
            $data['encoding_format'] = $options['encoding_format'];
        }

        if (isset($options['dimensions'])) {
            $dimensions = (int)$options['dimensions'];
            if ($dimensions <= 0 || $dimensions > self::MODEL_DIMENSIONS[$model]) {
                throw new ValidationException(
                    "Invalid dimensions: {$dimensions}. Must be between 1 and " .
                    self::MODEL_DIMENSIONS[$model]
                );
            }
            $data['dimensions'] = $dimensions;
        }

        // Make the request
        $response = $this->client->request('POST', '/embeddings', $data);

        $this->client->getLogger()->info('Embeddings generated', [
            'embedding_count' => count($response['data'] ?? [])
        ]);

        return $response;
    }

    /**
     * Alias for createEmbeddings() - provides OpenAI-compatible API
     *
     * @param array $params Embedding parameters
     * @return array The API response
     */
    public function create(array $params): array {
        return $this->createEmbeddings($params);
    }

    /**
     * Calculate similarity between embeddings
     *
     * @param array $embedding1 First embedding vector
     * @param array $embedding2 Second embedding vector
     * @param string $metric Distance metric to use
     * @return float Similarity score
     * @throws ValidationException If parameters are invalid
     */
    public function calculateSimilarity(
        array $embedding1,
        array $embedding2,
        string $metric = 'cosine'
    ): float {
        if (!in_array($metric, self::DISTANCE_METRICS)) {
            throw new ValidationException(
                "Invalid metric: {$metric}. Available metrics: " .
                implode(', ', self::DISTANCE_METRICS)
            );
        }

        if (count($embedding1) !== count($embedding2)) {
            throw new ValidationException(
                'Embeddings must have the same dimensions'
            );
        }

        switch ($metric) {
            case 'cosine':
                return $this->cosineSimilarity($embedding1, $embedding2);
            case 'euclidean':
                return $this->euclideanDistance($embedding1, $embedding2);
            case 'dot_product':
                return $this->dotProduct($embedding1, $embedding2);
            case 'manhattan':
                return $this->manhattanDistance($embedding1, $embedding2);
            default:
                throw new ValidationException("Unsupported metric: {$metric}");
        }
    }

    /**
     * Search for similar embeddings
     *
     * @param array $query Query embedding
     * @param array $embeddings Array of embeddings to search through
     * @param array $options Search options
     * @return array Search results
     * @throws ValidationException If parameters are invalid
     */
    public function searchSimilar(array $query, array $embeddings, array $options = []): array {
        if (empty($embeddings)) {
            throw new ValidationException('embeddings array cannot be empty');
        }

        $metric = $options['metric'] ?? 'cosine';
        $topK = $options['top_k'] ?? 5;
        $threshold = $options['threshold'] ?? 0.0;

        if ($topK <= 0 || $topK > count($embeddings)) {
            throw new ValidationException('top_k must be between 1 and embedding count');
        }

        $scores = [];
        foreach ($embeddings as $index => $embedding) {
            $similarity = $this->calculateSimilarity($query, $embedding, $metric);
            if ($similarity >= $threshold) {
                $scores[] = [
                    'index' => $index,
                    'score' => $similarity
                ];
            }
        }

        // Sort by similarity score
        usort($scores, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // Return top K results
        return array_slice($scores, 0, $topK);
    }

    /**
     * Batch process embeddings
     *
     * @param array $texts Array of texts to process
     * @param array $options Processing options
     * @return array Batch processing results
     * @throws ValidationException If parameters are invalid
     */
    public function batchProcess(array $texts, array $options = []): array {
        $batchSize = $options['batch_size'] ?? 100;
        $results = [];
        $batches = array_chunk($texts, $batchSize);

        foreach ($batches as $index => $batch) {
            $this->client->getLogger()->info('Processing batch', [
                'batch' => $index + 1,
                'size' => count($batch)
            ]);

            $batchResults = $this->createEmbeddings([
                'input' => $batch,
                'model' => $options['model'] ?? 'text-embedding-3-small'
            ]);

            $results = array_merge($results, $batchResults['data'] ?? []);
        }

        return ['data' => $results];
    }

    /**
     * Get model information
     *
     * @param string $model Model name
     * @return array Model information
     * @throws ValidationException If model is invalid
     */
    public function getModelInfo(string $model): array {
        if (!in_array($model, self::EMBEDDING_MODELS)) {
            throw new ValidationException(
                "Invalid model: {$model}. Available models: " .
                implode(', ', self::EMBEDDING_MODELS)
            );
        }

        return [
            'name' => $model,
            'dimensions' => self::MODEL_DIMENSIONS[$model],
            'max_input_length' => 8192,
            'encoding_format' => 'float'
        ];
    }

    /**
     * Calculate cosine similarity between two vectors
     *
     * @param array $a First vector
     * @param array $b Second vector
     * @return float Cosine similarity
     */
    private function cosineSimilarity(array $a, array $b): float {
        $dotProduct = $this->dotProduct($a, $b);
        $normA = sqrt($this->dotProduct($a, $a));
        $normB = sqrt($this->dotProduct($b, $b));

        if ($normA == 0 || $normB == 0) {
            return 0.0;
        }

        return $dotProduct / ($normA * $normB);
    }

    /**
     * Calculate Euclidean distance between two vectors
     *
     * @param array $a First vector
     * @param array $b Second vector
     * @return float Euclidean distance
     */
    private function euclideanDistance(array $a, array $b): float {
        $sum = 0;
        foreach ($a as $i => $val) {
            $diff = $val - $b[$i];
            $sum += $diff * $diff;
        }
        return sqrt($sum);
    }

    /**
     * Calculate dot product between two vectors
     *
     * @param array $a First vector
     * @param array $b Second vector
     * @return float Dot product
     */
    private function dotProduct(array $a, array $b): float {
        return array_sum(array_map(function($x, $y) {
            return $x * $y;
        }, $a, $b));
    }

    /**
     * Calculate Manhattan distance between two vectors
     *
     * @param array $a First vector
     * @param array $b Second vector
     * @return float Manhattan distance
     */
    private function manhattanDistance(array $a, array $b): float {
        return array_sum(array_map(function($x, $y) {
            return abs($x - $y);
        }, $a, $b));
    }
}
