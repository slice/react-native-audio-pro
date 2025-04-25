import { NativeModules, NativeEventEmitter } from 'react-native';

import { useInternalStore } from './useInternalStore';
import { logDebug } from './utils';
import { AudioProEventType } from './values';

import type { AudioProEvent } from './types';

const NativeAudioPro = NativeModules.AudioPro;
export const emitter = new NativeEventEmitter(NativeAudioPro);

export const ambientEmitter = new NativeEventEmitter(NativeAudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEvent) => {
	const { debug, debugIncludesProgress, updateFromEvent } = useInternalStore.getState();
	if (debug) {
		if (event.type !== AudioProEventType.PROGRESS || debugIncludesProgress) {
			logDebug('AudioProEvent', JSON.stringify(event));
		}
	}
	updateFromEvent(event);
});

ambientEmitter.addListener('AudioProAmbientEvent', (event) => {
	const { debug } = useInternalStore.getState();
	if (debug) {
		logDebug('AudioProAmbientEvent', JSON.stringify(event));
	}
});
