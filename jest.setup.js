import '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Mock NativeAnimatedHelper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Configure fake timers
jest.useFakeTimers();

// Mock console methods
const originalConsole = { ...console };
global.console = {
    ...console,
    error: jest.fn((...args) => {
        // Don't throw for expected errors
        if (typeof args[0] === 'string' && 
            (args[0].includes('AudioPro:') || args[0].includes('~~~ AudioPro:'))) {
            return;
        }
        originalConsole.error(...args);
    }),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};
