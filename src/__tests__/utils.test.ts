import { Image } from 'react-native';

import { useInternalStore } from '../useInternalStore';
import {
	guardTrackPlaying,
	logDebug,
	normalizeFilePath,
	normalizeVolume,
	resolveAssetSource,
	validateTrack,
} from '../utils';

import type { AudioProTrack } from '../types';

// Import centralized mocks
import { NativeEventEmitter } from '../__mocks__';
import { useInternalStoreMock } from '../test-utils';

// Mock console.log for debug logging
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('utils', () => {
	const mockTrack: AudioProTrack = {
		id: 'test-track',
		url: 'https://example.com/test.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useInternalStore.getState as jest.Mock).mockReturnValue({
			...useInternalStoreMock,
			trackPlaying: useInternalStoreMock.trackPlaying,
			debug: useInternalStoreMock.debug,
			debugIncludesProgress: useInternalStoreMock.debugIncludesProgress,
			configureOptions: useInternalStoreMock.configureOptions,
		});
	});

	describe('guardTrackPlaying', () => {
		it('should return true when track is playing', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				trackPlaying: mockTrack,
			});

			const result = guardTrackPlaying('test');

			expect(result).toBe(true);
		});

		it('should return false and log error when no track is playing', () => {
			const result = guardTrackPlaying('test');

			expect(result).toBe(false);
			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('AudioPro: test called but no track is playing'),
			);
		});
	});

	describe('logDebug', () => {
		it('should log when debug is enabled', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				debug: true,
			});

			logDebug('test message', { data: 'test' });

			expect(console.log).toHaveBeenCalledWith('~~~', 'test message', { data: 'test' });
		});

		it('should not log when debug is disabled', () => {
			logDebug('test message', { data: 'test' });

			expect(console.log).not.toHaveBeenCalled();
		});
	});

	describe('normalizeFilePath', () => {
		it('should add file:// prefix to local paths', () => {
			const result = normalizeFilePath('/data/user/0/com.app/files/test.mp3');

			expect(result).toBe('file:///data/user/0/com.app/files/test.mp3');
		});

		it('should not modify paths that already have file:// prefix', () => {
			const result = normalizeFilePath('file:///data/user/0/com.app/files/test.mp3');

			expect(result).toBe('file:///data/user/0/com.app/files/test.mp3');
		});

		it('should not modify remote URLs', () => {
			const result = normalizeFilePath('https://example.com/test.mp3');

			expect(result).toBe('https://example.com/test.mp3');
		});
	});

	describe('normalizeVolume', () => {
		it('should clamp volume to 0-1 range', () => {
			expect(normalizeVolume(-0.5)).toBe(0);
			expect(normalizeVolume(0.5)).toBe(0.5);
			expect(normalizeVolume(1.5)).toBe(1.0);
		});

		it('should handle special cases for values near 0 and 1', () => {
			expect(normalizeVolume(0.0001)).toBe(0);
			expect(normalizeVolume(0.999)).toBe(1.0);
		});
	});

	describe('resolveAssetSource', () => {
		it('should resolve local asset numbers to URIs', () => {
			const mockUri = 'file:///path/to/asset';
			(Image.resolveAssetSource as jest.Mock).mockReturnValue({ uri: mockUri });

			const result = resolveAssetSource(123, 'test');

			expect(Image.resolveAssetSource).toHaveBeenCalledWith(123);
			expect(result).toBe(mockUri);
		});

		it('should return string URLs unchanged', () => {
			const url = 'https://example.com/test.jpg';
			const result = resolveAssetSource(url, 'test');

			expect(Image.resolveAssetSource).not.toHaveBeenCalled();
			expect(result).toBe(url);
		});
	});

	describe('validateTrack', () => {
		it('should validate a complete track', () => {
			const result = validateTrack(mockTrack);

			expect(result).toBe(true);
		});

		it('should reject tracks with missing required fields', () => {
			const invalidTracks = [
				{ ...mockTrack, id: '' },
				{ ...mockTrack, url: '' },
				{ ...mockTrack, title: '' },
				{ ...mockTrack, artwork: '' },
			];

			invalidTracks.forEach((track) => {
				expect(validateTrack(track)).toBe(false);
			});
		});

		it('should reject tracks with invalid URL types', () => {
			const invalidTrack = {
				...mockTrack,
				url: 123, // Should be string or number from require()
			};

			expect(validateTrack(invalidTrack)).toBe(false);
		});
	});
});
