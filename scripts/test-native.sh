#!/bin/bash

# Exit on error
set -e

echo "Running native tests for both Android and iOS..."

# Make the individual test scripts executable
chmod +x "$(dirname "$0")/test-android.sh"
chmod +x "$(dirname "$0")/test-ios.sh"

# Run Android tests
"$(dirname "$0")/test-android.sh"

# Run iOS tests
"$(dirname "$0")/test-ios.sh"

echo "All native tests completed successfully!"
