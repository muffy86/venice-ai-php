<?php

namespace Venice\Exceptions;

/**
 * Exception thrown when authentication fails (invalid API key, expired token, etc.)
 */
class AuthenticationException extends VeniceException {
    public function __construct(
        string $message = "Authentication failed",
        int $code = 401,
        ?\Throwable $previous = null,
        array $context = [],
        ?string $requestId = null
    ) {
        parent::__construct($message, $code, $previous, $context, $requestId);
    }
}
