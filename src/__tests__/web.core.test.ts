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
});
