<?php

namespace Venice\Models;

use Venice\VeniceAI;

/**
 * Service for interacting with Venice AI's model endpoints
 */
class ModelService {
    /** @var VeniceAI Main client instance */
    private VeniceAI $client;

    /**
     * Constructor
     *
     * @param VeniceAI $client Main client instance
     */
    public function __construct(VeniceAI $client) {
        $this->client = $client;
    }

    /**
     * List available models
     * 
     * @param string|null $type Optional filter for model type ('text' or 'image')
     * @return array List of available models
     * @throws \InvalidArgumentException If type is invalid
     * @throws \Exception If the request fails
     */
    public function list(?string $type = null): array {
        $endpoint = '/models';
        if ($type !== null) {
            if (!in_array($type, ['text', 'image'])) {
                throw new \InvalidArgumentException("Type must be either 'text' or 'image'");
            }
            $endpoint .= '?type=' . urlencode($type);
        }
        return $this->client->request('GET', $endpoint);
    }

    /**
     * List available text models
     * 
     * @return array List of available text models
     * @throws \Exception If the request fails
     */
    public function listTextModels(): array {
        return $this->list('text');
    }

    /**
     * List available image models
     *
     * @return array List of available image models
     * @throws \Exception If the request fails
     */
    public function listImageModels(): array {
        return $this->list('image');
    }
    
    /**
     * List available model traits
     *
     * @return array List of available model traits
     * @throws \Exception If the request fails
     */
    public function listTraits(): array {
        return $this->client->request('GET', '/models/traits');
    }
}