<?php

namespace Venice\Exceptions;

/**
 * Exception thrown when request validation fails
 */
class ValidationException extends VeniceException {
    /** @var array Validation errors */
    private array $errors = [];

    public function __construct(
        string $message = "Validation failed",
        int $code = 400,
        ?\Throwable $previous = null,
        array $context = [],
        ?string $requestId = null,
        array $errors = []
    ) {
        parent::__construct($message, $code, $previous, $context, $requestId);
        $this->errors = $errors;
    }

    /**
     * Get validation errors
     *
     * @return array
     */
    public function getErrors(): array {
        return $this->errors;
    }

    /**
     * Set validation errors
     *
     * @param array $errors
     * @return self
     */
    public function setErrors(array $errors): self {
        $this->errors = $errors;
        return $this;
    }

    /**
     * Add validation error
     *
     * @param string $field
     * @param string $message
     * @return self
     */
    public function addError(string $field, string $message): self {
        $this->errors[$field] = $message;
        return $this;
    }

    /**
     * Check if field has error
     *
     * @param string $field
     * @return bool
     */
    public function hasError(string $field): bool {
        return isset($this->errors[$field]);
    }

    /**
     * Get error for specific field
     *
     * @param string $field
     * @return string|null
     */
    public function getError(string $field): ?string {
        return $this->errors[$field] ?? null;
    }
}
