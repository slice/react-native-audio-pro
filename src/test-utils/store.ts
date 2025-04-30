export const useInternalStoreMock = {
  getState: jest.fn(),
  setState: jest.fn(),
  subscribe: jest.fn(),
  getSnapshot: jest.fn(),
  // State properties
  playerState: 'IDLE',
  position: 0,
  duration: 0,
  trackPlaying: null,
  playbackSpeed: 1.0,
  volume: 1.0,
  error: null,
  debug: false,
  debugIncludesProgress: false,
  configureOptions: {
    contentType: 'MUSIC',
    debug: false,
    debugIncludesProgress: false,
    progressIntervalMs: 1000,
  },
  // Setter methods
  setTrackPlaying: jest.fn(),
  setError: jest.fn(),
  setVolume: jest.fn(),
  setPlaybackSpeed: jest.fn(),
  setConfigureOptions: jest.fn(),
  setDebug: jest.fn(),
  setDebugIncludesProgress: jest.fn(),
  updateFromEvent: jest.fn(),
};

// Export for direct use in tests
export default useInternalStoreMock; 