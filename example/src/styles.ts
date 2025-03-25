import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  artwork: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  trackPosition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  seekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginBottom: 20,
  },
  stopRow: {
    marginBottom: 20,
  },
  controlText: {
    fontSize: 18,
    padding: 10,
  },
  playPauseText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  stateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  disabledText: {
    color: '#cccccc',
  },
});
