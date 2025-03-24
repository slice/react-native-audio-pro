import {
  addAudioProListener,
  AudioProState,
  type AudioProEventPayload,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';

export function registerAudioProListeners() {
  addAudioProListener((event: AudioProEventPayload) => {
    const store = usePlayerStore.getState();

    if (event.state === AudioProState.PLAYING) {
      store.setPosition(event.position);
      store.setDuration(event.duration);
      store.setState(AudioProState.PLAYING);
    } else if (event.state === AudioProState.PAUSED) {
      store.setState(AudioProState.PAUSED);
    } else if (event.state === AudioProState.STOPPED) {
      store.setState(AudioProState.STOPPED);
    } else if (event.state === AudioProState.ERROR) {
      console.error('AudioPro Error:', event.error);
      store.setState(AudioProState.ERROR);
    } else if (event.state === AudioProState.SEEK_START) {
      // Optional: Handle seek start event if needed
    } else if (event.state === AudioProState.SEEK_COMPLETE) {
      store.setPosition(event.position);
      store.setDuration(event.duration);
    }
  });
}
