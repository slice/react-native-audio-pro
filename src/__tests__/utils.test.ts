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
import { validateTrack, isValidMediaUrl, isValidArtworkUrl } from '../utils';
import type { AudioProTrack } from '../types';

describe('Utils', () => {
	describe('isValidMediaUrl', () => {
		it('should validate standard audio URLs', () => {
			expect(isValidMediaUrl('https://example.com/audio.mp3')).toBe(true);
			expect(isValidMediaUrl('https://example.com/audio.m4a')).toBe(true);
			expect(isValidMediaUrl('https://example.com/audio.wav')).toBe(true);
			expect(isValidMediaUrl('https://example.com/audio.aac')).toBe(true);
		});

		it('should validate URLs with query parameters', () => {
			expect(
				isValidMediaUrl('https://example.com/audio.mp3?param=value'),
			).toBe(true);
			expect(
				isValidMediaUrl('https://example.com/stream?format=mp3'),
			).toBe(true);
		});

		it('should validate URLs without file extensions', () => {
			expect(isValidMediaUrl('https://example.com/stream')).toBe(true);
			expect(isValidMediaUrl('https://example.com/audio/123456')).toBe(
				true,
			);
		});

		it('should validate the URL from the issue description', () => {
			expect(
				isValidMediaUrl(
					'https://assets.evergrace.app/stories/baby-in-the-bulrushes/baby-in-the-bulrushes-audio-teaser.mp3',
				),
			).toBe(true);
		});

		it('should validate require() results (numbers)', () => {
			expect(isValidMediaUrl(12345)).toBe(true);
		});

		it('should reject invalid URLs', () => {
			expect(isValidMediaUrl('')).toBe(false);
			expect(isValidMediaUrl('   ')).toBe(false);
			expect(isValidMediaUrl(null as unknown as string)).toBe(false);
			expect(isValidMediaUrl(undefined as unknown as string)).toBe(false);
		});
	});

	describe('isValidArtworkUrl', () => {
		it('should validate standard image URLs', () => {
			expect(isValidArtworkUrl('https://example.com/image.jpg')).toBe(
				true,
			);
			expect(isValidArtworkUrl('https://example.com/image.jpeg')).toBe(
				true,
			);
			expect(isValidArtworkUrl('https://example.com/image.png')).toBe(
				true,
			);
			expect(isValidArtworkUrl('https://example.com/image.webp')).toBe(
				true,
			);
		});

		it('should validate URLs with query parameters', () => {
			expect(
				isValidArtworkUrl('https://example.com/image.jpg?param=value'),
			).toBe(true);
			expect(
				isValidArtworkUrl('https://example.com/image?format=jpg'),
			).toBe(true);
		});

		it('should validate data URLs', () => {
			expect(
				isValidArtworkUrl(
					'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
				),
			).toBe(true);
		});

		it('should validate require() results (numbers)', () => {
			expect(isValidArtworkUrl(12345)).toBe(true);
		});

		it('should reject invalid URLs', () => {
			expect(isValidArtworkUrl('')).toBe(false);
			expect(isValidArtworkUrl('   ')).toBe(false);
			expect(isValidArtworkUrl(null as unknown as string)).toBe(false);
			expect(isValidArtworkUrl(undefined as unknown as string)).toBe(
				false,
			);
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
});
