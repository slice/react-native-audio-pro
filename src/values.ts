import type { AudioProConfigureOptions } from './types';

export const DEFAULT_SEEK_SECONDS = 30;

export const DEFAULT_CONFIG: AudioProConfigureOptions = {
  contentType: 'music',
  debug: false,
};

export enum AudioProEventName {
  TRACK_ENDED = 'TRACK_ENDED',
  PROGRESS = 'PROGRESS',
  SEEK_COMPLETE = 'SEEK_COMPLETE',
  REMOTE_NEXT = 'REMOTE_NEXT',
  REMOTE_PREV = 'REMOTE_PREV',
  PLAYBACK_ERROR = 'PLAYBACK_ERROR',
}

export enum AudioProState {
  STOPPED = 'STOPPED',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}
