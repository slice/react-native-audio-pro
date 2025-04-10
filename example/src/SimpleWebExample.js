import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, Slider } from 'react-native';
import { AudioPro, useAudioPro } from 'react-native-audio-pro';

// Example track
const exampleTrack = {
	id: 'track-001',
	url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
	title: 'Example Audio Track',
	artwork: 'https://picsum.photos/200',
	artist: 'SoundHelix',
	album: 'Sample Tracks',
};

// This example demonstrates using AudioPro in a web environment
const SimpleWebExample = () => {
	// Use the AudioPro hook to get playback state
	const { state, position, duration, track, playbackSpeed } = useAudioPro();

	// Set up event listener outside React lifecycle
	useEffect(() => {
		const subscription = AudioPro.addEventListener((event) => {
			console.log('Audio event:', event.type);
		});

		// Cleanup when component unmounts
		return () => {
			subscription.remove();
			AudioPro.stop();
		};
	}, []);

	// Format time in MM:SS
	const formatTime = (ms) => {
		if (!ms) return '0:00';
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	// Handle play button
	const handlePlay = () => {
		AudioPro.play(exampleTrack);
	};

	// Handle seek
	const handleSeek = (value) => {
		AudioPro.seekTo(value * duration);
	};

	// Calculate progress percentage
	const progress = duration > 0 ? position / duration : 0;

	// Check if track is currently playing
	const isPlaying = state === 'PLAYING';

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				React Native Audio Pro - Web Example
			</Text>

			<Text style={styles.status}>Status: {state}</Text>

			{track && (
				<View style={styles.trackInfo}>
					<Text style={styles.trackTitle}>{track.title}</Text>
					<Text style={styles.trackArtist}>{track.artist}</Text>
				</View>
			)}

			<View style={styles.progressContainer}>
				<Text>{formatTime(position)}</Text>
				<Slider
					style={styles.slider}
					value={progress}
					onValueChange={handleSeek}
					minimumTrackTintColor="#4285f4"
					maximumTrackTintColor="#e0e0e0"
					thumbTintColor="#4285f4"
				/>
				<Text>{formatTime(duration)}</Text>
			</View>

			<View style={styles.buttonContainer}>
				<Button
					title="Play"
					onPress={handlePlay}
					disabled={isPlaying}
				/>
				<Button
					title="Pause"
					onPress={AudioPro.pause}
					disabled={!isPlaying}
				/>
				<Button
					title="Stop"
					onPress={AudioPro.stop}
					disabled={state === 'STOPPED'}
				/>
			</View>

			<Text style={styles.speedText}>
				Playback Speed: {playbackSpeed}x
			</Text>
			<View style={styles.speedButtons}>
				<Button
					title="0.5x"
					onPress={() => AudioPro.setPlaybackSpeed(0.5)}
				/>
				<Button
					title="1.0x"
					onPress={() => AudioPro.setPlaybackSpeed(1.0)}
				/>
				<Button
					title="1.5x"
					onPress={() => AudioPro.setPlaybackSpeed(1.5)}
				/>
				<Button
					title="2.0x"
					onPress={() => AudioPro.setPlaybackSpeed(2.0)}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		width: '100%',
		maxWidth: 600,
		margin: '0 auto',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	status: {
		fontSize: 18,
		marginBottom: 20,
	},
	trackInfo: {
		marginBottom: 20,
		alignItems: 'center',
	},
	trackTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	trackArtist: {
		fontSize: 16,
		color: '#666',
	},
	progressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginBottom: 20,
	},
	slider: {
		flex: 1,
		marginHorizontal: 10,
		height: 40,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		maxWidth: 300,
		marginBottom: 20,
	},
	speedText: {
		marginBottom: 10,
		fontSize: 16,
	},
	speedButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		maxWidth: 300,
	},
});

export default SimpleWebExample;
