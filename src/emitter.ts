import { NativeEventEmitter } from 'react-native';
import type { AudioProEventPayload, AudioProStatePayload } from './types';
import { logDebug } from './utils';
import { useInternalStore } from './useInternalStore';
import { NativeAudioPro } from './index';

export const emitter = new NativeEventEmitter(NativeAudioPro);

emitter.addListener('AudioProEvent', (event: AudioProEventPayload) => {
	logDebug('AudioProEvent', event);
	const { setDuration, setLastNotice, setPosition } =
		useInternalStore.getState();
	if ('name' in event && event.name) {
		setLastNotice(event.name);
	}
	// noinspection SuspiciousTypeOfGuard
	if ('position' in event && typeof event.position === 'number') {
		setPosition(event.position);
	}
	// noinspection SuspiciousTypeOfGuard
	if ('duration' in event && typeof event.duration === 'number') {
		setDuration(event.duration);
	}
});

emitter.addListener('AudioProStateEvent', (event: AudioProStatePayload) => {
	logDebug('AudioProState', event);
	const { setState, setPosition, setDuration } = useInternalStore.getState();
	setState(event.state);
	// noinspection SuspiciousTypeOfGuard
	if ('position' in event && typeof event.position === 'number') {
		setPosition(event.position);
	}
	// noinspection SuspiciousTypeOfGuard
	if ('duration' in event && typeof event.duration === 'number') {
		setDuration(event.duration);
	}
});
