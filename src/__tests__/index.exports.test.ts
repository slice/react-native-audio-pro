import { AudioPro } from '../audioPro';
import * as AudioProExports from '../index';
import { useAudioPro } from '../useAudioPro';
import { AudioProState, AudioProEventType, AudioProContentType } from '../values';

describe('Index exports', () => {
	it('should export AudioPro', () => {
		expect(AudioProExports.AudioPro).toBe(AudioPro);
	});

	it('should export useAudioPro hook', () => {
		expect(AudioProExports.useAudioPro).toBe(useAudioPro);
	});

	it('should export AudioProState enum', () => {
		expect(AudioProExports.AudioProState).toBe(AudioProState);
		expect(AudioProExports.AudioProState.IDLE).toBe(AudioProState.IDLE);
		expect(AudioProExports.AudioProState.LOADING).toBe(AudioProState.LOADING);
		expect(AudioProExports.AudioProState.PLAYING).toBe(AudioProState.PLAYING);
		expect(AudioProExports.AudioProState.PAUSED).toBe(AudioProState.PAUSED);
		expect(AudioProExports.AudioProState.STOPPED).toBe(AudioProState.STOPPED);
		expect(AudioProExports.AudioProState.ERROR).toBe(AudioProState.ERROR);
	});

	it('should export AudioProEventType enum', () => {
		expect(AudioProExports.AudioProEventType).toBe(AudioProEventType);
		expect(AudioProExports.AudioProEventType.STATE_CHANGED).toBe(
			AudioProEventType.STATE_CHANGED,
		);
		expect(AudioProExports.AudioProEventType.TRACK_ENDED).toBe(AudioProEventType.TRACK_ENDED);
		expect(AudioProExports.AudioProEventType.PLAYBACK_ERROR).toBe(
			AudioProEventType.PLAYBACK_ERROR,
		);
		expect(AudioProExports.AudioProEventType.PROGRESS).toBe(AudioProEventType.PROGRESS);
		expect(AudioProExports.AudioProEventType.SEEK_COMPLETE).toBe(
			AudioProEventType.SEEK_COMPLETE,
		);
		expect(AudioProExports.AudioProEventType.PLAYBACK_SPEED_CHANGED).toBe(
			AudioProEventType.PLAYBACK_SPEED_CHANGED,
		);
		expect(AudioProExports.AudioProEventType.REMOTE_NEXT).toBe(AudioProEventType.REMOTE_NEXT);
		expect(AudioProExports.AudioProEventType.REMOTE_PREV).toBe(AudioProEventType.REMOTE_PREV);
	});

	it('should export AudioProContentType enum', () => {
		expect(AudioProExports.AudioProContentType).toBe(AudioProContentType);
		expect(AudioProExports.AudioProContentType.MUSIC).toBe(AudioProContentType.MUSIC);
		expect(AudioProExports.AudioProContentType.SPEECH).toBe(AudioProContentType.SPEECH);
	});

	it('should export all required types', () => {
		// We can't directly test the types, but we can document the expected types
		// These types are exported via 'export type', so they won't appear as keys
		// in the exports object. This test is more of a documentation check.
		expect(Object.keys(AudioProExports).length).toBeGreaterThan(0);

		// The following types should be exported (for documentation purposes):
		// - AudioProTrack
		// - AudioProEventCallback
		// - AudioProEvent
		// - AudioProStateChangedPayload
		// - AudioProTrackEndedPayload
		// - AudioProPlaybackErrorPayload
		// - AudioProProgressPayload
		// - AudioProSeekCompletePayload
		// - AudioProPlaybackSpeedChangedPayload
	});
});
