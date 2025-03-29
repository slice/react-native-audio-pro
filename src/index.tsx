import { NativeEventEmitter, NativeModules } from 'react-native';
import {
  type AudioProNoticeCallback,
  type AudioProNoticePayload,
  type AudioProSetupOptions,
  type AudioProStateCallback,
  type AudioProStatePayload,
  type AudioProTrack,
} from './types';

const DEFAULT_SEEK_SECONDS = 30;
const DEFAULT_SEEK_MILLISECONDS = DEFAULT_SEEK_SECONDS * 1000;

const DEFAULT_CONFIG: AudioProSetupOptions = {
  contentType: 'music',
};

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

let configureOptions: AudioProSetupOptions = { ...DEFAULT_CONFIG };
let debug = false;

function logDebug(...args: any[]) {
  if (debug) {
    console.log('~~~', ...args);
  }
}

const AudioPro = {
  configure(options: AudioProSetupOptions): void {
    logDebug('AudioPro: configure()', options);
    configureOptions = { ...DEFAULT_CONFIG, ...options };
    debug = !!options.debug;
  },

  async play(track: AudioProTrack): Promise<void> {
    logDebug('AudioPro: play()', track);
    NativeAudioPro.play(track, configureOptions);
  },

  async pause(): Promise<void> {
    logDebug('AudioPro: pause()');
    NativeAudioPro.pause();
  },

  async resume(): Promise<void> {
    logDebug('AudioPro: resume()');
    NativeAudioPro.resume();
  },

  async stop(): Promise<void> {
    logDebug('AudioPro: stop()');
    NativeAudioPro.stop();
  },

  async seekTo(position: number): Promise<void> {
    logDebug('AudioPro: seekTo()', position);
    NativeAudioPro.seekTo(position);
  },

  async seekForward(amount: number = DEFAULT_SEEK_MILLISECONDS): Promise<void> {
    logDebug('AudioPro: seekForward()', amount);
    NativeAudioPro.seekForward(amount);
  },

  async seekBack(amount: number = DEFAULT_SEEK_MILLISECONDS): Promise<void> {
    logDebug('AudioPro: seekBack()', amount);
    NativeAudioPro.seekBack(amount);
  },

  addStateListener(callback: AudioProStateCallback) {
    return emitter.addListener(
      'AudioProStateEvent',
      (event: AudioProStatePayload) => {
        logDebug('AudioProState', event);
        callback(event);
      }
    );
  },

  addNoticeListener(callback: AudioProNoticeCallback) {
    return emitter.addListener(
      'AudioProNoticeEvent',
      (event: AudioProNoticePayload) => {
        logDebug('AudioProNotice', event);
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
