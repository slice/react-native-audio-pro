/**
 * REACT NATIVE AUDIO PRO - Web Implementation
 */
import { WebAudioPro } from './web';

export const NativeAudioPro = WebAudioPro;

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
	AudioProRemoteNextPayload,
	AudioProRemotePrevPayload,
	AudioProPlaybackSpeedChangedPayload,
} from './types';

export {
	AudioProState,
	AudioProEventType,
	AudioProContentType,
} from './values';
