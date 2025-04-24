import { useEffect, useState } from 'react';

import {
	ActivityIndicator,
	Image,
	SafeAreaView,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import Slider from '@react-native-community/slider';
import { type AudioProTrack, useAudioPro } from 'react-native-audio-pro';

import { getCurrentTrackIndex, setCurrentTrackIndex } from './player-service';
import { playlist } from './playlist';
import { styles } from './styles';
import { formatTime, getStateColor } from './utils';
import { AudioPro } from '../../src/audioPro';
import { AudioProState } from '../../src/values';

export default function App() {
	const [currentIndex, setLocalIndex] = useState(getCurrentTrackIndex());
	const currentTrack = playlist[currentIndex];
	const { position, duration, state, playingTrack, playbackSpeed, error } = useAudioPro();

	// Sync the local index with the player service
	useEffect(() => {
		const index = getCurrentTrackIndex();
		if (index !== currentIndex) {
			setLocalIndex(index);
			// Mark that we need to load the track if it changed
			if (state !== AudioProState.PLAYING) {
				setNeedsTrackLoad(true);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]); // Re-sync when playback state changes

	// Reset needsTrackLoad when the track actually changes
	useEffect(() => {
		if (playingTrack?.id === currentTrack?.id) {
			setNeedsTrackLoad(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [playingTrack?.id]);

	// Update both local state and player service when changing tracks
	const updateCurrentIndex = (index: number) => {
		setLocalIndex(index);
		setCurrentTrackIndex(index);
	};

	// Track whether we need to load a new track before playing
	const [needsTrackLoad, setNeedsTrackLoad] = useState(true);

	// Track whether to autoPlay when loading a track
	const [autoPlay, setAutoPlay] = useState(true);

	if (!currentTrack) return null;

	// Handle play/pause button press
	const handlePlayPause = () => {
		if (state === AudioProState.PLAYING) {
			// If playing, simply pause
			AudioPro.pause();
		} else if (state === AudioProState.PAUSED && !needsTrackLoad) {
			// If paused and we don't need to load a new track, resume
			AudioPro.resume();
		} else {
			// If stopped, or we need to load a new track, play the current track
			AudioPro.play(currentTrack, { autoPlay });
			setNeedsTrackLoad(false);
		}
	};

	const handleStop = () => {
		AudioPro.stop();
		setNeedsTrackLoad(true);
	};

	const handleClear = () => {
		AudioPro.clear();
		setNeedsTrackLoad(true);
	};

	const handleSeek = (value: number) => {
		AudioPro.seekTo(value);
	};

	const handleSeekBack = () => {
		AudioPro.seekBack();
	};

	const handleSeekForward = () => {
		AudioPro.seekForward();
	};

	const handlePrevious = () => {
		if (position > 5000) {
			// If we're more than 5 seconds into the track, seek to beginning
			AudioPro.seekTo(0);
		} else {
			// Otherwise, go to previous track
			const newIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;

			// Update the track index
			updateCurrentIndex(newIndex);

			// If we're currently playing or paused (but loaded), immediately load the new track
			if (state === AudioProState.PLAYING || state === AudioProState.PAUSED) {
				AudioPro.play(playlist[newIndex] as AudioProTrack, {
					autoPlay,
				});
				setNeedsTrackLoad(false);
			} else {
				// Otherwise, mark that we need to load the track when play is pressed
				setNeedsTrackLoad(true);
			}
		}
	};

	const handleNext = () => {
		const newIndex = (currentIndex + 1) % playlist.length;
		updateCurrentIndex(newIndex);

		// If we're currently playing or paused (but loaded), immediately load the new track
		if (state === AudioProState.PLAYING || state === AudioProState.PAUSED) {
			AudioPro.play(playlist[newIndex] as AudioProTrack, { autoPlay });
			setNeedsTrackLoad(false);
		} else {
			// Otherwise, mark that we need to load the track when play is pressed
			setNeedsTrackLoad(true);
		}
	};

	const handleIncreaseSpeed = () => {
		const newSpeed = Math.min(2.0, playbackSpeed + 0.25);
		AudioPro.setPlaybackSpeed(newSpeed);
	};

	const handleDecreaseSpeed = () => {
		const newSpeed = Math.max(0.25, playbackSpeed - 0.25);
		AudioPro.setPlaybackSpeed(newSpeed);
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Image
					source={
						typeof currentTrack.artwork === 'number'
							? currentTrack.artwork
							: { uri: currentTrack.artwork }
					}
					style={styles.artwork}
				/>
				<Text style={styles.title}>{currentTrack.title}</Text>
				<Text style={styles.artist}>{currentTrack.artist}</Text>
				<View style={styles.sliderContainer}>
					<Text style={styles.timeText}>{formatTime(position)}</Text>
					<Slider
						style={styles.slider}
						minimumValue={0}
						maximumValue={duration}
						value={position}
						minimumTrackTintColor="#1EB1FC"
						maximumTrackTintColor="#8E8E93"
						thumbTintColor="#1EB1FC"
						onSlidingComplete={handleSeek}
					/>
					<Text style={styles.timeText}>
						{formatTime(Math.max(0, duration - position))}
					</Text>
				</View>
				<View style={styles.controlsRow}>
					<TouchableOpacity onPress={handlePrevious}>
						<Text style={styles.controlText}>prev</Text>
					</TouchableOpacity>
					{state === AudioProState.LOADING ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#1EB1FC" />
						</View>
					) : (
						<TouchableOpacity onPress={handlePlayPause}>
							<Text style={styles.playPauseText}>
								{state === AudioProState.PLAYING
									? 'pause()'
									: state === AudioProState.PAUSED && !needsTrackLoad
										? 'resume()'
										: 'play(track)'}
							</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity onPress={handleNext}>
						<Text style={styles.controlText}>next</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.seekRow}>
					<TouchableOpacity onPress={handleSeekBack}>
						<Text style={styles.controlText}>-30s</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleSeekForward}>
						<Text style={styles.controlText}>+30s</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.speedRow}>
					<TouchableOpacity onPress={handleDecreaseSpeed}>
						<Text style={styles.controlText}>-</Text>
					</TouchableOpacity>
					<Text style={styles.speedText}>{playbackSpeed}x</Text>
					<TouchableOpacity onPress={handleIncreaseSpeed}>
						<Text style={styles.controlText}>+</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.stopRow}>
					<TouchableOpacity onPress={handleStop}>
						<Text style={styles.controlText}>stop()</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleClear}>
						<Text style={styles.controlText}>clear()</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.stopRow}>
					<TouchableOpacity onPress={() => setAutoPlay(!autoPlay)}>
						<Text style={styles.optionText}>
							autoPlay:{' '}
							<Text style={{ color: autoPlay ? '#90EE90' : '#FFA500' }}>
								{autoPlay ? 'true' : 'false'}
							</Text>
						</Text>
					</TouchableOpacity>
					<Text style={styles.stateText}>
						state: <Text style={{ color: getStateColor(state) }}>{state}</Text>
					</Text>
				</View>

				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>Error: {error.error}</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
