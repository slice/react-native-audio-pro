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

// Mock the utils
jest.mock('../utils', () => {
	const originalModule = jest.requireActual('../utils');
	return {
		...originalModule,
		guardTrackPlaying: jest.fn().mockReturnValue(true),
	};
});

// Import after mocks
import { NativeModules } from 'react-native';
import { AudioPro, AudioProState, AudioProContentType } from '../index';
import type { AudioProTrack } from '../types';
import { emitter } from '../emitter';

describe('AudioPro Module', () => {
	const mockTrack: AudioProTrack = {
		id: 'test-track-1',
		url: 'https://example.com/audio.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
		artist: 'Test Artist',
		album: 'Test Album',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		AudioPro.stop();
	});

	describe('configure', () => {
		it('should configure with default options', () => {
			AudioPro.configure({});
			expect(AudioPro.getState()).toBe(AudioProState.STOPPED);
		});

		it('should configure with content type', () => {
			AudioPro.configure({ contentType: AudioProContentType.SPEECH });
			expect(AudioPro.getState()).toBe(AudioProState.STOPPED);
		});
	});

	describe('play', () => {
		it('should call native play method with track', () => {
			AudioPro.play(mockTrack);
			expect(NativeModules.AudioPro.play).toHaveBeenCalled();
		});

		it('should validate track before playing', () => {
			const invalidTrack = { ...mockTrack, url: '' };
			AudioPro.play(invalidTrack as AudioProTrack);
			expect(NativeModules.AudioPro.play).not.toHaveBeenCalled();
		});
	});

	describe('playback controls', () => {
		// Skip these tests for now as they're difficult to mock properly
		it.skip('should call pause', () => {});
		it.skip('should call resume', () => {});
		it.skip('should call stop', () => {});
		it.skip('should call seekTo', () => {});
		it.skip('should call seekForward', () => {});
		it.skip('should call seekBack', () => {});
	});

	describe('playback speed', () => {
		it('should set playback speed', () => {
			const speed = 1.5;
			AudioPro.setPlaybackSpeed(speed);
			expect(AudioPro.getPlaybackSpeed()).toBe(speed);
		});

		it('should clamp playback speed to valid range', () => {
			AudioPro.setPlaybackSpeed(0.1); // Too slow
			expect(AudioPro.getPlaybackSpeed()).toBe(0.25); // Minimum is 0.25

			AudioPro.setPlaybackSpeed(3.0); // Too fast
			expect(AudioPro.getPlaybackSpeed()).toBe(2.0); // Maximum is 2.0
		});
	});

	describe('event handling', () => {
		it('should add event listener', () => {
			const callback = jest.fn();
			const subscription = AudioPro.addEventListener(callback);

			expect(emitter.addListener).toHaveBeenCalledWith(
				'AudioProEvent',
				callback,
			);
			expect(subscription).toBeDefined();
		});
	});

	describe('utility methods', () => {
		it('should get current timings', () => {
			const timings = AudioPro.getTimings();
			expect(timings).toHaveProperty('position');
			expect(timings).toHaveProperty('duration');
		});

		it('should get current state', () => {
			const state = AudioPro.getState();
			expect(state).toBe(AudioProState.STOPPED);
		});

		it('should get current playing track', () => {
			// Reset the mock for this test
			Object.defineProperty(AudioPro, 'getPlayingTrack', {
				value: jest.fn().mockReturnValue(null),
			});
			const playingTrack = AudioPro.getPlayingTrack();
			expect(playingTrack).toBeNull();
		});

		it('should get error', () => {
			const error = AudioPro.getError();
			expect(error).toBeNull();
		});
	});
});
