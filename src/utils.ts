import type { AudioProTrack } from './types';
import { useInternalStore } from './useInternalStore';
import { emitter } from './emitter';
import { AudioProEventType } from './values';
import { Platform } from 'react-native';

export function isValidMediaUrl(url: string): boolean {
	if (!url || typeof url !== 'string' || !url.trim()) {
		logDebug('URL validation failed: URL is empty or not a string');
		return false;
	}

	try {
		const urlObj = new URL(url);
		const supportedProtocols = [
			'https:',
			'http:',
			'rtsp:',
			'rtmp:',
			'rtp:',
			'file:',
			'blob:',
			'data:',
		];

		if (
			!supportedProtocols.includes(urlObj.protocol) &&
			urlObj.protocol !== 'http:'
		) {
			logDebug(
				`URL validation failed: Unsupported protocol: ${urlObj.protocol}`,
			);
			return false;
		}

		// For web, check if the file extension is supported
		if (Platform.OS === 'web') {
			const supportedFormats = [
				'.mp3',
				'.mp4',
				'.m4a',
				'.aac',
				'.wav',
				'.ogg',
				'.oga',
				'.opus',
				'.webm',
			];
			const hasValidExtension = supportedFormats.some(
				(ext) =>
					urlObj.pathname.toLowerCase().endsWith(ext) ||
					urlObj.pathname.toLowerCase().includes(`${ext}?`),
			);

			if (!hasValidExtension && !urlObj.pathname.includes('stream')) {
				console.warn(
					`AudioPro: URL doesn't have a supported audio extension: ${url}. This may not work in all browsers.`,
				);
			}
		}

		return true;
	} catch (e) {
		console.warn(
			`AudioPro: URL format may be invalid but will attempt to play: ${url}`,
		);
		return true;
	}
}

export function isValidArtworkUrl(artworkUrl: string | number): boolean {
	// If artwork is a number (require() result), it's valid
	if (typeof artworkUrl === 'number') {
		return true;
	}
	if (!artworkUrl || typeof artworkUrl !== 'string' || !artworkUrl.trim()) {
		logDebug('Artwork URL validation failed: URL is empty or not a string');
		return false;
	}

	try {
		const urlObj = new URL(artworkUrl);

		const supportedImageFormats = [
			'.jpg',
			'.jpeg',
			'.png',
			'.webp',
			'.gif',
			'.svg',
		];

		// Check if the URL has a supported image extension
		const isImageFormatSupported = supportedImageFormats.some(
			(format) =>
				urlObj.pathname.toLowerCase().endsWith(format) ||
				urlObj.pathname.toLowerCase().includes(`${format}?`),
		);

		// For web, also accept data URLs for images
		const isDataUrl =
			urlObj.protocol === 'data:' &&
			(artworkUrl.startsWith('data:image/') ||
				artworkUrl.includes('base64'));

		if (!isImageFormatSupported && !isDataUrl) {
			console.warn(
				`AudioPro: Artwork URL doesn't have a supported image extension: ${artworkUrl}. Supported formats: ${supportedImageFormats.join(', ')}`,
			);
		}

		return true;
	} catch (e) {
		console.warn(
			`AudioPro: Artwork URL format may be invalid but will attempt to use it: ${artworkUrl}`,
		);
		return true;
	}
}

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

	if (!isValidMediaUrl(track.url)) {
		logDebug(
			`Track validation failed: Invalid media URL format: ${track.url}`,
		);
		return false;
	}

	if (!isValidArtworkUrl(track.artwork)) {
		logDebug(
			`Track validation failed: Invalid artwork URL format: ${track.artwork}`,
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
