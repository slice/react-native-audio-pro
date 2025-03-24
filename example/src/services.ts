export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export const playlist = [
  {
    id: '1',
    url: 'https://rnap.dev/soundhelix-song-1-tschurger.m4a',
    title: 'Soundhelix Song 1',
    artist: 'T. Schurger',
    artworkUrl: 'https://rnap.dev/usgs-bAji8qv_LlY-unsplash.jpg',
  },
  {
    id: '2',
    url: 'https://rnap.dev/soundhelix-song-5-tschurger.m4a',
    title: 'Soundhelix Song 5',
    artist: 'T. Schurger',
    artworkUrl: 'https://rnap.dev/usgs-PgL1p8TBGNQ-unsplash.jpg',
  },
];
