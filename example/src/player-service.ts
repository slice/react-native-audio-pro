import {
  addAudioProListener,
  AudioProEvent,
  type AudioProEventPayload,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';

export function registerAudioProListeners() {
  addAudioProListener((event: AudioProEventPayload) => {
    const store = usePlayerStore.getState();

    if (event.position !== undefined) {
      store.setPosition(event.position);
    }

    if (event.duration !== undefined) {
      store.setDuration(event.duration);
    }

    switch (event.state) {
      case AudioProEvent.IsPlaying:
        store.setState(AudioProEvent.IsPlaying);
        break;
      case AudioProEvent.IsPaused:
        store.setState(AudioProEvent.IsPaused);
        break;
      case AudioProEvent.IsStopped:
        store.setState(AudioProEvent.IsStopped);
        break;
    }
  });
}
