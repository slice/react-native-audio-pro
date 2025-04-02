import { create } from 'zustand';
import { AudioProState, DEFAULT_CONFIG } from './values';
import type { AudioProConfigureOptions, AudioProTrack } from './types';

export interface AudioProStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	lastNotice: string;
	debug: boolean;
	loadedTrack?: AudioProTrack;
	configureOptions: AudioProConfigureOptions;
	setPlayerState: (playerState: AudioProState) => void;
	setPosition: (position: number) => void;
	setDuration: (duration: number) => void;
	setLastNotice: (name: string) => void;
	setDebug: (debug: boolean) => void;
	setLoadedTrack: (track: AudioProTrack | undefined) => void;
	setConfigureOptions: (options: AudioProConfigureOptions) => void;
}

export const useInternalStore = create<AudioProStore>((set) => ({
	playerState: AudioProState.STOPPED,
	position: 0,
	duration: 0,
	lastNotice: '',
	debug: false,
	loadedTrack: undefined,
	configureOptions: { ...DEFAULT_CONFIG },
	setPlayerState: (playerState) => set({ playerState }),
	setPosition: (position) => set({ position }),
	setDuration: (duration) => set({ duration }),
	setLastNotice: (name) => set({ lastNotice: name }),
	setDebug: (debug) => set({ debug }),
	setLoadedTrack: (track) => set({ loadedTrack: track }),
	setConfigureOptions: (options) => set({ configureOptions: options }),
}));
