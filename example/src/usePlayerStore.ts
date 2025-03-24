import { create } from 'zustand';
import { AudioProEvent } from 'react-native-audio-pro';

export interface PlayerState {
  state: AudioProEvent;
  setState: (newState: AudioProEvent) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  state: AudioProEvent.IsStopped,
  setState: (newState: AudioProEvent) => set({ state: newState }),
}));

usePlayerStore.subscribe((state) => {
  console.log('AudioProState updated:', state);
});
