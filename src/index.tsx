/**
 * REACT NATIVE AUDIO PRO
 */
import { NativeModules } from 'react-native';

export const NativeAudioPro = NativeModules.AudioPro
	? NativeModules.AudioPro
	: new Proxy(
			{},
			{
				get() {
					throw new Error(
						'react-native-audio-pro: Native module is not linked properly.'
					);
				},
			}
		);

export { AudioPro } from './audioPro';

export { useAudioPro } from './useAudioPro';

export type {
	AudioProTrack,
	AudioProEventPayload,
	AudioProEventCallback,
} from './types';

export { AudioProState, AudioProEventName } from './values';
