<?php

namespace Venice\Exceptions;

/**
 * Base exception class for Venice AI SDK
 */
class VeniceException extends \Exception {
    /** @var array Additional context data */
    protected array $context = [];

    /** @var string|null Request ID for tracking */
    protected ?string $requestId = null;

    /**
     * Constructor
     *
     * @param string $message Exception message
     * @param int $code Exception code
     * @param \Throwable|null $previous Previous exception
     * @param array $context Additional context data
     * @param string|null $requestId Request ID for tracking
     */
    public function __construct(
        string $message = "",
        int $code = 0,
        ?\Throwable $previous = null,
        array $context = [],
        ?string $requestId = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
        $this->requestId = $requestId;
    }

    /**
     * Get additional context data
     *
     * @return array
     */
    public function getContext(): array {
        return $this->context;
    }

    /**
     * Get request ID
     *
     * @return string|null
     */
    public function getRequestId(): ?string {
        return $this->requestId;
    }

    /**
     * Set request ID
     *
     * @param string $requestId
     * @return self
     */
    public function setRequestId(string $requestId): self {
        $this->requestId = $requestId;
        return $this;
    }

    /**
     * Add context data
     *
     * @param array $context
     * @return self
     */
    public function addContext(array $context): self {
        $this->context = array_merge($this->context, $context);
        return $this;
    }

    /**
     * Get formatted error message with context
     *
     * @return string
     */
    public function getFormattedMessage(): string {
        $message = $this->getMessage();

        if ($this->requestId) {
            $message = "[Request: {$this->requestId}] $message";
        }

        if (!empty($this->context)) {
            $contextStr = json_encode($this->context, JSON_PRETTY_PRINT);
            $message .= "\nContext: $contextStr";
        }

        return $message;
    }
}
