import { useInternalStore } from './useInternalStore';
import { useShallow } from 'zustand/react/shallow';

export const useAudioPro = () => {
	const { state, position, duration } = useInternalStore(
		useShallow((zustandState) => ({
			state: zustandState.playerState,
			position: zustandState.position,
			duration: zustandState.duration,
		}))
	);
	return {
		state,
		position,
		duration,
	};
};
