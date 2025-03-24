import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const DEFAULT_SEEK_SECONDS = 30;
const DEFAULT_SEEK_MILLISECONDS = DEFAULT_SEEK_SECONDS * 1000;

export enum AudioProState {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  SEEK_START = 'SEEK_START',
  SEEK_COMPLETE = 'SEEK_COMPLETE',
}

export interface BaseAudioProEventPayload {
  state: AudioProState;
}

export interface AudioProPlayingStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.PLAYING;
  position: number;
  duration: number;
}

export interface AudioProPausedStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.PAUSED;
}

export interface AudioProStoppedStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.STOPPED;
}

export interface AudioProErrorStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.ERROR;
  error: string;
}

export interface AudioProSeekStartStatePayload
  extends BaseAudioProEventPayload {
  state: AudioProState.SEEK_START;
}

export interface AudioProSeekCompleteStatePayload
  extends BaseAudioProEventPayload {
  state: AudioProState.SEEK_COMPLETE;
  position: number;
  duration: number;
}

export type AudioProEventPayload =
  | AudioProPlayingStatePayload
  | AudioProPausedStatePayload
  | AudioProStoppedStatePayload
  | AudioProErrorStatePayload
  | AudioProSeekStartStatePayload
  | AudioProSeekCompleteStatePayload;

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

export function play(track: AudioProTrack): void {
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

export type AudioProCallback = (payload: AudioProEventPayload) => void;

export function addAudioProListener(callback: AudioProCallback) {
  return emitter.addListener('AudioProEvent', (event: any) => {
    switch (event.state) {
      case AudioProState.PLAYING:
        callback({
          state: AudioProState.PLAYING,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProState.ERROR:
        callback({
          state: AudioProState.ERROR,
          error: event.error,
        });
        break;
      case AudioProState.PAUSED:
        callback({ state: AudioProState.PAUSED });
        break;
      case AudioProState.STOPPED:
        callback({ state: AudioProState.STOPPED });
        break;
      case AudioProState.SEEK_START:
        callback({ state: AudioProState.SEEK_START });
        break;
      case AudioProState.SEEK_COMPLETE:
        callback({
          state: AudioProState.SEEK_COMPLETE,
          position: event.position,
          duration: event.duration,
        });
        break;
      default:
        break;
    }
  });
}
