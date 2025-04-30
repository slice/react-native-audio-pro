export const mockTimers = {
  setTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearTimeout: jest.fn(),
  clearInterval: jest.fn(),
};

// Export for direct use in tests
export default mockTimers; 