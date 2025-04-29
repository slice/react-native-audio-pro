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
		useInternalStore: {
			getState: jest.fn().mockReturnValue(mockState),
			setState: jest.fn(),
		},
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
			// No state changes from TypeScript layer
		});

		it('should configure with content type', () => {
			AudioPro.configure({ contentType: AudioProContentType.SPEECH });
			// No state changes from TypeScript layer
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
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.PLAYBACK_ERROR,
					payload: expect.objectContaining({
						error: 'AudioPro: Invalid track provided to play().',
					}),
				}),
			);
		});
	});

	describe('playback controls', () => {
		it('should call pause', async () => {
			// First play a track
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.pause();
			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should call resume', async () => {
			// First play and pause a track
			await AudioPro.play(mockTrack);
			AudioPro.pause();
			jest.clearAllMocks();

			AudioPro.resume();
			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should call stop', async () => {
			// First play a track
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should call seekTo', async () => {
			const position = 30; // 30 seconds
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekTo(position);
			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(position);
			// No state changes from TypeScript layer
		});

		it('should call seekForward', async () => {
			const seconds = 10;
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekForward(seconds);
			expect(NativeModules.AudioPro.seekForward).toHaveBeenCalledWith(seconds);
			// No state changes from TypeScript layer
		});

		it('should call seekBack', async () => {
			const seconds = 10;
			await AudioPro.play(mockTrack);
			jest.clearAllMocks();

			AudioPro.seekBack(seconds);
			expect(NativeModules.AudioPro.seekBack).toHaveBeenCalledWith(seconds);
			// No state changes from TypeScript layer
		});

		it('should handle pause when not playing', () => {
			jest.clearAllMocks();
			AudioPro.pause();
			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should handle resume when not paused', () => {
			jest.clearAllMocks();
			AudioPro.resume();
			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should handle stop when not playing', () => {
			jest.clearAllMocks();
			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should handle clear when not playing', () => {
			jest.clearAllMocks();
			AudioPro.clear();
			expect(NativeModules.AudioPro.clear).toHaveBeenCalled();
			// No state changes from TypeScript layer
		});

		it('should handle invalid seek positions', () => {
			// Position less than 0
			AudioPro.seekTo(-1);
			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(0);

			// Position greater than duration
			AudioPro.seekTo(999999);
			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(999999);
		});

		it('should handle invalid seek forward/back values', () => {
			// Negative values
			AudioPro.seekForward(-1);
			expect(NativeModules.AudioPro.seekForward).not.toHaveBeenCalled();

			AudioPro.seekBack(-1);
			expect(NativeModules.AudioPro.seekBack).not.toHaveBeenCalled();

			// Zero values
			AudioPro.seekForward(0);
			expect(NativeModules.AudioPro.seekForward).not.toHaveBeenCalled();

			AudioPro.seekBack(0);
			expect(NativeModules.AudioPro.seekBack).not.toHaveBeenCalled();
		});
	});

	describe('playback speed', () => {
		it('should set playback speed', () => {
			const speed = 1.5;
			AudioPro.setPlaybackSpeed(speed);
			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(speed);
		});

		it('should clamp playback speed to valid range', () => {
			AudioPro.setPlaybackSpeed(0.1); // Too slow
			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(0.25); // Minimum is 0.25

			AudioPro.setPlaybackSpeed(3.0); // Too fast
			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(2.0); // Maximum is 2.0
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
			expect(state).toBe(useInternalStore.getState().playerState);
		});

		it('should get current playing track', () => {
			const playingTrack = AudioPro.getPlayingTrack();
			expect(playingTrack).toBe(useInternalStore.getState().trackPlaying);
		});

		it('should get error', () => {
			const error = AudioPro.getError();
			expect(error).toBe(useInternalStore.getState().error);
		});
	});

	describe('state transitions', () => {
		it('should handle state transitions correctly', async () => {
			// Initial state
			expect(AudioPro.getState()).toBe(useInternalStore.getState().playerState);

			// Play -> PLAYING
			await AudioPro.play(mockTrack);
			expect(NativeModules.AudioPro.play).toHaveBeenCalled();

			// Playing -> PAUSED
			AudioPro.pause();
			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();

			// Paused -> PLAYING
			AudioPro.resume();
			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();

			// Playing -> STOPPED
			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
		});
	});
});
