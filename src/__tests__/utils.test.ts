// Mock the NativeModules
jest.mock('react-native', () => ({
	NativeModules: {
		AudioPro: {
			play: jest.fn(),
			pause: jest.fn(),
			resume: jest.fn(),
			stop: jest.fn(),
			seekTo: jest.fn(),
			seekForward: jest.fn(),
			seekBack: jest.fn(),
			setPlaybackSpeed: jest.fn(),
			addListener: jest.fn(),
			removeListeners: jest.fn(),
		},
	},
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		removeAllListeners: jest.fn(),
	})),
	Platform: {
		OS: 'ios',
		select: jest.fn().mockImplementation((obj) => obj.ios),
	},
	Image: {
		resolveAssetSource: jest.fn().mockImplementation((source) => ({
			uri: typeof source === 'number' ? `resolved-${source}` : source,
		})),
	},
}));

// Mock the emitter
jest.mock('../emitter', () => ({
	emitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

// Mock console methods
const originalConsole = {
	log: console.log,
	error: console.error,
};

// Import after mocks
import {
	validateTrack,
	isValidUrl,
	normalizeFilePath,
	normalizeVolume,
	resolveAssetSource,
	guardTrackPlaying,
	logDebug,
} from '../utils';

import type { AudioProTrack } from '../types';

// Mock useInternalStore
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn().mockReturnValue({
			debug: false,
			trackPlaying: null,
		}),
	},
}));

describe('Utils', () => {
	describe('isValidUrl', () => {
		it('should validate standard audio URLs', () => {
			expect(isValidUrl('https://example.com/audio.mp3')).toBe(true);
			expect(isValidUrl('https://example.com/audio.m4a')).toBe(true);
			expect(isValidUrl('https://example.com/audio.wav')).toBe(true);
			expect(isValidUrl('https://example.com/audio.aac')).toBe(true);
		});

		it('should validate URLs with query parameters', () => {
			expect(isValidUrl('https://example.com/audio.mp3?param=value')).toBe(true);
			expect(isValidUrl('https://example.com/stream?format=mp3')).toBe(true);
		});

		it('should validate URLs without file extensions', () => {
			expect(isValidUrl('https://example.com/stream')).toBe(true);
			expect(isValidUrl('https://example.com/audio/123456')).toBe(true);
		});

		it('should validate the URL from the issue description', () => {
			expect(
				isValidUrl(
					'https://assets.evergrace.app/stories/baby-in-the-bulrushes/baby-in-the-bulrushes-audio-teaser.mp3',
				),
			).toBe(true);
		});

		it('should validate require() results (numbers)', () => {
			expect(isValidUrl(12345)).toBe(true);
		});

		it('should reject invalid URLs', () => {
			expect(isValidUrl('')).toBe(false);
			expect(isValidUrl('   ')).toBe(false);
			expect(isValidUrl(null as unknown as string)).toBe(false);
			expect(isValidUrl(undefined as unknown as string)).toBe(false);
		});
	});

	describe('isValidUrl for artwork', () => {
		it('should validate standard image URLs', () => {
			expect(isValidUrl('https://example.com/image.jpg')).toBe(true);
			expect(isValidUrl('https://example.com/image.jpeg')).toBe(true);
			expect(isValidUrl('https://example.com/image.png')).toBe(true);
			expect(isValidUrl('https://example.com/image.webp')).toBe(true);
		});

		it('should validate URLs with query parameters', () => {
			expect(isValidUrl('https://example.com/image.jpg?param=value')).toBe(true);
			expect(isValidUrl('https://example.com/image?format=jpg')).toBe(true);
		});

		it('should validate data URLs', () => {
			expect(isValidUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD')).toBe(true);
		});

		it('should validate require() results (numbers)', () => {
			expect(isValidUrl(12345)).toBe(true);
		});

		it('should reject invalid URLs', () => {
			expect(isValidUrl('')).toBe(false);
			expect(isValidUrl('   ')).toBe(false);
			expect(isValidUrl(null as unknown as string)).toBe(false);
			expect(isValidUrl(undefined as unknown as string)).toBe(false);
		});
	});

	describe('validateTrack', () => {
		it('should validate a valid track', () => {
			const validTrack: AudioProTrack = {
				id: 'test-track-1',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
				artist: 'Test Artist',
			};

			expect(validateTrack(validTrack)).toBe(true);
		});

		it('should reject a track with missing id', () => {
			const invalidTrack = {
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			} as AudioProTrack;

			expect(validateTrack(invalidTrack)).toBe(false);
		});

		it('should reject a track with empty url', () => {
			const invalidTrack = {
				id: 'test-track-1',
				url: '',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			} as AudioProTrack;

			expect(validateTrack(invalidTrack)).toBe(false);
		});

		it('should reject a track with missing title', () => {
			const invalidTrack = {
				id: 'test-track-1',
				url: 'https://example.com/audio.mp3',
				artwork: 'https://example.com/artwork.jpg',
			} as AudioProTrack;

			expect(validateTrack(invalidTrack)).toBe(false);
		});

		it('should reject a track with missing artwork', () => {
			const invalidTrack = {
				id: 'test-track-1',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
			} as AudioProTrack;

			expect(validateTrack(invalidTrack)).toBe(false);
		});
	});

	describe('normalizeFilePath', () => {
		it('should add file:// prefix to local paths', () => {
			expect(normalizeFilePath('/data/user/0/com.example.app/files/abc.mp3')).toBe(
				'file:///data/user/0/com.example.app/files/abc.mp3',
			);
		});

		it('should not modify paths that already have file:// prefix', () => {
			const path = 'file:///data/user/0/com.example.app/files/abc.mp3';
			expect(normalizeFilePath(path)).toBe(path);
		});

		it('should not modify http/https URLs', () => {
			const httpPath = 'http://example.com/audio.mp3';
			const httpsPath = 'https://example.com/audio.mp3';
			expect(normalizeFilePath(httpPath)).toBe(httpPath);
			expect(normalizeFilePath(httpsPath)).toBe(httpsPath);
		});

		it('should not modify relative paths', () => {
			const relativePath = 'audio/music.mp3';
			expect(normalizeFilePath(relativePath)).toBe(relativePath);
		});
	});

	describe('normalizeVolume', () => {
		it('should clamp values between 0 and 1', () => {
			expect(normalizeVolume(-0.5)).toBe(0);
			expect(normalizeVolume(1.5)).toBe(1);
		});

		it('should format values to 2 decimal places', () => {
			expect(normalizeVolume(0.123456)).toBe(0.12);
			expect(normalizeVolume(0.56789)).toBe(0.57);
		});

		it('should handle zero correctly', () => {
			expect(normalizeVolume(0)).toBe(0);
			// Test for floating point artifacts that should be converted to 0
			expect(normalizeVolume(1.3877787807814457e-16)).toBe(0);
		});

		it('should handle values close to 0 correctly', () => {
			expect(normalizeVolume(0.0001)).toBe(0);
			expect(normalizeVolume(0.001)).toBe(0);
			expect(normalizeVolume(0.0011)).toBe(0);
		});

		it('should handle values close to 1 correctly', () => {
			// These should be rounded to 1 based on our threshold (> 0.995)
			expect(normalizeVolume(0.996)).toBe(1);
			expect(normalizeVolume(0.999)).toBe(1);
			// This is exactly at our threshold, so it should be formatted to 2 decimal places
			expect(normalizeVolume(0.995)).toBe(0.99);
		});

		it('should handle common volume values correctly', () => {
			expect(normalizeVolume(0.1)).toBe(0.1);
			expect(normalizeVolume(0.10000000000000014)).toBe(0.1); // Fix floating point noise
			expect(normalizeVolume(0.5)).toBe(0.5);
			expect(normalizeVolume(0.7)).toBe(0.7);
		});
	});

	describe('guardTrackPlaying', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			console.error = jest.fn();
		});

		afterEach(() => {
			console.error = originalConsole.error;
		});

		it('should return true when a track is playing', () => {
			// Mock that a track is playing
			require('../useInternalStore').useInternalStore.getState.mockReturnValueOnce({
				trackPlaying: {
					id: 'test-track',
					url: 'https://example.com/audio.mp3',
					title: 'Test Track',
					artwork: 'https://example.com/artwork.jpg',
				},
			});

			expect(guardTrackPlaying('testMethod')).toBe(true);
			expect(console.error).not.toHaveBeenCalled();
		});

		it('should return false and emit error when no track is playing', () => {
			// Mock that no track is playing
			require('../useInternalStore').useInternalStore.getState.mockReturnValueOnce({
				trackPlaying: null,
			});

			expect(guardTrackPlaying('testMethod')).toBe(false);
			expect(console.error).toHaveBeenCalledWith(
				'~~~ AudioPro: testMethod called but no track is playing or has been played.',
			);
			expect(require('../emitter').emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: 'PLAYBACK_ERROR',
				track: null,
				payload: {
					error: '~~~ AudioPro: testMethod called but no track is playing or has been played.',
					errorCode: -1,
				},
			});
		});
	});

	describe('logDebug', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			console.log = jest.fn();
		});

		afterEach(() => {
			console.log = originalConsole.log;
		});

		it('should log when debug is enabled', () => {
			// Mock debug enabled
			require('../useInternalStore').useInternalStore.getState.mockReturnValueOnce({
				debug: true,
			});

			logDebug('Test message', { foo: 'bar' });
			expect(console.log).toHaveBeenCalledWith('~~~', 'Test message', { foo: 'bar' });
		});

		it('should not log when debug is disabled', () => {
			// Mock debug disabled
			require('../useInternalStore').useInternalStore.getState.mockReturnValueOnce({
				debug: false,
			});

			logDebug('Test message', { foo: 'bar' });
			expect(console.log).not.toHaveBeenCalled();
		});
	});

	describe('resolveAssetSource', () => {
		it('should return the string URL as is', () => {
			const url = 'https://example.com/audio.mp3';
			expect(resolveAssetSource(url)).toBe(url);
		});

		it('should resolve require() result to URI', () => {
			const requireResult = 12345;
			expect(resolveAssetSource(requireResult)).toBe(`resolved-${requireResult}`);
		});

		it('should log debug info when resolving require() result', () => {
			// Mock debug enabled
			require('../useInternalStore').useInternalStore.getState.mockReturnValueOnce({
				debug: true,
			});
			console.log = jest.fn();

			const requireResult = 12345;
			resolveAssetSource(requireResult, 'artwork');

			expect(console.log).toHaveBeenCalledWith(
				'~~~',
				'Resolved require() artwork to URI:',
				`resolved-${requireResult}`,
			);
			console.log = originalConsole.log;
		});
	});
});
