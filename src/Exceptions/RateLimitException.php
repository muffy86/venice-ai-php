<?php

namespace Venice\Exceptions;

/**
 * Exception thrown when rate limit is exceeded
 */
class RateLimitException extends VeniceException {
    /** @var int|null Retry after seconds */
    private ?int $retryAfter = null;

    public function __construct(
        string $message = "Rate limit exceeded",
        int $code = 429,
        ?\Throwable $previous = null,
        array $context = [],
        ?string $requestId = null,
        ?int $retryAfter = null
    ) {
        parent::__construct($message, $code, $previous, $context, $requestId);
        $this->retryAfter = $retryAfter;
    }

    /**
     * Get retry after seconds
     *
     * @return int|null
     */
    public function getRetryAfter(): ?int {
        return $this->retryAfter;
    }

    /**
     * Set retry after seconds
     *
     * @param int $retryAfter
     * @return self
     */
    public function setRetryAfter(int $retryAfter): self {
        $this->retryAfter = $retryAfter;
        return $this;
    }
}
