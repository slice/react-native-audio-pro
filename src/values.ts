import type { AudioProConfigureOptions } from './types';

export const DEFAULT_SEEK_SECONDS = 30;

export enum AudioProContentType {
	MUSIC = 'MUSIC',
	SPEECH = 'SPEECH',
}

export enum AudioProState {
	STOPPED = 'STOPPED',
	LOADING = 'LOADING',
	PLAYING = 'PLAYING',
	PAUSED = 'PAUSED',
	ERROR = 'ERROR',
}

export enum AudioProEventType {
	STATE_CHANGED = 'STATE_CHANGED',
	PROGRESS = 'PROGRESS',
	TRACK_ENDED = 'TRACK_ENDED',
	SEEK_COMPLETE = 'SEEK_COMPLETE',
	PLAYBACK_SPEED_CHANGED = 'PLAYBACK_SPEED_CHANGED',
	REMOTE_NEXT = 'REMOTE_NEXT',
	REMOTE_PREV = 'REMOTE_PREV',
	PLAYBACK_ERROR = 'PLAYBACK_ERROR',
}

export const DEFAULT_CONFIG: AudioProConfigureOptions = {
	contentType: AudioProContentType.MUSIC,
	debug: false,
};
