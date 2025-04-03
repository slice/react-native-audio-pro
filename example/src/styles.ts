import { StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Calculate screen aspect ratio
const aspectRatio = height / width;

// Check if device needs smaller UI
// This includes both physically small devices and devices with less available vertical space
// Pixel devices (16:9 or 19:9 ratio) will qualify as needing smaller UI
const needsSmallerUI = width < 400 || height < 700 || aspectRatio > 1.9;

// Scale factors based on device size and aspect ratio
// More aggressive scaling for very tall phones
const scale = needsSmallerUI ? (aspectRatio > 2 ? 0.8 : 0.85) : 1;

// For Pixel devices and other tall phones, we need to be more aggressive with artwork scaling
// For extremely tall phones (like Pixel 4 XL), scale down to 65%
let artworkScale = 1;
if (needsSmallerUI) {
	if (aspectRatio > 2.1)
		artworkScale = 0.65; // Very tall phones
	else if (aspectRatio > 1.9)
		artworkScale = 0.7; // Tall phones like Pixel
	else artworkScale = 0.75; // Other small devices
}

// Debug info
console.log(
	`Screen: ${width}x${height}, Ratio: ${aspectRatio.toFixed(2)}, Small UI: ${needsSmallerUI}`,
);

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#222',
	},
	scrollContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: needsSmallerUI ? 12 : 20,
	},
	artwork: {
		width: 300 * artworkScale,
		height: 300 * artworkScale,
		marginBottom: needsSmallerUI ? 8 : 15,
		borderRadius: 15,
	},
	title: {
		fontSize: 24 * scale,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: needsSmallerUI ? 2 : 4,
	},
	artist: {
		fontSize: 18 * scale,
		color: '#ccc',
		marginBottom: needsSmallerUI ? 8 : 15,
	},

	trackPosition: {
		fontSize: 14 * scale,
		color: '#ccc',
		marginBottom: needsSmallerUI ? 5 : 10,
	},
	sliderContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginBottom: needsSmallerUI ? 8 : 15,
	},
	slider: {
		flex: 1,
		height: needsSmallerUI ? 28 : 40,
	},
	timeText: {
		fontSize: 12 * scale,
		color: '#ccc',
		width: needsSmallerUI ? 32 : 40,
		textAlign: 'center',
	},
	controlsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		marginBottom: needsSmallerUI ? 8 : 15,
	},
	seekRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: needsSmallerUI ? '75%' : '60%',
		marginBottom: needsSmallerUI ? 8 : 15,
	},
	speedRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		width: needsSmallerUI ? '90%' : '80%',
		marginBottom: needsSmallerUI ? 8 : 15,
	},
	speedText: {
		fontSize: 18 * scale,
		fontWeight: 'bold',
		color: '#1EB1FC',
		width: needsSmallerUI ? 55 : 70,
		textAlign: 'center',
	},
	stopRow: {
		marginBottom: needsSmallerUI ? 8 : 15,
	},
	controlText: {
		fontSize: 18 * scale,
		padding: needsSmallerUI ? 6 : 10,
		color: '#fff',
	},
	playPauseText: {
		fontSize: 22 * scale,
		fontWeight: 'bold',
		color: '#fff',
	},
	stateText: {
		fontSize: 12 * scale,
		color: '#ccc',
		marginBottom: needsSmallerUI ? 2 : 4,
	},
});
