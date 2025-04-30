export const mockNativeAudioPro = {
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
  ambientPlay: jest.fn(),
  ambientStop: jest.fn(),
  ambientPause: jest.fn(),
  ambientResume: jest.fn(),
  ambientSeekTo: jest.fn(),
  ambientSetVolume: jest.fn(),
};

jest.mock('react-native', () => ({
  NativeModules: {
    AudioPro: mockNativeAudioPro,
  },
})); 