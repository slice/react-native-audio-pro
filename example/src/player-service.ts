import {
  addAudioProStateListener,
  addAudioProNoticeListener,
  AudioProState,
  AudioProNotice,
  type AudioProStatePayload,
  type AudioProNoticePayload,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';

export function registerAudioProListeners() {
  // Register state listener
  addAudioProStateListener((event: AudioProStatePayload) => {
    const store = usePlayerStore.getState();
    switch (event.state) {
      case AudioProState.PLAYING:
        store.setState(AudioProState.PLAYING);
        break;
      case AudioProState.PAUSED:
        store.setState(AudioProState.PAUSED);
        break;
      case AudioProState.STOPPED:
        store.setState(AudioProState.STOPPED);
        break;
      case AudioProState.LOADING:
        store.setState(AudioProState.LOADING);
        break;
      case AudioProState.BUFFERING:
        store.setState(AudioProState.BUFFERING);
        break;
      default:
        break;
    }
  });

  // Register notice listener
  addAudioProNoticeListener((notice: AudioProNoticePayload) => {
    const store = usePlayerStore.getState();
    switch (notice.notice) {
      case AudioProNotice.TRACK_ENDED:
        store.setNotice(notice.notice);
        store.setPosition(notice.position);
        store.setDuration(notice.duration);
        break;
      case AudioProNotice.PLAYBACK_ERROR:
        store.setNotice(notice.notice);
        break;
      case AudioProNotice.PROGRESS:
        store.setPosition(notice.position);
        store.setDuration(notice.duration);
        store.setNotice(notice.notice);
        break;
      case AudioProNotice.SEEK_COMPLETE:
        store.setNotice(notice.notice);
        store.setPosition(notice.position);
        store.setDuration(notice.duration);
        break;
      default:
        break;
    }
  });
}
