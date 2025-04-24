# Android Unit Tests for React Native Audio Pro

This directory contains unit tests for the Android (Kotlin) implementation of React Native Audio Pro.

## Test Structure

The tests are organized into several categories:

1. **AudioProSanityTest**: Basic sanity tests to verify that the test infrastructure is working.
2. **AudioProLogicTest**: Tests that verify the audio player logic adheres to the contract defined in `logic.md`. These tests focus on state transitions and event emissions.
3. **AudioProControllerTest**: Tests for the AudioProController that verify the actual implementation.
4. **AudioProMediaLibrarySessionCallbackTest**: Tests for the AudioProMediaLibrarySessionCallback to ensure it handles commands correctly.
5. **AudioProModuleTest**: Tests for the AudioProModule to ensure it correctly delegates to the AudioProController.
6. **AudioProEdgeCasesTest**: Tests for edge cases and error handling.

## Test Utilities

The `AudioProTestUtils` class provides utility methods for creating mock objects used in the tests.

## Running the Tests

You can run the tests using the following command from the project root:

```bash
yarn test:android
```

This will run all the tests and display a summary of the results.

## Test Coverage

The tests cover the following areas:

- Core state transitions and event emissions
- Edge cases and error handling
- Media session callback behavior
- Module initialization and lifecycle
- Controller functionality

## Adding New Tests

When adding new tests, follow these guidelines:

1. Use descriptive test names that clearly indicate what is being tested.
2. Use the `@Test` annotation to mark test methods.
3. Use assertions to verify expected behavior.
4. Use mocks to isolate the code being tested.
5. Use the `@Before` annotation to set up test fixtures.
6. Use the `@After` annotation to clean up after tests if necessary.

## Test Dependencies

The tests use the following dependencies:

- JUnit: For running the tests
- Mockito: For creating mock objects
- Kotlin Coroutines Test: For testing coroutines
- Media3: For testing media session behavior

## Test Configuration

The tests use a separate Gradle configuration defined in `build.gradle` to avoid dependencies on React Native. This allows the tests to run in isolation without needing to build the entire project.
