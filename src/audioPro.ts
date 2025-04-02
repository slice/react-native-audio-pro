import type {
	AudioProConfigureOptions,
	AudioProEventCallback,
	AudioProEventPayload,
	AudioProTrack,
} from './types';
import {
	guardTrackLoaded,
	guardTrackPlaying,
	logDebug,
	validateTrack,
} from './utils';
import { useInternalStore } from './useInternalStore';
import {
	AudioProEventName,
	DEFAULT_CONFIG,
	DEFAULT_SEEK_SECONDS,
} from './values';
import { emitter } from './emitter';

import { NativeAudioPro } from './index';

export const AudioPro = {
	configure(options: AudioProConfigureOptions): void {
		logDebug('AudioPro: configure()', options);
		const { setConfigureOptions, setDebug } = useInternalStore.getState();
		setConfigureOptions({ ...DEFAULT_CONFIG, ...options });
		setDebug(!!options.debug);
	},

	load(track: AudioProTrack) {
		logDebug('AudioPro: load()', track);
		if (!validateTrack(track)) {
			const errorMessage = 'AudioPro: Invalid track provided to load().';
			console.error(errorMessage);
			emitter.emit('AudioProEvent', {
				name: AudioProEventName.PLAYBACK_ERROR,
				error: errorMessage,
				errorCode: -1,
			});
			return;
		}
		useInternalStore.getState().setTrackLoaded(track);
	},

	play() {
		if (!guardTrackLoaded('play')) return;
		const { trackLoaded, configureOptions } = useInternalStore.getState();
		logDebug('AudioPro: play()', trackLoaded);
		NativeAudioPro.play(trackLoaded, configureOptions);
		useInternalStore.getState().setTrackPlaying(trackLoaded);
	},

	pause() {
		if (!guardTrackPlaying('pause')) return;
		logDebug('AudioPro: pause()');
		NativeAudioPro.pause();
	},

	resume() {
		if (!guardTrackPlaying('resume')) return;
		logDebug('AudioPro: resume()');
		NativeAudioPro.resume();
	},

	stop() {
		if (!guardTrackPlaying('stop')) return;
		logDebug('AudioPro: stop()');
		NativeAudioPro.stop();
		useInternalStore.getState().setTrackPlaying(undefined);
	},

	seekTo(positionMs: number) {
		if (!guardTrackPlaying('seekTo')) return;
		logDebug('AudioPro: seekTo()', positionMs);
		NativeAudioPro.seekTo(positionMs);
	},

	seekForward(amountMs: number = DEFAULT_SEEK_SECONDS) {
		if (!guardTrackPlaying('seekForward')) return;
		logDebug('AudioPro: seekForward()', amountMs);
		const milliseconds = amountMs * 1000;
		NativeAudioPro.seekForward(milliseconds);
	},

	seekBack(amountMs: number = DEFAULT_SEEK_SECONDS) {
		if (!guardTrackPlaying('seekBack')) return;
		logDebug('AudioPro: seekBack()', amountMs);
		const milliseconds = amountMs * 1000;
		NativeAudioPro.seekBack(milliseconds);
	},

	addEventListener(callback: AudioProEventCallback) {
		return emitter.addListener(
			'AudioProEvent',
			(event: AudioProEventPayload) => {
				callback(event);
			}
		);
	},

	getTimings() {
		const { position, duration } = useInternalStore.getState();
		return { position, duration };
	},

	getState() {
		const { playerState } = useInternalStore.getState();
		return playerState;
	},

	getTrack() {
		const { trackPlaying } = useInternalStore.getState();
		return trackPlaying;
	},
};
