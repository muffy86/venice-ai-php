<?php

namespace Venice\Audio;

use Venice\VeniceAI;
use Venice\Utils\Validator;
use Venice\Exceptions\ValidationException;
use Venice\Exceptions\VeniceException;

/**
 * Service for interacting with Venice AI's audio endpoints
 *
 * Provides comprehensive audio processing capabilities including:
 * - Speech-to-text transcription
 * - Text-to-speech generation
 * - Audio analysis and enhancement
 * - Real-time audio streaming
 * - Multi-language support
 */
class AudioService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /** @var array Supported audio formats */
    private const SUPPORTED_FORMATS = [
        'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'flac', 'ogg'
    ];

    /** @var array Supported languages for transcription */
    private const SUPPORTED_LANGUAGES = [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
    ];

    /** @var array Available voice models */
    private const VOICE_MODELS = [
        'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
    ];

    /** @var array Audio quality settings */
    private const QUALITY_SETTINGS = [
        'standard' => ['bitrate' => 128, 'sample_rate' => 44100],
        'high' => ['bitrate' => 256, 'sample_rate' => 48000],
        'premium' => ['bitrate' => 320, 'sample_rate' => 96000]
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
     * Transcribe audio to text
     *
     * @param array $options Transcription options
     * @return array The transcription response
     * @throws ValidationException If parameters are invalid
     * @throws VeniceException If the request fails
     */
    public function transcribe(array $options): array {
        // Validate required parameters
        if (empty($options['file'])) {
            throw new ValidationException('file is required for transcription');
        }

        // Validate file exists and format
        $filePath = $options['file'];
        if (!file_exists($filePath)) {
            throw new ValidationException("Audio file not found: {$filePath}");
        }

        $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($fileExtension, self::SUPPORTED_FORMATS)) {
            throw new ValidationException(
                "Unsupported audio format: {$fileExtension}. Supported formats: " .
                implode(', ', self::SUPPORTED_FORMATS)
            );
        }

        // Validate file size (25MB limit)
        $fileSize = filesize($filePath);
        if ($fileSize > 25 * 1024 * 1024) {
            throw new ValidationException('Audio file size must not exceed 25MB');
        }

        // Validate language if provided
        if (isset($options['language']) && !in_array($options['language'], self::SUPPORTED_LANGUAGES)) {
            throw new ValidationException(
                "Unsupported language: {$options['language']}. Supported languages: " .
                implode(', ', self::SUPPORTED_LANGUAGES)
            );
        }

        $this->client->getLogger()->info('Starting audio transcription', [
            'file' => basename($filePath),
            'size' => $fileSize,
            'format' => $fileExtension
        ]);

        // Build request data
        $data = [
            'file' => $filePath,
            'model' => $options['model'] ?? 'whisper-1'
        ];

        // Add optional parameters
        $optionalParams = [
            'language', 'prompt', 'response_format', 'temperature'
        ];

        foreach ($optionalParams as $param) {
            if (isset($options[$param])) {
                $data[$param] = $options[$param];
            }
        }

        // Enhanced options
        if (isset($options['timestamp_granularities'])) {
            $data['timestamp_granularities'] = $options['timestamp_granularities'];
        }

        if (isset($options['word_timestamps']) && $options['word_timestamps']) {
            $data['timestamp_granularities'] = ['word'];
        }

        // Make the request
        $response = $this->client->request('POST', '/audio/transcriptions', $data);

        $this->client->getLogger()->info('Audio transcription completed', [
            'duration' => $response['duration'] ?? 'unknown',
            'text_length' => strlen($response['text'] ?? '')
        ]);

        return $response;
    }

    /**
     * Generate speech from text
     *
     * @param array $options Speech generation options
     * @return array The audio generation response
     * @throws ValidationException If parameters are invalid
     * @throws VeniceException If the request fails
     */
    public function generateSpeech(array $options): array {
        // Validate required parameters
        if (empty($options['input'])) {
            throw new ValidationException('input text is required for speech generation');
        }

        if (strlen($options['input']) > 4096) {
            throw new ValidationException('Input text must not exceed 4096 characters');
        }

        // Validate voice
        $voice = $options['voice'] ?? 'alloy';
        if (!in_array($voice, self::VOICE_MODELS)) {
            throw new ValidationException(
                "Invalid voice: {$voice}. Available voices: " .
                implode(', ', self::VOICE_MODELS)
            );
        }

        $this->client->getLogger()->info('Generating speech', [
            'voice' => $voice,
            'text_length' => strlen($options['input']),
            'format' => $options['response_format'] ?? 'mp3'
        ]);

        // Build request data
        $data = [
            'model' => $options['model'] ?? 'tts-1',
            'input' => $options['input'],
            'voice' => $voice
        ];

        // Add optional parameters
        if (isset($options['response_format'])) {
            $data['response_format'] = $options['response_format'];
        }

        if (isset($options['speed'])) {
            $speed = (float)$options['speed'];
            if ($speed < 0.25 || $speed > 4.0) {
                throw new ValidationException('Speed must be between 0.25 and 4.0');
            }
            $data['speed'] = $speed;
        }

        // Enhanced options for quality
        if (isset($options['quality'])) {
            $quality = $options['quality'];
            if (isset(self::QUALITY_SETTINGS[$quality])) {
                $data['quality_settings'] = self::QUALITY_SETTINGS[$quality];
            }
        }

        // Set headers for binary response
        $headers = [
            'Accept' => 'audio/*'
        ];

        // Make the request
        $response = $this->client->request('POST', '/audio/speech', $data, $headers);

        // Handle binary audio response
        if (is_string($response)) {
            $outputPath = $options['output_path'] ?? null;
            if ($outputPath) {
                file_put_contents($outputPath, $response);
                $this->client->getLogger()->info('Speech saved to file', ['path' => $outputPath]);
            }

            return [
                'audio_data' => base64_encode($response),
                'format' => $options['response_format'] ?? 'mp3',
                'size' => strlen($response),
                'saved_to' => $outputPath
            ];
        }

        return $response;
    }

    /**
     * Translate audio to English text
     *
     * @param array $options Translation options
     * @return array The translation response
     * @throws ValidationException If parameters are invalid
     * @throws VeniceException If the request fails
     */
    public function translate(array $options): array {
        // Validate required parameters
        if (empty($options['file'])) {
            throw new ValidationException('file is required for translation');
        }

        // Validate file exists and format
        $filePath = $options['file'];
        if (!file_exists($filePath)) {
            throw new ValidationException("Audio file not found: {$filePath}");
        }

        $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($fileExtension, self::SUPPORTED_FORMATS)) {
            throw new ValidationException(
                "Unsupported audio format: {$fileExtension}. Supported formats: " .
                implode(', ', self::SUPPORTED_FORMATS)
            );
        }

        $this->client->getLogger()->info('Starting audio translation', [
            'file' => basename($filePath),
            'format' => $fileExtension
        ]);

        // Build request data
        $data = [
            'file' => $filePath,
            'model' => $options['model'] ?? 'whisper-1'
        ];

        // Add optional parameters
        $optionalParams = ['prompt', 'response_format', 'temperature'];
        foreach ($optionalParams as $param) {
            if (isset($options[$param])) {
                $data[$param] = $options[$param];
            }
        }

        // Make the request
        $response = $this->client->request('POST', '/audio/translations', $data);

        $this->client->getLogger()->info('Audio translation completed', [
            'text_length' => strlen($response['text'] ?? '')
        ]);

        return $response;
    }

    /**
     * Analyze audio content
     *
     * @param array $options Analysis options
     * @return array The analysis response
     * @throws ValidationException If parameters are invalid
     * @throws VeniceException If the request fails
     */
    public function analyze(array $options): array {
        if (empty($options['file'])) {
            throw new ValidationException('file is required for audio analysis');
        }

        $filePath = $options['file'];
        if (!file_exists($filePath)) {
            throw new ValidationException("Audio file not found: {$filePath}");
        }

        $this->client->getLogger()->info('Starting audio analysis', [
            'file' => basename($filePath)
        ]);

        $data = [
            'file' => $filePath,
            'analysis_type' => $options['analysis_type'] ?? 'comprehensive'
        ];

        // Add analysis options
        if (isset($options['detect_emotions'])) {
            $data['detect_emotions'] = (bool)$options['detect_emotions'];
        }

        if (isset($options['detect_speakers'])) {
            $data['detect_speakers'] = (bool)$options['detect_speakers'];
        }

        if (isset($options['extract_keywords'])) {
            $data['extract_keywords'] = (bool)$options['extract_keywords'];
        }

        return $this->client->request('POST', '/audio/analyze', $data);
    }

    /**
     * Stream audio processing
     *
     * @param array $options Streaming options
     * @return \Generator Generator yielding streaming response chunks
     * @throws ValidationException If parameters are invalid
     */
    public function streamProcess(array $options): \Generator {
        if (empty($options['audio_stream'])) {
            throw new ValidationException('audio_stream is required for streaming');
        }

        $data = [
            'model' => $options['model'] ?? 'whisper-1',
            'stream' => true,
            'format' => $options['format'] ?? 'pcm'
        ];

        $response = $this->client->request('POST', '/audio/stream', $data);

        // Parse streaming response
        $lines = explode("\n", $response);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || !str_starts_with($line, 'data: ')) {
                continue;
            }

            $data = substr($line, 6);
            if ($data === '[DONE]') {
                break;
            }

            $chunk = json_decode($data, true);
            if ($chunk !== null) {
                yield $chunk;
            }
        }
    }

    /**
     * Get supported audio formats
     *
     * @return array Supported audio formats
     */
    public function getSupportedFormats(): array {
        return self::SUPPORTED_FORMATS;
    }

    /**
     * Get supported languages
     *
     * @return array Supported languages
     */
    public function getSupportedLanguages(): array {
        return self::SUPPORTED_LANGUAGES;
    }

    /**
     * Get available voice models
     *
     * @return array Available voice models
     */
    public function getVoiceModels(): array {
        return self::VOICE_MODELS;
    }

    /**
     * Get quality settings
     *
     * @return array Quality settings
     */
    public function getQualitySettings(): array {
        return self::QUALITY_SETTINGS;
    }

    /**
     * Validate audio file
     *
     * @param string $filePath
     * @return array Validation result
     */
    public function validateAudioFile(string $filePath): array {
        $result = [
            'valid' => false,
            'errors' => [],
            'info' => []
        ];

        if (!file_exists($filePath)) {
            $result['errors'][] = 'File does not exist';
            return $result;
        }

        $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($fileExtension, self::SUPPORTED_FORMATS)) {
            $result['errors'][] = "Unsupported format: {$fileExtension}";
        }

        $fileSize = filesize($filePath);
        if ($fileSize > 25 * 1024 * 1024) {
            $result['errors'][] = 'File size exceeds 25MB limit';
        }

        $result['info'] = [
            'format' => $fileExtension,
            'size' => $fileSize,
            'size_mb' => round($fileSize / (1024 * 1024), 2)
        ];

        $result['valid'] = empty($result['errors']);
        return $result;
    }
}
