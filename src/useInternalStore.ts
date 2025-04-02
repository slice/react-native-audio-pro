import { create } from 'zustand';
import { AudioProState, DEFAULT_CONFIG } from './values';
import type { AudioProConfigureOptions, AudioProTrack } from './types';

export interface AudioProStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	lastNotice: string;
	debug: boolean;
	trackLoaded?: AudioProTrack;
	trackPlaying?: AudioProTrack;
	configureOptions: AudioProConfigureOptions;
	setDebug: (debug: boolean) => void;
	setTrackLoaded: (track: AudioProTrack | undefined) => void;
	setTrackPlaying: (track: AudioProTrack | undefined) => void;
	setConfigureOptions: (options: AudioProConfigureOptions) => void;
	setStateFromStateEvent: (
		state: AudioProState,
		position?: number,
		duration?: number
	) => void;
	setStateFromNoticeEvent: (
		name: string,
		position?: number,
		duration?: number
	) => void;
}

export const useInternalStore = create<AudioProStore>((set) => ({
	playerState: AudioProState.STOPPED,
	position: 0,
	duration: 0,
	lastNotice: '',
	debug: false,
	trackLoaded: undefined,
	trackPlaying: undefined,
	configureOptions: { ...DEFAULT_CONFIG },
	setDebug: (debug) => set({ debug }),
	setTrackLoaded: (track) => set({ trackLoaded: track }),
	setTrackPlaying: (track) => set({ trackPlaying: track }),
	setConfigureOptions: (options) => set({ configureOptions: options }),
	setStateFromStateEvent: (state, position, duration) => {
		const updates: Partial<AudioProStore> = {};
		updates.playerState = state;
		if (position !== undefined) updates.position = position;
		if (duration !== undefined) updates.duration = duration;
		set(updates);
	},
	setStateFromNoticeEvent: (name, position, duration) => {
		const updates: Partial<AudioProStore> = {};
		updates.lastNotice = name;
		if (position !== undefined) updates.position = position;
		if (duration !== undefined) updates.duration = duration;
		set(updates);
	},
}));
