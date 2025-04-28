import { copyArtworkToCache, copyAudioToCache } from './file-utils';

export function formatTime(milliseconds: number): string {
	const seconds = milliseconds / 1000;
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export const getStateColor = (state: string) => {
	switch (state) {
		case 'IDLE':
			return '#999';
		case 'STOPPED':
			return '#666';
		case 'LOADING':
			return '#81b0ff';
		case 'PLAYING':
			return '#90ee90';
		case 'PAUSED':
			return '#ffa500';
		case 'ERROR':
			return '#ff6b6b';
		default:
			return '#fff';
	}
};

export const copyTestingFiles = () => {
	// Copy testing files
	setTimeout(() => {
		// Copy audio file to the cache directory for testing
		const audioSource = require('../../docs/audio-soundhelix-song-9-tschurger.mp3');
		copyAudioToCache(audioSource)
			.then(() => {
				console.log('Audio file copied to cache for testing');
			})
			.catch((error) => {
				console.error('Failed to copy audio file to cache:', error);
			});

		// Copy artwork file to the cache directory for testing
		const artworkSource = require('../../docs/artwork-usgs-PgL1p8TBGNQ-unsplash.jpg');
		copyArtworkToCache(artworkSource)
			.then(() => {
				console.log('Artwork file copied to cache for testing');
			})
			.catch((error) => {
				console.error('Failed to copy artwork file to cache:', error);
			});
	}, 1000);
};
