import { create } from 'zustand';
import { AudioProEventType, AudioProState, DEFAULT_CONFIG } from './values';
import type {
	AudioProConfigureOptions,
	AudioProEvent,
	AudioProPlaybackErrorPayload,
	AudioProTrack,
} from './types';

export interface AudioProStore {
	playerState: AudioProState;
	position: number;
	duration: number;
	playbackSpeed: number;
	debug: boolean;
	trackPlaying: AudioProTrack | null;
	configureOptions: AudioProConfigureOptions;
	error: AudioProPlaybackErrorPayload | null;
	setDebug: (debug: boolean) => void;
	setTrackPlaying: (track: AudioProTrack | null) => void;
	setConfigureOptions: (options: AudioProConfigureOptions) => void;
	setPlaybackSpeed: (speed: number) => void;
	setError: (error: AudioProPlaybackErrorPayload | null) => void;
	updateFromEvent: (event: AudioProEvent) => void;
}

export const useInternalStore = create<AudioProStore>((set, get) => ({
	playerState: AudioProState.STOPPED,
	position: 0,
	duration: 0,
	playbackSpeed: 1.0,
	debug: false,
	trackPlaying: null,
	configureOptions: { ...DEFAULT_CONFIG },
	error: null,
	setDebug: (debug) => set({ debug }),
	setTrackPlaying: (track) => set({ trackPlaying: track }),
	setConfigureOptions: (options) => set({ configureOptions: options }),
	setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
	setError: (error) => set({ error }),
	updateFromEvent: (event) => {
		const updates: Partial<AudioProStore> = {};
		const { type, track, payload } = event;

		// Command events don't update state or require track
		if (
			type === AudioProEventType.REMOTE_NEXT ||
			type === AudioProEventType.REMOTE_PREV
		) {
			return; // Command events don't update state
		}

		// For non-command events, track should be included
		if (track === undefined && type !== AudioProEventType.PLAYBACK_ERROR) {
			console.warn(
				`AudioPro: Event ${type} missing required track property`,
			);
		}

		// Handle different event types
		switch (type) {
			case AudioProEventType.STATE_CHANGED:
				if (payload?.state && payload.state !== get().playerState) {
					updates.playerState = payload.state as AudioProState;

					// Clear error when transitioning to a non-ERROR state
					if (
						payload.state !== AudioProState.ERROR &&
						get().error !== null
					) {
						updates.error = null;
					}
				}
				break;

			case AudioProEventType.PLAYBACK_ERROR:
				if (payload && payload.error) {
					updates.error = {
						error: payload.error,
						errorCode: payload.errorCode,
					};
					// Set state to ERROR
					updates.playerState = AudioProState.ERROR;
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

		// Update track if it has changed and we're not in an error state
		// Never clear trackPlaying on error
		if (track) {
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
		} else if (
			track === null &&
			type !== AudioProEventType.PLAYBACK_ERROR
		) {
			// Only clear trackPlaying if explicitly set to null and not an error event
			if (get().trackPlaying !== null) {
				updates.trackPlaying = null;
			}
		}

		// Only update state if there are changes
		if (Object.keys(updates).length > 0) {
			set(updates);
		}
	},
}));
