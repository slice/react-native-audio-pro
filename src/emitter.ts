import { NativeModules, NativeEventEmitter } from 'react-native';

import { useInternalStore } from './useInternalStore';
import { logDebug } from './utils';
import { AudioProEventType } from './values';

import type { AudioProEvent } from './types';

const NativeAudioPro = NativeModules.AudioPro;
export const emitter = new NativeEventEmitter(NativeAudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEvent) => {
	const { debug, debugIncludesProgress, updateFromEvent } = useInternalStore.getState();
	if (debug) {
		if (event.type === AudioProEventType.PROGRESS && !debugIncludesProgress) {
			return;
		}
		logDebug('AudioProEvent', JSON.stringify(event));
	}
	updateFromEvent(event);
});
