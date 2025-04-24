#!/bin/bash

# Exit on error
set -e

echo "Running Android tests..."

# Navigate to the Android directory
cd android

# Run the tests using the Gradle wrapper with the test-specific build.gradle file
# Use --rerun-tasks to force Gradle to run the tests even if they're up-to-date
./gradlew -b src/test/build.gradle test --rerun-tasks

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "Android tests completed successfully!"

    # Print a summary of the test results
    echo "\nTest Summary:"
    echo "------------"

    # Count the number of test classes
    TEST_CLASSES=$(find src/test/java -name "*Test.kt" | wc -l)
    echo "Test Classes: $TEST_CLASSES"

    # Count the number of test methods
    TEST_METHODS=$(grep -r "@Test" src/test/java | wc -l)
    echo "Test Methods: $TEST_METHODS"

    echo "\nTest Coverage Areas:"
    echo "- Core state transitions and event emissions"
    echo "- Edge cases and error handling"
    echo "- Media session callback behavior"
    echo "- Module initialization and lifecycle"
    echo "- Controller functionality"
    echo "- Buffering behavior"
    echo "- Progress events"
    echo "- Remote control and lock screen interactions"
    echo "- Volume and playback speed control"
    echo "- Track metadata handling"

    echo "\nTo see detailed test results, check the build/reports/tests directory."

    exit 0
else
    echo "Android tests failed!"
    exit 1
fi
