import { NativeModules, Platform } from 'react-native';

import { ambientEmitter, emitter } from './emitter';
import { useInternalStore } from './useInternalStore';
import {
	guardTrackPlaying,
	logDebug,
	normalizeFilePath,
	normalizeVolume,
	resolveAssetSource,
	validateTrack,
} from './utils';
import {
	AudioProAmbientEventType,
	AudioProEventType,
	AudioProState,
	DEFAULT_CONFIG,
	DEFAULT_SEEK_MS,
} from './values';

import type {
	AmbientAudioPlayOptions,
	AudioProAmbientEventCallback,
	AudioProConfigureOptions,
	AudioProEventCallback,
	AudioProPlayOptions,
	AudioProTrack,
} from './types';

const NativeAudioPro =
	Platform.OS === 'web' ? require('./web').WebAudioPro : NativeModules.AudioPro;

function isValidPlayerStateForOperation(operation: string): boolean {
	const { playerState } = useInternalStore.getState();
	if (playerState === AudioProState.IDLE || playerState === AudioProState.ERROR) {
		logDebug(`AudioPro: ${operation} ignored - player in`, playerState, 'state');
		return false;
	}
	return true;
}

export const AudioPro = {
	configure(options: AudioProConfigureOptions): void {
		const { setConfigureOptions, setDebug, setDebugIncludesProgress } =
			useInternalStore.getState();
		setConfigureOptions({ ...DEFAULT_CONFIG, ...options });
		setDebug(!!options.debug);
		setDebugIncludesProgress(options.debugIncludesProgress ?? false);
		logDebug('AudioPro: configure()', options);
	},

	play(track: AudioProTrack, options?: AudioProPlayOptions) {
		const playOptions: AudioProPlayOptions = options || {};

		const resolvedTrack = { ...track };

		// Resolve asset sources (for require() resources)
		resolvedTrack.artwork = resolveAssetSource(track.artwork, 'artwork');
		resolvedTrack.url = resolveAssetSource(track.url, 'audio URL');

		// Normalize file paths to ensure local paths have file:// prefix
		if (typeof resolvedTrack.url === 'string') {
			resolvedTrack.url = normalizeFilePath(resolvedTrack.url);
		}
		if (typeof resolvedTrack.artwork === 'string') {
			resolvedTrack.artwork = normalizeFilePath(resolvedTrack.artwork);
		}

		if (!validateTrack(resolvedTrack)) {
			const errorMessage = 'AudioPro: Invalid track provided to play().';
			console.error(errorMessage);
			emitter.emit('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: null,
				payload: {
					error: errorMessage,
					errorCode: -1,
				},
			});
			return;
		}

		const { error, setError, configureOptions, playbackSpeed, setTrackPlaying, volume } =
			useInternalStore.getState();

		// Clear errors and set track as playing
		setTrackPlaying(resolvedTrack);
		if (error) {
			setError(null);
		}

		// Prepare options for native module
		const nativeOptions = {
			...configureOptions,
			playbackSpeed,
			volume: normalizeVolume(volume),
			autoplay: playOptions.autoPlay ?? true,
			headers: playOptions.headers,
		};

		logDebug('AudioPro: play()', track, 'options:', options, 'nativeOptions:', nativeOptions);

		NativeAudioPro.play(resolvedTrack, nativeOptions);
	},

	pause() {
		if (!guardTrackPlaying('pause')) return;
		logDebug('AudioPro: pause()');
		if (!isValidPlayerStateForOperation('pause()')) return;
		NativeAudioPro.pause();
	},

	resume() {
		if (!guardTrackPlaying('resume')) return;
		logDebug('AudioPro: resume()');
		if (!isValidPlayerStateForOperation('resume()')) return;

		// Clear any existing error
		const { error, setError } = useInternalStore.getState();
		if (error) {
			setError(null);
		}
		NativeAudioPro.resume();
	},

	stop() {
		logDebug('AudioPro: stop()');
		const { error, setError } = useInternalStore.getState();
		if (error) {
			setError(null);
		}
		NativeAudioPro.stop();
	},

	clear() {
		logDebug('AudioPro: clear()');
		const { error, setError, setTrackPlaying, setVolume } = useInternalStore.getState();
		if (error) {
			setError(null);
		}
		setTrackPlaying(null);
		setVolume(normalizeVolume(1.0));
		NativeAudioPro.clear();
	},

	seekTo(positionMs: number) {
		if (!guardTrackPlaying('seekTo')) return;
		logDebug('AudioPro: seekTo()', positionMs);
		if (!isValidPlayerStateForOperation('seekTo()')) return;
		NativeAudioPro.seekTo(positionMs);
	},

	seekForward(amountMs: number = DEFAULT_SEEK_MS) {
		if (!guardTrackPlaying('seekForward')) return;
		logDebug('AudioPro: seekForward()', amountMs);
		if (!isValidPlayerStateForOperation('seekForward()')) return;
		NativeAudioPro.seekForward(amountMs);
	},

	seekBack(amountMs: number = DEFAULT_SEEK_MS) {
		if (!guardTrackPlaying('seekBack')) return;
		logDebug('AudioPro: seekBack()', amountMs);
		if (!isValidPlayerStateForOperation('seekBack()')) return;
		NativeAudioPro.seekBack(amountMs);
	},

	addEventListener(callback: AudioProEventCallback) {
		return emitter.addListener('AudioProEvent', callback);
	},

	getTimings() {
		const { position, duration } = useInternalStore.getState();
		return { position, duration };
	},

	getState() {
		return useInternalStore.getState().playerState;
	},

	getPlayingTrack() {
		return useInternalStore.getState().trackPlaying;
	},

	setPlaybackSpeed(speed: number) {
		const validatedSpeed = Math.max(0.25, Math.min(2.0, speed));
		if (validatedSpeed !== speed) {
			console.warn(
				`AudioPro: Playback speed ${speed} out of range, clamped to ${validatedSpeed}`,
			);
		}

		logDebug('AudioPro: setPlaybackSpeed()', validatedSpeed);
		const { setPlaybackSpeed, trackPlaying } = useInternalStore.getState();
		setPlaybackSpeed(validatedSpeed);

		if (trackPlaying) {
			if (!isValidPlayerStateForOperation('setPlaybackSpeed() native call')) return;
			NativeAudioPro.setPlaybackSpeed(validatedSpeed);
		}
	},

	getPlaybackSpeed() {
		return useInternalStore.getState().playbackSpeed;
	},

	setVolume(volume: number) {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		if (clampedVolume !== volume) {
			console.warn(`AudioPro: Volume ${volume} out of range, clamped to ${clampedVolume}`);
		}

		const normalizedVolume = normalizeVolume(clampedVolume);
		logDebug('AudioPro: setVolume()', normalizedVolume);

		const { setVolume, trackPlaying } = useInternalStore.getState();
		setVolume(normalizedVolume);

		if (trackPlaying) {
			if (!isValidPlayerStateForOperation('setVolume()')) return;
			NativeAudioPro.setVolume(normalizedVolume);
		}
	},

	getVolume() {
		return useInternalStore.getState().volume;
	},

	getError() {
		return useInternalStore.getState().error;
	},

	setProgressInterval(ms: number) {
		const MIN_INTERVAL = 100;
		const MAX_INTERVAL = 10000;

		const clampedMs = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, ms));
		if (clampedMs !== ms) {
			console.warn(
				`AudioPro: Progress interval ${ms}ms out of range, clamped to ${clampedMs}ms`,
			);
		}

		logDebug('AudioPro: setProgressInterval()', clampedMs);
		const { setConfigureOptions, configureOptions } = useInternalStore.getState();
		setConfigureOptions({ ...configureOptions, progressIntervalMs: clampedMs });
	},

	getProgressInterval() {
		return (
			useInternalStore.getState().configureOptions.progressIntervalMs ??
			DEFAULT_CONFIG.progressIntervalMs
		);
	},

	// ==============================
	// AMBIENT AUDIO METHODS
	// ==============================

	/**
	 * Play an ambient audio track
	 *
	 * @param options - Ambient audio options
	 * @param options.url - URL of the audio file to play or a number from require() for local files
	 * @param options.loop - Whether to loop the audio (default: true)
	 */
	ambientPlay(options: AmbientAudioPlayOptions): void {
		const { url: originalUrl, loop = true } = options;

		// Resolve asset source (for require() resources)
		let resolvedUrl = resolveAssetSource(originalUrl, 'ambient audio URL');

		if (!resolvedUrl) {
			const errorMessage = 'AudioPro: Invalid URL provided to ambientPlay().';
			console.error(errorMessage);
			ambientEmitter.emit('AudioProAmbientEvent', {
				type: AudioProAmbientEventType.AMBIENT_ERROR,
				payload: {
					error: errorMessage,
				},
			});
			return;
		}

		// Normalize file path to ensure local paths have file:// prefix
		if (typeof resolvedUrl === 'string') {
			resolvedUrl = normalizeFilePath(resolvedUrl);
		}

		logDebug('AudioPro: ambientPlay()', { url: resolvedUrl, loop });
		NativeAudioPro.ambientPlay({ url: resolvedUrl, loop });
	},

	/**
	 * Stop ambient audio playback
	 */
	ambientStop(): void {
		logDebug('AudioPro: ambientStop()');
		NativeAudioPro.ambientStop();
	},

	/**
	 * Set the volume of ambient audio playback
	 *
	 * @param volume - Volume level (0.0 to 1.0)
	 */
	ambientSetVolume(volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		if (clampedVolume !== volume) {
			console.warn(`AudioPro: Volume ${volume} out of range, clamped to ${clampedVolume}`);
		}

		const normalizedVolume = normalizeVolume(clampedVolume);
		logDebug('AudioPro: ambientSetVolume()', normalizedVolume);
		NativeAudioPro.ambientSetVolume(normalizedVolume);
	},

	/**
	 * Add a listener for ambient audio events
	 *
	 * @param callback - Callback function to handle ambient audio events
	 * @returns Subscription that can be used to remove the listener
	 */
	addAmbientListener(callback: AudioProAmbientEventCallback) {
		return ambientEmitter.addListener('AudioProAmbientEvent', callback);
	},
};
