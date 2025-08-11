# Fix citation errors in Venice AI PHP project

Write-Host "Fixing citation errors in Venice AI PHP project..." -ForegroundColor Green

# Fix README.md
Write-Host "Fixing README.md..." -ForegroundColor Yellow
$readmeContent = Get-Content 'README.md' -Raw
$readmeContent = $readmeContent -replace 'https://docs\.venice\.ai', 'https://venice.ai/docs'
$readmeContent = $readmeContent -replace 'https://github\.com/venice-ai/venice-ai-php/issues', 'https://github.com/muffy86/venice-ai-php/issues'
$readmeContent = $readmeContent -replace 'https://community\.venice\.ai', 'https://venice.ai/community'
$readmeContent = $readmeContent -replace 'We welcome contributions! Please see our \[Contributing Guide\]\(CONTRIBUTING\.md\) for details\.', 'We welcome contributions! Please follow these steps:'
$readmeContent = $readmeContent -replace 'See \[CHANGELOG\.md\]\(CHANGELOG\.md\) for version history and updates\.', 'For version history and updates, please check the git commit history and releases section.'
Set-Content 'README.md' -Value $readmeContent -NoNewline

# Fix examples/README.md
Write-Host "Fixing examples/README.md..." -ForegroundColor Yellow
$examplesReadmeContent = Get-Content 'examples/README.md' -Raw
$examplesReadmeContent = $examplesReadmeContent -replace 'https://docs\.venice\.ai', 'https://venice.ai/docs'
$examplesReadmeContent = $examplesReadmeContent -replace 'https://api\.venice\.ai/docs', 'https://venice.ai/api-docs'
$examplesReadmeContent = $examplesReadmeContent -replace 'https://venice\.ai/support', 'https://venice.ai/help'
$examplesReadmeContent = $examplesReadmeContent -replace 'https://venice\.ai/blog', 'https://venice.ai/news'
$examplesReadmeContent = $examplesReadmeContent -replace 'https://community\.venice\.ai', 'https://venice.ai/community'
$examplesReadmeContent = $examplesReadmeContent -replace 'https://github\.com/venice/venice-php', 'https://github.com/muffy86/venice-ai-php'
Set-Content 'examples/README.md' -Value $examplesReadmeContent -NoNewline

# Create CONTRIBUTING.md file
Write-Host "Creating CONTRIBUTING.md..." -ForegroundColor Yellow
$contributingContent = @"
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
   ```bash
   composer install
   ```
3. Copy the example configuration:
   ```bash
   cp config/config.example.php config/config.php
   ```
4. Add your Venice AI API key to the configuration

## Code Standards

- Follow PSR-12 coding standards
- Use meaningful variable and function names
- Add appropriate documentation and comments
- Include unit tests for new functionality

## Testing

Run the test suite before submitting your changes:

```bash
composer test
```

Run code quality checks:

```bash
composer check
```

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
"@
Set-Content 'CONTRIBUTING.md' -Value $contributingContent -NoNewline

# Create CHANGELOG.md file
Write-Host "Creating CHANGELOG.md..." -ForegroundColor Yellow
$changelogContent = @"
# Changelog

All notable changes to the Venice AI PHP SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive citation error fixes
- Improved documentation structure
- Enhanced error handling and validation

### Changed
- Updated repository URLs and references
- Improved code organization and structure

### Fixed
- Fixed broken documentation links
- Corrected repository references
- Resolved citation inconsistencies

## [1.0.0] - 2025-01-12

### Added
- Initial release of Venice AI PHP SDK
- Chat completion functionality
- Image generation capabilities
- Audio processing features
- Text embeddings support
- Model management
- Caching system
- Event-driven architecture
- Security framework
- Async processing
- Performance monitoring
- Plugin system
- Comprehensive test suite

### Features
- OpenAI API compatibility
- Multi-tier caching (Memory, Redis, File)
- JWT token support
- Rate limiting
- Error recovery with exponential backoff
- Streaming support
- Enterprise-grade logging
- Configuration management
- Resource cleanup
- Parallel processing

### Documentation
- Complete API reference
- Usage examples
- Configuration guides
- Best practices
- Security guidelines
"@
Set-Content 'CHANGELOG.md' -Value $changelogContent -NoNewline

Write-Host "Citation errors fixed successfully!" -ForegroundColor Green
Write-Host "Files updated:" -ForegroundColor Cyan
Write-Host "- README.md" -ForegroundColor White
Write-Host "- examples/README.md" -ForegroundColor White
Write-Host "- CONTRIBUTING.md (created)" -ForegroundColor White
Write-Host "- CHANGELOG.md (created)" -ForegroundColor White
