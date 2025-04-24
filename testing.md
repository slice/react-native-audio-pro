# Native Testing Setup

This document describes the native testing setup for both Android (Kotlin) and iOS (Swift) in the react-native-audio-pro project.

## Overview

The project now includes a minimal but working foundation for native unit testing on both platforms. The setup allows for:

- Running Android tests using JUnit
- Running iOS tests using XCTest
- Running both Android and iOS tests with a single command

## Requirements

### Android

- The Android tests require the `android.useAndroidX=true` property to be set in the `android/gradle.properties` file.
- The tests use a separate Gradle configuration to avoid dependencies on React Native.

### iOS

- The iOS tests require Swift and XCTest to be installed on your system.
- The tests use Swift Package Manager to run the tests.

## Test Structure

### Android Tests

Android tests are located in the `android/src/test` directory, following the standard Android test structure:

```
android/src/test/java/dev/rnap/reactnativeaudiopro/AudioProSanityTest.kt
android/src/test/java/dev/rnap/reactnativeaudiopro/AudioProLogicTest.kt
```

The `AudioProSanityTest.kt` file contains simple JUnit tests that verify basic functionality.

The `AudioProLogicTest.kt` file contains tests that verify the audio player logic adheres to the contract defined in `logic.md`. These tests focus on state transitions and event emissions, ensuring that the player behaves as expected in various scenarios.

The Android tests use a separate `build.gradle` file located at `android/src/test/build.gradle` to avoid dependencies on React Native. This allows the tests to run in isolation without needing to build the entire project.

The `build.gradle` file is configured to find the test source files in the current directory and includes detailed test logging to show the results of each test when running `yarn test:android`. The script uses the `--rerun-tasks` flag to ensure tests are always executed and their results are displayed.

### iOS Tests

iOS tests are located in the `ios/Tests` directory:

```
ios/Tests/AudioProSanityTests.swift
ios/Tests/AudioProLogicTests.swift
```

The `AudioProSanityTests.swift` file contains simple XCTests that verify basic functionality.

The `AudioProLogicTests.swift` file contains tests that verify the audio player logic adheres to the contract defined in `logic.md`. These tests focus on state transitions and event emissions, ensuring that the player behaves as expected in various scenarios.

## Running Tests

The following npm scripts have been added to package.json:

### Run Android Tests Only

```bash
yarn test:android
```

This command runs the Android tests using Gradle with a separate build configuration. The tests are run in isolation from the main project, which allows them to run without needing to build the entire React Native module.

### Run iOS Tests Only

```bash
yarn test:ios
```

This command runs the iOS tests using Swift Package Manager.

### Run All Native Tests

```bash
yarn test:native
```

This command runs both Android and iOS tests in sequence.

## Adding More Tests

### Adding Android Tests

1. Create new test files in the `android/src/test/java/dev/rnap/reactnativeaudiopro` directory
2. Use JUnit annotations (`@Test`, etc.) to define test methods
3. If you need additional dependencies, add them to the `android/src/test/build.gradle` file
4. Run the tests using `yarn test:android`

Note: The Android tests use a separate build configuration to avoid dependencies on React Native. This allows the tests to run in isolation without needing to build the entire project.

### Adding iOS Tests

1. Create new test files in the `ios/Tests` directory
2. Use XCTest framework to define test methods
3. Run the tests using `yarn test:ios`

## Troubleshooting

### Android Tests

- **Error: AndroidX dependencies not enabled**: Make sure `android.useAndroidX=true` is set in `android/gradle.properties`.
- **Error: Could not find com.facebook.react:react-android**: This occurs if you try to run the tests with the main build configuration. The tests should use the separate build.gradle file in the test directory.
- **Error: gradle command not found**: The tests use the Gradle wrapper (`./gradlew`) instead of the `gradle` command directly.

### iOS Tests

- **Error: swift command not found**: Make sure Swift is installed on your system.
- **Error: XCTest not found**: Make sure XCTest is installed with your Swift installation.
- **Error: No such module 'XCTest'**: This error occurs when building an app that includes this library. The test files are excluded from the main build via the `exclude_files` setting in the podspec file, so this error should not occur. If it does, make sure you're using the latest version of the library.

## Current Status and Future Improvements

The project now includes:
- Basic sanity tests for both Android and iOS
- Comprehensive tests for the audio player logic that verify adherence to the contract defined in `logic.md`

Future improvements could include:
- Setting up code coverage reporting
- Integrating with CI/CD pipelines
- Adding UI tests for the native components
- Adding more integration tests that test the actual audio playback functionality with real audio files
