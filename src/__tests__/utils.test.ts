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
}));

// Mock the emitter
jest.mock('../emitter', () => ({
	emitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

// Import after mocks
import { validateTrack, isValidUrl, normalizeVolume } from '../utils';

import type { AudioProTrack } from '../types';

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
});
