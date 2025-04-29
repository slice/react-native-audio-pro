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

import { renderHook, act } from '@testing-library/react-hooks';

import { useAudioPro } from '../useAudioPro';
import { AudioProState, DEFAULT_CONFIG, AudioProEventType } from '../values';

import type { AudioProTrack } from '../types';
import type { AudioProStore } from '../useInternalStore';

// Mock state that can be accessed by tests
export const mockState: AudioProStore = {
	playerState: AudioProState.IDLE,
	position: 0,
	duration: 0,
	playbackSpeed: 1.0,
	volume: 0.8,
	debug: false,
	debugIncludesProgress: false,
	trackPlaying: null,
	configureOptions: DEFAULT_CONFIG,
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

jest.mock('../useInternalStore', () => ({
	useInternalStore: (selector?: (state: AudioProStore) => AudioProStore) => {
		if (selector) {
			return selector(mockState);
		}
		return mockState;
	},
	getState: () => mockState,
}));

describe('useAudioPro', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset mock state to initial values
		Object.assign(mockState, {
			playerState: AudioProState.IDLE,
			position: 0,
			duration: 0,
			playbackSpeed: 1.0,
			volume: 0.8,
			trackPlaying: null,
			error: null,
		});
	});

	const testTrack: AudioProTrack = {
		id: '1',
		url: 'test.mp3',
		title: 'Test Track',
		artwork: 'test.jpg',
	};

	it('should return the correct initial state', () => {
		const { result } = renderHook(() => useAudioPro());

		expect(result.current.state).toBe(AudioProState.IDLE);
		expect(result.current.position).toBe(0);
		expect(result.current.duration).toBe(0);
		expect(result.current.playingTrack).toBeNull();
		expect(result.current.playbackSpeed).toBe(1.0);
		expect(result.current.volume).toBe(0.8);
		expect(result.current.error).toBeNull();
	});

	it('should update state when store changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: testTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 1000,
					duration: 5000,
				},
			});
		});

		expect(result.current.state).toBe(AudioProState.PLAYING);
		expect(result.current.position).toBe(1000);
		expect(result.current.duration).toBe(5000);
		expect(result.current.playingTrack).toEqual(testTrack);
	});

	it('should update when playback speed changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.updateFromEvent({
				type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
				track: testTrack,
				payload: { speed: 1.5 },
			});
		});

		expect(result.current.playbackSpeed).toBe(1.5);
	});

	it('should update when volume changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.volume = 0.8;
		});

		expect(result.current.volume).toBe(0.8);
	});

	it('should update when error occurs', () => {
		const { result } = renderHook(() => useAudioPro());

		const testError = { error: 'Test error', errorCode: 123 };
		act(() => {
			mockState.updateFromEvent({
				type: AudioProEventType.PLAYBACK_ERROR,
				track: null,
				payload: testError,
			});
		});

		expect(result.current.error).toEqual(testError);
	});

	it('should update when track playing changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.updateFromEvent({
				type: AudioProEventType.STATE_CHANGED,
				track: testTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 0,
				},
			});
		});

		expect(result.current.playingTrack).toEqual(testTrack);
	});
});
