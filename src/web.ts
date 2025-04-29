import { emitter } from './emitter';
import { AudioProEventType, AudioProState } from './values';

import type { AudioProTrack } from './types';

export interface WebAudioProOptions {
	autoplay?: boolean;
	debug?: boolean;
	debugIncludesProgress?: boolean;
	playbackSpeed?: number;
	headers?: {
		audio?: Record<string, string>;
		artwork?: Record<string, string>;
	};
	contentType?: string;
}

export interface WebAudioProInterface {
	play(track: AudioProTrack, options: WebAudioProOptions): void;
	pause(): void;
	resume(): void;
	stop(): void;
	clear(): void;
	seekTo(positionMs: number): void;
	seekForward(amountMs: number): void;
	seekBack(amountMs: number): void;
	setPlaybackSpeed(speed: number): void;
}

export class WebAudioProImpl implements WebAudioProInterface {
	private audio: HTMLAudioElement | null = null;
	private currentTrack: AudioProTrack | null = null;
	private progressInterval: number | null = null;
	private playbackSpeed: number = 1.0;
	private debug: boolean = false;

	constructor() {
		if (typeof window !== 'undefined' && typeof document !== 'undefined') {
			this.audio = new Audio();
			this.setupAudioListeners();
		}
	}

	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('~~~ [Web]', ...args);
		}
	}

	private setupAudioListeners(): void {
		if (!this.audio) return;

		this.audio.addEventListener('playing', () => {
			this.emitStateChanged(AudioProState.PLAYING);
			this.startProgressUpdates();
		});

		this.audio.addEventListener('pause', () => {
			this.emitStateChanged(AudioProState.PAUSED);
			this.stopProgressUpdates();
		});

		this.audio.addEventListener('ended', () => {
			this.stopProgressUpdates();
			this.emitTrackEnded();
		});

		this.audio.addEventListener('error', (e: Event) => {
			this.stopProgressUpdates();
			let errorMessage = 'Unknown error';
			let errorCode = -1;

			// Safely extract error information if available
			if (e && e.target) {
				const audioElement = e.target as HTMLAudioElement;
				if (audioElement && audioElement.error) {
					errorMessage = audioElement.error.message || 'Network error';
					errorCode = audioElement.error.code || -1;
				}
			}

			this.emitError(`Audio error: ${errorMessage}`, errorCode);
		});

		this.audio.addEventListener('loadstart', () => {
			this.emitStateChanged(AudioProState.LOADING);
		});

		this.audio.addEventListener('canplay', () => {
			if (this.audio?.paused) {
				this.emitStateChanged(AudioProState.PAUSED);
			}
		});

		this.audio.addEventListener('seeked', () => {
			this.emitSeekComplete();
		});
	}

	private emitStateChanged(state: AudioProState): void {
		const position = this.audio?.currentTime ? Math.floor(this.audio.currentTime * 1000) : 0;
		const duration =
			this.audio?.duration && !isNaN(this.audio.duration)
				? Math.floor(this.audio.duration * 1000)
				: 0;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track: this.currentTrack,
			payload: {
				state,
				position,
				duration,
			},
		});
	}

	private emitProgress(): void {
		if (!this.audio) return;

		const position = Math.floor(this.audio.currentTime * 1000);
		const duration = !isNaN(this.audio.duration) ? Math.floor(this.audio.duration * 1000) : 0;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PROGRESS,
			track: this.currentTrack,
			payload: {
				position,
				duration,
			},
		});
	}

	private emitTrackEnded(): void {
		if (!this.audio) return;

		const position = Math.floor(this.audio.currentTime * 1000);
		const duration = !isNaN(this.audio.duration) ? Math.floor(this.audio.duration * 1000) : 0;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.TRACK_ENDED,
			track: this.currentTrack,
			payload: {
				position,
				duration,
			},
		});
	}

	private emitSeekComplete(): void {
		if (!this.audio) return;

		const position = Math.floor(this.audio.currentTime * 1000);
		const duration = !isNaN(this.audio.duration) ? Math.floor(this.audio.duration * 1000) : 0;

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.SEEK_COMPLETE,
			track: this.currentTrack,
			payload: {
				position,
				duration,
			},
		});
	}

	private emitError(error: string, errorCode: number = -1): void {
		// First emit the state change to ERROR
		this.emitStateChanged(AudioProState.ERROR);

		// Then emit the playback error
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PLAYBACK_ERROR,
			track: this.currentTrack,
			payload: {
				error,
				errorCode,
			},
		});
	}

	private startProgressUpdates(): void {
		this.stopProgressUpdates();
		this.progressInterval = window.setInterval(() => {
			this.emitProgress();
		}, 1000) as unknown as number;
	}

	private stopProgressUpdates(): void {
		if (this.progressInterval !== null) {
			clearInterval(this.progressInterval);
			this.progressInterval = null;
		}
	}

	// Public API methods that match the native implementations

	play(track: AudioProTrack, options: WebAudioProOptions): void {
		const autoplay = options.autoplay !== undefined ? options.autoplay : true;
		this.log('Play', track, options, 'autoplay:', autoplay);
		this.currentTrack = track;
		this.debug = !!options.debug;
		this.playbackSpeed = options.playbackSpeed || 1.0;

		if (!this.audio) {
			this.emitError('Audio element not available in this environment');
			return;
		}

		// Emit loading state first
		this.emitStateChanged(AudioProState.LOADING);

		// Validate track URL
		if (!track.url) {
			this.emitError('Audio error: Unknown error');
			return;
		}

		// Web implementation doesn't support local audio files via require()
		if (typeof track.url === 'number') {
			this.emitError(
				'Local audio files via require() are not supported in web environment',
				-1,
			);
			return;
		}

		// Reset and configure the audio element
		this.audio.src = track.url;
		this.audio.playbackRate = this.playbackSpeed;
		this.audio.load();

		if (!autoplay) {
			this.emitStateChanged(AudioProState.PAUSED);
			return;
		}

		try {
			const playResult = this.audio.play();
			if (playResult && typeof playResult.then === 'function') {
				playResult.catch((error) => {
					this.emitError(`Failed to play: ${error.message}`);
				});
			}
		} catch (error) {
			this.emitError(`Failed to play: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	pause(): void {
		if (!this.audio || this.audio.paused) return;
		this.audio.pause();
		this.emitStateChanged(AudioProState.PAUSED);
	}

	resume(): void {
		if (!this.audio) return;
		try {
			const playResult = this.audio.play();
			if (playResult && typeof playResult.then === 'function') {
				playResult.catch((error) => {
					this.emitError(`Failed to resume: ${error.message}`);
				});
			}
		} catch (error) {
			this.emitError(`Failed to resume: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	stop(): void {
		if (!this.audio) return;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.emitStateChanged(AudioProState.STOPPED);
		this.stopProgressUpdates();
	}

	clear(): void {
		if (!this.audio) return;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.audio.src = '';
		this.currentTrack = null;
		this.emitStateChanged(AudioProState.IDLE);
		this.stopProgressUpdates();
	}

	seekTo(positionMs: number): void {
		if (!this.audio) return;
		if (positionMs < 0) return;
		if (this.audio.duration && positionMs > this.audio.duration * 1000) return;

		this.audio.currentTime = positionMs / 1000;
		this.emitSeekComplete();
	}

	seekForward(amountMs: number): void {
		if (!this.audio) return;
		if (amountMs <= 0) return;

		const newPosition = Math.min(
			this.audio.duration || Infinity,
			this.audio.currentTime + amountMs / 1000
		);
		this.audio.currentTime = newPosition;
		this.emitSeekComplete();
	}

	seekBack(amountMs: number): void {
		if (!this.audio) return;
		if (amountMs <= 0) return;

		this.audio.currentTime = Math.max(0, this.audio.currentTime - amountMs / 1000);
		this.emitSeekComplete();
	}

	setPlaybackSpeed(speed: number): void {
		this.log('SetPlaybackSpeed', speed);
		this.playbackSpeed = speed;

		if (this.audio) {
			this.audio.playbackRate = speed;

			emitter.emit('AudioProEvent', {
				type: AudioProEventType.PLAYBACK_SPEED_CHANGED,
				track: this.currentTrack,
				payload: {
					speed,
				},
			});
		}
	}
}

export const WebAudioPro: WebAudioProInterface = new WebAudioProImpl();
