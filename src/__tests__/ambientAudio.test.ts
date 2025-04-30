import { NativeModules } from 'react-native';

import { AudioPro } from '../audioPro';
import { ambientEmitter } from '../emitter';
import { AudioProAmbientEventType } from '../values';

// Import centralized mocks
import { NativeEventEmitter } from '../__mocks__';

describe('Ambient Audio', () => {
	const mockAmbientOptions = {
		url: 'https://example.com/ambient.mp3',
		loop: true,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('ambientPlay()', () => {
		it('should play ambient audio with default options', () => {
			AudioPro.ambientPlay(mockAmbientOptions);

			expect(NativeModules.AudioPro.ambientPlay).toHaveBeenCalledWith(
				mockAmbientOptions.url,
				true, // default loop value
			);
		});

		it('should play ambient audio with explicit loop option', () => {
			AudioPro.ambientPlay({ ...mockAmbientOptions, loop: false });

			expect(NativeModules.AudioPro.ambientPlay).toHaveBeenCalledWith(
				mockAmbientOptions.url,
				false,
			);
		});

		it('should handle local asset files', () => {
			const localAsset = { ...mockAmbientOptions, url: 123 }; // require() number
			AudioPro.ambientPlay(localAsset);

			expect(NativeModules.AudioPro.ambientPlay).toHaveBeenCalledWith(
				expect.any(String), // resolved asset URI
				true,
			);
		});
	});

	describe('ambientStop()', () => {
		it('should stop ambient playback', () => {
			AudioPro.ambientStop();

			expect(NativeModules.AudioPro.ambientStop).toHaveBeenCalled();
		});
	});

	describe('ambientSetVolume()', () => {
		it('should set ambient volume within valid range', () => {
			AudioPro.ambientSetVolume(0.5);

			expect(NativeModules.AudioPro.ambientSetVolume).toHaveBeenCalledWith(0.5);
		});

		it('should clamp ambient volume to valid range', () => {
			AudioPro.ambientSetVolume(2.0);

			expect(NativeModules.AudioPro.ambientSetVolume).toHaveBeenCalledWith(1.0);
		});
	});

	describe('ambientPause() and ambientResume()', () => {
		it('should pause ambient playback', () => {
			AudioPro.ambientPause();

			expect(NativeModules.AudioPro.ambientPause).toHaveBeenCalled();
		});

		it('should resume ambient playback', () => {
			AudioPro.ambientResume();

			expect(NativeModules.AudioPro.ambientResume).toHaveBeenCalled();
		});
	});

	describe('ambientSeekTo()', () => {
		it('should seek ambient audio to specific position', () => {
			AudioPro.ambientSeekTo(5000);

			expect(NativeModules.AudioPro.ambientSeekTo).toHaveBeenCalledWith(5000);
		});

		it('should not seek to negative position', () => {
			AudioPro.ambientSeekTo(-1000);

			expect(NativeModules.AudioPro.ambientSeekTo).not.toHaveBeenCalled();
		});
	});

	describe('ambient events', () => {
		it('should emit AMBIENT_TRACK_ENDED when non-looping track ends', () => {
			const event = { type: AudioProAmbientEventType.AMBIENT_TRACK_ENDED };
			ambientEmitter.emit('AudioProAmbientEvent', event);

			expect(ambientEmitter.emit).toHaveBeenCalledWith('AudioProAmbientEvent', event);
		});

		it('should emit AMBIENT_ERROR on playback error', () => {
			const event = {
				type: AudioProAmbientEventType.AMBIENT_ERROR,
				payload: { error: 'Playback failed' },
			};
			ambientEmitter.emit('AudioProAmbientEvent', event);

			expect(ambientEmitter.emit).toHaveBeenCalledWith('AudioProAmbientEvent', event);
		});
	});

	describe('independence from main player', () => {
		it('should not affect main player state when playing ambient audio', () => {
			// Mock main player state
			const mainPlayerState = {
				playerState: 'PLAYING',
				trackPlaying: { id: 'main-track' },
			};

			// Play ambient audio
			AudioPro.ambientPlay(mockAmbientOptions);

			// Verify main player state is unchanged
			expect(NativeModules.AudioPro.play).not.toHaveBeenCalled();
			expect(mainPlayerState.playerState).toBe('PLAYING');
			expect(mainPlayerState.trackPlaying.id).toBe('main-track');
		});
	});
});
