import { NativeModules, Platform } from 'react-native';

import { AudioPro } from '../audioPro';
import { normalizeFilePath } from '../utils';

// Mock the NativeModules
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
		},
	},
	Platform: {
		OS: 'ios',
		select: jest.fn().mockImplementation((obj) => obj.ios),
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

// Mock the emitter
jest.mock('../emitter', () => ({
	emitter: {
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
			trackPlaying: null,
			configureOptions: {},
			setTrackPlaying: jest.fn(),
			setConfigureOptions: jest.fn(),
		}),
	},
}));

// Mock console methods
const originalConsole = {
	warn: console.warn,
};

describe('File Path Handling', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		console.warn = jest.fn();
	});

	afterEach(() => {
		console.warn = originalConsole.warn;
	});

	describe('normalizeFilePath function', () => {
		it('should add file:// prefix to local paths', () => {
			expect(normalizeFilePath('/data/user/0/com.example.app/files/audio.mp3')).toBe(
				'file:///data/user/0/com.example.app/files/audio.mp3',
			);
		});

		it('should not modify paths that already have file:// prefix', () => {
			const path = 'file:///data/user/0/com.example.app/files/audio.mp3';
			expect(normalizeFilePath(path)).toBe(path);
		});

		it('should not modify http/https URLs', () => {
			const httpPath = 'http://example.com/audio.mp3';
			const httpsPath = 'https://example.com/audio.mp3';
			expect(normalizeFilePath(httpPath)).toBe(httpPath);
			expect(normalizeFilePath(httpsPath)).toBe(httpsPath);
		});

		it('should not modify rtsp/rtmp URLs', () => {
			const rtspPath = 'rtsp://example.com/stream';
			const rtmpPath = 'rtmp://example.com/stream';
			expect(normalizeFilePath(rtspPath)).toBe(rtspPath);
			expect(normalizeFilePath(rtmpPath)).toBe(rtmpPath);
		});

		it('should show deprecation warning in dev mode when auto-correcting paths', () => {
			// Save original __DEV__ value
			// Save original __DEV__ value using a type assertion
			const originalDev = (global as { __DEV__?: boolean }).__DEV__;

			// Set __DEV__ to true to test warning
			(global as { __DEV__?: boolean }).__DEV__ = true;

			normalizeFilePath('/data/user/0/com.example.app/files/audio.mp3');

			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining(
					'Deprecation Notice: Local file paths must be prefixed with "file://"',
				),
			);

			// Restore original __DEV__ value
			(global as { __DEV__?: boolean }).__DEV__ = originalDev;
		});

		it('should not show deprecation warning in production mode', () => {
			// Save original __DEV__ value
			// Save original __DEV__ value using a type assertion
			const originalDev = (global as { __DEV__?: boolean }).__DEV__;

			// Set __DEV__ to false to test production behavior
			(global as { __DEV__?: boolean }).__DEV__ = false;

			normalizeFilePath('/data/user/0/com.example.app/files/audio.mp3');

			expect(console.warn).not.toHaveBeenCalled();

			// Restore original __DEV__ value
			(global as { __DEV__?: boolean }).__DEV__ = originalDev;
		});
	});

	describe('AudioPro play method with file paths', () => {
		it('should normalize file paths before sending to native module', () => {
			const track = {
				id: 'test-track',
				url: '/data/user/0/com.example.app/files/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			};

			AudioPro.play(track);

			// Check that the normalized path was passed to the native module
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'file:///data/user/0/com.example.app/files/audio.mp3',
				}),
				expect.anything(),
			);
		});

		it('should not modify paths that already have file:// prefix', () => {
			const track = {
				id: 'test-track',
				url: 'file:///data/user/0/com.example.app/files/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			};

			AudioPro.play(track);

			// Check that the path was passed unchanged to the native module
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'file:///data/user/0/com.example.app/files/audio.mp3',
				}),
				expect.anything(),
			);
		});

		it('should handle local file paths in Android cache directories', () => {
			// Set platform to Android for this test
			Platform.OS = 'android';

			const track = {
				id: 'test-track',
				url: '/data/user/0/package.name/cache/folder/file.m4a',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			};

			AudioPro.play(track);

			// Check that the normalized path was passed to the native module
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'file:///data/user/0/package.name/cache/folder/file.m4a',
				}),
				expect.anything(),
			);

			// Reset platform
			Platform.OS = 'ios';
		});

		it('should handle artwork paths that need normalization', () => {
			const track = {
				id: 'test-track',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: '/data/user/0/com.example.app/files/artwork.jpg',
			};

			AudioPro.play(track);

			// Check that the normalized artwork path was passed to the native module
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.objectContaining({
					artwork: 'file:///data/user/0/com.example.app/files/artwork.jpg',
				}),
				expect.anything(),
			);
		});
	});
});
