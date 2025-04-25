import { act, renderHook } from '@testing-library/react-hooks';

import { useInternalStore } from '../useInternalStore';
import { normalizeVolume } from '../utils';
import { AudioProEventType, AudioProState, DEFAULT_CONFIG } from '../values';

describe('useInternalStore', () => {
	// Reset the store before each test
	beforeEach(() => {
		act(() => {
			useInternalStore.setState({
				playerState: AudioProState.IDLE,
				position: 0,
				duration: 0,
				playbackSpeed: 1.0,
				volume: normalizeVolume(1.0),
				debug: false,
				debugIncludesProgress: false,
				trackPlaying: null,
				configureOptions: { ...DEFAULT_CONFIG },
				error: null,
				setDebug: useInternalStore.getState().setDebug,
				setDebugIncludesProgress: useInternalStore.getState().setDebugIncludesProgress,
				setTrackPlaying: useInternalStore.getState().setTrackPlaying,
				setConfigureOptions: useInternalStore.getState().setConfigureOptions,
				setPlaybackSpeed: useInternalStore.getState().setPlaybackSpeed,
				setVolume: useInternalStore.getState().setVolume,
				setError: useInternalStore.getState().setError,
				updateFromEvent: useInternalStore.getState().updateFromEvent,
			});
		});
	});

	describe('initialization', () => {
		it('should initialize with default values', () => {
			const { result } = renderHook(() => useInternalStore());

			expect(result.current.playerState).toBe(AudioProState.IDLE);
			expect(result.current.position).toBe(0);
			expect(result.current.duration).toBe(0);
			expect(result.current.playbackSpeed).toBe(1.0);
			expect(result.current.volume).toBe(1.0);
			expect(result.current.debug).toBe(false);
			expect(result.current.debugIncludesProgress).toBe(false);
			expect(result.current.trackPlaying).toBeNull();
			expect(result.current.configureOptions).toEqual(DEFAULT_CONFIG);
			expect(result.current.error).toBeNull();
		});
	});

	describe('setter functions', () => {
		it('should set debug flag', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.setDebug(true);
			});

			expect(result.current.debug).toBe(true);
		});

		it('should set debugIncludesProgress flag', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.setDebugIncludesProgress(true);
			});

			expect(result.current.debugIncludesProgress).toBe(true);
		});

		it('should set trackPlaying', () => {
			const { result } = renderHook(() => useInternalStore());
			const track = { id: 'test', url: 'test.mp3', title: 'Test Track', artwork: 'test.jpg' };

			act(() => {
				result.current.setTrackPlaying(track);
			});

			expect(result.current.trackPlaying).toEqual(track);
		});

		it('should set configureOptions', () => {
			const { result } = renderHook(() => useInternalStore());
			const options = {
				...DEFAULT_CONFIG,
				progressIntervalMs: 500,
				debug: true,
			};

			act(() => {
				result.current.setConfigureOptions(options);
			});

			expect(result.current.configureOptions).toEqual(options);
		});

		it('should set playbackSpeed', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.setPlaybackSpeed(1.5);
			});

			expect(result.current.playbackSpeed).toBe(1.5);
		});

		it('should set volume and normalize it', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.setVolume(0.5);
			});

			expect(result.current.volume).toBe(0.5);

			// Test normalization for values > 1
			act(() => {
				result.current.setVolume(1.5);
			});

			expect(result.current.volume).toBe(1.0);

			// Test normalization for values < 0
			act(() => {
				result.current.setVolume(-0.5);
			});

			expect(result.current.volume).toBe(0.0);
		});

		it('should set error', () => {
			const { result } = renderHook(() => useInternalStore());
			const error = { error: 'Test error', errorCode: 123 };

			act(() => {
				result.current.setError(error);
			});

			expect(result.current.error).toEqual(error);
		});
	});

	describe('updateFromEvent', () => {
		it('should handle STATE_CHANGED events', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
					payload: { state: AudioProState.PLAYING },
				});
			});

			expect(result.current.playerState).toBe(AudioProState.PLAYING);
		});

		it('should clear error when leaving ERROR state', () => {
			const { result } = renderHook(() => useInternalStore());
			const error = { error: 'Test error', errorCode: 123 };

			// Set initial error and ERROR state
			act(() => {
				result.current.setError(error);
				result.current.updateFromEvent({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
					payload: { state: AudioProState.ERROR },
				});
			});

			expect(result.current.error).toEqual(error);
			expect(result.current.playerState).toBe(AudioProState.ERROR);

			// Transition to non-ERROR state
			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.STATE_CHANGED,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
					payload: { state: AudioProState.IDLE },
				});
			});

			expect(result.current.error).toBeNull();
			expect(result.current.playerState).toBe(AudioProState.IDLE);
		});

		it('should handle PLAYBACK_ERROR events', () => {
			const { result } = renderHook(() => useInternalStore());
			const error = { error: 'Test error', errorCode: 123 };

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.PLAYBACK_ERROR,
					track: null,
					payload: { error: 'Test error', errorCode: 123 },
				});
			});

			expect(result.current.error).toEqual(error);
			// State should not automatically change to ERROR
			expect(result.current.playerState).toBe(AudioProState.IDLE);
		});

		it('should handle PLAYBACK_SPEED_CHANGED events', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
					payload: { speed: 1.5 },
				});
			});

			expect(result.current.playbackSpeed).toBe(1.5);
		});

		it('should handle progress updates', () => {
			const { result } = renderHook(() => useInternalStore());

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.PROGRESS,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
					payload: { position: 30, duration: 120 },
				});
			});

			expect(result.current.position).toBe(30);
			expect(result.current.duration).toBe(120);
		});

		it('should update trackPlaying when track changes', () => {
			const { result } = renderHook(() => useInternalStore());
			const track = { id: 'test', url: 'test.mp3', title: 'Test Track', artwork: 'test.jpg' };

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.STATE_CHANGED,
					track,
					payload: { state: AudioProState.PLAYING },
				});
			});

			expect(result.current.trackPlaying).toEqual(track);
		});

		it('should handle track unloading', () => {
			const { result } = renderHook(() => useInternalStore());
			const track = { id: 'test', url: 'test.mp3', title: 'Test Track', artwork: 'test.jpg' };

			// First set a track
			act(() => {
				result.current.setTrackPlaying(track);
			});

			expect(result.current.trackPlaying).toEqual(track);

			// Then unload it
			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.STATE_CHANGED,
					track: null,
					payload: { state: AudioProState.IDLE },
				});
			});

			expect(result.current.trackPlaying).toBeNull();
		});

		it('should ignore REMOTE_NEXT and REMOTE_PREV events', () => {
			const { result } = renderHook(() => useInternalStore());
			const initialState = { ...result.current };

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.REMOTE_NEXT,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
				});
			});

			// State should remain unchanged
			expect(result.current.trackPlaying).toEqual(initialState.trackPlaying);

			act(() => {
				result.current.updateFromEvent({
					type: AudioProEventType.REMOTE_PREV,
					track: {
						id: 'test',
						url: 'test.mp3',
						title: 'Test Track',
						artwork: 'test.jpg',
					},
				});
			});

			// State should remain unchanged
			expect(result.current.trackPlaying).toEqual(initialState.trackPlaying);
		});

		it('should warn when non-error event is missing track', () => {
			const originalConsoleWarn = console.warn;
			console.warn = jest.fn();

			const { result } = renderHook(() => useInternalStore());

			// We need to directly call the updateFromEvent function with an incomplete event
			// This is a special test case that bypasses TypeScript checks
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const incompleteEvent: any = {
				type: AudioProEventType.STATE_CHANGED,
				payload: { state: AudioProState.PLAYING },
			};

			act(() => {
				result.current.updateFromEvent(incompleteEvent);
			});

			expect(console.warn).toHaveBeenCalledWith(
				'AudioPro: Event STATE_CHANGED missing required track property',
			);

			console.warn = originalConsoleWarn;
		});

		it('should not warn when PLAYBACK_ERROR event is missing track', () => {
			const originalConsoleWarn = console.warn;
			console.warn = jest.fn();

			const { result } = renderHook(() => useInternalStore());

			// We need to directly call the updateFromEvent function with an incomplete event
			// This is a special test case that bypasses TypeScript checks
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const incompleteEvent: any = {
				type: AudioProEventType.PLAYBACK_ERROR,
				payload: { error: 'Test error', errorCode: 123 },
			};

			act(() => {
				result.current.updateFromEvent(incompleteEvent);
			});

			expect(console.warn).not.toHaveBeenCalled();

			console.warn = originalConsoleWarn;
		});
	});
});
