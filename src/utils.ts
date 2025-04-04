import type { AudioProTrack } from './types';
import { useInternalStore } from './useInternalStore';
import { emitter } from './emitter';
import { AudioProEventType } from './values';

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

		return true;
	} catch (e) {
		console.warn(
			`AudioPro: URL format may be invalid but will attempt to play: ${url}`,
		);
		return true;
	}
}

export function isValidArtworkUrl(artworkUrl: string): boolean {
	if (!artworkUrl || typeof artworkUrl !== 'string' || !artworkUrl.trim()) {
		logDebug('Artwork URL validation failed: URL is empty or not a string');
		return false;
	}

	try {
		// eslint-disable-next-line no-new
		new URL(artworkUrl);

		const supportedImageFormats = [
			'.jpg',
			'.jpeg',
			'.png',
			'.webp',
			'.gif',
		];
		const isImageFormatSupported = supportedImageFormats.some(
			(format) =>
				artworkUrl.toLowerCase().endsWith(format) ||
				artworkUrl.toLowerCase().includes(`${format}?`),
		);

		if (!isImageFormatSupported) {
			console.warn(
				`AudioPro: Artwork URL doesn't have a recognized image extension: ${artworkUrl}`,
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
