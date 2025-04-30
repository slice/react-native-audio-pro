import { AudioProState } from '../values';

const mockState = {
    playerState: AudioProState.IDLE,
    position: 0,
    duration: 0,
    playbackSpeed: 1.0,
    volume: 1.0,
    debug: false,
    debugIncludesProgress: false,
    trackPlaying: null,
    configureOptions: {
        contentType: 'MUSIC',
        debug: false,
        debugIncludesProgress: false,
        progressIntervalMs: 1000,
    },
    error: null,
    setDebug: jest.fn(),
    setDebugIncludesProgress: jest.fn(),
    setTrackPlaying: jest.fn(),
    setConfigureOptions: jest.fn(),
    setPlaybackSpeed: jest.fn(),
    setVolume: jest.fn(),
    setError: jest.fn(),
    updateFromEvent: jest.fn(),
};

export const useInternalStore = jest.fn().mockReturnValue(mockState); 