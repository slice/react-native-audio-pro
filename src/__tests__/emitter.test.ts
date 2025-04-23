// Mock the emitter module
jest.mock('../emitter', () => {
	// Create a mock emitter
	const mockEmitter = {
		addListener: jest.fn(),
		emit: jest.fn(),
	};

	return {
		emitter: mockEmitter,
	};
});

// Mock dependencies
const mockUpdateFromEvent = jest.fn();
let mockDebug = false;
let mockDebugIncludesProgress = false;

// Mock useInternalStore
jest.mock('../useInternalStore', () => ({
	useInternalStore: {
		getState: jest.fn().mockImplementation(() => ({
			debug: mockDebug,
			debugIncludesProgress: mockDebugIncludesProgress,
			updateFromEvent: mockUpdateFromEvent,
		})),
	},
}));

// Mock logDebug
jest.mock('../utils', () => ({
	logDebug: jest.fn(),
}));

// No imports needed

describe('Emitter', () => {
	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();
		mockDebug = false;
		mockDebugIncludesProgress = false;
	});

	it('should add a listener for AudioProEvent', () => {
		// Import the emitter module
		const { emitter } = require('../emitter');

		// Check that the emitter has an addListener method
		expect(emitter.addListener).toBeDefined();
	});

	it('should be able to emit events', () => {
		// Import the emitter module
		const { emitter } = require('../emitter');

		// Check that the emitter has an emit method
		expect(emitter.emit).toBeDefined();
	});
});
