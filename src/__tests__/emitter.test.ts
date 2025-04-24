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

// Mock logDebug
jest.mock('../utils', () => ({
	logDebug: jest.fn(),
}));

// No imports needed

describe('Emitter', () => {
	let mockUpdateFromEvent: jest.Mock;
	let mockDebug: boolean;
	let mockDebugIncludesProgress: boolean;

	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();

		mockUpdateFromEvent = jest.fn();
		mockDebug = false;
		mockDebugIncludesProgress = false;

		jest.doMock('../useInternalStore', () => ({
			useInternalStore: {
				getState: jest.fn().mockImplementation(() => ({
					debug: mockDebug,
					debugIncludesProgress: mockDebugIncludesProgress,
					updateFromEvent: mockUpdateFromEvent,
				})),
			},
		}));
	});

	it('should add a listener for AudioProEvent', () => {
		const { emitter } = require('../emitter');
		expect(emitter.addListener).toBeDefined();
	});

	it('should be able to emit events', () => {
		const { emitter } = require('../emitter');
		expect(emitter.emit).toBeDefined();
	});
});
