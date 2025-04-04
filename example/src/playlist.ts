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
		artwork: 'https://rnap.dev/artwork-usgs-PgL1p8TBGNQ-unsplash.jpg',
		artist: 'T. Schurger',
	},
	{
		id: 'stream-1',
		url: 'https://audio-edge-d34v9.syd.o.radiomast.io/ref-128k-mp3-stereo-preroll',
		title: 'Radio Mast Stream',
		artwork: 'https://rnap.dev/artwork-usgs-8tfu4320oxI-unsplash.jpg',
		artist: 'Radio Mast',
	},
	{
		id: 'error-track',
		url: 'https://error',
		title: 'This track should error',
		artwork: 'https://error',
		artist: 'For test purposes',
	},
];
