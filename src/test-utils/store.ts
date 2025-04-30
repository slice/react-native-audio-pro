export const useInternalStoreMock = {
  getState: jest.fn(),
  setState: jest.fn(),
  subscribe: jest.fn(),
  getSnapshot: jest.fn(),
};

// Export for direct use in tests
export default useInternalStoreMock; 