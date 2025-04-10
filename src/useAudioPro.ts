import { useInternalStore } from './useInternalStore';
import { useShallow } from 'zustand/react/shallow';

export const useAudioPro = () => {
	const { state, position, duration, track, playbackSpeed, error } =
		useInternalStore(
			useShallow((zustandState) => ({
				state: zustandState.playerState,
				position: zustandState.position,
				duration: zustandState.duration,
				track: zustandState.trackPlaying,
				playbackSpeed: zustandState.playbackSpeed,
				error: zustandState.error,
			})),
		);
	return {
		state,
		position,
		duration,
		track,
		playbackSpeed,
		error,
	};
};
