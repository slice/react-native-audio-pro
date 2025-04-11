import type { AudioProTrack } from 'react-native-audio-pro';

export const playlist: AudioProTrack[] = [
	{
		id: 'remote-song-1',
		url: 'https://rnap.dev/audio-soundhelix-song-1-tschurger.mp3',
		title: 'Soundhelix Song 1',
		artwork: 'https://rnap.dev/artwork-usgs-bAji8qv_LlY-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		id: 'local-song-2',
		url: require('../../docs/audio-soundhelix-song-9-tschurger.mp3'),
		title: 'Local Audio File (Song 9)',
		artwork: require('../../docs/artwork-usgs-PgL1p8TBGNQ-unsplash.jpg'),
		artist: 'T. Schurger (Local)',
	},
	{
		id: 'stream-hls-3',
		url: 'https://stream-akamai.castr.com/5b9352dbda7b8c769937e459/live_2361c920455111ea85db6911fe397b9e/index.fmp4.m3u8',
		title: 'Castr Stream (HLS)',
		artwork: 'https://rnap.dev/artwork-usgs-8tfu4320oxI-unsplash.jpg',
		artist: 'Castr',
	},
	{
		id: 'error-track-1',
		url: 'https://error',
		title: 'This track should error',
		artwork: 'https://error',
		artist: 'For test purposes',
	},
];
