import { Image } from 'react-native';

import { emitter } from './emitter';
import { useInternalStore } from './useInternalStore';
import { AudioProEventType } from './values';

import type { AudioProTrack } from './types';

/**
 * Normalizes a file path to ensure it has the file:// prefix if it's a local path
 *
 * @param path - The path to normalize
 * @returns The normalized path with file:// prefix if needed
 */
export function normalizeFilePath(path: string): string {
	// noinspection SuspiciousTypeOfGuard
	if (
		typeof path === 'string' &&
		path.startsWith('/') &&
		!path.startsWith('file://') &&
		!path.startsWith('http://') &&
		!path.startsWith('https://')
	) {
		if (__DEV__) {
			console.warn(
				'[react-native-audio-pro] Deprecation Notice: Local file paths must be prefixed with "file://". ' +
					'Auto-correction is deprecated and will be removed in v10.0.0. Please update your code.',
			);
		}
		return `file://${path}`;
	}
	return path;
}

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

/**
 * Validates a track object to ensure it has all required properties with correct types
 *
 * @param track - The track object to validate
 * @returns true if the track is valid, false otherwise
 */
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

/**
 * Guards against operations that require a track to be playing
 *
 * @param methodName - The name of the method being called
 * @returns true if a track is playing, false otherwise
 */
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

/**
 * Logs debug messages if debug mode is enabled
 *
 * @param args - Arguments to log
 */
export function logDebug(...args: unknown[]) {
	if (useInternalStore.getState().debug) {
		console.log('~~~', ...args);
	}
}

/**
 * Resolves a resource that might be a number from require() to a URI string
 *
 * @param resource - The resource to resolve (string URL or number from require())
 * @param resourceType - The type of resource (for logging purposes)
 * @returns The resolved URI string
 */
export function resolveAssetSource(
	resource: string | number,
	resourceType: string = 'resource',
): string {
	// If the resource is already a string, return it as is
	if (typeof resource === 'string') {
		return resource;
	}

	// If the resource is a number (from require()), resolve it to a URI
	const resolvedUri = Image.resolveAssetSource(resource).uri;
	logDebug(`Resolved require() ${resourceType} to URI:`, resolvedUri);
	return resolvedUri;
}
