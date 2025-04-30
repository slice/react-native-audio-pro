import '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

jest.useFakeTimers();

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModules: {
    AudioPro: {
      play: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
}));

jest.mock('./src/useInternalStore', () => ({
  useInternalStore: {
    getState: () => ({
      playerState: 'PLAYING',
      position: 0,
      duration: 0,
      trackPlaying: { url: 'https://example.com/audio.mp3' },
      volume: 1.0,
      playbackSpeed: 1.0,
      configureOptions: {},
      setTrackPlaying: jest.fn(),
      setError: jest.fn(),
      error: null,
      updateFromEvent: jest.fn(),
    }),
  },
}));
