import { emitter } from './emitter';
import { AudioProEventType, AudioProState } from './values';

import type { AudioProTrack } from './types';

/**
 * Options for web audio player
 */
export interface WebAudioProOptions {
	/** Whether to start playback automatically */
	autoPlay?: boolean;
	/** Whether to enable debug logging */
	debug?: boolean;
	/** Whether to include progress events in debug logs */
	debugIncludesProgress?: boolean;
	/** Initial playback speed */
	playbackSpeed?: number;
	/** Custom HTTP headers for audio and artwork requests */
	headers?: {
		audio?: Record<string, string>;
		artwork?: Record<string, string>;
	};
	/** Type of content being played */
	contentType?: string;
}

/**
 * Interface for web audio player implementation
 */
export interface WebAudioProInterface {
	/** Play an audio track */
	play(track: AudioProTrack, options: WebAudioProOptions): void;
	/** Pause playback */
	pause(): void;
	/** Resume playback */
	resume(): void;
	/** Stop playback and reset position */
	stop(): void;
	/** Clear the player state */
	clear(): void;
	/** Seek to a specific position */
	seekTo(positionMs: number): void;
	/** Seek forward by specified amount */
	seekForward(amountMs: number): void;
	/** Seek backward by specified amount */
	seekBack(amountMs: number): void;
	/** Set playback speed */
	setPlaybackSpeed(speed: number): void;
}

/**
 * Web implementation of the audio player using HTML5 Audio API
 */
export class WebAudioProImpl implements WebAudioProInterface {
	private audio: HTMLAudioElement | null = null;
	private currentTrack: AudioProTrack | null = null;
	private progressInterval: number | null = null;
	private playbackSpeed: number = 1.0;
	private debug: boolean = false;

	/**
	 * Creates a new web audio player instance
	 */
	constructor() {
		if (typeof window !== 'undefined' && typeof document !== 'undefined') {
			this.audio = new Audio();
			this.setupAudioListeners();
		}
	}

	/**
	 * Logs debug messages if debug mode is enabled
	 *
	 * @param args - Arguments to log
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('~~~ [Web]', ...args);
		}
	}

	/**
	 * Sets up event listeners for the audio element
	 */
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

	/**
	 * Emits a state changed event
	 *
	 * @param state - The new state
	 */
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

	/**
	 * Emits a progress update event
	 */
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

	/**
	 * Emits a track ended event
	 */
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

	/**
	 * Emits a seek complete event
	 */
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

	/**
	 * Emits an error event
	 *
	 * @param error - Error message
	 * @param errorCode - Error code
	 */
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

	/**
	 * Starts the progress update interval
	 */
	private startProgressUpdates(): void {
		this.stopProgressUpdates();
		this.progressInterval = window.setInterval(() => {
			this.emitProgress();
		}, 1000) as unknown as number;
	}

	/**
	 * Stops the progress update interval
	 */
	private stopProgressUpdates(): void {
		if (this.progressInterval !== null) {
			clearInterval(this.progressInterval);
			this.progressInterval = null;
		}
	}

	/**
	 * Play an audio track
	 *
	 * @param track - The track to play
	 * @param options - Playback options
	 */
	play(track: AudioProTrack, options: WebAudioProOptions): void {
		const autoPlay = options.autoPlay !== undefined ? options.autoPlay : true;
		this.log('Play', track, options, 'autoPlay:', autoPlay);
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

		if (!autoPlay) {
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
			this.emitError(
				`Failed to play: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Pause playback
	 */
	pause(): void {
		if (!this.audio || this.audio.paused) return;
		this.audio.pause();
		this.emitStateChanged(AudioProState.PAUSED);
	}

	/**
	 * Resume playback
	 */
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
			this.emitError(
				`Failed to resume: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Stop playback and reset position
	 */
	stop(): void {
		if (!this.audio) return;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.emitStateChanged(AudioProState.STOPPED);
		this.stopProgressUpdates();
	}

	/**
	 * Clear the player state
	 */
	clear(): void {
		if (!this.audio) return;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.audio.src = '';
		this.currentTrack = null;
		this.emitStateChanged(AudioProState.IDLE);
		this.stopProgressUpdates();
	}

	/**
	 * Seek to a specific position
	 *
	 * @param positionMs - Position in milliseconds
	 */
	seekTo(positionMs: number): void {
		if (!this.audio) return;
		if (positionMs < 0) return;
		if (this.audio.duration && positionMs > this.audio.duration * 1000) return;

		this.audio.currentTime = positionMs / 1000;
		this.emitSeekComplete();
	}

	/**
	 * Seek forward by specified amount
	 *
	 * @param amountMs - Amount in milliseconds
	 */
	seekForward(amountMs: number): void {
		if (!this.audio) return;
		if (amountMs <= 0) return;

		const newPosition = Math.min(
			this.audio.duration || Infinity,
			this.audio.currentTime + amountMs / 1000,
		);
		this.audio.currentTime = newPosition;
		this.emitSeekComplete();
	}

	/**
	 * Seek backward by specified amount
	 *
	 * @param amountMs - Amount in milliseconds
	 */
	seekBack(amountMs: number): void {
		if (!this.audio) return;
		if (amountMs <= 0) return;

		this.audio.currentTime = Math.max(0, this.audio.currentTime - amountMs / 1000);
		this.emitSeekComplete();
	}

	/**
	 * Set playback speed
	 *
	 * @param speed - Playback speed (1.0 is normal speed)
	 */
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
