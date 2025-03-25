import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const DEFAULT_SEEK_SECONDS = 30;
const DEFAULT_SEEK_MILLISECONDS = DEFAULT_SEEK_SECONDS * 1000;

// Player States
export enum AudioProState {
  STOPPED = 'STOPPED',
  LOADING = 'LOADING',
  BUFFERING = 'BUFFERING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

// Notice types (used for instantaneous events)
export enum AudioProNotice {
  TRACK_ENDED = 'TRACK_ENDED',
  PLAYBACK_ERROR = 'PLAYBACK_ERROR',
  PROGRESS = 'PROGRESS',
  SEEK_COMPLETE = 'SEEK_COMPLETE',
}

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

export interface AudioProBufferingStatePayload
  extends BaseAudioProStatePayload {
  state: AudioProState.BUFFERING;
}

export type AudioProStatePayload =
  | AudioProPlayingStatePayload
  | AudioProPausedStatePayload
  | AudioProStoppedStatePayload
  | AudioProLoadingStatePayload
  | AudioProBufferingStatePayload;

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

export type AudioProNoticePayload =
  | AudioProTrackEndedNoticePayload
  | AudioProPlaybackErrorNoticePayload
  | AudioProProgressNoticePayload
  | AudioProSeekCompleteNoticePayload;

// ==============================
// Track definition
// ==============================
export type AudioProTrack = {
  url: string;
  artwork: string;
  title: string;
  album?: string;
  artist?: string;
};

const LINKING_ERROR =
  `The package 'react-native-audio-pro' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const AudioPro = NativeModules.AudioPro
  ? NativeModules.AudioPro
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// ==============================
// Exposed Methods
// ==============================
export function play(track: AudioProTrack): void {
  console.log('~~~ play', track);
  AudioPro.play(track);
}

export function pause(): void {
  AudioPro.pause();
}

export function resume(): void {
  AudioPro.resume();
}

export function stop(): void {
  AudioPro.stop();
}

export function seekTo(position: number): void {
  AudioPro.seekTo(position);
}

export function seekForward(amount: number = DEFAULT_SEEK_MILLISECONDS): void {
  AudioPro.seekForward(amount);
}

export function seekBack(amount: number = DEFAULT_SEEK_MILLISECONDS): void {
  AudioPro.seekBack(amount);
}

const emitter = new NativeEventEmitter(AudioPro);

// ==============================
// Listener Callback Types
// ==============================
export type AudioProStateCallback = (payload: AudioProStatePayload) => void;
export type AudioProNoticeCallback = (payload: AudioProNoticePayload) => void;

// ==============================
// State Listener
// ==============================
export function addAudioProStateListener(callback: AudioProStateCallback) {
  return emitter.addListener('AudioProStateEvent', (event: any) => {
    console.log('~~~ AudioProStateEvent', event);
    switch (event.state) {
      case AudioProState.PLAYING:
        callback({
          state: AudioProState.PLAYING,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProState.PAUSED:
        callback({
          state: AudioProState.PAUSED,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProState.STOPPED:
        callback({
          state: AudioProState.STOPPED,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProState.LOADING:
        callback({ state: AudioProState.LOADING });
        break;
      case AudioProState.BUFFERING:
        callback({ state: AudioProState.BUFFERING });
        break;
      default:
        break;
    }
  });
}

// ==============================
// Notice Listener
// ==============================
export function addAudioProNoticeListener(callback: AudioProNoticeCallback) {
  return emitter.addListener('AudioProNoticeEvent', (event: any) => {
    console.log('~~~ AudioProNoticeEvent', event);
    switch (event.notice) {
      case AudioProNotice.TRACK_ENDED:
        callback({
          notice: AudioProNotice.TRACK_ENDED,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProNotice.PLAYBACK_ERROR:
        callback({
          notice: AudioProNotice.PLAYBACK_ERROR,
          error: event.error,
          errorCode: event.errorCode,
        });
        break;
      case AudioProNotice.PROGRESS:
        callback({
          notice: AudioProNotice.PROGRESS,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProNotice.SEEK_COMPLETE:
        callback({
          notice: AudioProNotice.SEEK_COMPLETE,
          position: event.position,
          duration: event.duration,
        });
        break;
      default:
        break;
    }
  });
}
