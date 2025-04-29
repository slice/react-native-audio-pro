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
import { AudioProState } from '../values';

import type { AudioProTrack } from '../types';
import type { AudioProStore } from '../useInternalStore';

// Mock track for testing
const mockTrack: AudioProTrack = {
	id: 'test-track',
	url: 'https://example.com/test.mp3',
	title: 'Test Track',
	artwork: 'https://example.com/artwork.jpg',
	artist: 'Test Artist',
	album: 'Test Album',
};

// Mock useInternalStore
const mockState: AudioProStore = {
	playerState: AudioProState.IDLE,
	position: 0,
	duration: 0,
	playbackSpeed: 1.0,
	volume: 1.0,
	debug: false,
	debugIncludesProgress: false,
	trackPlaying: null,
	configureOptions: {},
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
	useInternalStore: (selector?: (state: AudioProStore) => any) => {
		if (selector) {
			return selector(mockState);
		}
		return mockState;
	},
}));

describe('useAudioPro', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return the correct initial state', () => {
		const { result } = renderHook(() => useAudioPro());

		expect(result.current.state).toBe(AudioProState.IDLE);
		expect(result.current.position).toBe(0);
		expect(result.current.duration).toBe(0);
		expect(result.current.playingTrack).toBeNull();
		expect(result.current.playbackSpeed).toBe(1.0);
		expect(result.current.volume).toBe(1.0);
		expect(result.current.error).toBeNull();
	});

	it('should update state when store changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.playerState = AudioProState.PLAYING;
			mockState.position = 1000;
			mockState.duration = 5000;
			mockState.trackPlaying = mockTrack;
			mockState.playbackSpeed = 1.5;
			mockState.volume = 0.8;
			mockState.error = { error: 'Test error', errorCode: 123 };
		});

		expect(result.current.state).toBe(AudioProState.PLAYING);
		expect(result.current.position).toBe(1000);
		expect(result.current.duration).toBe(5000);
		expect(result.current.playingTrack).toEqual(mockTrack);
		expect(result.current.playbackSpeed).toBe(1.5);
		expect(result.current.volume).toBe(0.8);
		expect(result.current.error).toEqual({ error: 'Test error', errorCode: 123 });
	});

	it('should update when playback speed changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.playbackSpeed = 1.5;
		});

		expect(result.current.playbackSpeed).toBe(1.5);
	});

	it('should update when volume changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.volume = 0.5;
		});

		expect(result.current.volume).toBe(0.5);
	});

	it('should update when error occurs', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.error = { error: 'Test error', errorCode: 123 };
		});

		expect(result.current.error).toEqual({ error: 'Test error', errorCode: 123 });
	});

	it('should update when track playing changes', () => {
		const { result } = renderHook(() => useAudioPro());

		act(() => {
			mockState.trackPlaying = mockTrack;
		});

		expect(result.current.playingTrack).toEqual(mockTrack);
	});
});
