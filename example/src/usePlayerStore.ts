import { create } from 'zustand';
import { AudioProState } from 'react-native-audio-pro';

export interface PlayerState {
  state: AudioProState;
  position: number;
  duration: number;
  setState: (newState: AudioProState) => void;
  setPosition: (value: number) => void;
  setDuration: (value: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  state: AudioProState.STOPPED,
  position: 0,
  duration: 0,
  setState: (newState) => set({ state: newState }),
  setPosition: (value) => set({ position: value }),
  setDuration: (value) => set({ duration: value }),
}));

usePlayerStore.subscribe((state) => {
  console.log('State updated:', state);
});
