import { AudioProEventType } from '../values';

// Import the AudioProEvent type for typing
import type { AudioProEvent } from '../types';

// We'll mock the emitter module
// This is done in the beforeEach block

// Store the callbacks for testing
let mainEventCallback: ((event: AudioProEvent) => void) | null = null;
let ambientEventCallback:
	| ((event: { type: string; payload?: Record<string, unknown> }) => void)
	| null = null;

// Mock the NativeEventEmitter and NativeModules
jest.mock('react-native', () => ({
	NativeEventEmitter: jest.fn().mockImplementation(() => ({
		addListener: jest.fn((eventName, callback) => {
			// Store the callback based on the event name
			if (eventName === 'AudioProEvent') {
				mainEventCallback = callback;
			} else if (eventName === 'AudioProAmbientEvent') {
				ambientEventCallback = callback;
			}
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

	it('should add listeners for both AudioProEvent and AudioProAmbientEvent', () => {
		// This will trigger the addListener calls
		require('../emitter');

		// Verify that listeners were added for both event types
		expect(mainEventCallback).toBeDefined();
		expect(ambientEventCallback).toBeDefined();
	});

	it('should not log PROGRESS events when debugIncludesProgress is false', () => {
		// Set up test conditions
		mockDebug = true;
		mockDebugIncludesProgress = false;

		// Reset the mock before the test
		mockLogDebug.mockReset();

		// Import the emitter module to trigger the listener setup
		require('../emitter');

		// Create a mock PROGRESS event
		const mockProgressEvent: AudioProEvent = {
			type: AudioProEventType.PROGRESS,
			track: null, // Required for all events except REMOTE_NEXT and REMOTE_PREV
			payload: { position: 1000, duration: 5000 },
		};

		// Call the main event callback with the mock event
		if (mainEventCallback) {
			mainEventCallback(mockProgressEvent);
		}

		// Verify that logDebug was not called with PROGRESS events when debugIncludesProgress is false
		expect(mockLogDebug).not.toHaveBeenCalledWith(
			'AudioProEvent',
			expect.stringContaining('PROGRESS'),
		);
	});

	it('should log PROGRESS events when debugIncludesProgress is true', () => {
		// Set up test conditions
		mockDebug = true;
		mockDebugIncludesProgress = true;

		// Reset the mock before the test
		mockLogDebug.mockReset();

		// Import the emitter module to trigger the listener setup
		require('../emitter');

		// Create a mock PROGRESS event
		const mockProgressEvent: AudioProEvent = {
			type: AudioProEventType.PROGRESS,
			track: null, // Required for all events except REMOTE_NEXT and REMOTE_PREV
			payload: { position: 1000, duration: 5000 },
		};

		// Call the main event callback with the mock event
		if (mainEventCallback) {
			mainEventCallback(mockProgressEvent);
		}

		// Verify that logDebug was called with PROGRESS events when debugIncludesProgress is true
		expect(mockLogDebug).toHaveBeenCalledWith('AudioProEvent', expect.any(String));
	});

	it('should always call updateFromEvent for all events', () => {
		// Set up test conditions
		mockDebug = false;

		// Reset the mock before the test
		mockUpdateFromEvent.mockReset();

		// Import the emitter module to trigger the listener setup
		require('../emitter');

		// Create a mock PROGRESS event
		const mockProgressEvent: AudioProEvent = {
			type: AudioProEventType.PROGRESS,
			track: null, // Required for all events except REMOTE_NEXT and REMOTE_PREV
			payload: { position: 1000, duration: 5000 },
		};

		// Call the main event callback with the mock event
		if (mainEventCallback) {
			mainEventCallback(mockProgressEvent);
		}

		// Verify that updateFromEvent was called with the event
		expect(mockUpdateFromEvent).toHaveBeenCalledWith(mockProgressEvent);
	});
});
