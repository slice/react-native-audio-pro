import { create } from 'zustand';
import { AudioProEvent } from 'react-native-audio-pro';

export interface PlayerState {
  state: AudioProEvent;
  position: number;
  duration: number;
  setState: (newState: AudioProEvent) => void;
  setPosition: (value: number) => void;
  setDuration: (value: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  state: AudioProEvent.IsStopped,
  position: 0,
  duration: 0,
  setState: (newState) => set({ state: newState }),
  setPosition: (value) => set({ position: value }),
  setDuration: (value) => set({ duration: value }),
}));

usePlayerStore.subscribe((state) => {
  console.log('State updated:', state);
});
