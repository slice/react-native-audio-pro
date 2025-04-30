/**
 * Centralized Mock Exports
 * 
 * This file serves as the single source of truth for all mocks in the test suite.
 * When adding new mocks, please follow these guidelines:
 * 
 * 1. Core React Native mocks -> react-native.ts
 * 2. AudioPro specific mocks -> audio-pro.ts
 * 3. Event system mocks -> events.ts
 * 4. Test utilities -> test-utils/
 * 
 * Do not define mocks directly in test files unless absolutely necessary.
 */

export * from './react-native';
export * from './audio-pro';
export * from './events'; 