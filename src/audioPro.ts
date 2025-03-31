import type {
  AudioProConfigureOptions,
  AudioProEventCallback,
  AudioProEventPayload,
  AudioProTrack,
} from './types';
import { guardTrackLoaded, logDebug, validateTrack } from './utils';
import { useAudioProStore } from './useAudioProStore';
import {
  AudioProEventName,
  DEFAULT_CONFIG,
  DEFAULT_SEEK_SECONDS,
} from './values';
import { emitter } from './emitter';
import { NativeAudioPro } from './native';

export const AudioPro = {
  configure(options: AudioProConfigureOptions): void {
    logDebug('AudioPro: configure()', options);
    const { setConfigureOptions, setDebug } = useAudioProStore.getState();
    setConfigureOptions({ ...DEFAULT_CONFIG, ...options });
    setDebug(!!options.debug);
  },

  load(track: AudioProTrack) {
    logDebug('AudioPro: load()', track);
    if (!validateTrack(track)) {
      const errorMessage = 'AudioPro: Invalid track provided to load().';
      console.error(errorMessage);
      emitter.emit('AudioProEvent', {
        name: AudioProEventName.PLAYBACK_ERROR,
        error: errorMessage,
        errorCode: -1,
      });
      return;
    }
    useAudioProStore.getState().setLoadedTrack(track);
  },

  play() {
    if (!guardTrackLoaded('play')) return;
    const { loadedTrack, configureOptions } = useAudioProStore.getState();
    logDebug('AudioPro: play()', loadedTrack);
    NativeAudioPro.play(loadedTrack, configureOptions);
  },

  pause() {
    if (!guardTrackLoaded('pause')) return;
    logDebug('AudioPro: pause()');
    NativeAudioPro.pause();
  },

  resume() {
    if (!guardTrackLoaded('resume')) return;
    logDebug('AudioPro: resume()');
    NativeAudioPro.resume();
  },

  stop() {
    if (!guardTrackLoaded('stop')) return;
    logDebug('AudioPro: stop()');
    NativeAudioPro.stop();
  },

  seekTo(position: number) {
    logDebug('AudioPro: seekTo()', position);
    NativeAudioPro.seekTo(position);
  },

  seekForward(seconds: number = DEFAULT_SEEK_SECONDS) {
    logDebug('AudioPro: seekForward()', seconds);
    const milliseconds = seconds * 1000;
    NativeAudioPro.seekForward(milliseconds);
  },

  seekBack(seconds: number = DEFAULT_SEEK_SECONDS) {
    logDebug('AudioPro: seekBack()', seconds);
    const milliseconds = seconds * 1000;
    NativeAudioPro.seekBack(milliseconds);
  },

  addEventListener(callback: AudioProEventCallback) {
    return emitter.addListener(
      'AudioProEvent',
      (event: AudioProEventPayload) => {
        callback(event);
      }
    );
  },
};
