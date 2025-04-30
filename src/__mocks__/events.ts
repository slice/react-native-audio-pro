export class NativeEventEmitter {
  constructor() {}
  addListener = jest.fn().mockReturnValue({ remove: jest.fn() });
  removeListener = jest.fn();
  removeAllListeners = jest.fn();
}

// Export for direct use in tests
export default NativeEventEmitter; 