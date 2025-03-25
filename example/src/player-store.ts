import { create } from 'zustand';
import { AudioProState, type AudioProTrack } from 'react-native-audio-pro';

export type RepeatMode = 'none' | 'repeatOne' | 'repeatAll';

export interface PlayerState {
  // Player state from audio-pro
  state: AudioProState;
  position: number;
  duration: number;
  lastNotice: string;
  // New: playlist and current track index (null means no track should play)
  playlist: AudioProTrack[];
  currentIndex: number | null;
  // New: repeat mode
  repeatMode: RepeatMode;

  // Setters for audio state
  setState: (newState: AudioProState) => void;
  setPosition: (value: number) => void;
  setDuration: (value: number) => void;
  setNotice: (value: string) => void;

  // Setters for playlist and current track
  setPlaylist: (playlist: AudioProTrack[]) => void;
  setCurrentIndex: (index: number | null) => void;

  // Functions to determine next/previous track
  nextTrack: () => void;
  previousTrack: () => void;

  // Setter for repeat mode
  setRepeatMode: (mode: RepeatMode) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  state: AudioProState.STOPPED,
  position: 0,
  duration: 0,
  lastNotice: '',
  playlist: [],
  currentIndex: null,
  repeatMode: 'none',

  setState: (newState) => set({ state: newState }),
  setPosition: (value) => set({ position: value }),
  setDuration: (value) => set({ duration: value }),
  setNotice: (value) => set({ lastNotice: value }),

  setPlaylist: (playlist) => set({ playlist }),
  setCurrentIndex: (index) => set({ currentIndex: index }),

  nextTrack: () => {
    const { currentIndex, playlist, repeatMode } = get();
    if (currentIndex === null) return; // no track playing, nothing to do

    // If repeatOne, simply keep the same track regardless of end of song
    if (repeatMode === 'repeatOne') {
      // Re-trigger the same track (by re-setting the same index)
      set({ currentIndex });
      return;
    }

    // If more tracks exist in the playlist, move to the next one
    if (currentIndex < playlist.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      // When at the last track, check for repeatAll or none
      if (repeatMode === 'repeatAll' && playlist.length > 0) {
        set({ currentIndex: 0 });
      } else {
        // For repeat mode: none, set currentIndex to null to indicate stop playing
        set({ currentIndex: null });
      }
    }
  },

  previousTrack: () => {
    const { currentIndex } = get();
    if (currentIndex === null) return; // no track playing, nothing to do
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    } else {
      // At the start of the playlist; you may decide to remain on the first track
      set({ currentIndex: 0 });
    }
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),
}));

// usePlayerStore.subscribe((state) => {
//   console.log('State updated:', state);
// });
