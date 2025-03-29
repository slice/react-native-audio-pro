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

let isSetup = false;
let setupOptions: AudioProSetupOptions | null = null;
let debug = false;

function logDebug(...args: any[]) {
  if (debug) {
    console.log('~~~', ...args);
  }
}

function ensureSetup(): boolean {
  if (!isSetup) {
    if (!setupOptions) {
      emitter.emit('AudioProNoticeEvent', {
        notice: AudioProNotice.PLAYBACK_ERROR,
        error: 'AudioPro: setup() must be called before using this method.',
        errorCode: 1001,
      });
      return false;
    }
    logDebug('AudioPro: calling NativeAudioPro.setup()', setupOptions);
    NativeAudioPro.setup(setupOptions);
    isSetup = true;
  }
  return true;
}

const AudioPro = {
  setup(options: AudioProSetupOptions): void {
    logDebug('AudioPro: setup()', options);
    if (isSetup) {
      console.warn(
        '[AudioPro] setup() already called. Ignoring duplicate call.'
      );
      return;
    }
    setupOptions = options;
    debug = !!options.debug;
  },

  async play(track: AudioProTrack): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: play()', track);
    NativeAudioPro.play(track);
  },

  async pause(): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: pause()');
    NativeAudioPro.pause();
  },

  async resume(): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: resume()');
    NativeAudioPro.resume();
  },

  async stop(): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: stop()');
    NativeAudioPro.stop();
  },

  async seekTo(position: number): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: seekTo()', position);
    NativeAudioPro.seekTo(position);
  },

  async seekForward(amount: number = DEFAULT_SEEK_MILLISECONDS): Promise<void> {
    if (!ensureSetup()) return;
    logDebug('AudioPro: seekForward()', amount);
    NativeAudioPro.seekForward(amount);
  },

  async seekBack(amount: number = DEFAULT_SEEK_MILLISECONDS): Promise<void> {
    if (!ensureSetup()) return;
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
