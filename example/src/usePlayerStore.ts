import { create } from 'zustand';
import { AudioProState } from 'react-native-audio-pro';

export interface PlayerState {
  state: AudioProState;
  position: number;
  duration: number;
  lastNotice: string;
  setState: (newState: AudioProState) => void;
  setPosition: (value: number) => void;
  setDuration: (value: number) => void;
  setNotice: (value: string) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  state: AudioProState.STOPPED,
  position: 0,
  duration: 0,
  lastNotice: '',
  setState: (newState) => set({ state: newState }),
  setPosition: (value) => set({ position: value }),
  setDuration: (value) => set({ duration: value }),
  setNotice: (value) => set({ lastNotice: value }),
}));

// usePlayerStore.subscribe((state) => {
//   console.log('State updated:', state);
// });
