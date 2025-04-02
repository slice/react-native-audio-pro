import { NativeEventEmitter } from 'react-native';
import type { AudioProEventPayload, AudioProStatePayload } from './types';
import { logDebug } from './utils';
import { useInternalStore } from './useInternalStore';
import { NativeAudioPro } from './index';

export const emitter = new NativeEventEmitter(NativeAudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEventPayload) => {
	logDebug('AudioProEvent', JSON.stringify(event));
	const { setStateFromNoticeEvent } = useInternalStore.getState();

	let position: number | undefined;
	if ('position' in event) {
		position = event.position ?? undefined;
	}
	let duration: number | undefined;
	if ('duration' in event) {
		duration = event.duration ?? undefined;
	}
	setStateFromNoticeEvent(event.name, position, duration);
});

emitter.addListener('AudioProStateEvent', (event: AudioProStatePayload) => {
	logDebug('AudioProState', JSON.stringify(event));
	const { setStateFromStateEvent } = useInternalStore.getState();

	let position: number | undefined;
	if ('position' in event) {
		position = event.position ?? undefined;
	}
	let duration: number | undefined;
	if ('duration' in event) {
		duration = event.duration ?? undefined;
	}
	setStateFromStateEvent(event.state, position, duration);
});
