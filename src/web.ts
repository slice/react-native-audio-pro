import type { AudioProTrack } from './types';
import { emitter } from './emitter';
import { AudioProEventType, AudioProState } from './values';

interface WebAudioProInterface {
	play(track: AudioProTrack, options: any): void;
	pause(): void;
	resume(): void;
	stop(): void;
	seekTo(positionMs: number): void;
	seekForward(amountSec: number): void;
	seekBack(amountSec: number): void;
	setPlaybackSpeed(speed: number): void;
}

class WebAudioProImpl implements WebAudioProInterface {
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

	private log(...args: any[]): void {
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
			const audioElement = e.target as HTMLAudioElement;
			const errorMessage = audioElement.error?.message || 'Unknown error';
			const errorCode = audioElement.error?.code || -1;
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
		const position = this.audio?.currentTime
			? Math.floor(this.audio.currentTime * 1000)
			: 0;
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
		const duration = !isNaN(this.audio.duration)
			? Math.floor(this.audio.duration * 1000)
			: 0;

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
		const duration = !isNaN(this.audio.duration)
			? Math.floor(this.audio.duration * 1000)
			: 0;

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
		const duration = !isNaN(this.audio.duration)
			? Math.floor(this.audio.duration * 1000)
			: 0;

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
		emitter.emit('AudioProEvent', {
			type: AudioProEventType.PLAYBACK_ERROR,
			track: this.currentTrack,
			payload: {
				error,
				errorCode,
			},
		});

		emitter.emit('AudioProEvent', {
			type: AudioProEventType.STATE_CHANGED,
			track: this.currentTrack,
			payload: {
				state: AudioProState.ERROR,
				position: 0,
				duration: 0,
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

	play(track: AudioProTrack, options: any): void {
		this.log('Play', track, options);
		this.currentTrack = track;
		this.debug = !!options.debug;
		this.playbackSpeed = options.playbackSpeed || 1.0;

		if (!this.audio) {
			this.emitError('Audio element not available in this environment');
			return;
		}

		// Reset and configure the audio element
		this.audio.src = track.url;
		this.audio.playbackRate = this.playbackSpeed;
		this.audio.load();

		// Start playback
		this.audio.play().catch((error: Error) => {
			this.emitError(`Failed to play: ${error.message}`, -1);
		});
	}

	pause(): void {
		this.log('Pause');
		if (this.audio) {
			this.audio.pause();
		}
	}

	resume(): void {
		this.log('Resume');
		if (this.audio) {
			this.audio.play().catch((error: Error) => {
				this.emitError(`Failed to resume: ${error.message}`, -1);
			});
		}
	}

	stop(): void {
		this.log('Stop');
		if (this.audio) {
			this.audio.pause();
			this.audio.currentTime = 0;
			this.emitStateChanged(AudioProState.STOPPED);
		}
		this.stopProgressUpdates();
	}

	seekTo(positionMs: number): void {
		this.log('SeekTo', positionMs);
		if (this.audio) {
			this.audio.currentTime = positionMs / 1000; // Convert ms to seconds
		}
	}

	seekForward(amountSec: number): void {
		this.log('SeekForward', amountSec);
		if (this.audio) {
			// Convert seconds to milliseconds for consistency with native implementation
			const milliseconds = amountSec * 1000;
			// Then convert back to seconds for the HTML Audio API
			this.audio.currentTime = Math.min(
				this.audio.duration || 0,
				this.audio.currentTime + milliseconds / 1000,
			);
		}
	}

	seekBack(amountSec: number): void {
		this.log('SeekBack', amountSec);
		if (this.audio) {
			// Convert seconds to milliseconds for consistency with native implementation
			const milliseconds = amountSec * 1000;
			// Then convert back to seconds for the HTML Audio API
			this.audio.currentTime = Math.max(
				0,
				this.audio.currentTime - milliseconds / 1000,
			);
		}
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
