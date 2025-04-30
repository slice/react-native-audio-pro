import { renderHook, act } from '@testing-library/react-hooks';

import { AudioPro } from '../audioPro';
import { emitter } from '../emitter';
import { useAudioPro } from '../useAudioPro';
import { useInternalStore } from '../useInternalStore';
import { AudioProState, AudioProEventType } from '../values';

import type { AudioProTrack } from '../types';

// Import centralized mocks
import { NativeEventEmitter } from '../__mocks__';
import { useInternalStoreMock } from '../test-utils';

describe('useAudioPro', () => {
	const mockTrack: AudioProTrack = {
		id: 'test-track',
		url: 'https://example.com/test.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useInternalStore as unknown as jest.Mock).mockImplementation(() => ({
			playerState: useInternalStoreMock.playerState,
			position: useInternalStoreMock.position,
			duration: useInternalStoreMock.duration,
			trackPlaying: useInternalStoreMock.trackPlaying,
			playbackSpeed: useInternalStoreMock.playbackSpeed,
			volume: useInternalStoreMock.volume,
			error: useInternalStoreMock.error,
		}));
	});

	it('should return initial state', () => {
		const { result } = renderHook(() => useAudioPro());

		expect(result.current.state).toBe(AudioProState.IDLE);
		expect(result.current.playingTrack).toBeNull();
		expect(result.current.position).toBe(0);
		expect(result.current.duration).toBe(0);
		expect(result.current.volume).toBe(1.0);
		expect(result.current.playbackSpeed).toBe(1.0);
		expect(result.current.error).toBeNull();
	});

	it('should update state when events are received', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			// Simulate state change event
			const listener = (emitter.addListener as jest.Mock).mock.calls[0][1];
			listener({
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 5000,
					duration: 300000,
				},
			});
		});

		expect(result.current.state).toBe(AudioProState.PLAYING);
		expect(result.current.playingTrack).toEqual(mockTrack);
		expect(result.current.position).toBe(5000);
		expect(result.current.duration).toBe(300000);
	});

	it('should handle progress events', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			// Simulate progress event
			const listener = (emitter.addListener as jest.Mock).mock.calls[0][1];
			listener({
				type: AudioProEventType.PROGRESS,
				track: mockTrack,
				payload: {
					position: 10000,
					duration: 300000,
				},
			});
		});

		expect(result.current.position).toBe(10000);
		expect(result.current.duration).toBe(300000);
	});

	it('should handle playback error events', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			// Simulate error event
			const listener = (emitter.addListener as jest.Mock).mock.calls[0][1];
			listener({
				type: AudioProEventType.PLAYBACK_ERROR,
				track: null,
				payload: {
					error: 'Playback failed',
					errorCode: -1,
				},
			});
		});

		expect(result.current.error).toEqual({
			error: 'Playback failed',
			errorCode: -1,
		});
	});

	it('should handle playback speed changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			// Simulate speed change event
			const listener = (emitter.addListener as jest.Mock).mock.calls[0][1];
			listener({
				type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
				track: mockTrack,
				payload: {
					speed: 1.5,
				},
			});
		});

		expect(result.current.playbackSpeed).toBe(1.5);
	});

	it('should expose AudioPro methods', () => {
		const { result } = renderHook(() => useAudioPro());

		// Test play
		act(() => {
			AudioPro.play(mockTrack);
		});
		expect(AudioPro.play).toHaveBeenCalledWith(mockTrack);

		// Test pause
		act(() => {
			AudioPro.pause();
		});
		expect(AudioPro.pause).toHaveBeenCalled();

		// Test resume
		act(() => {
			AudioPro.resume();
		});
		expect(AudioPro.resume).toHaveBeenCalled();

		// Test stop
		act(() => {
			AudioPro.stop();
		});
		expect(AudioPro.stop).toHaveBeenCalled();

		// Test clear
		act(() => {
			AudioPro.clear();
		});
		expect(AudioPro.clear).toHaveBeenCalled();
	});

	it('should clean up event listeners on unmount', () => {
		const mockRemove = jest.fn();
		(emitter.addListener as jest.Mock).mockReturnValueOnce({ remove: mockRemove });

		const { unmount } = renderHook(() => useAudioPro());
		unmount();

		expect(mockRemove).toHaveBeenCalled();
	});
});
