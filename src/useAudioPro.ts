import { useShallow } from 'zustand/react/shallow';

import { useInternalStore } from './useInternalStore';

export const useAudioPro = () => {
	const { state, position, duration, playingTrack, playbackSpeed, volume, error } =
		useInternalStore(
			useShallow((zustandState) => ({
				state: zustandState.playerState,
				position: zustandState.position,
				duration: zustandState.duration,
				playingTrack: zustandState.trackPlaying,
				playbackSpeed: zustandState.playbackSpeed,
				volume: zustandState.volume,
				error: zustandState.error,
			})),
		);
	return {
		state,
		position,
		duration,
		playingTrack,
		playbackSpeed,
		volume,
		error,
	};
};
