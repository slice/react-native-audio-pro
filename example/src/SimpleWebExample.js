import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

// This is a simple example that demonstrates the web audio functionality
const SimpleWebExample = () => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [audio, setAudio] = useState(null);

	useEffect(() => {
		// Create audio element when component mounts
		// eslint-disable-next-line no-undef
		const audioElement = new Audio(
			'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
		);
		audioElement.addEventListener('play', () => setIsPlaying(true));
		audioElement.addEventListener('pause', () => setIsPlaying(false));
		audioElement.addEventListener('ended', () => setIsPlaying(false));

		setAudio(audioElement);

		// Cleanup when component unmounts
		return () => {
			if (audioElement) {
				audioElement.pause();
				audioElement.src = '';
			}
		};
	}, []);

	const handlePlay = () => {
		if (audio) {
			audio.play();
		}
	};

	const handlePause = () => {
		if (audio) {
			audio.pause();
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				React Native Audio Pro - Web Example
			</Text>
			<Text style={styles.status}>
				Status: {isPlaying ? 'Playing' : 'Paused'}
			</Text>
			<View style={styles.buttonContainer}>
				<Button
					title="Play"
					onPress={handlePlay}
					disabled={isPlaying}
				/>
				<Button
					title="Pause"
					onPress={handlePause}
					disabled={!isPlaying}
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
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		maxWidth: 300,
	},
});

export default SimpleWebExample;
