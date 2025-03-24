import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export enum AudioProState {
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Error = 'error',
}

export interface BaseAudioProEventPayload {
  state: AudioProState;
}

export interface AudioProPlayingStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.Playing;
  position: number;
  duration: number;
}

export interface AudioProPausedStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.Paused;
}

export interface AudioProStoppedStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.Stopped;
}

export interface AudioProErrorStatePayload extends BaseAudioProEventPayload {
  state: AudioProState.Error;
  error: string;
}

export type AudioProEventPayload =
  | AudioProPlayingStatePayload
  | AudioProPausedStatePayload
  | AudioProStoppedStatePayload
  | AudioProErrorStatePayload;

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

const emitter = new NativeEventEmitter(AudioPro);

export type AudioProCallback = (payload: AudioProEventPayload) => void;

export function addAudioProListener(callback: AudioProCallback) {
  return emitter.addListener('AudioProEvent', (event: any) => {
    switch (event.state) {
      case AudioProState.Playing:
        callback({
          state: AudioProState.Playing,
          position: event.position,
          duration: event.duration,
        });
        break;
      case AudioProState.Error:
        callback({
          state: AudioProState.Error,
          error: event.error,
        });
        break;
      case AudioProState.Paused:
        callback({ state: AudioProState.Paused });
        break;
      case AudioProState.Stopped:
        callback({ state: AudioProState.Stopped });
        break;
      default:
        break;
    }
  });
}
