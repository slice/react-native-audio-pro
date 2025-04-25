import { AudioPro } from '../audioPro';
import { AudioProAmbientEventType } from '../values';

// Mock dependencies
jest.mock('react-native', () => ({
	NativeModules: {
		AudioPro: {
			ambientPlay: jest.fn(),
			ambientStop: jest.fn(),
			ambientSetVolume: jest.fn(),
		},
	},
	Platform: {
		OS: 'ios', // Mock as iOS to use NativeModules.AudioPro
	},
	Image: {
		resolveAssetSource: jest.fn().mockImplementation((source) => ({
			uri: typeof source === 'number' ? `resolved-${source}` : source,
		})),
	},
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
	})),
}));

// Mock utils
jest.mock('../utils', () => ({
	logDebug: jest.fn(),
	validateTrack: jest.fn().mockReturnValue(true),
	guardTrackPlaying: jest.fn().mockReturnValue(true),
	normalizeFilePath: jest.fn().mockImplementation((path) => path),
	normalizeVolume: jest.fn().mockImplementation((volume) => {
		// Simple mock implementation that matches our real function
		if (volume === 0 || Math.abs(volume) < 0.001) return 0;
		if (volume > 0.995 && volume <= 1) return 1;
		const clampedVolume = Math.max(0, Math.min(1, volume));
		return parseFloat(clampedVolume.toFixed(2));
	}),
	resolveAssetSource: jest.fn().mockImplementation((source) => {
		// Simple mock implementation that returns the source if it's a string, or a resolved URI if it's a number
		return typeof source === 'number' ? `resolved-${source}` : source;
	}),
}));

// Mock emitter
jest.mock('../emitter', () => ({
	emitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
	},
	ambientEmitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

// Mock useInternalStore
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn().mockReturnValue({
			debug: false,
			debugIncludesProgress: false,
			updateFromEvent: jest.fn(),
			setVolume: jest.fn(),
		}),
	},
}));

describe('Ambient Audio', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should have ambient audio methods', () => {
		expect(typeof AudioPro.ambientPlay).toBe('function');
		expect(typeof AudioPro.ambientStop).toBe('function');
		expect(typeof AudioPro.ambientSetVolume).toBe('function');
		expect(typeof AudioPro.addAmbientListener).toBe('function');
	});

	it('should call native ambientPlay with correct parameters for remote URL', () => {
		const url = 'https://example.com/audio.mp3';
		AudioPro.ambientPlay({ url });

		// Get the mock from NativeModules
		const { ambientPlay } = require('react-native').NativeModules.AudioPro;

		// Verify it was called with the correct parameters
		expect(ambientPlay).toHaveBeenCalledWith({
			url,
			loop: true, // Default value
		});
	});

	it('should call native ambientPlay with correct parameters for local file', () => {
		const url = 12345; // Simulating require('./audio.mp3')
		AudioPro.ambientPlay({ url, loop: false });

		// Get the mock from NativeModules
		const { ambientPlay } = require('react-native').NativeModules.AudioPro;
		const { resolveAssetSource } = require('../utils');

		// Verify resolveAssetSource was called
		expect(resolveAssetSource).toHaveBeenCalledWith(url, 'ambient audio URL');

		// Verify ambientPlay was called with the correct parameters
		expect(ambientPlay).toHaveBeenCalledWith({
			url: `resolved-${url}`, // The resolved URL
			loop: false,
		});
	});

	it('should call native ambientStop', () => {
		AudioPro.ambientStop();

		// Get the mock from NativeModules
		const { ambientStop } = require('react-native').NativeModules.AudioPro;

		// Verify it was called
		expect(ambientStop).toHaveBeenCalled();
	});

	it('should call native ambientSetVolume with normalized volume', () => {
		AudioPro.ambientSetVolume(0.5);

		// Get the mock from NativeModules
		const { ambientSetVolume } = require('react-native').NativeModules.AudioPro;
		const { normalizeVolume } = require('../utils');

		// Verify normalizeVolume was called
		expect(normalizeVolume).toHaveBeenCalledWith(0.5);

		// Verify ambientSetVolume was called with the normalized volume
		expect(ambientSetVolume).toHaveBeenCalled();
	});

	it('should clamp ambient volume values between 0 and 1', () => {
		// Mock console.warn to check for warning messages
		const originalWarn = console.warn;
		console.warn = jest.fn();

		// Test with value below range
		AudioPro.ambientSetVolume(-0.5);
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('out of range, clamped to 0'),
		);

		// Test with value above range
		AudioPro.ambientSetVolume(1.5);
		expect(console.warn).toHaveBeenCalledWith(
			expect.stringContaining('out of range, clamped to 1'),
		);

		// Restore console.warn
		console.warn = originalWarn;
	});

	it('should add a listener for ambient audio events', () => {
		const callback = jest.fn();
		const subscription = AudioPro.addAmbientListener(callback);

		// Get the mock from emitter
		const { ambientEmitter } = require('../emitter');

		// Verify addListener was called with the correct parameters
		expect(ambientEmitter.addListener).toHaveBeenCalledWith('AudioProAmbientEvent', callback);

		// Verify a subscription was returned
		expect(subscription).toBeDefined();
		expect(typeof subscription.remove).toBe('function');
	});

	it('should emit an error event when URL is invalid', () => {
		// Call ambientPlay with an invalid URL
		AudioPro.ambientPlay({ url: '' });

		// Get the mock from emitter
		const { ambientEmitter } = require('../emitter');

		// Verify emit was called with the correct parameters
		expect(ambientEmitter.emit).toHaveBeenCalledWith('AudioProAmbientEvent', {
			type: AudioProAmbientEventType.AMBIENT_ERROR,
			payload: {
				error: expect.stringContaining('Invalid URL'),
			},
		});
	});
});
