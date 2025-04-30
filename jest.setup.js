import '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Mock NativeAnimatedHelper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Configure fake timers
jest.useFakeTimers();

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  NativeModules: {
    AudioPro: {
      play: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      clear: jest.fn(),
      seekTo: jest.fn(),
      seekForward: jest.fn(),
      seekBack: jest.fn(),
      setPlaybackSpeed: jest.fn(),
      setVolume: jest.fn(),
      setProgressInterval: jest.fn(),
      ambientPlay: jest.fn(),
      ambientStop: jest.fn(),
      ambientPause: jest.fn(),
      ambientResume: jest.fn(),
      ambientSeekTo: jest.fn(),
      ambientSetVolume: jest.fn(),
      getTimings: jest.fn(),
      getState: jest.fn(),
      getPlayingTrack: jest.fn(),
      getPlaybackSpeed: jest.fn(),
      getVolume: jest.fn(),
      getError: jest.fn(),
      getProgressInterval: jest.fn(),
    },
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  Image: {
    resolveAssetSource: jest.fn((source) => ({
      uri: typeof source === 'number' ? `asset://${source}` : source,
      width: 100,
      height: 100,
      scale: 1,
    })),
  },
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}));

// Mock useInternalStore
jest.mock('./src/useInternalStore', () => ({
  useInternalStore: jest.fn(() => ({
    playerState: 'IDLE',
    position: 0,
    duration: 0,
    volume: 1.0,
    playbackSpeed: 1.0,
    debug: false,
    debugIncludesProgress: false,
    configureOptions: {
      contentType: 'MUSIC',
      progressIntervalMs: 1000,
      debug: false,
      debugIncludesProgress: false,
    },
    error: null,
    setDebug: jest.fn(),
    setDebugIncludesProgress: jest.fn(),
    setTrackPlaying: jest.fn(),
    setConfigureOptions: jest.fn(),
    setPlaybackSpeed: jest.fn(),
    setVolume: jest.fn(),
    setError: jest.fn(),
    updateFromEvent: jest.fn(),
  })),
}));

// Mock emitter
jest.mock('./src/emitter', () => ({
  emitter: {
    emit: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  ambientEmitter: {
    emit: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

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

// Clean up fake timers after each test
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
