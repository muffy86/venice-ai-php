# Venice AI PHP SDK

## Development Setup

### Prerequisites

- PHP 7.4 or higher
- Composer
- Git
- Node.js (for Husky git hooks)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/venice-ai-php.git
cd venice-ai-php
```

2. Install PHP dependencies:

```bash
composer install
```

3. Install Husky git hooks:

```bash
npx husky install
```

### Code Quality Tools

This project uses several tools to ensure code quality:

1. **PHP_CodeSniffer (phpcs)** - Checks coding standards

```bash
composer phpcs
```

2. **PHPStan** - Static analysis tool

```bash
composer phpstan
```

3. **PHP CS Fixer** - Fixes coding standards

```bash
composer php-cs-fixer
```

### VSCode Setup

1. Install recommended extensions:

- PHP Intelephense
- PHP CS Fixer
- PHP CodeSniffer
- PHPStan
- Prettier
- ESLint

2. The project includes VSCode settings for:

- Format on save
- Code actions on save
- PHP validation
- EditorConfig support

### Git Hooks

Pre-commit hooks are set up to run:

- PHP_CodeSniffer
- PHPStan
- PHP CS Fixer

This ensures code quality checks pass before commits.

### EditorConfig

The project includes `.editorconfig` for consistent coding style across editors and IDEs.
