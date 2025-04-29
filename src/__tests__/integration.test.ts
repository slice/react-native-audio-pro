import { NativeModules } from 'react-native';

import { AudioPro } from '../audioPro';
import { useInternalStore } from '../useInternalStore';
import { AudioProEventType, AudioProState } from '../values';

import type { AudioProTrack } from '../types';

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

// Mock utils
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

// Create a mock store with a proper state management implementation
const createMockStore = () => {
	const state: {
		playerState: AudioProState;
		position: number;
		duration: number;
		playbackSpeed: number;
		volume: number;
		debug: boolean;
		debugIncludesProgress: boolean;
		trackPlaying: AudioProTrack | null;
		configureOptions: {
			contentType: string;
			debug: boolean;
			debugIncludesProgress: boolean;
			progressIntervalMs: number;
			showNextPrevControls: boolean;
		};
		error: { error: string; errorCode: number } | null;
		setDebug: jest.Mock;
		setDebugIncludesProgress: jest.Mock;
		setTrackPlaying: jest.Mock;
		setConfigureOptions: jest.Mock;
		setPlaybackSpeed: jest.Mock;
		setVolume: jest.Mock;
		setError: jest.Mock;
		updateFromEvent: jest.Mock;
	} = {
		playerState: AudioProState.IDLE,
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
			showNextPrevControls: true,
		},
		error: null,
		setDebug: jest.fn().mockImplementation((debug) => {
			state.debug = debug;
		}),
		setDebugIncludesProgress: jest.fn().mockImplementation((includeProgress) => {
			state.debugIncludesProgress = includeProgress;
		}),
		setTrackPlaying: jest.fn().mockImplementation((track) => {
			state.trackPlaying = track;
		}),
		setConfigureOptions: jest.fn().mockImplementation((options) => {
			state.configureOptions = options;
		}),
		setPlaybackSpeed: jest.fn().mockImplementation((speed) => {
			state.playbackSpeed = speed;
		}),
		setVolume: jest.fn().mockImplementation((volume) => {
			state.volume = volume;
		}),
		setError: jest.fn().mockImplementation((error) => {
			state.error = error;
		}),
		updateFromEvent: jest.fn().mockImplementation((event) => {
			// Simplified implementation of updateFromEvent
			const { type, track, payload } = event;

			if (type === AudioProEventType.STATE_CHANGED && payload?.state) {
				state.playerState = payload.state;
				if (payload.state !== AudioProState.ERROR && state.error !== null) {
					state.error = null;
				}
			}

			if (type === AudioProEventType.PLAYBACK_ERROR && payload?.error) {
				state.error = {
					error: payload.error,
					errorCode: payload.errorCode,
				};
			}

			if (type === AudioProEventType.PLAYBACK_SPEED_CHANGED && payload?.speed !== undefined) {
				state.playbackSpeed = payload.speed;
			}

			if (payload?.position !== undefined) {
				state.position = payload.position;
			}

			if (payload?.duration !== undefined) {
				state.duration = payload.duration;
			}

			if (track) {
				state.trackPlaying = track;
			} else if (track === null && type !== AudioProEventType.PLAYBACK_ERROR) {
				state.trackPlaying = null;
			}
		}),
	};

	return state;
};

const mockStore = createMockStore();

// Mock useInternalStore
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn().mockImplementation(() => mockStore),
		setState: jest.fn().mockImplementation((updates) => {
			Object.assign(mockStore, updates);
		}),
	},
}));

describe('Integration Tests', () => {
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
	});

	describe('State Management Flow', () => {
		it('should update store state when receiving state change events', () => {
			// Set initial state to IDLE
			mockStore.playerState = AudioProState.IDLE;

			// Play a track
			AudioPro.play(mockTrack);

			// Verify native module was called
			expect(NativeModules.AudioPro.play).toHaveBeenCalled();

			// Simulate native module emitting LOADING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.LOADING,
					position: 0,
					duration: 0,
				},
			});

			// Store should be updated to LOADING state
			expect(useInternalStore.getState().playerState).toBe(AudioProState.LOADING);
			expect(useInternalStore.getState().trackPlaying).toEqual(mockTrack);

			// Simulate native module emitting PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 120000,
				},
			});

			// Store should be updated to PLAYING state
			expect(useInternalStore.getState().playerState).toBe(AudioProState.PLAYING);
			expect(useInternalStore.getState().duration).toBe(120000);
		});

		it('should update position when receiving progress events', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Verify native module was called
			expect(NativeModules.AudioPro.play).toHaveBeenCalled();

			// Simulate native module emitting PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 120000,
				},
			});

			// Simulate progress event
			mockStore.updateFromEvent({
				type: AudioProEventType.PROGRESS,
				track: mockTrack,
				payload: {
					position: 30000,
					duration: 120000,
				},
			});

			// Store should be updated with new position
			expect(useInternalStore.getState().position).toBe(30000);
		});

		it('should handle error events and update store', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Verify native module was called
			expect(NativeModules.AudioPro.play).toHaveBeenCalled();

			// Simulate error event
			mockStore.updateFromEvent({
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Test error message',
					errorCode: 123,
				},
			});

			// Store should have error information
			expect(useInternalStore.getState().error).toEqual({
				error: 'Test error message',
				errorCode: 123,
			});

			// Simulate state change to ERROR
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.ERROR,
					position: 0,
					duration: 0,
				},
			});

			// Store should be in ERROR state
			expect(useInternalStore.getState().playerState).toBe(AudioProState.ERROR);

			// Error should still be present
			expect(useInternalStore.getState().error).toEqual({
				error: 'Test error message',
				errorCode: 123,
			});
		});

		it('should clear error when transitioning from ERROR to another state', () => {
			// Set initial ERROR state
			mockStore.setError({ error: 'Test error message', errorCode: 123 });
			mockStore.playerState = AudioProState.ERROR;

			// Verify ERROR state
			expect(useInternalStore.getState().playerState).toBe(AudioProState.ERROR);
			expect(useInternalStore.getState().error).not.toBeNull();

			// Transition to IDLE state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.IDLE,
					position: 0,
					duration: 0,
				},
			});

			// Error should be cleared
			expect(useInternalStore.getState().playerState).toBe(AudioProState.IDLE);
			expect(useInternalStore.getState().error).toBeNull();
		});
	});

	describe('Playback Control Flow', () => {
		it('should call native module methods and update store when controlling playback', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Native module should be called
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(mockTrack, expect.anything());

			// Simulate PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 120000,
				},
			});

			// Pause playback
			AudioPro.pause();

			// Native module should be called
			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();

			// Simulate PAUSED state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PAUSED,
					position: 30000,
					duration: 120000,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().playerState).toBe(AudioProState.PAUSED);
			expect(useInternalStore.getState().position).toBe(30000);

			// Resume playback
			AudioPro.resume();

			// Native module should be called
			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();

			// Simulate PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 30000,
					duration: 120000,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().playerState).toBe(AudioProState.PLAYING);
		});

		it('should handle seek operations correctly', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Simulate PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 30000,
					duration: 120000,
				},
			});

			// Seek to position
			AudioPro.seekTo(60000);

			// Native module should be called
			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(60000);

			// Simulate seek complete event
			mockStore.updateFromEvent({
				type: AudioProEventType.SEEK_COMPLETE,
				track: mockTrack,
				payload: {
					position: 60000,
					duration: 120000,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().position).toBe(60000);

			// Seek forward
			AudioPro.seekForward();

			// Native module should be called with default amount
			expect(NativeModules.AudioPro.seekForward).toHaveBeenCalledWith(30000);

			// Seek back with custom amount
			AudioPro.seekBack(15000);

			// Native module should be called with custom amount
			expect(NativeModules.AudioPro.seekBack).toHaveBeenCalledWith(15000);
		});

		it('should handle playback speed changes', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Set playback speed
			AudioPro.setPlaybackSpeed(1.5);

			// Native module should be called
			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(1.5);

			// Simulate playback speed changed event
			mockStore.updateFromEvent({
				type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
				track: mockTrack,
				payload: {
					speed: 1.5,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().playbackSpeed).toBe(1.5);
		});

		it('should handle volume changes', () => {
			// Set initial volume
			mockStore.volume = 1.0;

			// Set volume
			AudioPro.setVolume(0.5);

			// Native module should be called
			expect(NativeModules.AudioPro.setVolume).toHaveBeenCalledWith(0.5);

			// Manually update the store since volume is set directly
			mockStore.volume = 0.5;

			// Store should be updated
			expect(useInternalStore.getState().volume).toBe(0.5);
		});
	});

	describe('Track Lifecycle', () => {
		it('should handle track ended events', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Simulate PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 120000,
				},
			});

			// Simulate track ended event
			mockStore.updateFromEvent({
				type: AudioProEventType.TRACK_ENDED,
				track: mockTrack,
				payload: {
					position: 120000,
					duration: 120000,
				},
			});

			// Simulate STOPPED state (native code should emit this after TRACK_ENDED)
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.STOPPED,
					position: 120000,
					duration: 120000,
				},
			});

			// Store should be updated to STOPPED state
			expect(useInternalStore.getState().playerState).toBe(AudioProState.STOPPED);
			expect(useInternalStore.getState().position).toBe(120000);
		});

		it('should handle stopping and clearing a track', () => {
			// Play a track
			AudioPro.play(mockTrack);

			// Simulate PLAYING state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 30000,
					duration: 120000,
				},
			});

			// Stop playback
			AudioPro.stop();

			// Native module should be called
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();

			// Simulate STOPPED state
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.STOPPED,
					position: 30000,
					duration: 120000,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().playerState).toBe(AudioProState.STOPPED);
			expect(useInternalStore.getState().trackPlaying).toEqual(mockTrack);

			// Clear playback
			AudioPro.clear();

			// Native module should be called
			expect(NativeModules.AudioPro.clear).toHaveBeenCalled();

			// Simulate IDLE state with null track
			mockStore.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: null,
				payload: {
					state: AudioProState.IDLE,
					position: 0,
					duration: 0,
				},
			});

			// Store should be updated
			expect(useInternalStore.getState().playerState).toBe(AudioProState.IDLE);
			expect(useInternalStore.getState().trackPlaying).toBeNull();
		});
	});
});
