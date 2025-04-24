import { emitter } from './emitter';
import { useInternalStore } from './useInternalStore';
import { AudioProEventType } from './values';

import type { AudioProTrack } from './types';

/**
 * A simplified URL validation function that doesn't rely on the URL constructor.
 * It performs basic checks on the URL string to determine if it's valid.
 */
export function isValidUrl(url: string | number): boolean {
	// If URL is a number (require() result), it's valid
	if (typeof url === 'number') {
		return true;
	}

	// Check if the URL is empty or not a string
	// noinspection SuspiciousTypeOfGuard
	if (!url || typeof url !== 'string' || !url.trim()) {
		logDebug('URL validation failed: URL is empty or not a string');
		return false;
	}

	// Basic check for common URL schemes
	if (
		url.startsWith('http://') ||
		url.startsWith('https://') ||
		url.startsWith('rtsp://') ||
		url.startsWith('rtmp://') ||
		url.startsWith('file://') ||
		url.startsWith('data:') ||
		url.startsWith('blob:')
	) {
		return true;
	}

	// If it's not a standard URL, it might be a relative path
	// or a custom URI scheme. We'll allow it but log a debug message.
	logDebug(`URL format may be non-standard but will attempt to use it: ${url}`);
	return true;
}

export function validateTrack(track: AudioProTrack): boolean {
	// 1. Track object must be provided
	if (!track) {
		logDebug('Track validation failed: no track object provided');
		return false;
	}

	// 2. ID must be a non-empty string
	// noinspection SuspiciousTypeOfGuard
	if (typeof track.id !== 'string' || !track.id.trim()) {
		logDebug('Track validation failed: invalid or missing track.id');
		return false;
	}

	// 3. URL must be a non-empty string and valid
	if (typeof track.url !== 'string' || !track.url.trim() || !isValidUrl(track.url)) {
		logDebug('Track validation failed: invalid or missing track.url');
		return false;
	}

	// 4. Title must be a non-empty string
	// noinspection SuspiciousTypeOfGuard
	if (typeof track.title !== 'string' || !track.title.trim()) {
		logDebug('Track validation failed: invalid or missing track.title');
		return false;
	}

	// 5. Artwork URL must be a non-empty string and valid
	if (typeof track.artwork !== 'string' || !track.artwork.trim() || !isValidUrl(track.artwork)) {
		logDebug('Track validation failed: invalid or missing track.artwork');
		return false;
	}

	// 6. Optional album and artist must be strings if provided
	// noinspection SuspiciousTypeOfGuard
	if (track.album !== undefined && typeof track.album !== 'string') {
		logDebug('Track validation failed: invalid track.album');
		return false;
	}
	// noinspection SuspiciousTypeOfGuard
	if (track.artist !== undefined && typeof track.artist !== 'string') {
		logDebug('Track validation failed: invalid track.artist');
		return false;
	}

	// All validations passed
	return true;
}

export function guardTrackPlaying(methodName: string): boolean {
	if (!useInternalStore.getState().trackPlaying) {
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

export function logDebug(...args: unknown[]) {
	if (useInternalStore.getState().debug) {
		console.log('~~~', ...args);
	}
}
