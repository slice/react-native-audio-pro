import { AudioProState, AudioProContentType } from '../values';
import type { AudioProStore } from '../types';

export const mockState: AudioProStore = {
    playerState: AudioProState.IDLE,
    position: 0,
    duration: 0,
    playbackSpeed: 1.0,
    volume: 1.0,
    debug: false,
    debugIncludesProgress: false,
    trackPlaying: null,
    configureOptions: {
        contentType: AudioProContentType.MUSIC,
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

export const useInternalStore = jest.fn().mockImplementation(() => ({
    playerState: mockState.playerState,
    position: mockState.position,
    duration: mockState.duration,
    trackPlaying: mockState.trackPlaying,
    playbackSpeed: mockState.playbackSpeed,
    volume: mockState.volume,
    error: mockState.error,
})); 