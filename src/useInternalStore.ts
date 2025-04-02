import { create } from 'zustand';
import { AudioProState, DEFAULT_CONFIG } from './values';
import type { AudioProConfigureOptions, AudioProTrack } from './types';

export interface AudioProStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	playbackSpeed: number;
	lastNotice: string;
	debug: boolean;
	trackLoaded: AudioProTrack | null;
	trackPlaying: AudioProTrack | null;
	configureOptions: AudioProConfigureOptions;
	setDebug: (debug: boolean) => void;
	setTrackLoaded: (track: AudioProTrack | null) => void;
	setTrackPlaying: (track: AudioProTrack | null) => void;
	setConfigureOptions: (options: AudioProConfigureOptions) => void;
	setPlaybackSpeed: (speed: number) => void;
	setStateFromStateEvent: (
		state: AudioProState,
		position: number | undefined,
		duration: number | undefined,
		track: AudioProTrack | null,
	) => void;
	setStateFromNoticeEvent: (
		name: string,
		position: number | undefined,
		duration: number | undefined,
		track: AudioProTrack | null,
	) => void;
}

export const useInternalStore = create<AudioProStore>((set, get) => ({
	playerState: AudioProState.STOPPED,
	position: 0,
	duration: 0,
	playbackSpeed: 1.0,
	lastNotice: '',
	debug: false,
	trackLoaded: null,
	trackPlaying: null,
	configureOptions: { ...DEFAULT_CONFIG },
	setDebug: (debug) => set({ debug }),
	setTrackLoaded: (track) => set({ trackLoaded: track }),
	setTrackPlaying: (track) => set({ trackPlaying: track }),
	setConfigureOptions: (options) => set({ configureOptions: options }),
	setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
	setStateFromStateEvent: (state, position, duration, track) => {
		const updates: Partial<AudioProStore> = {};
		updates.playerState = state;

		if (position !== undefined && position !== get().position) {
			updates.position = position;
		}
		if (duration !== undefined && duration !== get().duration) {
			updates.duration = duration;
		}

		if (track === null) {
			if (get().trackPlaying !== null) {
				updates.trackPlaying = null;
			}
		} else if (track) {
			const currentTrack = get().trackPlaying;
			if (
				currentTrack === null ||
				track.id !== currentTrack.id ||
				track.url !== currentTrack.url ||
				track.title !== currentTrack.title ||
				track.artwork !== currentTrack.artwork ||
				track.album !== currentTrack.album ||
				track.artist !== currentTrack.artist
			) {
				updates.trackPlaying = track;
			}
		}

		if (Object.keys(updates).length > 0) {
			set(updates);
		}
	},
	setStateFromNoticeEvent: (name, position, duration, track) => {
		const updates: Partial<AudioProStore> = {};

		if (name !== get().lastNotice) {
			updates.lastNotice = name;
		}

		if (position !== undefined && position !== get().position) {
			updates.position = position;
		}
		if (duration !== undefined && duration !== get().duration) {
			updates.duration = duration;
		}

		if (track === null) {
			if (get().trackPlaying !== null) {
				updates.trackPlaying = null;
			}
		} else if (track) {
			const currentTrack = get().trackPlaying;
			if (
				currentTrack === null ||
				track.id !== currentTrack.id ||
				track.url !== currentTrack.url ||
				track.title !== currentTrack.title ||
				track.artwork !== currentTrack.artwork ||
				track.album !== currentTrack.album ||
				track.artist !== currentTrack.artist
			) {
				updates.trackPlaying = track;
			}
		}

		if (Object.keys(updates).length > 0) {
			set(updates);
		}
	},
}));
