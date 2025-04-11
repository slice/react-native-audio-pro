import { useEffect, useState } from 'react';
import {
	Image,
	SafeAreaView,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	Alert,
	Switch,
	ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { type AudioProTrack, useAudioPro } from 'react-native-audio-pro';

import { formatTime } from './utils';
import { playlist } from './playlist';
import { styles } from './styles';
import { AudioProState } from '../../src/values';
import { AudioPro } from '../../src/audioPro';
import { getCurrentTrackIndex, setCurrentTrackIndex } from './player-service';

export default function App() {
	// Use the current track index from the player service
	const [currentIndex, setLocalIndex] = useState(getCurrentTrackIndex());
	const currentTrack = playlist[currentIndex];
	const { position, duration, state, playingTrack, playbackSpeed, error } =
		useAudioPro();

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

	// Track whether to autoplay when loading a track
	const [autoplay, setAutoplay] = useState(true);

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
			AudioPro.play(currentTrack, autoplay);
			setNeedsTrackLoad(false);
		}
	};

	const handleStop = () => {
		AudioPro.stop();
		setNeedsTrackLoad(true);
	};

	const handleSeek = (value: number) => {
		AudioPro.seekTo(value);
	};

	const handleSeekBack = () => {
		AudioPro.seekBack(10000); // 10 seconds in milliseconds
	};

	const handleSeekForward = () => {
		AudioPro.seekForward(30000); // 30 seconds in milliseconds
	};

	const handlePrevious = () => {
		if (position > 5000) {
			// If we're more than 5 seconds into the track, seek to beginning
			AudioPro.seekTo(0);
		} else {
			// Otherwise, go to previous track
			const newIndex =
				currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;

			// Update the track index
			updateCurrentIndex(newIndex);

			// If we're currently playing or paused (but loaded), immediately load the new track
			if (
				state === AudioProState.PLAYING ||
				state === AudioProState.PAUSED
			) {
				AudioPro.play(playlist[newIndex] as AudioProTrack, autoplay);
				setNeedsTrackLoad(false);
			} else {
				// Otherwise, mark that we need to load the track when play is pressed
				setNeedsTrackLoad(true);
			}
		}
	};

	const handleNext = () => {
		// Calculate the new index
		const newIndex = (currentIndex + 1) % playlist.length;

		// Update the track index
		updateCurrentIndex(newIndex);

		// If we're currently playing or paused (but loaded), immediately load the new track
		if (state === AudioProState.PLAYING || state === AudioProState.PAUSED) {
			AudioPro.play(playlist[newIndex] as AudioProTrack, autoplay);
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

	const showErrorDetails = () => {
		if (error) {
			Alert.alert(
				'Playback Error',
				`Error: ${error.error}\nCode: ${error.errorCode || 'N/A'}`,
			);
		}
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
						<Text style={styles.controlText}>Prev</Text>
					</TouchableOpacity>
					{state === AudioProState.LOADING ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#1EB1FC" />
						</View>
					) : (
						<TouchableOpacity onPress={handlePlayPause}>
							<Text style={styles.playPauseText}>
								{state === AudioProState.PLAYING
									? 'Pause'
									: 'Play'}
							</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity onPress={handleNext}>
						<Text style={styles.controlText}>Next</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.seekRow}>
					<TouchableOpacity onPress={handleSeekBack}>
						<Text style={styles.controlText}>-10s</Text>
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
						<Text style={styles.controlText}>Stop</Text>
					</TouchableOpacity>
				</View>
				<Text style={styles.stateText}>State: {state}</Text>
				{playingTrack && (
					<Text style={styles.stateText}>
						Track ID: {playingTrack.id}
					</Text>
				)}

				<View style={styles.optionRow}>
					<Text style={styles.optionText}>Autoplay:</Text>
					<Switch
						value={autoplay}
						onValueChange={setAutoplay}
						trackColor={{ false: '#767577', true: '#81b0ff' }}
						thumbColor={autoplay ? '#1EB1FC' : '#f4f3f4'}
					/>
				</View>

				{/* Error display and handling */}
				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>
							Error: {error.error}
						</Text>
						<TouchableOpacity
							onPress={showErrorDetails}
							style={styles.errorButton}
						>
							<Text style={styles.errorButtonText}>
								Show Details
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
