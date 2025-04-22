// Mock console methods to silence them during tests
// eslint-disable-next-line no-undef
beforeAll(() => {
	// Store original console methods
	global.originalConsole = {
		log: console.log,
		warn: console.warn,
		error: console.error,
		info: console.info,
		debug: console.debug,
	};

	// Mock console methods
	// eslint-disable-next-line no-undef
	console.log = jest.fn();
	// eslint-disable-next-line no-undef
	console.warn = jest.fn();
	// eslint-disable-next-line no-undef
	console.error = jest.fn();
	// eslint-disable-next-line no-undef
	console.info = jest.fn();
	// eslint-disable-next-line no-undef
	console.debug = jest.fn();
});

// Restore original console methods after all tests
// eslint-disable-next-line no-undef
afterAll(() => {
	console.log = global.originalConsole.log;
	console.warn = global.originalConsole.warn;
	console.error = global.originalConsole.error;
	console.info = global.originalConsole.info;
	console.debug = global.originalConsole.debug;
});
