import {
	AudioProContentType,
	AudioProEventType,
	AudioProState,
} from './values';

// ==============================
// TRACK
// ==============================

export type AudioProArtwork = string | number;

export type AudioProTrack = {
	id: string;
	url: string | number;
	title: string;
	artwork: AudioProArtwork;
	album?: string;
	artist?: string;
	[key: string]: unknown; // custom properties
};

// ==============================
// CONFIGURE OPTIONS
// ==============================

export type AudioProConfigureOptions = {
	contentType?: AudioProContentType;
	debug?: boolean;
	debugIncludesProgress?: boolean;
};

// ==============================
// PLAY OPTIONS
// ==============================

export type AudioProHeaders = {
	audio?: Record<string, string>;
	artwork?: Record<string, string>;
};

export type AudioProPlayOptions = {
	autoPlay?: boolean;
	headers?: AudioProHeaders;
} & AudioProConfigureOptions;

// ==============================
// EVENTS
// ==============================

export type AudioProEventCallback = (event: AudioProEvent) => void;

export interface AudioProEvent {
	type: AudioProEventType;
	track: AudioProTrack | null; // Required for all events except REMOTE_NEXT and REMOTE_PREV
	payload?: {
		state?: AudioProState;
		position?: number;
		duration?: number;
		error?: string;
		errorCode?: number;
		speed?: number;
	};
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

export interface AudioProPlaybackSpeedChangedPayload {
	speed: number;
}
