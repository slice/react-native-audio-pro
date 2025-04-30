import { NativeModules } from 'react-native';

import { AudioPro } from '../audioPro';
import { emitter, ambientEmitter } from '../emitter';
import { useInternalStore } from '../useInternalStore';
import { AudioProState, AudioProEventType, AudioProContentType } from '../values';

// Mock NativeModules
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
			setProgressInterval: jest.fn(),
		},
	},
	Platform: {
		OS: 'ios',
	},
}));

// Mock internal store
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn(),
	},
}));

// Mock emitters
jest.mock('../emitter', () => ({
	emitter: {
		emit: jest.fn(),
		addListener: jest.fn(),
	},
	ambientEmitter: {
		emit: jest.fn(),
		addListener: jest.fn(),
	},
}));

describe('AudioPro', () => {
	const mockTrack = {
		id: 'test-track',
		url: 'https://example.com/test.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset store state
		(useInternalStore.getState as jest.Mock).mockReturnValue({
			playerState: AudioProState.IDLE,
			trackPlaying: null,
			position: 0,
			duration: 0,
			volume: 1.0,
			playbackSpeed: 1.0,
			error: null,
			configureOptions: {
				contentType: AudioProContentType.MUSIC,
				debug: false,
				debugIncludesProgress: false,
				progressIntervalMs: 1000,
			},
			setTrackPlaying: jest.fn(),
			setError: jest.fn(),
			setVolume: jest.fn(),
			setConfigureOptions: jest.fn(),
			setDebug: jest.fn(),
			setDebugIncludesProgress: jest.fn(),
		});
	});

	describe('configure()', () => {
		it('should set configuration options', () => {
			const options = {
				contentType: AudioProContentType.SPEECH,
				debug: true,
				debugIncludesProgress: true,
				progressIntervalMs: 500,
			};

			AudioPro.configure(options);

			const { setConfigureOptions, setDebug, setDebugIncludesProgress } =
				useInternalStore.getState();
			expect(setConfigureOptions).toHaveBeenCalledWith(expect.objectContaining(options));
			expect(setDebug).toHaveBeenCalledWith(true);
			expect(setDebugIncludesProgress).toHaveBeenCalledWith(true);
		});
	});

	describe('play()', () => {
		it('should play a valid track', () => {
			AudioPro.play(mockTrack);

			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				mockTrack,
				expect.objectContaining({
					autoplay: true,
					volume: 1.0,
					playbackSpeed: 1.0,
				}),
			);
		});

		it('should handle invalid track', () => {
			const invalidTrack = { ...mockTrack, url: '' };
			AudioPro.play(invalidTrack);

			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: null,
				payload: expect.objectContaining({
					error: expect.any(String),
					errorCode: -1,
				}),
			});
		});

		it('should clear error state when playing new track', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				error: 'Previous error',
			});

			AudioPro.play(mockTrack);

			const { setError } = useInternalStore.getState();
			expect(setError).toHaveBeenCalledWith(null);
		});
	});

	describe('pause()', () => {
		it('should pause playback when track is playing', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				playerState: AudioProState.PLAYING,
				trackPlaying: mockTrack,
			});

			AudioPro.pause();

			expect(NativeModules.AudioPro.pause).toHaveBeenCalled();
		});

		it('should not pause when in IDLE state', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				playerState: AudioProState.IDLE,
			});

			AudioPro.pause();

			expect(NativeModules.AudioPro.pause).not.toHaveBeenCalled();
		});
	});

	describe('resume()', () => {
		it('should resume playback when paused', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				playerState: AudioProState.PAUSED,
				trackPlaying: mockTrack,
			});

			AudioPro.resume();

			expect(NativeModules.AudioPro.resume).toHaveBeenCalled();
		});

		it('should clear error state when resuming', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				playerState: AudioProState.PAUSED,
				trackPlaying: mockTrack,
				error: 'Previous error',
			});

			AudioPro.resume();

			const { setError } = useInternalStore.getState();
			expect(setError).toHaveBeenCalledWith(null);
		});
	});

	describe('stop()', () => {
		it('should stop playback and clear error state', () => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				error: 'Previous error',
			});

			AudioPro.stop();

			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();
			const { setError } = useInternalStore.getState();
			expect(setError).toHaveBeenCalledWith(null);
		});
	});

	describe('clear()', () => {
		it('should reset player state completely', () => {
			AudioPro.clear();

			expect(NativeModules.AudioPro.clear).toHaveBeenCalled();
			const { setTrackPlaying, setVolume, setError } = useInternalStore.getState();
			expect(setTrackPlaying).toHaveBeenCalledWith(null);
			expect(setVolume).toHaveBeenCalledWith(1.0);
			expect(setError).toHaveBeenCalledWith(null);
		});
	});

	describe('seek operations', () => {
		beforeEach(() => {
			(useInternalStore.getState as jest.Mock).mockReturnValueOnce({
				...useInternalStore.getState(),
				playerState: AudioProState.PLAYING,
				trackPlaying: mockTrack,
			});
		});

		it('should seek to specific position', () => {
			AudioPro.seekTo(5000);

			expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(5000);
		});

		it('should not seek to negative position', () => {
			AudioPro.seekTo(-1000);

			expect(NativeModules.AudioPro.seekTo).not.toHaveBeenCalled();
		});

		it('should seek forward', () => {
			AudioPro.seekForward(10000);

			expect(NativeModules.AudioPro.seekForward).toHaveBeenCalledWith(10000);
		});

		it('should seek backward', () => {
			AudioPro.seekBack(10000);

			expect(NativeModules.AudioPro.seekBack).toHaveBeenCalledWith(10000);
		});
	});

	describe('volume control', () => {
		it('should set volume within valid range', () => {
			AudioPro.setVolume(0.5);

			expect(NativeModules.AudioPro.setVolume).toHaveBeenCalledWith(0.5);
		});

		it('should clamp volume to valid range', () => {
			AudioPro.setVolume(2.0);

			expect(NativeModules.AudioPro.setVolume).toHaveBeenCalledWith(1.0);
		});
	});

	describe('playback speed', () => {
		it('should set playback speed within valid range', () => {
			AudioPro.setPlaybackSpeed(1.5);

			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(1.5);
		});

		it('should clamp playback speed to valid range', () => {
			AudioPro.setPlaybackSpeed(3.0);

			expect(NativeModules.AudioPro.setPlaybackSpeed).toHaveBeenCalledWith(2.0);
		});
	});

	describe('event listeners', () => {
		it('should add event listener', () => {
			const callback = jest.fn();
			const subscription = AudioPro.addEventListener(callback);

			expect(emitter.addListener).toHaveBeenCalledWith('AudioProEvent', callback);
			expect(subscription).toBeDefined();
		});

		it('should add ambient event listener', () => {
			const callback = jest.fn();
			const subscription = AudioPro.addAmbientListener(callback);

			expect(ambientEmitter.addListener).toHaveBeenCalledWith(
				'AudioProAmbientEvent',
				callback,
			);
			expect(subscription).toBeDefined();
		});
	});
});
