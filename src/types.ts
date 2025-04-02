import { AudioProEventName, AudioProState } from './values';

// ==============================
// Track definition
// ==============================
export type AudioProTrack = {
	id: string;
	url: string;
	title: string;
	artwork: string;
	album?: string;
	artist?: string;
};

// ==============================
// State Payloads
// ==============================
export interface BaseAudioProStatePayload {
	state: AudioProState;
	track: AudioProTrack | null;
}

export interface AudioProPlayingStatePayload extends BaseAudioProStatePayload {
	state: AudioProState.PLAYING;
	position: number;
	duration: number;
}

export interface AudioProPausedStatePayload extends BaseAudioProStatePayload {
	state: AudioProState.PAUSED;
	position: number;
	duration: number;
}

export interface AudioProStoppedStatePayload extends BaseAudioProStatePayload {
	state: AudioProState.STOPPED;
	position: number;
	duration: number;
}

export interface AudioProLoadingStatePayload extends BaseAudioProStatePayload {
	state: AudioProState.LOADING;
}

export type AudioProStatePayload =
	| AudioProPlayingStatePayload
	| AudioProPausedStatePayload
	| AudioProStoppedStatePayload
	| AudioProLoadingStatePayload;

// ==============================
// Notice Payloads
// ==============================
export interface BaseAudioProNoticePayload {
	name: AudioProEventName;
	track: AudioProTrack | null;
}

export interface AudioProTrackEndedNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.TRACK_ENDED;
	position: number;
	duration: number;
}

export interface AudioProPlaybackErrorNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.PLAYBACK_ERROR;
	error: string;
	errorCode?: number;
}

export interface AudioProProgressNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.PROGRESS;
	position: number;
	duration: number;
}

export interface AudioProSeekCompleteNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.SEEK_COMPLETE;
	position: number;
	duration: number;
}

export interface AudioProRemoteNextNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.REMOTE_NEXT;
}

export interface AudioProRemotePrevNoticePayload
	extends BaseAudioProNoticePayload {
	name: AudioProEventName.REMOTE_PREV;
}

export type AudioProEventPayload =
	| AudioProTrackEndedNoticePayload
	| AudioProPlaybackErrorNoticePayload
	| AudioProProgressNoticePayload
	| AudioProSeekCompleteNoticePayload
	| AudioProRemoteNextNoticePayload
	| AudioProRemotePrevNoticePayload;

export type AudioProConfigureOptions = {
	contentType?: 'music' | 'speech';
	debug?: boolean;
};

// ==============================
// Listener Callback Types
// ==============================
export type AudioProEventCallback = (payload: AudioProEventPayload) => void;
