import { NativeModules, NativeEventEmitter } from 'react-native';
import { useInternalStore } from './useInternalStore';
import { logDebug } from './utils';
import type { AudioProEvent } from './types';

const AudioPro = NativeModules.AudioPro;
export const emitter = new NativeEventEmitter(AudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEvent) => {
	logDebug('AudioProEvent', JSON.stringify(event));
	useInternalStore.getState().updateFromEvent(event);
});
