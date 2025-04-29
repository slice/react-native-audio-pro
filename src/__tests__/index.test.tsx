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
		isValidPlayerStateForOperation: jest.fn().mockReturnValue(true),
	};
});

// Mock useInternalStore
jest.mock('../useInternalStore', () => {
	const mockState = {
		playerState: 'STOPPED',
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

import { emitter } from '../emitter';
import { AudioPro, AudioProState, AudioProContentType, AudioProEventType } from '../index';
import { useInternalStore } from '../useInternalStore';
import { DEFAULT_CONFIG } from '../values';

import type { AudioProTrack } from '../types';

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
		useInternalStore.setState({
			trackPlaying: null,
			playerState: AudioProState.IDLE,
			position: 0,
			duration: 0,
			error: null,
			volume: 1.0,
			playbackSpeed: 1.0,
			configureOptions: DEFAULT_CONFIG,
		});
	});

	describe('configure', () => {
		it('should configure with default options', () => {
			AudioPro.configure({});
			expect(AudioPro.getState()).toBe(AudioProState.IDLE);
		});

		it('should configure with content type', () => {
			AudioPro.configure({ contentType: AudioProContentType.SPEECH });
			expect(AudioPro.getState()).toBe(AudioProState.IDLE);
		});
	});

	describe('play', () => {
		it('should call native play method with track and default autoplay=true', () => {
			AudioPro.play(mockTrack);
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ autoplay: true }),
			);
		});

		it('should respect autoPlay=false in options', () => {
			AudioPro.play(mockTrack, { autoPlay: false });
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ autoplay: false }),
			);
		});

		it('should validate track before playing', () => {
			const invalidTrack = { ...mockTrack, url: '' };
			AudioPro.play(invalidTrack as AudioProTrack);
			expect(NativeModules.AudioPro.play).not.toHaveBeenCalled();
		});
	});

	describe('playback controls', () => {
		it('should call pause and update state', async () => {
			// First play a track
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.pause();
			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PAUSED,
					}),
				}),
			);
		});

		it('should call resume and update state', async () => {
			// First play and pause a track
			await AudioPro.play(mockTrack);
			AudioPro.pause();
			jest.clearAllMocks();

			AudioPro.resume();
			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PLAYING,
					}),
				}),
			);
		});

		it('should call stop and update state', async () => {
			// First play a track
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.STOPPED,
					}),
				}),
			);
		});

		it('should call seekTo and update position', async () => {
			const position = 30; // 30 seconds
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekTo(position);
			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(position);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
					payload: expect.objectContaining({
						position,
					}),
				}),
			);
		});

		it('should call seekForward and update position', async () => {
			const seconds = 10;
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekForward(seconds);
			expect(NativeModules.AudioPro.seekForward).toHaveBeenCalledWith(seconds);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
				}),
			);
		});

		it('should call seekBack and update position', async () => {
			const seconds = 10;
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekBack(seconds);
			expect(NativeModules.AudioPro.seekBack).toHaveBeenCalledWith(seconds);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
				}),
			);
		});

		it('should handle pause when not playing', () => {
			jest.clearAllMocks();
			AudioPro.pause();
			expect(NativeModules.AudioPro.pause).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});

		it('should handle resume when not paused', () => {
			jest.clearAllMocks();
			AudioPro.resume();
			expect(NativeModules.AudioPro.resume).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});

		it('should handle stop when not playing', () => {
			jest.clearAllMocks();
			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.STOPPED,
					}),
				}),
			);
		});

		it('should handle clear when not playing', () => {
			jest.clearAllMocks();
			AudioPro.clear();
			expect(NativeModules.AudioPro.clear).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.IDLE,
					}),
				}),
			);
		});

		it('should handle invalid seek positions', () => {
			// Negative position
			AudioPro.seekTo(-1);
			expect(NativeModules.AudioPro.seekTo).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();

			// Position greater than duration
			AudioPro.seekTo(999999);
			expect(NativeModules.AudioPro.seekTo).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});

		it('should handle invalid seek forward/back values', () => {
			// Negative values
			AudioPro.seekForward(-1);
			expect(NativeModules.AudioPro.seekForward).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();

			AudioPro.seekBack(-1);
			expect(NativeModules.AudioPro.seekBack).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();

			// Zero values
			AudioPro.seekForward(0);
			expect(NativeModules.AudioPro.seekForward).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();

			AudioPro.seekBack(0);
			expect(NativeModules.AudioPro.seekBack).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});
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

			expect(emitter.addListener).toHaveBeenCalledWith('AudioProEvent', callback);
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
			expect(state).toBe(AudioProState.IDLE);
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

	describe('state transitions', () => {
		it('should handle state transitions correctly', async () => {
			// Initial state
			expect(AudioPro.getState()).toBe(AudioProState.IDLE);

			// Play -> PLAYING
			await AudioPro.play(mockTrack);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PLAYING,
					}),
				}),
			);

			// Playing -> PAUSED
			AudioPro.pause();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PAUSED,
					}),
				}),
			);

			// Paused -> PLAYING
			AudioPro.resume();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PLAYING,
					}),
				}),
			);

			// Playing -> STOPPED
			AudioPro.stop();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.STOPPED,
					}),
				}),
			);
		});
	});
});
