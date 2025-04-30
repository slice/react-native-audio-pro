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
};

// Export for direct use in tests
export default useInternalStoreMock; 