import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import {
  pause,
  play,
  resume,
  stop,
  AudioProEvent,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';
import { useState } from 'react';
import { formatTime } from './utils';
import { playlist } from './playlist';

export default function App() {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalDuration = 240;
  const currentTrack = playlist[currentIndex];

  const playerState = usePlayerStore((state) => state.state);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (playerState === AudioProEvent.IsPlaying) {
      pause();
    } else if (playerState === AudioProEvent.IsPaused) {
      resume();
    } else {
      play(currentTrack.url);
    }
  };

  const handleStop = () => {
    stop();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} />
      <Text style={styles.title}>{currentTrack.title}</Text>
      <Text style={styles.artist}>{currentTrack.artist}</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={totalDuration}
          value={currentPosition}
          minimumTrackTintColor="#1EB1FC"
          maximumTrackTintColor="#8E8E93"
          thumbTintColor="#1EB1FC"
          onValueChange={(value) => setCurrentPosition(value)}
        />
        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
      </View>
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={() => {
            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          }}
        >
          <Text style={styles.controlText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause}>
          <Text style={[styles.controlText, styles.playPauseText]}>
            {playerState === AudioProEvent.IsPlaying ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (currentIndex < playlist.length - 1)
              setCurrentIndex(currentIndex + 1);
          }}
        >
          <Text style={styles.controlText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.seekRow}>
        <TouchableOpacity
          onPress={() => {
            setCurrentPosition(Math.max(0, currentPosition - 30));
          }}
        >
          <Text style={styles.controlText}>-30s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setCurrentPosition(Math.min(totalDuration, currentPosition + 30));
          }}
        >
          <Text style={styles.controlText}>+30s</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stopRow}>
        <TouchableOpacity onPress={handleStop}>
          <Text style={styles.controlText}>Stop</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stateText}>State: {playerState}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    width: 50,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  controlText: {
    fontSize: 18,
  },
  playPauseText: {
    fontWeight: 'bold',
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '40%',
    marginBottom: 20,
  },
  stopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  stateText: {
    fontSize: 16,
    marginTop: 20,
  },
});
