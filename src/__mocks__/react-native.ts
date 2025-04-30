// Mock Platform first to ensure correct module resolution
export const Platform = {
	OS: 'ios',
	select: jest.fn().mockImplementation((obj) => obj.ios),
};

// Import and re-export AudioPro mock
import AudioProMock from './audio-pro';
export const NativeModules = {
	AudioPro: AudioProMock,
};

// Export AudioPro mock directly for web fallback
export const WebAudioPro = AudioProMock;

// Import and re-export NativeEventEmitter
import NativeEventEmitter from './events';
export { NativeEventEmitter };

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
