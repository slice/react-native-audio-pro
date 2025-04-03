import type { AudioProTrack } from './types';
import { useInternalStore } from './useInternalStore';
import { emitter } from './emitter';
import { AudioProEventType } from './values';

export function validateTrack(track: AudioProTrack): boolean {
	// noinspection SuspiciousTypeOfGuard
	if (
		!track ||
		typeof track.id !== 'string' ||
		!track.id.trim() ||
		typeof track.url !== 'string' ||
		!track.url.trim() ||
		typeof track.title !== 'string' ||
		!track.title.trim() ||
		typeof track.artwork !== 'string' ||
		!track.artwork.trim() ||
		(track.album !== undefined && typeof track.album !== 'string') ||
		(track.artist !== undefined && typeof track.artist !== 'string')
	) {
		logDebug(
			'Track validation failed: Missing or invalid required properties',
		);
		return false;
	}

	const audioUrl = track.url.toLowerCase();
	const supportedAudioFormats = [
		'.mp3',
		'.aac',
		'.wav',
		'.m4a',
		'.ogg',
		'.flac',
		'.mp4',
		'.3gp',
	];

	const isAudioFormatSupported = supportedAudioFormats.some(
		(format) =>
			audioUrl.endsWith(format) || audioUrl.includes(`${format}?`), // Handle URLs with query parameters
	);

	if (!isAudioFormatSupported) {
		logDebug(
			`Track validation failed: Unsupported audio format for URL: ${track.url}`,
		);
		return false;
	}

	const artworkUrl = track.artwork.toLowerCase();
	const supportedImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];

	const isImageFormatSupported = supportedImageFormats.some(
		(format) =>
			artworkUrl.endsWith(format) || artworkUrl.includes(`${format}?`), // Handle URLs with query parameters
	);

	if (!isImageFormatSupported) {
		logDebug(
			`Track validation failed: Unsupported image format for artwork: ${track.artwork}`,
		);
		return false;
	}

	return true;
}

export function logDebug(...args: any[]) {
	const { debug } = useInternalStore.getState();
	if (debug) {
		console.log('~~~', ...args);
	}
}

export function guardTrackLoaded(methodName: string): boolean {
	const { trackLoaded } = useInternalStore.getState();
	if (!trackLoaded) {
		const errorMessage = `~~~ AudioPro: ${methodName} called but no track loaded. Call loadTrack() first.`;
		console.error(errorMessage);
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PLAYBACK_ERROR,
			track: null,
			payload: {
				error: errorMessage,
				errorCode: -1,
			},
		});
		return false;
	}
	return true;
}

export function guardTrackPlaying(methodName: string): boolean {
	const { trackPlaying } = useInternalStore.getState();
	if (!trackPlaying) {
		const errorMessage = `~~~ AudioPro: ${methodName} called but no track is playing or has been played.`;
		console.error(errorMessage);
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PLAYBACK_ERROR,
			track: null,
			payload: {
				error: errorMessage,
				errorCode: -1,
			},
		});
		return false;
	}
	return true;
}
