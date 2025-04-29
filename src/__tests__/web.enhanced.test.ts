/**
 * @jest-environment jsdom
 */

import { emitter } from '../emitter';
import { AudioProEventType, AudioProState } from '../values';
import { WebAudioProImpl } from '../web';

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
	paused: true,
};

// Store event handlers
const eventHandlers: Record<string, (event?: Event) => void> = {};

// Mock Audio constructor
const AudioMock = jest.fn(() => mockAudio);
global.Audio = AudioMock as unknown as typeof Audio;

// Mock setInterval and clearInterval
global.window.setInterval = jest.fn(() => 123) as unknown as typeof window.setInterval;
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

describe('WebAudioPro Enhanced Tests', () => {
	let webAudioPro: WebAudioProImpl;

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
		mockAudio.paused = true;

		// Create a new instance for each test
		webAudioPro = new WebAudioProImpl();

		// Set the mock audio object and initialize private properties
		// @ts-expect-error - Accessing private property for testing
		webAudioPro.audio = mockAudio;
		// @ts-expect-error - Accessing private property for testing
		webAudioPro.progressInterval = null;
	});

	describe('Event Handling', () => {
		it('should handle playing event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
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

			// Should start progress updates
			expect(window.setInterval).toHaveBeenCalled();
		});

		it('should handle pause event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set up progressInterval to simulate it's running
			// @ts-expect-error - Accessing private property for testing
			webAudioPro.progressInterval = 123;

			// Trigger the pause event
			if (eventHandlers.pause) {
				eventHandlers.pause();
			}

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

			// Should call clearInterval (we don't check the exact ID since it's implementation detail)
			expect(window.clearInterval).toHaveBeenCalled();
		});

		it('should handle ended event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set up progressInterval to simulate it's running
			// @ts-expect-error - Accessing private property for testing
			webAudioPro.progressInterval = 123;

			// Trigger the ended event
			if (eventHandlers.ended) {
				eventHandlers.ended();
			}

			// Should call clearInterval (we don't check the exact ID since it's implementation detail)
			expect(window.clearInterval).toHaveBeenCalled();

			// Should emit TRACK_ENDED event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.TRACK_ENDED,
				track: mockTrack,
				payload: {
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle error event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set up progressInterval to simulate it's running
			// @ts-expect-error - Accessing private property for testing
			webAudioPro.progressInterval = 123;

			// Create a mock error
			const mockErrorEvent = {
				target: {
					error: {
						message: 'Test error message',
						code: 123,
					},
				},
			} as unknown as Event;

			// Trigger the error event
			if (eventHandlers.error) {
				eventHandlers.error(mockErrorEvent);
			}

			// Should call clearInterval (we don't check the exact ID since it's implementation detail)
			expect(window.clearInterval).toHaveBeenCalled();

			// Should emit PLAYBACK_ERROR event
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Audio error: Test error message',
					errorCode: 123,
				},
			});

			// Should emit STATE_CHANGED event with ERROR state
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.STATE_CHANGED,
				track: mockTrack,
				payload: {
					state: AudioProState.ERROR,
					position: 0,
					duration: 0,
				},
			});
		});

		it('should handle error event with minimal information', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Create a minimal error event
			const minimalErrorEvent = {} as Event;

			// Trigger the error event
			if (eventHandlers.error) {
				eventHandlers.error(minimalErrorEvent);
			}

			// Should emit PLAYBACK_ERROR event with default error message
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Audio error: Unknown error',
					errorCode: -1,
				},
			});
		});

		it('should handle loadstart event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Trigger the loadstart event
			if (eventHandlers.loadstart) {
				eventHandlers.loadstart();
			}

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

		it('should handle canplay event when paused', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set paused state
			mockAudio.paused = true;

			// Trigger the canplay event
			if (eventHandlers.canplay) {
				eventHandlers.canplay();
			}

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

		it('should handle seeked event', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Trigger the seeked event
			if (eventHandlers.seeked) {
				eventHandlers.seeked();
			}

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

	describe('Progress Updates', () => {
		it('should emit progress events with correct position and duration', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time and duration
			mockAudio.currentTime = 30;
			mockAudio.duration = 120;

			// Create a startProgressUpdates method to simulate the internal method
			// @ts-expect-error - Accessing private method for testing
			const emitProgress = webAudioPro.emitProgress.bind(webAudioPro);
			emitProgress();

			// Should emit PROGRESS event with correct values
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PROGRESS,
				track: mockTrack,
				payload: {
					position: 30000, // 30 seconds in ms
					duration: 120000, // 120 seconds in ms
				},
			});
		});

		it('should handle NaN duration in progress updates', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time and invalid duration
			mockAudio.currentTime = 30;
			mockAudio.duration = NaN;

			// Create a startProgressUpdates method to simulate the internal method
			// @ts-expect-error - Accessing private method for testing
			const emitProgress = webAudioPro.emitProgress.bind(webAudioPro);
			emitProgress();

			// Should emit PROGRESS event with correct values and 0 duration
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PROGRESS,
				track: mockTrack,
				payload: {
					position: 30000, // 30 seconds in ms
					duration: 0, // NaN converted to 0
				},
			});
		});
	});

	describe('Seek Methods', () => {
		it('should seek to specific position', () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set duration
			mockAudio.duration = 120;

			// Call seekTo
			webAudioPro.seekTo(60000); // 60 seconds in ms

			// Should set currentTime to 60 seconds
			expect(mockAudio.currentTime).toBe(60);
		});

		it('should seek forward by specified amount', () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time and duration
			mockAudio.currentTime = 30;
			mockAudio.duration = 120;

			// Call seekForward
			webAudioPro.seekForward(15000); // 15 seconds in ms

			// Should increase currentTime by 15 seconds
			expect(mockAudio.currentTime).toBe(45);
		});

		it('should not seek forward beyond duration', () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time and duration
			mockAudio.currentTime = 110;
			mockAudio.duration = 120;

			// Call seekForward with a large value
			webAudioPro.seekForward(30000); // 30 seconds in ms

			// Should limit to duration
			expect(mockAudio.currentTime).toBe(120);
		});

		it('should seek back by specified amount', () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time
			mockAudio.currentTime = 30;

			// Call seekBack
			webAudioPro.seekBack(15000); // 15 seconds in ms

			// Should decrease currentTime by 15 seconds
			expect(mockAudio.currentTime).toBe(15);
		});

		it('should not seek back before 0', () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Set current time
			mockAudio.currentTime = 10;

			// Call seekBack with a large value
			webAudioPro.seekBack(15000); // 15 seconds in ms

			// Should limit to 0
			expect(mockAudio.currentTime).toBe(0);
		});
	});

	describe('Play Method Edge Cases', () => {
		it('should handle play with autoplay=false', () => {
			webAudioPro.play(mockTrack, { autoplay: false });

			// Should set the source
			expect(mockAudio.src).toBe(mockTrack.url);

			// Should call load
			expect(mockAudio.load).toHaveBeenCalled();

			// Should NOT call play
			expect(mockAudio.play).not.toHaveBeenCalled();

			// Should emit PAUSED state
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

		it('should handle play with synchronous error', () => {
			// Mock play to throw a synchronous error
			mockAudio.play.mockImplementationOnce(() => {
				throw new Error('Synchronous play error');
			});

			webAudioPro.play(mockTrack, { autoplay: true });

			// Should emit error
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Failed to play: Synchronous play error',
					errorCode: -1,
				},
			});
		});

		it('should handle play with non-Error object thrown', () => {
			// Mock play to throw a non-Error object
			mockAudio.play.mockImplementationOnce(() => {
				throw 'String error'; // Not an Error object
			});

			webAudioPro.play(mockTrack, { autoplay: true });

			// Should emit error with string conversion
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Failed to play: String error',
					errorCode: -1,
				},
			});
		});
	});

	describe('Resume Method Edge Cases', () => {
		it('should handle resume with synchronous error', () => {
			// First play a track to set currentTrack
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Mock play to throw a synchronous error
			mockAudio.play.mockImplementationOnce(() => {
				throw new Error('Synchronous resume error');
			});

			webAudioPro.resume();

			// Should emit error
			expect(emitter.emit).toHaveBeenCalledWith('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: mockTrack,
				payload: {
					error: 'Failed to resume: Synchronous resume error',
					errorCode: -1,
				},
			});
		});
	});

	describe('Browser Compatibility', () => {
		it('should handle browsers where play() does not return a Promise', () => {
			// Mock play to return undefined instead of a Promise
			mockAudio.play.mockReturnValueOnce(undefined as unknown as Promise<void>);

			// Should not throw when play doesn't return a Promise
			expect(() => {
				webAudioPro.play(mockTrack, { autoplay: true });
			}).not.toThrow();
		});
	});
});
