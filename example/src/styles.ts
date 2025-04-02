import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		backgroundColor: '#222',
	},
	artwork: {
		width: 300,
		height: 300,
		marginBottom: 15,
		borderRadius: 15,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 4,
	},
	artist: {
		fontSize: 18,
		color: '#ccc',
		marginBottom: 15,
	},

	trackPosition: {
		fontSize: 14,
		color: '#ccc',
		marginBottom: 10,
	},
	sliderContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginBottom: 15,
	},
	slider: {
		flex: 1,
		height: 40,
	},
	timeText: {
		fontSize: 12,
		color: '#ccc',
		width: 40,
		textAlign: 'center',
	},
	controlsRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		marginBottom: 15,
	},
	seekRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '60%',
		marginBottom: 15,
	},
	speedRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		width: '80%',
		marginBottom: 15,
	},
	speedText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1EB1FC',
		width: 70,
		textAlign: 'center',
	},
	stopRow: {
		marginBottom: 15,
	},
	controlText: {
		fontSize: 18,
		padding: 10,
		color: '#fff',
	},
	playPauseText: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#fff',
	},
	stateText: {
		fontSize: 12,
		color: '#ccc',
		marginBottom: 4,
	},
});
