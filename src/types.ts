import { AudioProNotice, AudioProState } from './index';

// ==============================
// Track definition
// ==============================
export type AudioProTrack = {
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
  notice: AudioProNotice;
}

export interface AudioProTrackEndedNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.TRACK_ENDED;
  position: number;
  duration: number;
}

export interface AudioProPlaybackErrorNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.PLAYBACK_ERROR;
  error: string;
  errorCode?: number;
}

export interface AudioProProgressNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.PROGRESS;
  position: number;
  duration: number;
}

export interface AudioProSeekCompleteNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.SEEK_COMPLETE;
  position: number;
  duration: number;
}

export interface AudioProRemoteNextNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.REMOTE_NEXT;
}

export interface AudioProRemotePrevNoticePayload
  extends BaseAudioProNoticePayload {
  notice: AudioProNotice.REMOTE_PREV;
}

export type AudioProNoticePayload =
  | AudioProTrackEndedNoticePayload
  | AudioProPlaybackErrorNoticePayload
  | AudioProProgressNoticePayload
  | AudioProSeekCompleteNoticePayload
  | AudioProRemoteNextNoticePayload
  | AudioProRemotePrevNoticePayload;

export type AudioProSetupOptions = {
  contentType?: 'music' | 'speech';
  debug?: boolean;
};

// ==============================
// Listener Callback Types
// ==============================
export type AudioProStateCallback = (payload: AudioProStatePayload) => void;
export type AudioProNoticeCallback = (payload: AudioProNoticePayload) => void;
