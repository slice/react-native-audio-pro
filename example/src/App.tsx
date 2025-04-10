import { useEffect, useState } from 'react';
import {
	Image,
	SafeAreaView,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
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
	const { position, duration, state, track, playbackSpeed } = useAudioPro();

	// Sync the local index with the player service
	useEffect(() => {
		const index = getCurrentTrackIndex();
		if (index !== currentIndex) {
			setLocalIndex(index);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]); // Re-sync when playback state changes

	// Update both local state and player service when changing tracks
	const updateCurrentIndex = (index: number) => {
		setLocalIndex(index);
		setCurrentTrackIndex(index);
	};

	if (!currentTrack) return null;

	const handlePlayPause = () => {
		if (state === AudioProState.PLAYING) {
			AudioPro.pause();
		} else if (state === AudioProState.PAUSED) {
			AudioPro.resume();
		} else {
			AudioPro.play(currentTrack);
		}
	};

	const handleStop = () => {
		AudioPro.stop();
	};

	const handleSeek = (value: number) => {
		AudioPro.seekTo(value);
	};

	const handleSeekBack = () => {
		AudioPro.seekBack(10);
	};

	const handleSeekForward = () => {
		AudioPro.seekForward(30);
	};

	const handlePrevious = () => {
		if (position > 5000) {
			AudioPro.seekTo(0);
		} else {
			const newIndex =
				currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
			updateCurrentIndex(newIndex);
			if (state === AudioProState.PLAYING) {
				AudioPro.play(playlist[newIndex] as AudioProTrack);
			}
		}
	};

	const handleNext = () => {
		const newIndex = (currentIndex + 1) % playlist.length;
		updateCurrentIndex(newIndex);
		if (state === AudioProState.PLAYING) {
			AudioPro.play(playlist[newIndex] as AudioProTrack);
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
						<Text style={styles.controlText}>Prev</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handlePlayPause}>
						<Text style={styles.playPauseText}>
							{state === AudioProState.PLAYING ? 'Pause' : 'Play'}
						</Text>
					</TouchableOpacity>
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
				{track && (
					<Text style={styles.stateText}>Track ID: {track.id}</Text>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
