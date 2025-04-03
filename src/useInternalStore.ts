import { create } from 'zustand';
import { AudioProEventType, AudioProState, DEFAULT_CONFIG } from './values';
import type {
	AudioProConfigureOptions,
	AudioProEvent,
	AudioProTrack,
} from './types';

export interface AudioProStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	playbackSpeed: number;
	debug: boolean;
	trackLoaded: AudioProTrack | null;
	trackPlaying: AudioProTrack | null;
	configureOptions: AudioProConfigureOptions;
	setDebug: (debug: boolean) => void;
	setTrackLoaded: (track: AudioProTrack | null) => void;
	setTrackPlaying: (track: AudioProTrack | null) => void;
	setConfigureOptions: (options: AudioProConfigureOptions) => void;
	setPlaybackSpeed: (speed: number) => void;
	updateFromEvent: (event: AudioProEvent) => void;
}

export const useInternalStore = create<AudioProStore>((set, get) => ({
	playerState: AudioProState.STOPPED,
	position: 0,
	duration: 0,
	playbackSpeed: 1.0,
	debug: false,
	trackLoaded: null,
	trackPlaying: null,
	configureOptions: { ...DEFAULT_CONFIG },
	setDebug: (debug) => set({ debug }),
	setTrackLoaded: (track) => set({ trackLoaded: track }),
	setTrackPlaying: (track) => set({ trackPlaying: track }),
	setConfigureOptions: (options) => set({ configureOptions: options }),
	setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
	updateFromEvent: (event) => {
		const updates: Partial<AudioProStore> = {};
		const { type, track, payload } = event;

		// Handle different event types
		switch (type) {
			case AudioProEventType.STATE_CHANGED:
				if (payload?.state && payload.state !== get().playerState) {
					updates.playerState = payload.state as AudioProState;
				}
				break;

			case AudioProEventType.PLAYBACK_SPEED_CHANGED:
				if (payload?.speed && payload.speed !== get().playbackSpeed) {
					updates.playbackSpeed = payload.speed;
				}
				break;
		}

		// Update position and duration if provided in the payload
		if (
			payload?.position !== undefined &&
			payload.position !== get().position
		) {
			updates.position = payload.position;
		}
		if (
			payload?.duration !== undefined &&
			payload.duration !== get().duration
		) {
			updates.duration = payload.duration;
		}

		// Update track if it has changed
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

		// Only update state if there are changes
		if (Object.keys(updates).length > 0) {
			set(updates);
		}
	},
}));
