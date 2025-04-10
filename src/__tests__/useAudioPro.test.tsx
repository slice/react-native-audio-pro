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
		trackPlaying: null,
		error: null,
	};

	return {
		useInternalStore: jest.fn().mockImplementation((selector) => {
			return selector(mockState);
		}),
	};
});

// Import after mocks
import { renderHook } from '@testing-library/react-hooks';
import { AudioProState } from '../values';
import { useAudioPro } from '../useAudioPro';

describe('useAudioPro Hook', () => {
	it('should return the current state', () => {
		const { result } = renderHook(() => useAudioPro());

		expect(result.current.state).toBe(AudioProState.STOPPED);
		expect(result.current.position).toBe(0);
		expect(result.current.duration).toBe(0);
		expect(result.current.track).toBeNull();
		expect(result.current.playbackSpeed).toBe(1.0);
		expect(result.current.error).toBeNull();
	});
});
