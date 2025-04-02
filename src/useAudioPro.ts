import { useInternalStore } from './useInternalStore';
import { useShallow } from 'zustand/react/shallow';

export const useAudioPro = () => {
	const { state, position, duration, track } = useInternalStore(
		useShallow((zustandState) => ({
			state: zustandState.playerState,
			position: zustandState.position,
			duration: zustandState.duration,
			track: zustandState.trackPlaying,
		}))
	);
	return {
		state,
		position,
		duration,
		track,
	};
};
