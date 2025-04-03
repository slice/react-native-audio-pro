import {
	AudioProContentType,
	AudioProEventType,
	AudioProState,
} from './values';

// ==============================
// TRACK
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
// CONFIGURE OPTIONS
// ==============================

export type AudioProConfigureOptions = {
	contentType?: AudioProContentType;
	debug?: boolean;
};

// ==============================
// EVENTS
// ==============================

export type AudioProEventCallback = (event: AudioProEvent) => void;

export interface AudioProEvent {
	type: AudioProEventType;
	track: AudioProTrack | null;
	payload?: Record<string, any>;
}

export interface AudioProStateChangedPayload {
	state: AudioProState;
	position: number;
	duration: number;
}

export interface AudioProTrackEndedPayload {
	position: number;
	duration: number;
}

export interface AudioProPlaybackErrorPayload {
	error: string;
	errorCode?: number;
}

export interface AudioProProgressPayload {
	position: number;
	duration: number;
}

export interface AudioProSeekCompletePayload {
	position: number;
	duration: number;
}

export interface AudioProRemoteNextPayload {}

export interface AudioProRemotePrevPayload {}

export interface AudioProPlaybackSpeedChangedPayload {
	speed: number;
}
