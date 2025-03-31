import { useAudioProStore } from './useAudioProStore';

export const useAudioPro = () =>
  useAudioProStore((state) => ({
    state: state.state,
    position: state.position,
    duration: state.duration,
  }));
