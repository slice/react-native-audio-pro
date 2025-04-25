/**
 * REACT NATIVE AUDIO PRO
 */
export { AudioPro } from './audioPro';
export { useAudioPro } from './useAudioPro';

export type {
	AudioProTrack,
	AudioProEventCallback,
	AudioProEvent,
	AudioProStateChangedPayload,
	AudioProTrackEndedPayload,
	AudioProPlaybackErrorPayload,
	AudioProProgressPayload,
	AudioProSeekCompletePayload,
	AudioProPlaybackSpeedChangedPayload,

	// Ambient audio types
	AmbientAudioPlayOptions,
	AudioProAmbientEventCallback,
	AudioProAmbientEvent,
	AudioProAmbientErrorPayload,
} from './types';

export {
	AudioProState,
	AudioProEventType,
	AudioProContentType,
	AudioProAmbientEventType,
} from './values';
