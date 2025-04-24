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
