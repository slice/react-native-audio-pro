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
import { validateTrack } from '../utils';
import type { AudioProTrack } from '../types';

describe('Utils', () => {
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
