import { NativeEventEmitter, NativeModules } from 'react-native';
import {
  type AudioProNoticeCallback,
  type AudioProNoticePayload,
  type AudioProStateCallback,
  type AudioProStatePayload,
  type AudioProTrack,
} from './types';

const DEFAULT_SEEK_SECONDS = 30;
const DEFAULT_SEEK_MILLISECONDS = DEFAULT_SEEK_SECONDS * 1000;

export enum AudioProState {
  STOPPED = 'STOPPED',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export enum AudioProNotice {
  TRACK_ENDED = 'TRACK_ENDED',
  PLAYBACK_ERROR = 'PLAYBACK_ERROR',
  PROGRESS = 'PROGRESS',
  SEEK_COMPLETE = 'SEEK_COMPLETE',
  REMOTE_NEXT = 'REMOTE_NEXT',
  REMOTE_PREV = 'REMOTE_PREV',
}

const NativeAudioPro = NativeModules.AudioPro
  ? NativeModules.AudioPro
  : new Proxy(
      {},
      {
        get() {
          throw new Error(
            'react-native-audio-pro: Native module is not linked properly.'
          );
        },
      }
    );

const emitter = new NativeEventEmitter(NativeAudioPro);

const AudioPro = {
  play(track: AudioProTrack): void {
    NativeAudioPro.play(track);
  },

  pause(): void {
    NativeAudioPro.pause();
  },

  resume(): void {
    NativeAudioPro.resume();
  },

  stop(): void {
    NativeAudioPro.stop();
  },

  seekTo(position: number): void {
    NativeAudioPro.seekTo(position);
  },

  seekForward(amount: number = DEFAULT_SEEK_MILLISECONDS): void {
    NativeAudioPro.seekForward(amount);
  },

  seekBack(amount: number = DEFAULT_SEEK_MILLISECONDS): void {
    NativeAudioPro.seekBack(amount);
  },

  addStateListener(callback: AudioProStateCallback) {
    return emitter.addListener(
      'AudioProStateEvent',
      (event: AudioProStatePayload) => {
        console.log('~~~ AudioProState', event);
        callback(event);
      }
    );
  },

  addNoticeListener(callback: AudioProNoticeCallback) {
    return emitter.addListener(
      'AudioProNoticeEvent',
      (event: AudioProNoticePayload) => {
        console.log('~~~ AudioProNotice', event);
        callback(event);
      }
    );
  },
};

export default AudioPro;

export type {
  AudioProTrack,
  AudioProStatePayload,
  AudioProNoticePayload,
  AudioProStateCallback,
  AudioProNoticeCallback,
};
