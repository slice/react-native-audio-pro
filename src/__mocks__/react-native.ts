export const NativeModules = {
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
		ambientPlay: jest.fn(),
		ambientStop: jest.fn(),
		ambientPause: jest.fn(),
		ambientResume: jest.fn(),
		ambientSeekTo: jest.fn(),
		ambientSetVolume: jest.fn(),
	},
};

// Mock NativeEventEmitter
export class NativeEventEmitter {
	constructor() {}
	addListener = jest.fn().mockReturnValue({ remove: jest.fn() });
	removeListener = jest.fn();
	removeAllListeners = jest.fn();
}

// Mock Image module
export const Image = {
	resolveAssetSource: jest.fn().mockImplementation((source) => ({
		uri: typeof source === 'number' ? `asset://${source}` : source,
		width: 100,
		height: 100,
		scale: 1,
	})),
};

// Mock other React Native components and modules
export const View = 'View';
export const Text = 'Text';
export const StyleSheet = {
	create: jest.fn().mockImplementation((styles) => styles),
};

// Mock Platform
export const Platform = {
	OS: 'ios',
	select: jest.fn().mockImplementation((obj) => obj.ios),
};
