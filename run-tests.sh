#!/bin/bash

# Venice AI PHP SDK - Test Runner Script
# =====================================
# Comprehensive test execution with coverage reporting and quality checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
LOGS_DIR="$BUILD_DIR/logs"
COVERAGE_DIR="$BUILD_DIR/coverage"

echo -e "${BLUE}🚀 Venice AI PHP SDK - Test Suite Runner${NC}"
echo "========================================"
echo ""

# Create build directories
echo -e "${YELLOW}📁 Creating build directories...${NC}"
mkdir -p "$LOGS_DIR"
mkdir -p "$COVERAGE_DIR"

# Function to run a command and check its exit status
run_command() {
    local cmd="$1"
    local description="$2"

    echo -e "${BLUE}▶️  $description${NC}"
    if eval "$cmd"; then
        echo -e "${GREEN}✅ $description completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $description failed${NC}"
        return 1
    fi
}

# Function to display test results
display_results() {
    echo ""
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo "======================="

    if [ -f "$LOGS_DIR/junit.xml" ]; then
        # Parse JUnit XML for basic stats (simplified)
        local tests=$(grep -o 'tests="[0-9]*"' "$LOGS_DIR/junit.xml" | head -1 | grep -o '[0-9]*')
        local failures=$(grep -o 'failures="[0-9]*"' "$LOGS_DIR/junit.xml" | head -1 | grep -o '[0-9]*')
        local errors=$(grep -o 'errors="[0-9]*"' "$LOGS_DIR/junit.xml" | head -1 | grep -o '[0-9]*')

        echo "Total Tests: $tests"
        echo "Failures: $failures"
        echo "Errors: $errors"

        if [ "$failures" -eq 0 ] && [ "$errors" -eq 0 ]; then
            echo -e "${GREEN}🎉 All tests passed!${NC}"
        else
            echo -e "${RED}⚠️  Some tests failed${NC}"
        fi
    fi

    if [ -f "$BUILD_DIR/coverage.txt" ]; then
        echo ""
        echo -e "${BLUE}📈 Coverage Summary:${NC}"
        tail -n 10 "$BUILD_DIR/coverage.txt"
    fi
}

# Parse command line arguments
SUITE="all"
COVERAGE=true
QUALITY_CHECKS=true
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --suite)
            SUITE="$2"
            shift 2
            ;;
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        --no-quality)
            QUALITY_CHECKS=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --suite SUITE     Run specific test suite (core, services, advanced, integration, performance, all)"
            echo "  --no-coverage     Skip code coverage analysis"
            echo "  --no-quality      Skip quality checks (PHPStan, PHP CS Fixer)"
            echo "  --verbose         Enable verbose output"
            echo "  --help           Show this help message"
            echo ""
            echo "Available test suites:"
            echo "  core             Core functionality tests"
            echo "  services         AI service tests"
            echo "  advanced         Advanced feature tests"
            echo "  integration      Integration tests"
            echo "  performance      Performance tests"
            echo "  all              All test suites (default)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "Configuration:"
echo "  Test Suite: $SUITE"
echo "  Coverage: $COVERAGE"
echo "  Quality Checks: $QUALITY_CHECKS"
echo "  Verbose: $VERBOSE"
echo ""

# Check if vendor directory exists
if [ ! -d "vendor" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    run_command "composer install --no-interaction --prefer-dist" "Composer install"
    echo ""
fi

# Quality checks
if [ "$QUALITY_CHECKS" = true ]; then
    echo -e "${BLUE}🔍 Running Quality Checks${NC}"
    echo "========================"

    # PHP CS Fixer (dry run)
    if command -v php-cs-fixer &> /dev/null; then
        run_command "php-cs-fixer fix --dry-run --diff --verbose" "PHP CS Fixer check" || true
    else
        echo -e "${YELLOW}⚠️  PHP CS Fixer not found, skipping code style check${NC}"
    fi

    # PHPStan
    if [ -f "vendor/bin/phpstan" ]; then
        run_command "vendor/bin/phpstan analyse --memory-limit=1G" "PHPStan static analysis" || true
    else
        echo -e "${YELLOW}⚠️  PHPStan not found, skipping static analysis${NC}"
    fi

    echo ""
fi

# Build PHPUnit command
PHPUNIT_CMD="vendor/bin/phpunit"

if [ "$VERBOSE" = true ]; then
    PHPUNIT_CMD="$PHPUNIT_CMD --verbose"
fi

if [ "$COVERAGE" = true ]; then
    PHPUNIT_CMD="$PHPUNIT_CMD --coverage-html $COVERAGE_DIR --coverage-clover $LOGS_DIR/clover.xml --coverage-text=$BUILD_DIR/coverage.txt"
fi

# Add suite-specific options
case $SUITE in
    "core")
        PHPUNIT_CMD="$PHPUNIT_CMD --testsuite Core"
        ;;
    "services")
        PHPUNIT_CMD="$PHPUNIT_CMD --testsuite Services"
        ;;
    "advanced")
        PHPUNIT_CMD="$PHPUNIT_CMD --testsuite Advanced"
        ;;
    "integration")
        PHPUNIT_CMD="$PHPUNIT_CMD --testsuite Integration"
        ;;
    "performance")
        PHPUNIT_CMD="$PHPUNIT_CMD --testsuite Performance"
        ;;
    "all")
        # Run all suites (default)
        ;;
    *)
        echo -e "${RED}❌ Unknown test suite: $SUITE${NC}"
        exit 1
        ;;
esac

# Run tests
echo -e "${BLUE}🧪 Running Tests${NC}"
echo "================"

if run_command "$PHPUNIT_CMD" "PHPUnit test execution"; then
    TEST_SUCCESS=true
else
    TEST_SUCCESS=false
fi

echo ""

# Display results
display_results

# Generate additional reports
if [ "$COVERAGE" = true ] && [ -f "$LOGS_DIR/clover.xml" ]; then
    echo ""
    echo -e "${BLUE}📋 Generating Additional Reports${NC}"
    echo "==============================="

    # Generate coverage badge (if clover.xml exists)
    if command -v php &> /dev/null; then
        php -r "
        \$xml = simplexml_load_file('$LOGS_DIR/clover.xml');
        \$metrics = \$xml->project->metrics;
        \$coverage = round((\$metrics['coveredstatements'] / \$metrics['statements']) * 100, 2);
        echo \"Coverage: {\$coverage}%\n\";

        \$color = \$coverage >= 80 ? 'brightgreen' : (\$coverage >= 60 ? 'yellow' : 'red');
        \$badge = \"https://img.shields.io/badge/coverage-{\$coverage}%25-{\$color}\";
        file_put_contents('$BUILD_DIR/coverage-badge.txt', \$badge);
        " 2>/dev/null || echo "Coverage calculation skipped"
    fi

    echo -e "${GREEN}✅ Coverage report generated: $COVERAGE_DIR/index.html${NC}"
fi

# Final status
echo ""
echo -e "${BLUE}🏁 Test Run Complete${NC}"
echo "==================="

if [ "$TEST_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 All tests completed successfully!${NC}"

    if [ "$COVERAGE" = true ]; then
        echo -e "${BLUE}📊 Coverage report: file://$(pwd)/$COVERAGE_DIR/index.html${NC}"
    fi

    echo ""
    echo "Next steps:"
    echo "  • Review test results in $LOGS_DIR/"
    echo "  • Check coverage report in $COVERAGE_DIR/"
    echo "  • Run specific test suites with --suite option"
    echo "  • Use --verbose for detailed output"

    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Debugging tips:"
    echo "  • Check $LOGS_DIR/junit.xml for detailed results"
    echo "  • Run with --verbose for more information"
    echo "  • Run specific test suites to isolate issues"
    echo "  • Check the logs in $LOGS_DIR/"

    exit 1
fi
