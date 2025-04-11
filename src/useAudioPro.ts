import { useInternalStore } from './useInternalStore';
import { useShallow } from 'zustand/react/shallow';

export const useAudioPro = () => {
	const { state, position, duration, playingTrack, playbackSpeed, error } =
		useInternalStore(
			useShallow((zustandState) => ({
				state: zustandState.playerState,
				position: zustandState.position,
				duration: zustandState.duration,
				playingTrack: zustandState.trackPlaying,
				playbackSpeed: zustandState.playbackSpeed,
				error: zustandState.error,
			})),
		);
	return {
		state,
		position,
		duration,
		playingTrack,
		playbackSpeed,
		error,
	};
};
