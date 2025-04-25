/**
 * @jest-environment jsdom
 */

import { emitter } from '../emitter';
import { AudioProEventType, AudioProState } from '../values';
import { WebAudioPro, WebAudioProImpl } from '../web';

import type { AudioProTrack } from '../types';

// Create a mock Audio class
const mockAudio = {
	play: jest.fn().mockReturnValue(Promise.resolve()),
	pause: jest.fn(),
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
	currentTime: 0,
	duration: 0,
	playbackRate: 1,
	src: '',
	load: jest.fn(),
};

// Store event handlers
const eventHandlers: Record<string, (event?: Event) => void> = {};

// Mock Audio constructor
const AudioMock = jest.fn(() => mockAudio);
global.Audio = AudioMock as unknown as typeof Audio;

// Mock setInterval and clearInterval
global.window.setInterval = jest.fn().mockReturnValue(123) as unknown as typeof window.setInterval;
global.window.clearInterval = jest.fn() as unknown as typeof window.clearInterval;

// Mock addEventListener to store handlers
mockAudio.addEventListener.mockImplementation((event, handler) => {
	eventHandlers[event] = handler;
});

// Mock the emitter
jest.mock('../emitter', () => ({
	emitter: {
		emit: jest.fn(),
	},
}));

// Imports are moved to the top

describe('WebAudioPro', () => {
	const mockTrack: AudioProTrack = {
		id: 'test-track-1',
		url: 'https://example.com/audio.mp3',
		title: 'Test Track',
		artwork: 'https://example.com/artwork.jpg',
		artist: 'Test Artist',
		album: 'Test Album',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset audio properties
		mockAudio.currentTime = 0;
		mockAudio.duration = 0;
		mockAudio.playbackRate = 1;
		mockAudio.src = '';
	});

	it('should initialize correctly', () => {
		expect(WebAudioPro).toBeDefined();
	});

	// These tests are now covered by web.core.test.ts
	describe.skip('play method', () => {
		it('should set up audio and play track', () => {
			WebAudioPro.play(mockTrack, { autoplay: true, debug: true });

			// Should create a new Audio instance
			expect(AudioMock).toHaveBeenCalled();

			// Should set the source
			expect(mockAudio.src).toBe(mockTrack.url);

			// Should call play
			expect(mockAudio.play).toHaveBeenCalled();

			// Should emit STATE_CHANGED event with LOADING state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.LOADING,
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle errors when audio element is not available', () => {
			// Create a new instance of WebAudioPro with a null audio element
			const instance = new WebAudioProImpl();
			// @ts-expect-error - Accessing private property for testing
			instance.audio = null;

			// Call play method directly on the instance
			instance.play(mockTrack, {});

			// Should emit error
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Audio element not available in this environment',
					errorCode: -1,
				},
			});
		});

		it('should handle local audio files via require()', () => {
			const localTrack = {
				...mockTrack,
				url: 123, // Simulate require() result
			};

			WebAudioPro.play(localTrack, {});

			// Should emit error for local files
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: localTrack,
				payload: {
					error: 'Local audio files via require() are not supported in web environment',
					errorCode: -1,
				},
			});
		});

		it('should set playback speed', () => {
			WebAudioPro.play(mockTrack, { playbackSpeed: 1.5 });
			expect(mockAudio.playbackRate).toBe(1.5);
		});

		it('should handle play errors', async () => {
			// Mock play to reject with an error
			const errorMessage = 'Test error';
			mockAudio.play.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			WebAudioPro.play(mockTrack, { autoplay: true });

			// Should call play
			expect(mockAudio.play).toHaveBeenCalled();

			// Wait for the promise rejection to be handled
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should emit error
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: `Failed to play: ${errorMessage}`,
					errorCode: -1,
				},
			});
		});
	});

	describe.skip('pause method', () => {
		it('should pause playback', () => {
			// First play a track
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			WebAudioPro.pause();

			// Should call pause
			expect(mockAudio.pause).toHaveBeenCalled();

			// Should emit STATE_CHANGED event with PAUSED state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PAUSED,
					position: 0,
					duration: 0,
				},
			});
		});
	});

	describe.skip('resume method', () => {
		it('should resume playback', async () => {
			// First play and pause a track
			WebAudioPro.play(mockTrack, {});
			WebAudioPro.pause();
			jest.clearAllMocks();

			// Make sure play returns a resolved promise
			mockAudio.play.mockReturnValue(Promise.resolve());

			WebAudioPro.resume();

			// Should call play
			expect(mockAudio.play).toHaveBeenCalled();

			// Wait for any promises to resolve
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should emit STATE_CHANGED event with PLAYING state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle resume errors', async () => {
			// First play and pause a track
			WebAudioPro.play(mockTrack, {});
			WebAudioPro.pause();
			jest.clearAllMocks();

			// Mock play to reject with an error
			const errorMessage = 'Resume error';
			mockAudio.play.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			WebAudioPro.resume();

			// Should call play
			expect(mockAudio.play).toHaveBeenCalled();

			// Wait for the promise rejection to be handled
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Should emit error
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: `Failed to resume: ${errorMessage}`,
					errorCode: -1,
				},
			});
		});
	});

	describe.skip('stop method', () => {
		it('should stop playback', () => {
			// First play a track
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			WebAudioPro.stop();

			// Should call pause
			expect(mockAudio.pause).toHaveBeenCalled();

			// Should reset currentTime
			expect(mockAudio.currentTime).toBe(0);

			// Should emit STATE_CHANGED event with STOPPED state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.STOPPED,
					position: 0,
					duration: 0,
				},
			});
		});
	});

	describe.skip('clear method', () => {
		it('should clear the player', () => {
			// First play a track
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			WebAudioPro.clear();

			// Should call pause
			expect(mockAudio.pause).toHaveBeenCalled();

			// Should remove event listeners
			expect(mockAudio.removeEventListener).toHaveBeenCalled();

			// Should emit STATE_CHANGED event with IDLE state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: null,
				payload: {
					state: AudioProState.IDLE,
					position: 0,
					duration: 0,
				},
			});
		});
	});

	describe.skip('seekTo method', () => {
		it('should seek to a specific position', () => {
			// First play a track
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			WebAudioPro.seekTo(30000);

			// Should set currentTime (30 seconds)
			expect(mockAudio.currentTime).toBe(30);

			// Should emit SEEK_COMPLETE event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.SEEK_COMPLETE,
				track: mockTrack,
				payload: {
					position: 30000,
					duration: 0,
				},
			});
		});
	});

	describe.skip('seekForward method', () => {
		it('should seek forward by the specified amount', () => {
			// First play a track and set current time
			WebAudioPro.play(mockTrack, {});
			mockAudio.currentTime = 10;
			jest.clearAllMocks();

			WebAudioPro.seekForward(5000);

			// Should increase currentTime by 5 seconds
			expect(mockAudio.currentTime).toBe(15);

			// Should emit SEEK_COMPLETE event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.SEEK_COMPLETE,
				track: mockTrack,
				payload: {
					position: 15000,
					duration: 0,
				},
			});
		});
	});

	describe.skip('seekBack method', () => {
		it('should seek backward by the specified amount', () => {
			// First play a track and set current time
			WebAudioPro.play(mockTrack, {});
			mockAudio.currentTime = 10;
			jest.clearAllMocks();

			WebAudioPro.seekBack(5000);

			// Should decrease currentTime by 5 seconds
			expect(mockAudio.currentTime).toBe(5);

			// Should emit SEEK_COMPLETE event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.SEEK_COMPLETE,
				track: mockTrack,
				payload: {
					position: 5000,
					duration: 0,
				},
			});
		});

		it('should not go below 0 when seeking backward', () => {
			// First play a track and set current time
			WebAudioPro.play(mockTrack, {});
			mockAudio.currentTime = 2;
			jest.clearAllMocks();

			WebAudioPro.seekBack(5000);

			// Should set currentTime to 0 (not negative)
			expect(mockAudio.currentTime).toBe(0);

			// Should emit SEEK_COMPLETE event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.SEEK_COMPLETE,
				track: mockTrack,
				payload: {
					position: 0,
					duration: 0,
				},
			});
		});
	});

	describe.skip('setPlaybackSpeed method', () => {
		it('should set the playback speed', () => {
			// First play a track
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			WebAudioPro.setPlaybackSpeed(1.5);

			// Should set playbackRate
			expect(mockAudio.playbackRate).toBe(1.5);

			// Should emit PLAYBACK_SPEED_CHANGED event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
				track: mockTrack,
				payload: {
					speed: 1.5,
				},
			});
		});
	});

	describe.skip('event handling', () => {
		it('should set up event listeners when playing a track', () => {
			WebAudioPro.play(mockTrack, {});

			// Should add event listeners
			expect(mockAudio.addEventListener).toHaveBeenCalledWith(
				'playing',
				expect.any(Function),
			);
			expect(mockAudio.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
			expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
			expect(mockAudio.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
			expect(mockAudio.addEventListener).toHaveBeenCalledWith(
				'loadstart',
				expect.any(Function),
			);
			expect(mockAudio.addEventListener).toHaveBeenCalledWith(
				'loadedmetadata',
				expect.any(Function),
			);
			expect(mockAudio.addEventListener).toHaveBeenCalledWith(
				'timeupdate',
				expect.any(Function),
			);
		});

		it('should handle the playing event', () => {
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Trigger the playing event
			if (eventHandlers.playing) {
				eventHandlers.playing();
			}

			// Should emit STATE_CHANGED event with PLAYING state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle the ended event', () => {
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Trigger the ended event
			if (eventHandlers.ended) {
				eventHandlers.ended();
			}

			// Should emit TRACK_ENDED event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.TRACK_ENDED,
				track: mockTrack,
				payload: {
					position: 0,
					duration: 0,
				},
			});

			// Should emit STATE_CHANGED event with STOPPED state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.STOPPED,
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle the error event', () => {
			WebAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Trigger the error event
			const errorEvent = new Event('error') as Event & { message: string };
			// Use type assertion to add message property
			(errorEvent as { message: string }).message = 'Test error';
			if (eventHandlers.error) {
				eventHandlers.error(errorEvent);
			}

			// Should emit PLAYBACK_ERROR event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Audio error: Test error',
				},
			});
		});

		it('should handle the loadedmetadata event', () => {
			WebAudioPro.play(mockTrack, {});
			mockAudio.duration = 120; // 2 minutes
			jest.clearAllMocks();

			// Trigger the loadedmetadata event
			if (eventHandlers.loadedmetadata) {
				eventHandlers.loadedmetadata();
			}

			// Should emit STATE_CHANGED event with updated duration
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.LOADING,
					position: 0,
					duration: 120000, // 120 seconds in ms
				},
			});
		});
	});

	describe.skip('progress updates', () => {
		it('should start progress updates when playing', () => {
			WebAudioPro.play(mockTrack, {});

			// Should set up interval for progress updates
			expect(window.setInterval).toHaveBeenCalled();
		});

		it('should stop progress updates when stopping', () => {
			WebAudioPro.play(mockTrack, {});
			WebAudioPro.stop();

			// Should clear interval
			expect(window.clearInterval).toHaveBeenCalledWith(123);
		});

		it('should emit progress events', () => {
			WebAudioPro.play(mockTrack, {});
			mockAudio.currentTime = 30;
			mockAudio.duration = 120;
			jest.clearAllMocks();

			// Get the interval callback and call it
			const mockSetInterval = window.setInterval as unknown as jest.Mock;
			const intervalCallback = mockSetInterval.mock.calls[0][0];
			intervalCallback();

			// Should emit PROGRESS event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PROGRESS,
				track: mockTrack,
				payload: {
					position: 30000, // 30 seconds in ms
					duration: 120000, // 120 seconds in ms
				},
			});
		});
	});
});
