# Contributing to Venice AI PHP SDK

We welcome contributions to the Venice AI PHP SDK! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

1. Install PHP 8.1 or higher
2. Install Composer dependencies:
   `ash
   composer install
   `
3. Copy the example configuration:
   `ash
   cp config/config.example.php config/config.php
   `
4. Add your Venice AI API key to the configuration

## Code Standards

- Follow PSR-12 coding standards
- Use meaningful variable and function names
- Add appropriate documentation and comments
- Include unit tests for new functionality

## Testing

Run the test suite before submitting your changes:

`ash
composer test
`

Run code quality checks:

`ash
composer check
`

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation as needed
3. Add or update tests for your changes
4. Ensure all tests pass
5. Submit a pull request with a clear description of your changes

## Code of Conduct

Please be respectful and professional in all interactions. We are committed to providing a welcoming and inclusive environment for all contributors.

## Questions?

If you have questions about contributing, please open an issue or contact the maintainers.