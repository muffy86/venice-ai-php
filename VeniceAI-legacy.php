<?php

/**
 * Backward compatibility layer for the Venice AI PHP SDK
 * 
 * This file provides backward compatibility with the older single-file SDK.
 * Use this if you have existing code that depends on the original structure.
 * 
 * For new projects, consider using the modern structure directly:
 * use Venice\VeniceAI;
 */

// Load required files
require_once __DIR__ . '/src/VeniceAI.php';
require_once __DIR__ . '/src/Http/HttpClient.php';
require_once __DIR__ . '/src/Chat/ChatService.php';
require_once __DIR__ . '/src/Image/ImageService.php';
require_once __DIR__ . '/src/Models/ModelService.php';

/**
 * Legacy VeniceAI client for backward compatibility
 */
class VeniceAI_Legacy {
    /** @var \Venice\VeniceAI Main client instance */
    private \Venice\VeniceAI $client;
    
    /** @var array Valid image sizes with descriptive keys */
    private const VALID_SIZES = [
        'square' => [1024, 1024],
        'portrait' => [1024, 1280],
        'landscape' => [1280, 1024]
    ];
    
    /** @var array Valid style presets */
    private const VALID_STYLES = [
        // Artistic
        "3D Model", "Analog Film", "Anime", "Comic Book", "Digital Art",
        "Enhance", "Fantasy Art", "Isometric Style", "Line Art", "Lowpoly",
        "Neon Punk", "Origami", "Pixel Art", "Texture",
        // Commercial
        "Advertising", "Food Photography", "Real Estate",
        // Fine Art
        "Abstract", "Cubist", "Graffiti", "Hyperrealism", "Impressionist",
        "Pointillism", "Pop Art", "Psychedelic", "Renaissance", "Steampunk",
        "Surrealist", "Typography", "Watercolor",
        // Gaming
        "Fighting Game", "GTA", "Super Mario", "Minecraft", "Pokemon",
        "Retro Arcade", "Retro Game", "RPG Fantasy Game", "Strategy Game",
        "Street Fighter", "Legend of Zelda",
        // Aesthetic
        "Architectural", "Disco", "Dreamscape", "Dystopian", "Fairy Tale",
        "Gothic", "Grunge", "Horror", "Minimalist", "Monochrome", "Nautical",
        "Space", "Stained Glass", "Techwear Fashion", "Tribal", "Zentangle",
        // Paper Art
        "Collage", "Flat Papercut", "Kirigami", "Paper Mache", "Paper Quilling",
        "Papercut Collage", "Papercut Shadow Box", "Stacked Papercut",
        "Thick Layered Papercut",
        // Photography
        "Alien", "Film Noir", "HDR", "Long Exposure", "Neon Noir",
        "Silhouette", "Tilt-Shift"
    ];
    
    /**
     * Constructor
     *
     * @param bool $debug Enable debug mode
     */
    public function __construct(bool $debug = null) {
        $this->client = new \Venice\VeniceAI(null, $debug);
    }
    
    /**
     * List available models
     *
     * @param string|null $type Optional filter for model type ('text' or 'image')
     * @return array List of available models
     */
    public function listModels(?string $type = null): array {
        return $this->client->models()->list($type);
    }
    
    /**
     * List available text models
     *
     * @return array List of available text models
     */
    public function listTextModels(): array {
        return $this->client->models()->listTextModels();
    }
    
    /**
     * List available image models
     *
     * @return array List of available image models
     */
    public function listImageModels(): array {
        return $this->client->models()->listImageModels();
    }
    
    /**
     * List available model traits
     *
     * @return array List of available model traits
     */
    public function listModelTraits(): array {
        return $this->client->models()->listTraits();
    }
    
    /**
     * Create a chat completion
     *
     * @param array $messages Array of message objects
     * @param string $model Model to use
     * @param array $options Additional options
     * @return array|string The API response
     */
    public function createChatCompletion(array $messages, string $model = 'default', array $options = []): array|string {
        return $this->client->chat()->createCompletion($messages, $model, $options);
    }
    
    /**
     * Generate an image
     *
     * @param array $options Image generation options
     * @return array The API response
     */
    public function generateImage(array $options): array {
        return $this->client->image()->generate($options);
    }
    
    /**
     * Upscale an image
     *
     * @param array $options Image upscaling options
     * @return array The API response
     */
    public function upscaleImage(array $options): array {
        return $this->client->image()->upscale($options);
    }
    
    /**
     * List available image style presets
     *
     * @return array List of available image style presets
     */
    public function listImageStyles(): array {
        return $this->client->image()->listStyles();
    }
    
    /**
     * Validate the API key
     *
     * @return bool True if the API key is valid
     */
    public function validateApiKey(): bool {
        return $this->client->validateApiKey();
    }
}

// For easy drop-in replacement, make the legacy class available as just "VeniceAI"
class_alias('VeniceAI_Legacy', 'VeniceAI');