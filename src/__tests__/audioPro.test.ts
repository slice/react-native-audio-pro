// Mock dependencies
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
		},
	},
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
	})),
	Image: {
		resolveAssetSource: jest.fn().mockImplementation((source) => ({
			uri: `resolved-${source}`,
		})),
	},
}));

jest.mock('../emitter', () => ({
	emitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

jest.mock('../utils', () => ({
	logDebug: jest.fn(),
	validateTrack: jest.fn().mockReturnValue(true),
	guardTrackPlaying: jest.fn().mockReturnValue(true),
}));

jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn().mockReturnValue({
			playerState: 'PLAYING',
			position: 0,
			duration: 0,
			playbackSpeed: 1.0,
			debug: false,
			debugIncludesProgress: false,
			trackPlaying: null,
			configureOptions: {
				contentType: 'MUSIC',
				debug: false,
				debugIncludesProgress: false,
			},
			error: null,
			setDebug: jest.fn(),
			setDebugIncludesProgress: jest.fn(),
			setTrackPlaying: jest.fn(),
			setConfigureOptions: jest.fn(),
			setPlaybackSpeed: jest.fn(),
			setError: jest.fn(),
			updateFromEvent: jest.fn(),
		}),
	},
}));

// Import after mocks
import { AudioPro } from '../audioPro';

describe('AudioPro', () => {
	it('should export the expected functions', () => {
		// Check that AudioPro exports the expected functions
		expect(typeof AudioPro.configure).toBe('function');
		expect(typeof AudioPro.play).toBe('function');
		expect(typeof AudioPro.pause).toBe('function');
		expect(typeof AudioPro.resume).toBe('function');
		expect(typeof AudioPro.stop).toBe('function');
		expect(typeof AudioPro.seekTo).toBe('function');
		expect(typeof AudioPro.seekForward).toBe('function');
		expect(typeof AudioPro.seekBack).toBe('function');
		expect(typeof AudioPro.addEventListener).toBe('function');
		expect(typeof AudioPro.getTimings).toBe('function');
		expect(typeof AudioPro.getState).toBe('function');
		expect(typeof AudioPro.getPlayingTrack).toBe('function');
		expect(typeof AudioPro.setPlaybackSpeed).toBe('function');
		expect(typeof AudioPro.getPlaybackSpeed).toBe('function');
		expect(typeof AudioPro.getError).toBe('function');
	});

	// We'll add more tests in the future if needed
});
