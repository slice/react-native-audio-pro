import { NativeEventEmitter } from 'react-native';
import type { AudioProEvent } from './types';
import { logDebug } from './utils';
import { useInternalStore } from './useInternalStore';
import { NativeAudioPro } from './index';

export const emitter = new NativeEventEmitter(NativeAudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEvent) => {
	logDebug('AudioProEvent', JSON.stringify(event));
	useInternalStore.getState().updateFromEvent(event);
});
