import { emitter, ambientEmitter } from '../emitter';
import { AudioProEventType, AudioProAmbientEventType, AudioProState } from '../values';

import type { AudioProEvent, AudioProAmbientEvent } from '../types';

describe('emitter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('main emitter', () => {
		it('should emit and receive events', () => {
			const mockCallback = jest.fn();
			const subscription = emitter.addListener('AudioProEvent', mockCallback);

			const event: AudioProEvent = {
				type: AudioProEventType.STATE_CHANGED,
				track: null,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 300000,
				},
			};

			emitter.emit('AudioProEvent', event);

			expect(mockCallback).toHaveBeenCalledWith(event);

			subscription.remove();
		});

		it('should handle multiple subscribers', () => {
			const mockCallback1 = jest.fn();
			const mockCallback2 = jest.fn();

			const subscription1 = emitter.addListener('AudioProEvent', mockCallback1);
			const subscription2 = emitter.addListener('AudioProEvent', mockCallback2);

			const event: AudioProEvent = {
				type: AudioProEventType.PROGRESS,
				track: null,
				payload: {
					position: 5000,
					duration: 300000,
				},
			};

			emitter.emit('AudioProEvent', event);

			expect(mockCallback1).toHaveBeenCalledWith(event);
			expect(mockCallback2).toHaveBeenCalledWith(event);

			subscription1.remove();
			subscription2.remove();
		});

		it('should not call removed subscribers', () => {
			const mockCallback = jest.fn();
			const subscription = emitter.addListener('AudioProEvent', mockCallback);

			subscription.remove();

			const event: AudioProEvent = {
				type: AudioProEventType.PLAYBACK_ERROR,
				track: null,
				payload: {
					error: 'Test error',
					errorCode: -1,
				},
			};

			emitter.emit('AudioProEvent', event);

			expect(mockCallback).not.toHaveBeenCalled();
		});
	});

	describe('ambient emitter', () => {
		it('should emit and receive ambient events', () => {
			const mockCallback = jest.fn();
			const subscription = ambientEmitter.addListener('AudioProAmbientEvent', mockCallback);

			const event: AudioProAmbientEvent = {
				type: AudioProAmbientEventType.AMBIENT_TRACK_ENDED,
			};

			ambientEmitter.emit('AudioProAmbientEvent', event);

			expect(mockCallback).toHaveBeenCalledWith(event);

			subscription.remove();
		});

		it('should handle ambient error events', () => {
			const mockCallback = jest.fn();
			const subscription = ambientEmitter.addListener('AudioProAmbientEvent', mockCallback);

			const event: AudioProAmbientEvent = {
				type: AudioProAmbientEventType.AMBIENT_ERROR,
				payload: {
					error: 'Ambient playback failed',
				},
			};

			ambientEmitter.emit('AudioProAmbientEvent', event);

			expect(mockCallback).toHaveBeenCalledWith(event);

			subscription.remove();
		});

		it('should not call removed ambient subscribers', () => {
			const mockCallback = jest.fn();
			const subscription = ambientEmitter.addListener('AudioProAmbientEvent', mockCallback);

			subscription.remove();

			const event: AudioProAmbientEvent = {
				type: AudioProAmbientEventType.AMBIENT_TRACK_ENDED,
			};

			ambientEmitter.emit('AudioProAmbientEvent', event);

			expect(mockCallback).not.toHaveBeenCalled();
		});
	});

	describe('event isolation', () => {
		it('should not mix main and ambient events', () => {
			const mainCallback = jest.fn();
			const ambientCallback = jest.fn();

			const mainSubscription = emitter.addListener('AudioProEvent', mainCallback);
			const ambientSubscription = ambientEmitter.addListener(
				'AudioProAmbientEvent',
				ambientCallback,
			);

			const mainEvent: AudioProEvent = {
				type: AudioProEventType.STATE_CHANGED,
				track: null,
				payload: {
					state: AudioProState.PLAYING,
					position: 0,
					duration: 300000,
				},
			};

			const ambientEvent: AudioProAmbientEvent = {
				type: AudioProAmbientEventType.AMBIENT_TRACK_ENDED,
			};

			emitter.emit('AudioProEvent', mainEvent);
			ambientEmitter.emit('AudioProAmbientEvent', ambientEvent);

			expect(mainCallback).toHaveBeenCalledWith(mainEvent);
			expect(mainCallback).not.toHaveBeenCalledWith(ambientEvent);
			expect(ambientCallback).toHaveBeenCalledWith(ambientEvent);
			expect(ambientCallback).not.toHaveBeenCalledWith(mainEvent);

			mainSubscription.remove();
			ambientSubscription.remove();
		});
	});
});
