<?php

namespace Venice\Config\Sources;

use Venice\Config\ConfigSourceInterface;
use Venice\Exceptions\VeniceException;

/**
 * File-based Configuration Source
 *
 * Handles configuration stored in files (PHP, JSON, YAML, INI)
 */
class FileConfigSource implements ConfigSourceInterface {
    /** @var string Configuration directory */
    private string $configDir;

    /** @var array Supported file extensions */
    private array $supportedExtensions = ['php', 'json', 'yaml', 'yml', 'ini'];

    /** @var array Loaded files cache */
    private array $loadedFiles = [];

    /**
     * Constructor
     */
    public function __construct(string $configDir) {
        $this->configDir = rtrim($configDir, '/');

        if (!is_dir($this->configDir)) {
            throw new VeniceException("Configuration directory does not exist: {$this->configDir}");
        }
    }

    /**
     * Load configuration data from files
     */
    public function load(): array {
        $config = [];

        foreach ($this->supportedExtensions as $extension) {
            $files = glob($this->configDir . "/*.{$extension}");

            foreach ($files as $file) {
                $fileConfig = $this->loadFile($file);
                $fileName = pathinfo($file, PATHINFO_FILENAME);

                if (is_array($fileConfig)) {
                    $config[$fileName] = $fileConfig;
                }
            }
        }

        return $config;
    }

    /**
     * Save configuration data to files
     */
    public function save(array $data): bool {
        foreach ($data as $fileName => $config) {
            $filePath = $this->configDir . '/' . $fileName . '.php';

            $content = "<?php\n\nreturn " . var_export($config, true) . ";\n";

            if (file_put_contents($filePath, $content) === false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if source is readable
     */
    public function isReadable(): bool {
        return is_readable($this->configDir);
    }

    /**
     * Check if source is writable
     */
    public function isWritable(): bool {
        return is_writable($this->configDir);
    }

    /**
     * Get source name
     */
    public function getName(): string {
        return 'file:' . $this->configDir;
    }

    /**
     * Get source metadata
     */
    public function getMetadata(): array {
        return [
            'type' => 'file',
            'directory' => $this->configDir,
            'supported_extensions' => $this->supportedExtensions,
            'loaded_files' => array_keys($this->loadedFiles)
        ];
    }

    /**
     * Load configuration from a single file
     */
    private function loadFile(string $filePath): array {
        if (isset($this->loadedFiles[$filePath])) {
            return $this->loadedFiles[$filePath];
        }

        if (!is_readable($filePath)) {
            throw new VeniceException("Configuration file is not readable: {$filePath}");
        }

        $extension = pathinfo($filePath, PATHINFO_EXTENSION);

        switch ($extension) {
            case 'php':
                $config = $this->loadPhpFile($filePath);
                break;

            case 'json':
                $config = $this->loadJsonFile($filePath);
                break;

            case 'yaml':
            case 'yml':
                $config = $this->loadYamlFile($filePath);
                break;

            case 'ini':
                $config = $this->loadIniFile($filePath);
                break;

            default:
                throw new VeniceException("Unsupported configuration file format: {$extension}");
        }

        $this->loadedFiles[$filePath] = $config;
        return $config;
    }

    /**
     * Load PHP configuration file
     */
    private function loadPhpFile(string $filePath): array {
        $config = include $filePath;

        if (!is_array($config)) {
            throw new VeniceException("PHP configuration file must return an array: {$filePath}");
        }

        return $config;
    }

    /**
     * Load JSON configuration file
     */
    private function loadJsonFile(string $filePath): array {
        $content = file_get_contents($filePath);
        $config = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new VeniceException("Invalid JSON in configuration file: {$filePath} - " . json_last_error_msg());
        }

        return $config ?: [];
    }

    /**
     * Load YAML configuration file
     */
    private function loadYamlFile(string $filePath): array {
        if (!function_exists('yaml_parse_file')) {
            throw new VeniceException("YAML extension is required to load YAML configuration files");
        }

        $config = yaml_parse_file($filePath);

        if ($config === false) {
            throw new VeniceException("Failed to parse YAML configuration file: {$filePath}");
        }

        return $config ?: [];
    }

    /**
     * Load INI configuration file
     */
    private function loadIniFile(string $filePath): array {
        $config = parse_ini_file($filePath, true);

        if ($config === false) {
            throw new VeniceException("Failed to parse INI configuration file: {$filePath}");
        }

        return $config;
    }
}
