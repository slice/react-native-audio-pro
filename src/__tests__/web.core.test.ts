import { emitter } from '../emitter';
import { type AudioProTrack } from '../types';
import { AudioProEventType, AudioProState } from '../values';
import { WebAudioProImpl } from '../web';

// Mock the emitter
jest.mock('../emitter', () => ({
	emitter: {
		emit: jest.fn(),
	},
}));

// Mock window.setInterval and window.clearInterval
window.setInterval = jest.fn(() => 123) as unknown as typeof window.setInterval;
window.clearInterval = jest.fn() as unknown as typeof window.clearInterval;

describe('WebAudioProImpl', () => {
	let webAudioPro: WebAudioProImpl;
	let mockAudio: {
		play: jest.Mock;
		pause: jest.Mock;
		addEventListener: jest.Mock;
		removeEventListener: jest.Mock;
		load: jest.Mock;
		currentTime: number;
		duration: number;
		playbackRate: number;
		src: string;
		paused: boolean;
	};

	const mockTrack: AudioProTrack = {
		id: 'test-track-1',
		title: 'Test Track',
		artist: 'Test Artist',
		album: 'Test Album',
		artwork: 'https://example.com/artwork.jpg',
		url: 'https://example.com/audio.mp3',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Create a mock Audio object
		mockAudio = {
			play: jest.fn().mockReturnValue(Promise.resolve()),
			pause: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			load: jest.fn(),
			currentTime: 0,
			duration: 0,
			playbackRate: 1,
			src: '',
			paused: true,
		};

		// Create a new instance of WebAudioProImpl
		webAudioPro = new WebAudioProImpl();

		// Set the mock audio object
		// @ts-expect-error - Accessing private property for testing
		webAudioPro.audio = mockAudio;
	});

	describe('play method', () => {
		it('should set up audio and play track', () => {
			webAudioPro.play(mockTrack, {});

			// Should set the source
			expect(mockAudio.src).toBe(mockTrack.url);

			// Should call load
			expect(mockAudio.load).toHaveBeenCalled();

			// Should emit loading state
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

		it('should set playback speed', () => {
			webAudioPro.play(mockTrack, { playbackSpeed: 1.5 });
			expect(mockAudio.playbackRate).toBe(1.5);
		});

		it('should handle play errors', async () => {
			const errorMessage = 'Test error';
			mockAudio.play.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			webAudioPro.play(mockTrack, { autoplay: true });

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

		it('should handle invalid track URL', async () => {
			const invalidTrack = { ...mockTrack, url: '' };
			webAudioPro.play(invalidTrack, {});

			// First state change to LOADING
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					track: invalidTrack,
					payload: expect.objectContaining({
						state: AudioProState.LOADING,
					}),
				}),
			);

			// Then error event
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.PLAYBACK_ERROR,
					track: invalidTrack,
					payload: expect.objectContaining({
						error: 'Audio error: Unknown error',
						errorCode: -1,
					}),
				}),
			);
		});

		it('should handle network errors', () => {
			const mockTrack = {
				id: 'test-track-1',
				url: 'https://example.com/audio.mp3',
				title: 'Test Track',
				artwork: 'https://example.com/artwork.jpg',
				artist: 'Test Artist',
				album: 'Test Album',
			};

			// Mock audio element
			const mockAudio = {
				addEventListener: jest.fn(),
				play: jest.fn().mockRejectedValue(new Error('Network error')),
				pause: jest.fn(),
				load: jest.fn(),
				currentTime: 0,
				duration: 0,
				src: '',
			};

			// Create instance with mock audio
			const audioPro = new WebAudioProImpl();
			audioPro['audio'] = mockAudio as any;

			// Play track
			audioPro.play(mockTrack, {});

			// First loading state
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.LOADING,
					}),
				}),
			);

			// Then error event
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.PLAYBACK_ERROR,
					payload: expect.objectContaining({
						error: 'Failed to play: Network error',
					}),
				}),
			);
		});
	});

	describe('resume method', () => {
		it('should resume playback', async () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Make sure play returns a resolved promise
			mockAudio.play.mockReturnValue(Promise.resolve());

			webAudioPro.resume();

			// Should call play
			expect(mockAudio.play).toHaveBeenCalled();
		});

		it('should handle resume errors', async () => {
			// First play a track
			webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Mock play to reject with an error
			const errorMessage = 'Resume error';
			mockAudio.play.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

			webAudioPro.resume();

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

	describe('pause method', () => {
		it('should pause playback', async () => {
			// First play a track
			await webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Simulate playing state
			mockAudio.paused = false;
			webAudioPro.pause();

			expect(mockAudio.pause).toHaveBeenCalled();
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.PAUSED,
					}),
				}),
			);
		});

		it('should handle pause when not playing', () => {
			// Reset the audio state
			jest.clearAllMocks();
			mockAudio.paused = true;

			webAudioPro.pause();
			expect(mockAudio.pause).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});
	});

	describe('stop method', () => {
		it('should stop playback and reset state', async () => {
			// First play a track
			await webAudioPro.play(mockTrack, {});
			jest.clearAllMocks();

			// Simulate playing state
			mockAudio.paused = false;
			webAudioPro.stop();

			expect(mockAudio.pause).toHaveBeenCalled();
			expect(mockAudio.currentTime).toBe(0);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.STATE_CHANGED,
					payload: expect.objectContaining({
						state: AudioProState.STOPPED,
					}),
				}),
			);
		});

		it('should handle stop when not playing', () => {
			// Reset the audio state
			jest.clearAllMocks();
			mockAudio.paused = true;

			webAudioPro.stop();
			expect(mockAudio.pause).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});
	});

	describe('seek methods', () => {
		it('should seek to position', () => {
			const positionMs = 30000; // 30 seconds in milliseconds
			webAudioPro.seekTo(positionMs);
			expect(mockAudio.currentTime).toBe(positionMs / 1000); // Convert to seconds
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
					payload: expect.objectContaining({
						position: positionMs,
					}),
				}),
			);
		});

		it('should handle invalid seek positions', () => {
			// Negative position
			webAudioPro.seekTo(-1);
			expect(mockAudio.currentTime).not.toBe(-1);
			expect(emitter.emit).not.toHaveBeenCalled();

			// Position greater than duration
			mockAudio.duration = 100;
			webAudioPro.seekTo(200000); // 200 seconds in milliseconds
			expect(mockAudio.currentTime).not.toBe(200);
			expect(emitter.emit).not.toHaveBeenCalled();
		});

		it('should seek forward', () => {
			mockAudio.currentTime = 10;
			webAudioPro.seekForward(5000); // 5 seconds in milliseconds
			expect(mockAudio.currentTime).toBe(15);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
				}),
			);
		});

		it('should seek backward', () => {
			mockAudio.currentTime = 20;
			webAudioPro.seekBack(5000); // 5 seconds in milliseconds
			expect(mockAudio.currentTime).toBe(15);
			expect(emitter.emit).toHaveBeenCalledWith(
				'AudioProEvent',
				expect.objectContaining({
					type: AudioProEventType.SEEK_COMPLETE,
				}),
			);
		});
	});
});
