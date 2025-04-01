import type { AudioProTrack } from 'react-native-audio-pro';

export const playlist: AudioProTrack[] = [
	{
		url: 'https://rnap.dev/audio-soundhelix-song-1-tschurger.mp3',
		title: 'Soundhelix Song 1',
		artwork: 'https://rnap.dev/artwork-usgs-bAji8qv_LlY-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		url: 'https://rnap.dev/audio-soundhelix-song-2-tschurger.mp3',
		title: 'Soundhelix Song 2',
		artwork: 'https://rnap.dev/artwork-usgs-PgL1p8TBGNQ-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		url: 'https://rnap.dev/audio-soundhelix-song-9-tschurger.mp3',
		title: 'Soundhelix Song 9',
		artwork: 'https://rnap.dev/artwork-usgs-8tfu4320oxI-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		url: 'https://error',
		title: 'This track should error',
		artwork: 'https://error',
		artist: 'For test purposes',
	},
];
