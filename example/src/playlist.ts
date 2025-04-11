import type { AudioProTrack } from 'react-native-audio-pro';

export const playlist: AudioProTrack[] = [
	{
		id: 'song-1',
		url: 'https://rnap.dev/audio-soundhelix-song-1-tschurger.mp3',
		title: 'Soundhelix Song 1',
		artwork: 'https://rnap.dev/artwork-usgs-bAji8qv_LlY-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		id: 'song-2',
		url: 'https://rnap.dev/audio-soundhelix-song-2-tschurger.mp3',
		title: 'Soundhelix Song 2',
		artwork: require('../../docs/artwork-usgs-PgL1p8TBGNQ-unsplash.jpg'),
		artist: 'T. Schurger',
	},
	{
		id: 'stream-1-hls',
		url: 'https://stream-akamai.castr.com/5b9352dbda7b8c769937e459/live_2361c920455111ea85db6911fe397b9e/index.fmp4.m3u8',
		title: 'Castr Stream (HLS)',
		artwork: 'https://rnap.dev/artwork-usgs-8tfu4320oxI-unsplash.jpg',
		artist: 'Castr',
	},
	{
		id: 'error-track',
		url: 'https://error',
		title: 'This track should error',
		artwork: 'https://error',
		artist: 'For test purposes',
	},
];
