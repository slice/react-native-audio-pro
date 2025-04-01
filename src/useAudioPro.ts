import { useInternalStore } from './useInternalStore';

export const useAudioPro = () =>
  useInternalStore((state) => ({
    state: state.state,
    position: state.position,
    duration: state.duration,
  }));
