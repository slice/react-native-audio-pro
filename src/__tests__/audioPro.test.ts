// Mock dependencies
jest.mock('react-native', () => ({
	NativeModules: {
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
			// Ambient audio methods
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

jest.mock('../emitter', () => ({
	emitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
	ambientEmitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

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

// Mock useInternalStore
jest.mock('../useInternalStore', () => {
	const mockState = {
		playerState: 'PLAYING',
		position: 0,
		duration: 0,
		playbackSpeed: 1.0,
		volume: 1.0,
		debug: false,
		debugIncludesProgress: false,
		trackPlaying: null,
		configureOptions: {
			contentType: 'MUSIC',
			debug: false,
			debugIncludesProgress: false,
			progressIntervalMs: 1000,
		},
		error: null,
		setDebug: jest.fn(),
		setDebugIncludesProgress: jest.fn(),
		setTrackPlaying: jest.fn(),
		setConfigureOptions: jest.fn(),
		setPlaybackSpeed: jest.fn(),
		setVolume: jest.fn(),
		setError: jest.fn(),
		updateFromEvent: jest.fn(),
	};

	return {
		useInternalStore: jest.fn().mockImplementation((selector) => {
			if (selector) {
				return selector(mockState);
			}
			return mockState;
		}),
		__mockState: mockState,
	};
});

// Import after mocks
import { NativeModules } from 'react-native';

import { AudioPro } from '../audioPro';
import { useInternalStore } from '../useInternalStore';
import { AudioProState } from '../values';

describe('AudioPro', () => {
	it('should export the expected functions', () => {
		// Check that AudioPro exports the expected functions
		expect(typeof AudioPro.configure).toBe('function');
		expect(typeof AudioPro.play).toBe('function');
		expect(typeof AudioPro.pause).toBe('function');
		expect(typeof AudioPro.resume).toBe('function');
		expect(typeof AudioPro.stop).toBe('function');
		expect(typeof AudioPro.seekTo).toBe('function');
		expect(typeof AudioPro.seekForward).toBe('function');
		expect(typeof AudioPro.seekBack).toBe('function');
		expect(typeof AudioPro.addEventListener).toBe('function');
		expect(typeof AudioPro.getTimings).toBe('function');
		expect(typeof AudioPro.getState).toBe('function');
		expect(typeof AudioPro.getPlayingTrack).toBe('function');
		expect(typeof AudioPro.setPlaybackSpeed).toBe('function');
		expect(typeof AudioPro.getPlaybackSpeed).toBe('function');
		expect(typeof AudioPro.setVolume).toBe('function');
		expect(typeof AudioPro.getVolume).toBe('function');
		expect(typeof AudioPro.getError).toBe('function');
		expect(typeof AudioPro.setProgressInterval).toBe('function');
		expect(typeof AudioPro.getProgressInterval).toBe('function');
		// Ambient audio methods
		expect(typeof AudioPro.ambientPlay).toBe('function');
		expect(typeof AudioPro.ambientStop).toBe('function');
		expect(typeof AudioPro.ambientSetVolume).toBe('function');
		expect(typeof AudioPro.addAmbientListener).toBe('function');
	});

	describe('volume control', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should clamp volume values between 0 and 1', () => {
			// Mock console.warn to check for warning messages
			const originalWarn = console.warn;
			console.warn = jest.fn();

			// Test with value below range
			AudioPro.setVolume(-0.5);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 0'),
			);
			expect(useInternalStore.getState().setVolume).toHaveBeenCalledWith(0);

			// Test with value above range
			AudioPro.setVolume(1.5);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 1'),
			);
			expect(useInternalStore.getState().setVolume).toHaveBeenCalledWith(1);

			// Test with value within range
			AudioPro.setVolume(0.5);
			expect(useInternalStore.getState().setVolume).toHaveBeenCalledWith(0.5);

			// Restore console.warn
			console.warn = originalWarn;
		});

		it('should call native module when track is playing', () => {
			// Mock track playing
			jest.spyOn(useInternalStore, 'getState').mockReturnValue({
				...useInternalStore.getState(),
				trackPlaying: { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' },
				playerState: AudioProState.PLAYING,
			});

			AudioPro.setVolume(0.7);
			expect(NativeModules.AudioPro.setVolume).toHaveBeenCalledWith(0.7);
		});

		it('should not call native module when no track is playing', () => {
			// Mock no track playing
			jest.spyOn(useInternalStore, 'getState').mockReturnValue({
				...useInternalStore.getState(),
				trackPlaying: null,
			});

			AudioPro.setVolume(0.7);
			expect(NativeModules.AudioPro.setVolume).not.toHaveBeenCalled();
		});

		it('should return the current volume value', () => {
			// Mock volume value
			jest.spyOn(useInternalStore, 'getState').mockReturnValue({
				...useInternalStore.getState(),
				volume: 0.6,
			});

			expect(AudioPro.getVolume()).toBe(0.6);
		});

		it('should reset volume to default when clear() is called', () => {
			AudioPro.clear();
			expect(useInternalStore.getState().setVolume).toHaveBeenCalledWith(1.0);
		});
	});

	describe('progress interval control', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should clamp progress interval values between 100ms and 10000ms', () => {
			// Mock console.warn to check for warning messages
			const originalWarn = console.warn;
			console.warn = jest.fn();

			// Test with value below range
			AudioPro.setProgressInterval(50);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 100ms'),
			);
			expect(useInternalStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 100 }),
			);

			// Test with value above range
			AudioPro.setProgressInterval(15000);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 10000ms'),
			);
			expect(useInternalStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 10000 }),
			);

			// Test with value within range
			AudioPro.setProgressInterval(500);
			expect(useInternalStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 500 }),
			);

			// Restore console.warn
			console.warn = originalWarn;
		});

		it('should return the current progress interval value', () => {
			// Mock progress interval value
			jest.spyOn(useInternalStore, 'getState').mockReturnValue({
				...useInternalStore.getState(),
				configureOptions: { progressIntervalMs: 2000 },
			});

			expect(AudioPro.getProgressInterval()).toBe(2000);
		});

		it('should return the default progress interval value from store initialization', () => {
			// Reset mock to default state
			const mockGetState = useInternalStore.getState as jest.Mock;
			mockGetState.mockImplementation(() => ({
				configureOptions: {
					progressIntervalMs: 1000,
				},
			}));

			expect(AudioPro.getProgressInterval()).toBe(1000); // Default value from store initialization
		});
	});

	describe('volume persistence', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should maintain volume settings after stop > play sequence', () => {
			// Setup: Mock store with custom volume and track playing
			jest.spyOn(useInternalStore, 'getState').mockReturnValue({
				...useInternalStore.getState(),
				volume: 0.3, // Set custom volume
				trackPlaying: { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' },
				playerState: AudioProState.PLAYING,
				setTrackPlaying: jest.fn(),
				setError: jest.fn(),
				configureOptions: { progressIntervalMs: 1000 },
				playbackSpeed: 1.0,
			});

			// Step 1: Stop playback
			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();

			// Step 2: Play again
			const track = { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' };
			AudioPro.play(track);

			// Verify: Volume from store is passed to native options
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ volume: 0.3 }),
			);
		});
	});

	// We'll add more tests in the future if needed
});
