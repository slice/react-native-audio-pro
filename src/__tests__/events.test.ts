import { useInternalStore } from '../useInternalStore';
import { AudioProAmbientEventType, AudioProEventType, AudioProState } from '../values';

import type { AudioProAmbientEvent, AudioProEvent, AudioProTrack } from '../types';

// Store the callbacks for testing
let mainEventCallback: ((event: AudioProEvent) => void) | null = null;
let ambientEventCallback: ((event: AudioProAmbientEvent) => void) | null = null;

// Mock the NativeEventEmitter and NativeModules
jest.mock('react-native', () => ({
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn((eventName, callback) => {
			// Store the callback based on the event name
			if (eventName === 'AudioProEvent') {
				mainEventCallback = callback;
			} else if (eventName === 'AudioProAmbientEvent') {
				ambientEventCallback = callback;
			}

			return { remove: jest.fn() };
		}),
	})),
	NativeModules: {
		AudioPro: {},
	},
}));

// Mock logDebug
jest.mock('../utils', () => ({
	logDebug: jest.fn(),
	normalizeFilePath: jest.fn((path) => path),
	normalizeVolume: jest.fn((volume) => volume),
	validateTrack: jest.fn(() => true),
	guardTrackPlaying: jest.fn(() => true),
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

describe('Event Handling', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Re-import the emitter to trigger the setup
		jest.isolateModules(() => {
			require('../emitter');
		});
	});

	describe('Main Audio Events', () => {
		it('should update store when receiving STATE_CHANGED event', () => {
			// Ensure callback was registered
			expect(mainEventCallback).not.toBeNull();

			const mockTrack = {
				id: 'test-track',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			};

			// Call the callback with a STATE_CHANGED event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: mockTrack,
					payload: {
						state: AudioProState.PLAYING,
						position: 30000,
						duration: 120000,
					},
				});
			}

			// Store should be updated
			expect(useInternalStore.getState().playerState).toBe(AudioProState.PLAYING);
			expect(useInternalStore.getState().position).toBe(30000);
			expect(useInternalStore.getState().duration).toBe(120000);
			expect(useInternalStore.getState().trackPlaying).toEqual(mockTrack);
		});

		it('should update store when receiving PROGRESS event', () => {
			// Set initial track
			useInternalStore.getState().setTrackPlaying({
				id: 'test-track',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			});

			// Call the callback with a PROGRESS event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.PROGRESS,
					track: useInternalStore.getState().trackPlaying,
					payload: {
						position: 45000,
						duration: 120000,
					},
				});
			}

			// Store should be updated
			expect(useInternalStore.getState().position).toBe(45000);
			expect(useInternalStore.getState().duration).toBe(120000);
		});

		it('should update store when receiving PLAYBACK_ERROR event', () => {
			// Call the callback with a PLAYBACK_ERROR event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.PLAYBACK_ERROR,
					track: null,
					payload: {
						error: 'Test error message',
						errorCode: 123,
					},
				});
			}

			// Store should be updated
			expect(useInternalStore.getState().error).toEqual({
				error: 'Test error message',
				errorCode: 123,
			});
		});

		it('should update store when receiving PLAYBACK_SPEED_CHANGED event', () => {
			// Set initial track
			useInternalStore.getState().setTrackPlaying({
				id: 'test-track',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
			});

			// Call the callback with a PLAYBACK_SPEED_CHANGED event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
					track: useInternalStore.getState().trackPlaying,
					payload: {
						speed: 1.5,
					},
				});
			}

			// Store should be updated
			expect(useInternalStore.getState().playbackSpeed).toBe(1.5);
		});

		it('should handle REMOTE_NEXT and REMOTE_PREV events', () => {
			// Reset the store state to IDLE before this test
			mockStore.playerState = AudioProState.IDLE;

			// These events don't update the store directly, but they should be processed
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.REMOTE_NEXT,
					track: null,
				});

				mainEventCallback({
					type: AudioProEventType.REMOTE_PREV,
					track: null,
				});
			}

			// Store should remain unchanged
			expect(useInternalStore.getState().playerState).toBe(AudioProState.IDLE);
		});

		it('should log events when debug is enabled', () => {
			// Enable debug
			mockStore.debug = true;

			// Mock the logDebug implementation to actually call the mock
			const mockLogDebug = jest.fn();
			jest.spyOn(require('../utils'), 'logDebug').mockImplementation(mockLogDebug);

			// We need to re-mock the emitter to use our updated logDebug mock
			jest.isolateModules(() => {
				const emitterModule = require('../emitter');
				mainEventCallback = emitterModule.emitter.addListener.mock.calls[0][1];
			});

			// Call the callback with a STATE_CHANGED event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test-track',
						url: 'https://example.com/audio.mp3',
						title: 'Test Track',
						artwork: 'https://example.com/artwork.jpg',
					},
					payload: {
						state: AudioProState.PLAYING,
					},
				});
			}

			// logDebug should be called
			expect(mockLogDebug).toHaveBeenCalled();
		});

		it('should not log PROGRESS events when debugIncludesProgress is false', () => {
			// Enable debug but not progress
			mockStore.debug = true;
			mockStore.debugIncludesProgress = false;

			// Mock the logDebug implementation to actually call the mock
			const mockLogDebug = jest.fn();
			jest.spyOn(require('../utils'), 'logDebug').mockImplementation(mockLogDebug);

			// We need to re-mock the emitter to use our updated logDebug mock
			jest.isolateModules(() => {
				const emitterModule = require('../emitter');
				mainEventCallback = emitterModule.emitter.addListener.mock.calls[0][1];
			});

			// Call the callback with a PROGRESS event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.PROGRESS,
					track: {
						id: 'test-track',
						url: 'https://example.com/audio.mp3',
						title: 'Test Track',
						artwork: 'https://example.com/artwork.jpg',
					},
					payload: {
						position: 30000,
						duration: 120000,
					},
				});
			}

			// logDebug should not be called for PROGRESS events
			expect(mockLogDebug).not.toHaveBeenCalled();
		});

		it('should log PROGRESS events when debugIncludesProgress is true', () => {
			// Enable debug and progress
			mockStore.debug = true;
			mockStore.debugIncludesProgress = true;

			// Mock the logDebug implementation to actually call the mock
			const mockLogDebug = jest.fn();
			jest.spyOn(require('../utils'), 'logDebug').mockImplementation(mockLogDebug);

			// We need to re-mock the emitter to use our updated logDebug mock
			jest.isolateModules(() => {
				const emitterModule = require('../emitter');
				mainEventCallback = emitterModule.emitter.addListener.mock.calls[0][1];
			});

			// Call the callback with a PROGRESS event
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.PROGRESS,
					track: {
						id: 'test-track',
						url: 'https://example.com/audio.mp3',
						title: 'Test Track',
						artwork: 'https://example.com/artwork.jpg',
					},
					payload: {
						position: 30000,
						duration: 120000,
					},
				});
			}

			// logDebug should be called for PROGRESS events when enabled
			expect(mockLogDebug).toHaveBeenCalled();
		});
	});

	describe('Ambient Audio Events', () => {
		it('should handle AMBIENT_TRACK_ENDED event', () => {
			// Ensure callback was registered
			expect(ambientEventCallback).not.toBeNull();

			// Call the callback with an AMBIENT_TRACK_ENDED event
			if (ambientEventCallback) {
				ambientEventCallback({
					type: AudioProAmbientEventType.AMBIENT_TRACK_ENDED,
				});
			}

			// No store updates expected for ambient events
		});

		it('should handle AMBIENT_ERROR event', () => {
			// Call the callback with an AMBIENT_ERROR event
			if (ambientEventCallback) {
				ambientEventCallback({
					type: AudioProAmbientEventType.AMBIENT_ERROR,
					payload: {
						error: 'Ambient audio error',
					},
				});
			}

			// No store updates expected for ambient events
		});
	});

	describe('Edge Cases', () => {
		it('should handle events with missing payload', () => {
			// Call the callback with an event missing payload
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test-track',
						url: 'https://example.com/audio.mp3',
						title: 'Test Track',
						artwork: 'https://example.com/artwork.jpg',
					},
					// No payload
				});
			}

			// Should not throw an error
		});

		it('should handle events with incomplete payload', () => {
			// Call the callback with an event with incomplete payload
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test-track',
						url: 'https://example.com/audio.mp3',
						title: 'Test Track',
						artwork: 'https://example.com/artwork.jpg',
					},
					payload: {
						// Missing state
						position: 30000,
					},
				});
			}

			// Should not throw an error
			// Position should be updated
			expect(useInternalStore.getState().position).toBe(30000);
		});

		it('should handle track changes', () => {
			// Set initial track
			const initialTrack = {
				id: 'initial-track',
				url: 'https://example.com/initial.mp3',
				title: 'Initial Track',
				artwork: 'https://example.com/initial.jpg',
			};

			useInternalStore.getState().setTrackPlaying(initialTrack);

			// Call the callback with a new track
			const newTrack = {
				id: 'new-track',
				url: 'https://example.com/new.mp3',
				title: 'New Track',
				artwork: 'https://example.com/new.jpg',
			};

			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: newTrack,
					payload: {
						state: AudioProState.PLAYING,
					},
				});
			}

			// Track should be updated
			expect(useInternalStore.getState().trackPlaying).toEqual(newTrack);
		});

		it('should handle track unloading', () => {
			// Set initial track
			const initialTrack = {
				id: 'initial-track',
				url: 'https://example.com/initial.mp3',
				title: 'Initial Track',
				artwork: 'https://example.com/initial.jpg',
			};

			useInternalStore.getState().setTrackPlaying(initialTrack);

			// Call the callback with null track
			if (mainEventCallback) {
				mainEventCallback({
					type: AudioProEventType.STATE_CHANGED,
					track: null,
					payload: {
						state: AudioProState.IDLE,
					},
				});
			}

			// Track should be null
			expect(useInternalStore.getState().trackPlaying).toBeNull();
		});
	});
});
