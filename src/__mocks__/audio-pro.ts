export const AudioProMock = {
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
};

// Export for direct use in tests
export default AudioProMock; 