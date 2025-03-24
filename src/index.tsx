import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export enum AudioProEvent {
  IsPlaying = 'IsPlaying',
  IsPaused = 'IsPaused',
  IsStopped = 'IsStopped',
}

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

export function play(url: string): void {
  AudioPro.play(url);
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

export type AudioProCallback = (state: AudioProEvent) => void;

export function addAudioProListener(callback: AudioProCallback) {
  return emitter.addListener('AudioProEvent', (event: { state: string }) => {
    switch (event.state) {
      case AudioProEvent.IsPlaying:
        callback(AudioProEvent.IsPlaying);
        break;
      case AudioProEvent.IsPaused:
        callback(AudioProEvent.IsPaused);
        break;
      case AudioProEvent.IsStopped:
        callback(AudioProEvent.IsStopped);
        break;
      default:
        break;
    }
  });
}
