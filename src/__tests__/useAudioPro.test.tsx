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

// Mock the useInternalStore
jest.mock('../useInternalStore', () => {
	const mockState = {
		playerState: 'STOPPED',
		position: 0,
		duration: 0,
		playbackSpeed: 1.0,
		volume: 0.8,
		trackPlaying: null,
		error: null,
	};

	return {
		useInternalStore: jest.fn().mockImplementation((selector) => {
			return selector(mockState);
		}),
		setMockState: (newState: Partial<typeof mockState>) => {
			Object.assign(mockState, newState);
		},
		getMockState: () => ({ ...mockState }),
	};
});

// Import after mocks
import { act, renderHook } from '@testing-library/react-hooks';

import { useAudioPro } from '../useAudioPro';
import { AudioProState } from '../values';

import type { AudioProTrack } from '../types';

describe('useAudioPro Hook', () => {
	const mockTrack: AudioProTrack = {
		id: 'test-track-1',
		url: 'https://example.com/audio.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
		artist: 'Test Artist',
		album: 'Test Album',
	};

	beforeEach(() => {
		// Reset the mock state before each test
		require('../useInternalStore').setMockState({
			playerState: AudioProState.STOPPED,
			position: 0,
			duration: 0,
			playbackSpeed: 1.0,
			volume: 0.8,
			trackPlaying: null,
			error: null,
		});
	});

	it('should return the current state', () => {
		const { result } = renderHook(() => useAudioPro());

		expect(result.current.state).toBe(AudioProState.STOPPED);
		expect(result.current.position).toBe(0);
		expect(result.current.duration).toBe(0);
		expect(result.current.playingTrack).toBeNull();
		expect(result.current.playbackSpeed).toBe(1.0);
		expect(result.current.volume).toBe(0.8);
		expect(result.current.error).toBeNull();
	});

	it('should update when state changes', () => {
		const { result, rerender } = renderHook(() => useAudioPro());

		// Initial state
		expect(result.current.state).toBe(AudioProState.STOPPED);

		// Update the state
		act(() => {
			require('../useInternalStore').setMockState({
				playerState: AudioProState.PLAYING,
				position: 1000,
				duration: 5000,
				trackPlaying: mockTrack,
			});
		});

		// Re-render the hook
		rerender();

		// Check that the hook returns the updated state
		expect(result.current.state).toBe(AudioProState.PLAYING);
		expect(result.current.position).toBe(1000);
		expect(result.current.duration).toBe(5000);
		expect(result.current.playingTrack).toEqual(mockTrack);
	});

	it('should update when playback speed changes', () => {
		const { result, rerender } = renderHook(() => useAudioPro());

		// Initial state
		expect(result.current.playbackSpeed).toBe(1.0);

		// Update the playback speed
		act(() => {
			require('../useInternalStore').setMockState({
				playbackSpeed: 1.5,
			});
		});

		// Re-render the hook
		rerender();

		// Check that the hook returns the updated playback speed
		expect(result.current.playbackSpeed).toBe(1.5);
	});

	it('should update when volume changes', () => {
		const { result, rerender } = renderHook(() => useAudioPro());

		// Initial state
		expect(result.current.volume).toBe(0.8);

		// Update the volume
		act(() => {
			require('../useInternalStore').setMockState({
				volume: 0.5,
			});
		});

		// Re-render the hook
		rerender();

		// Check that the hook returns the updated volume
		expect(result.current.volume).toBe(0.5);
	});

	it('should update when error occurs', () => {
		const { result, rerender } = renderHook(() => useAudioPro());

		// Initial state
		expect(result.current.error).toBeNull();

		// Set an error
		act(() => {
			require('../useInternalStore').setMockState({
				playerState: AudioProState.ERROR,
				error: { message: 'Test error', code: 123 },
			});
		});

		// Re-render the hook
		rerender();

		// Check that the hook returns the error
		expect(result.current.state).toBe(AudioProState.ERROR);
		expect(result.current.error).toEqual({ message: 'Test error', code: 123 });
	});
});
