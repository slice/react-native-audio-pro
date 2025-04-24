#!/bin/bash

# Exit on error
set -e

echo "Running Android tests..."

# Navigate to the Android directory
cd android

# Run the tests using the Gradle wrapper with the test-specific build.gradle file
# Use --rerun-tasks to force Gradle to run the tests even if they're up-to-date
./gradlew -b src/test/build.gradle test --rerun-tasks

echo "Android tests completed successfully!"
