import {
  addAudioProListener,
  AudioProEvent,
  type AudioProEventPayload,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';

export function registerAudioProListeners() {
  addAudioProListener((event: AudioProEventPayload) => {
    switch (event.state) {
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
