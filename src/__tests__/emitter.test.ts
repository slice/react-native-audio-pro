import { AudioProEventType } from '../values';

// Import the AudioProEvent type for typing
import type { AudioProEvent } from '../types';

// Store the callback for testing
let eventCallback: ((event: AudioProEvent) => void) | null = null;

// Mock the NativeEventEmitter and NativeModules
jest.mock('react-native', () => ({
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn((_eventName, callback) => {
			// Store the callback for testing
			eventCallback = callback;
			return { remove: jest.fn() };
		}),
	})),
	NativeModules: {
		AudioPro: {},
	},
}));

// Mock logDebug
jest.mock('../utils', () => ({
	logDebug: jest.fn(),
}));

// Mock useInternalStore
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn(),
	},
}));

describe('Emitter', () => {
	let mockUpdateFromEvent: jest.Mock;
	let mockDebug: boolean;
	let mockDebugIncludesProgress: boolean;
	let mockLogDebug: jest.Mock;

	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();

		mockUpdateFromEvent = jest.fn();
		mockDebug = false;
		mockDebugIncludesProgress = false;
		mockLogDebug = require('../utils').logDebug;

		// Set up the mock implementation for useInternalStore.getState
		require('../useInternalStore').useInternalStore.getState.mockImplementation(() => ({
			debug: mockDebug,
			debugIncludesProgress: mockDebugIncludesProgress,
			updateFromEvent: mockUpdateFromEvent,
		}));
	});

	it('should add a listener for AudioProEvent', () => {
		// This will trigger the addListener call
		require('../emitter');

		// Verify that a listener was added
		expect(eventCallback).toBeDefined();
	});

	it('should process PROGRESS events regardless of debugIncludesProgress flag', () => {
		// Set up test conditions
		mockDebug = true;
		mockDebugIncludesProgress = false;

		// Import the emitter module to trigger the listener setup
		require('../emitter');

		// Create a mock PROGRESS event
		const mockProgressEvent: AudioProEvent = {
			type: AudioProEventType.PROGRESS,
			track: null, // Required for all events except REMOTE_NEXT and REMOTE_PREV
			payload: { position: 1000, duration: 5000 },
		};

		// Call the event callback with the mock event
		if (eventCallback) {
			eventCallback(mockProgressEvent);
		}

		// Verify that updateFromEvent was called with the event
		expect(mockUpdateFromEvent).toHaveBeenCalledWith(mockProgressEvent);

		// Verify that logDebug was not called (since debugIncludesProgress is false)
		expect(mockLogDebug).not.toHaveBeenCalled();
	});
});
