import { emitter } from '../emitter';
import { AudioProEventType, AudioProState } from '../values';

import type { AudioProTrack, AudioProPlayOptions } from '../types';

// Create a mock implementation of WebAudioPro
export const WebAudioPro = {
	play: jest.fn((track: AudioProTrack, options: AudioProPlayOptions = {}) => {
		// Emit loading state
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track,
			payload: {
				state: AudioProState.LOADING,
				position: 0,
				duration: 0,
			},
		});

		// Handle local files error
		if (typeof track.url === 'number') {
			emitter.emit('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track,
				payload: {
					error: 'Local audio files via require() are not supported in web environment',
					errorCode: -1,
				},
			});
			return;
		}

		// Set playback speed if provided
		// Using type assertion to access playbackSpeed which is not in AudioProPlayOptions
		// but is used in the implementation
		const playbackSpeed = (options as { playbackSpeed?: number }).playbackSpeed;
		if (playbackSpeed) {
			WebAudioPro.setPlaybackSpeed(playbackSpeed);
		}
	}),

	pause: jest.fn(() => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track,
			payload: {
				state: AudioProState.PAUSED,
				position: 0,
				duration: 0,
			},
		});
	}),

	resume: jest.fn(() => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track,
			payload: {
				state: AudioProState.PLAYING,
				position: 0,
				duration: 0,
			},
		});
	}),

	stop: jest.fn(() => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track,
			payload: {
				state: AudioProState.STOPPED,
				position: 0,
				duration: 0,
			},
		});
	}),

	clear: jest.fn(() => {
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track: null,
			payload: {
				state: AudioProState.IDLE,
				position: 0,
				duration: 0,
			},
		});
	}),

	seekTo: jest.fn((position: number) => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.SEEK_COMPLETE,
			track,
			payload: {
				position,
				duration: 0,
			},
		});
	}),

	seekForward: jest.fn((milliseconds: number) => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;
		const currentPosition = 0; // Mock current position
		const newPosition = currentPosition + milliseconds;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.SEEK_COMPLETE,
			track,
			payload: {
				position: newPosition,
				duration: 0,
			},
		});
	}),

	seekBack: jest.fn((milliseconds: number) => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;
		const currentPosition = 5000; // Mock current position
		const newPosition = Math.max(0, currentPosition - milliseconds);

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.SEEK_COMPLETE,
			track,
			payload: {
				position: newPosition,
				duration: 0,
			},
		});
	}),

	setPlaybackSpeed: jest.fn((speed: number) => {
		// Get the current track from the last play call
		const track = WebAudioPro.play.mock.calls[0]?.[0] || null;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
			track,
			payload: {
				speed,
			},
		});
	}),

	// Reset all mocks
	_reset: () => {
		WebAudioPro.play.mockClear();
		WebAudioPro.pause.mockClear();
		WebAudioPro.resume.mockClear();
		WebAudioPro.stop.mockClear();
		WebAudioPro.clear.mockClear();
		WebAudioPro.seekTo.mockClear();
		WebAudioPro.seekForward.mockClear();
		WebAudioPro.seekBack.mockClear();
		WebAudioPro.setPlaybackSpeed.mockClear();
	},
};
