/**
 * REACT NATIVE AUDIO PRO
 */
import { NativeModules, Platform } from 'react-native';
import { WebAudioPro } from './web';

export const NativeAudioPro =
	Platform.OS === 'web'
		? WebAudioPro
		: NativeModules.AudioPro
			? NativeModules.AudioPro
			: new Proxy(
					{},
					{
						get() {
							throw new Error(
								'react-native-audio-pro: Native module is not linked properly.',
							);
						},
					},
				);

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
