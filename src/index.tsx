import { NativeModules, Platform } from 'react-native';

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
