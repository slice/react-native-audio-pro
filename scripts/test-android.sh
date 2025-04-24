#!/bin/bash

# Exit on error
set -e

echo "Running Android tests..."

# Navigate to the Android directory
cd android

# Run the tests using the Gradle wrapper with the test-specific build.gradle file
./gradlew -b src/test/build.gradle test

echo "Android tests completed successfully!"
