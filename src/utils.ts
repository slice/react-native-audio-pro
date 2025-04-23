import type { AudioProTrack } from './types';
import { useInternalStore } from './useInternalStore';
import { emitter } from './emitter';
import { AudioProEventType } from './values';

/**
 * A simplified URL validation function that doesn't rely on the URL constructor.
 * It performs basic checks on the URL string to determine if it's valid.
 */
export function isValidUrl(url: string | number): boolean {
	// If URL is a number (require() result), it's valid
	if (typeof url === 'number') {
		return true;
	}

	// Check if URL is empty or not a string
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
	logDebug(
		`URL format may be non-standard but will attempt to use it: ${url}`,
	);
	return true;
}

export function validateTrack(track: AudioProTrack): boolean {
	// noinspection SuspiciousTypeOfGuard
	if (
		!track ||
		typeof track.id !== 'string' ||
		!track.id.trim() ||
		!(typeof track.url === 'string' || typeof track.url === 'number') ||
		(typeof track.url === 'string' && !track.url.trim()) ||
		typeof track.title !== 'string' ||
		!track.title.trim() ||
		!(
			typeof track.artwork === 'string' ||
			typeof track.artwork === 'number'
		) ||
		(typeof track.artwork === 'string' && !track.artwork.trim()) ||
		(track.album !== undefined && typeof track.album !== 'string') ||
		(track.artist !== undefined && typeof track.artist !== 'string')
	) {
		logDebug(
			'Track validation failed: Missing or invalid required properties',
		);

		return false;
	}

	if (typeof track.url === 'string' && !isValidUrl(track.url)) {
		logDebug(
			`Track validation failed: Invalid media URL format: ${track.url}`,
		);
		return false;
	}

	if (typeof track.artwork === 'string' && !isValidUrl(track.artwork)) {
		logDebug(
			`Track validation failed: Invalid artwork URL format: ${track.artwork}`,
		);
		return false;
	}

	return true;
}

export function logDebug(...args: any[]) {
	const { debug, debugIncludesProgress } = useInternalStore.getState();
	if (debug) {
		// Skip logging PROGRESS events if debugIncludesProgress is false
		if (
			!debugIncludesProgress &&
			args.length >= 2 &&
			args[0] === 'AudioProEvent' &&
			typeof args[1] === 'string' &&
			args[1].includes('"type":"PROGRESS"')
		) {
			return;
		}
		console.log('~~~', ...args);
	}
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
