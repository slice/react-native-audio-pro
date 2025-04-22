import type { AudioProTrack } from './types';
import { useInternalStore } from './useInternalStore';
import { emitter } from './emitter';
import { AudioProEventType } from './values';
import { Platform } from 'react-native';

export function isValidMediaUrl(url: string | number): boolean {
	// If URL is a number (require() result), it's valid
	if (typeof url === 'number') {
		return true;
	}

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

			// Check for supported extensions in pathname or query parameters
			const hasValidExtension = supportedFormats.some(
				(ext) =>
					urlObj.pathname.toLowerCase().endsWith(ext) ||
					urlObj.pathname.toLowerCase().includes(`${ext}?`) ||
					url.toLowerCase().includes(`format=${ext.substring(1)}`) ||
					url.toLowerCase().includes(`type=${ext.substring(1)}`),
			);

			// Check for common streaming indicators
			const isStreamingUrl =
				urlObj.pathname.toLowerCase().includes('stream') ||
				urlObj.pathname.toLowerCase().includes('audio') ||
				urlObj.pathname.toLowerCase().includes('media') ||
				urlObj.pathname.toLowerCase().includes('sound') ||
				urlObj.pathname.toLowerCase().includes('music') ||
				urlObj.pathname.toLowerCase().includes('podcast') ||
				urlObj.pathname.toLowerCase().includes('hls') ||
				urlObj.pathname.toLowerCase().includes('m3u8');

			if (!hasValidExtension && !isStreamingUrl) {
				// Only warn for web platform where format compatibility matters more
				logDebug(
					`URL doesn't have a recognized audio format: ${url}. This may not work in all browsers.`,
				);
			}
		}

		return true;
	} catch (e) {
		// If the URL is a string but not a valid URL object, it might be a relative path
		// or a custom URI scheme. We'll allow it but log a debug message.
		logDebug(
			`URL format may be non-standard but will attempt to play: ${url}`,
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

		// Check if the URL has a supported image extension in pathname or query parameters
		const isImageFormatSupported = supportedImageFormats.some(
			(format) =>
				urlObj.pathname.toLowerCase().endsWith(format) ||
				urlObj.pathname.toLowerCase().includes(`${format}?`) ||
				artworkUrl
					.toLowerCase()
					.includes(`format=${format.substring(1)}`) ||
				artworkUrl
					.toLowerCase()
					.includes(`type=${format.substring(1)}`),
		);

		// Accept data URLs for images
		const isDataUrl =
			urlObj.protocol === 'data:' &&
			(artworkUrl.startsWith('data:image/') ||
				artworkUrl.includes('base64'));

		// Check for common image indicators in the URL
		const isImageUrl =
			urlObj.pathname.toLowerCase().includes('image') ||
			urlObj.pathname.toLowerCase().includes('img') ||
			urlObj.pathname.toLowerCase().includes('photo') ||
			urlObj.pathname.toLowerCase().includes('picture') ||
			urlObj.pathname.toLowerCase().includes('artwork') ||
			urlObj.pathname.toLowerCase().includes('cover') ||
			urlObj.pathname.toLowerCase().includes('thumbnail') ||
			urlObj.pathname.toLowerCase().includes('avatar');

		if (!isImageFormatSupported && !isDataUrl && !isImageUrl) {
			// Use logDebug instead of console.warn to avoid unnecessary warnings
			logDebug(
				`Artwork URL doesn't have a recognized image format: ${artworkUrl}. Supported formats: ${supportedImageFormats.join(', ')}`,
			);
		}

		return true;
	} catch (e) {
		// If the URL is a string but not a valid URL object, it might be a relative path
		// or a custom URI scheme. We'll allow it but log a debug message.
		logDebug(
			`Artwork URL format may be non-standard but will attempt to use it: ${artworkUrl}`,
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

	if (typeof track.url === 'string' && !isValidMediaUrl(track.url)) {
		logDebug(
			`Track validation failed: Invalid media URL format: ${track.url}`,
		);
		return false;
	}

	if (
		typeof track.artwork === 'string' &&
		!isValidArtworkUrl(track.artwork)
	) {
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
