import { NativeModules, NativeEventEmitter } from 'react-native';

import { AudioPro, AudioProEventType, AudioProState } from '../index';

import type { AudioProTrack } from '../index';
import { AudioProState as AudioProStateType, AudioProEvent, AudioProEventPayload } from '../types';

// Mock track for testing
const mockTrack: AudioProTrack = {
	id: '1',
	url: 'https://example.com/audio.mp3',
	title: 'Test Track',
	artist: 'Test Artist',
	album: 'Test Album',
	artwork: 'https://example.com/artwork.jpg',
};

interface MockStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	volume: number;
	playbackSpeed: number;
	trackPlaying: any;
	error: any;
	progressIntervalMs: number;
	getState: jest.Mock;
	setState: jest.Mock;
	setVolume: jest.Mock;
	setPlaybackSpeed: jest.Mock;
	setConfigureOptions: jest.Mock;
	setTrackPlaying: jest.Mock;
	setError: jest.Mock;
	updateFromEvent: jest.Mock;
}

// Create store
const mockStore: MockStore = {
	playerState: AudioProState.IDLE,
	position: 0,
	duration: 0,
	volume: 1.0,
	playbackSpeed: 1.0,
	trackPlaying: null,
	error: null,
	progressIntervalMs: 100,
	getState: jest.fn(function(this: MockStore) {
		return this;
	}),
	setState: jest.fn(function(this: MockStore, updates: Partial<MockStore>) {
		Object.assign(this, updates);
	}),
	setVolume: jest.fn(function(this: MockStore, volume: number) {
		this.volume = volume;
	}),
	setPlaybackSpeed: jest.fn(function(this: MockStore, speed: number) {
		this.playbackSpeed = speed;
	}),
	setConfigureOptions: jest.fn(function(this: MockStore, options: { progressIntervalMs?: number }) {
		if (options.progressIntervalMs !== undefined) {
			this.progressIntervalMs = options.progressIntervalMs;
		}
	}),
	setTrackPlaying: jest.fn(function(this: MockStore, track: any) {
		this.trackPlaying = track;
	}),
	setError: jest.fn(function(this: MockStore, error: any) {
		this.error = error;
	}),
	updateFromEvent: jest.fn(function(this: MockStore, event: AudioProEvent) {
		if (event.type === AudioProEventType.STATE_CHANGED && event.payload?.state) {
			this.playerState = event.payload.state;
		} else if (event.type === AudioProEventType.PROGRESS && event.payload?.position !== undefined) {
			this.position = event.payload.position;
		} else if (event.type === AudioProEventType.PLAYBACK_ERROR && event.payload) {
			this.error = event.payload;
		}
	})
};

const mockEmitter = {
	addListener: jest.fn(),
	emit: jest.fn().mockImplementation((eventName: string, event: AudioProEvent) => {
		if (eventName === 'AudioProEvent') {
			mockStore.updateFromEvent(event);
		}
	})
};

jest.doMock('../emitter', () => ({
	emitter: mockEmitter
}));

jest.doMock('../useInternalStore', () => ({
	useInternalStore: mockStore
}));

const mockNativeModule = {
	play: jest.fn(),
	pause: jest.fn(),
	stop: jest.fn(),
	seekTo: jest.fn(),
	setVolume: jest.fn(),
	setPlaybackSpeed: jest.fn(),
	cleanup: jest.fn(),
};

jest.doMock('react-native', () => ({
	NativeModules: {
		AudioPro: mockNativeModule
	},
	Platform: {
		OS: 'ios',
	},
	Image: {
		resolveAssetSource: jest.fn().mockImplementation((source) => ({
			uri: typeof source === 'number' ? `resolved-${source}` : source,
		})),
	},
	NativeEventEmitter: jest.fn().mockImplementation(() => mockEmitter),
}));

jest.doMock('../emitter', () => ({
	emitter: mockEmitter,
	ambientEmitter: {
		addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
		emit: jest.fn(),
	},
}));

jest.doMock('../utils', () => ({
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

const emitter = new NativeEventEmitter(NativeModules.AudioPro);

describe('AudioPro', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Object.assign(mockStore, {
			playerState: AudioProState.IDLE,
			position: 0,
			duration: 0,
			volume: 0.8,
			playbackSpeed: 1.0,
			trackPlaying: null,
			error: null,
			configureOptions: {
				progressIntervalMs: 1000,
				debug: false,
				debugIncludesProgress: false,
				showNextPrevControls: true,
				contentType: 'MUSIC',
				autoplay: true,
				volume: 1,
				playbackSpeed: 1,
			},
			setVolume: jest.fn(),
			setPlaybackSpeed: jest.fn(),
			setConfigureOptions: jest.fn(),
			setTrackPlaying: jest.fn(),
			setError: jest.fn(),
			updateFromEvent: jest.fn(),
		});
	});

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
		expect(typeof AudioPro.setVolume).toBe('function');
		expect(typeof AudioPro.getVolume).toBe('function');
		expect(typeof AudioPro.getError).toBe('function');
		expect(typeof AudioPro.setProgressInterval).toBe('function');
		expect(typeof AudioPro.getProgressInterval).toBe('function');
		// Ambient audio methods
		expect(typeof AudioPro.ambientPlay).toBe('function');
		expect(typeof AudioPro.ambientStop).toBe('function');
		expect(typeof AudioPro.ambientSetVolume).toBe('function');
		expect(typeof AudioPro.addAmbientListener).toBe('function');
	});

	describe('volume control', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should clamp volume values between 0 and 1', () => {
			// Mock console.warn to check for warning messages
			const originalWarn = console.warn;
			console.warn = jest.fn();

			// Test with value below range
			AudioPro.setVolume(-0.5);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 0'),
			);
			expect(mockStore.getState().setVolume).toHaveBeenCalledWith(0);

			// Test with value above range
			AudioPro.setVolume(1.5);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 1'),
			);
			expect(mockStore.getState().setVolume).toHaveBeenCalledWith(1);

			// Test with value within range
			AudioPro.setVolume(0.5);
			expect(mockStore.getState().setVolume).toHaveBeenCalledWith(0.5);

			// Restore console.warn
			console.warn = originalWarn;
		});

		it('should call native module when track is playing', () => {
			// Mock track playing
			jest.spyOn(mockStore, 'getState').mockReturnValue({
				...mockStore.getState(),
				trackPlaying: { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' },
				playerState: AudioProState.PLAYING,
			});

			AudioPro.setVolume(0.7);
			expect(NativeModules.AudioPro.setVolume).toHaveBeenCalledWith(0.7);
		});

		it('should not call native module when no track is playing', () => {
			// Mock no track playing
			jest.spyOn(mockStore, 'getState').mockReturnValue({
				...mockStore.getState(),
				trackPlaying: null,
			});

			AudioPro.setVolume(0.7);
			expect(NativeModules.AudioPro.setVolume).not.toHaveBeenCalled();
		});

		it('should return the current volume value', () => {
			// Mock volume value
			jest.spyOn(mockStore, 'getState').mockReturnValue({
				...mockStore.getState(),
				volume: 0.6,
			});

			expect(AudioPro.getVolume()).toBe(0.6);
		});

		it('should reset volume to default when clear() is called', () => {
			AudioPro.clear();
			expect(mockStore.getState().setVolume).toHaveBeenCalledWith(1.0);
		});
	});

	describe('progress interval control', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should clamp progress interval values between 100ms and 10000ms', () => {
			// Mock console.warn to check for warning messages
			const originalWarn = console.warn;
			console.warn = jest.fn();

			// Test with value below range
			AudioPro.setProgressInterval(50);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 100ms'),
			);
			expect(mockStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 100 }),
			);

			// Test with value above range
			AudioPro.setProgressInterval(15000);
			expect(console.warn).toHaveBeenCalledWith(
				expect.stringContaining('out of range, clamped to 10000ms'),
			);
			expect(mockStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 10000 }),
			);

			// Test with value within range
			AudioPro.setProgressInterval(500);
			expect(mockStore.getState().setConfigureOptions).toHaveBeenCalledWith(
				expect.objectContaining({ progressIntervalMs: 500 }),
			);

			// Restore console.warn
			console.warn = originalWarn;
		});

		it('should return the current progress interval value', () => {
			// Mock progress interval value
			jest.spyOn(mockStore, 'getState').mockReturnValue({
				...mockStore.getState(),
				configureOptions: { progressIntervalMs: 2000 },
			});

			expect(AudioPro.getProgressInterval()).toBe(2000);
		});

		it('should return the default progress interval value from store initialization', () => {
			// Reset mock to default state
			const mockGetState = mockStore.getState as jest.Mock;
			mockGetState.mockImplementation(() => ({
				configureOptions: {
					progressIntervalMs: 1000,
				},
			}));

			expect(AudioPro.getProgressInterval()).toBe(1000); // Default value from store initialization
		});
	});

	describe('volume persistence', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should maintain volume settings after stop > play sequence', () => {
			// Setup: Mock store with custom volume and track playing
			jest.spyOn(mockStore, 'getState').mockReturnValue({
				...mockStore.getState(),
				volume: 0.3, // Set custom volume
				trackPlaying: { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' },
				playerState: AudioProState.PLAYING,
				setTrackPlaying: jest.fn(),
				setError: jest.fn(),
				configureOptions: { progressIntervalMs: 1000 },
				playbackSpeed: 1.0,
			});

			// Step 1: Stop playback
			AudioPro.stop();
			expect(NativeModules.AudioPro.stop).toHaveBeenCalled();

			// Step 2: Play again
			const track = { id: 'test', url: 'test.mp3', title: 'Test', artwork: 'test.jpg' };
			AudioPro.play(track);

			// Verify: Volume from store is passed to native options
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ volume: 0.3 }),
			);
		});
	});

	describe('play', () => {
		it('should call native play method with track and default autoplay=true', () => {
			AudioPro.play(mockTrack);
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ autoplay: true }),
			);
		});

		it('should respect autoPlay=false in options', () => {
			AudioPro.play(mockTrack, { autoPlay: false });
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ autoplay: false }),
			);
		});

		it('should validate track before playing', () => {
			const invalidTrack = { ...mockTrack, url: '' };
			AudioPro.play(invalidTrack as AudioProTrack);
			expect(NativeModules.AudioPro.play).not.toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.PLAYBACK_ERROR,
					payload: expect.objectContaining({
						error: 'AudioPro: Invalid track provided to play().',
					}),
				}),
			);
		});

		it('should pass startTimeMs to native module when provided', () => {
			const startTimeMs = 5000;
			AudioPro.play(mockTrack, { startTimeMs });
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ startTimeMs }),
			);
		});

		it('should handle startTimeMs with autoplay=true', () => {
			const startTimeMs = 5000;
			AudioPro.play(mockTrack, { startTimeMs, autoPlay: true });
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ startTimeMs, autoplay: true }),
			);
		});

		it('should handle startTimeMs with autoplay=false', () => {
			const startTimeMs = 5000;
			AudioPro.play(mockTrack, { startTimeMs, autoPlay: false });
			expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ startTimeMs, autoplay: false }),
			);
		});

		describe('startTimeMs behavior', () => {
			beforeEach(() => {
				jest.clearAllMocks();
				// Reset store state
				mockStore.getState.mockReturnValue({
					playerState: AudioProState.IDLE,
					position: 0,
					duration: 0,
					volume: 0.8,
					playbackSpeed: 1.0,
					trackPlaying: null,
					error: null,
				});
			});

			it('should seek to the correct position when startTimeMs is provided', async () => {
				const startTimeMs = 5000;
				await AudioPro.play(mockTrack, { startTimeMs });

				// Verify seek was called with correct position
				expect(NativeModules.AudioPro.seekTo).toHaveBeenCalledWith(startTimeMs);
			});

			it('should emit SEEK_COMPLETE after seek finishes', async () => {
				const startTimeMs = 5000;
				const seekCompleteListener = jest.fn();

				AudioPro.addEventListener((event) => {
					if (event.type === AudioProEventType.SEEK_COMPLETE) {
						seekCompleteListener(event);
					}
				});

				await AudioPro.play(mockTrack, { startTimeMs });

				// Simulate seek completion
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.SEEK_COMPLETE,
					track: mockTrack,
					payload: { position: startTimeMs },
				});

				expect(seekCompleteListener).toHaveBeenCalledWith({
					type: AudioProEventType.SEEK_COMPLETE,
					track: mockTrack,
					payload: { position: startTimeMs },
				});
			});

			it('should start playback after seek when autoplay is true', async () => {
				const startTimeMs = 5000;
				await AudioPro.play(mockTrack, { startTimeMs, autoPlay: true });

				// Simulate seek completion
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.SEEK_COMPLETE,
					track: mockTrack,
					payload: { position: startTimeMs },
				});

				// Verify playback started
				expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining({ autoplay: true, startTimeMs }),
				);
			});

			it('should not start playback after seek when autoplay is false', async () => {
				const startTimeMs = 5000;
				await AudioPro.play(mockTrack, { startTimeMs, autoPlay: false });

				// Simulate seek completion
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.SEEK_COMPLETE,
					track: mockTrack,
					payload: { position: startTimeMs },
				});

				// Verify playback did not start
				expect(NativeModules.AudioPro.play).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining({ autoplay: false, startTimeMs }),
				);
			});

			it('should maintain correct state during seek and playback sequence', async () => {
				const startTimeMs = 5000;
				const stateListener = jest.fn();

				AudioPro.addEventListener((event) => {
					if (event.type === AudioProEventType.STATE_CHANGED) {
						stateListener(event);
					}
				});

				await AudioPro.play(mockTrack, { startTimeMs, autoPlay: true });

				// Simulate loading state
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.STATE_CHANGED,
					track: mockTrack,
					payload: { state: AudioProState.LOADING },
				});

				// Verify initial state
				expect(stateListener).toHaveBeenCalledWith(
					expect.objectContaining({
						type: AudioProEventType.STATE_CHANGED,
						track: mockTrack,
						payload: { state: AudioProState.LOADING },
					}),
				);

				// Simulate seek completion
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.SEEK_COMPLETE,
					track: mockTrack,
					payload: { position: startTimeMs },
				});

				// Simulate playing state
				emitter.emit('AudioProEvent', {
					type: AudioProEventType.STATE_CHANGED,
					track: mockTrack,
					payload: { state: AudioProState.PLAYING },
				});

				// Verify state transition to playing
				expect(stateListener).toHaveBeenCalledWith(
					expect.objectContaining({
						type: AudioProEventType.STATE_CHANGED,
						track: mockTrack,
						payload: { state: AudioProState.PLAYING },
					}),
				);
			});
		});
	});

	// We'll add more tests in the future if needed
});
