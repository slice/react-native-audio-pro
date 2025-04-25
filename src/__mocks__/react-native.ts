// Mock for React Native
const mockNativeModules = {
	AudioPro: {
		play: jest.fn(),
		pause: jest.fn(),
		resume: jest.fn(),
		stop: jest.fn(),
		seek: jest.fn(),
		setVolume: jest.fn(),
		setPlaybackSpeed: jest.fn(),
		getProgress: jest.fn(),
		getDuration: jest.fn(),
		getState: jest.fn(),
		configure: jest.fn(),
		clear: jest.fn(),
	},
};

class MockNativeEventEmitter {
	constructor() {}
	addListener = jest.fn(() => ({ remove: jest.fn() }));
	removeAllListeners = jest.fn();
	removeSubscription = jest.fn();
}

export const Platform = {
	OS: 'ios',
	select: jest.fn((obj) => obj.ios || obj.default),
};

export const NativeModules = mockNativeModules;
export const NativeEventEmitter = MockNativeEventEmitter;
export default {
	NativeModules,
	NativeEventEmitter,
	Platform,
};
