import { addAudioProListener, AudioProEvent } from 'react-native-audio-pro';
import { usePlayerStore } from './AudioProStore';

export function registerAudioProListeners() {
  addAudioProListener((event: AudioProEvent) => {
    switch (event) {
      case AudioProEvent.IsPlaying:
        usePlayerStore.getState().setState(AudioProEvent.IsPlaying);
        break;
      case AudioProEvent.IsPaused:
        usePlayerStore.getState().setState(AudioProEvent.IsPaused);
        break;
      case AudioProEvent.IsStopped:
        usePlayerStore.getState().setState(AudioProEvent.IsStopped);
        break;
      default:
        break;
    }
  });
}
