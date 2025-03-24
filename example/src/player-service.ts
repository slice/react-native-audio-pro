import {
  addAudioProListener,
  AudioProState,
  type AudioProEventPayload,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';

export function registerAudioProListeners() {
  addAudioProListener((event: AudioProEventPayload) => {
    const store = usePlayerStore.getState();

    if (event.state === AudioProState.Playing) {
      store.setPosition(event.position);
      store.setDuration(event.duration);
      store.setState(AudioProState.Playing);
    } else if (event.state === AudioProState.Paused) {
      store.setState(AudioProState.Paused);
    } else if (event.state === AudioProState.Stopped) {
      store.setState(AudioProState.Stopped);
    } else if (event.state === AudioProState.Error) {
      console.error('AudioPro Error:', event.error);
      store.setState(AudioProState.Error);
    }
  });
}
