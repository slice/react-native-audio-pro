import { NativeModules } from 'react-native';

export const NativeAudioPro = NativeModules.AudioPro
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
