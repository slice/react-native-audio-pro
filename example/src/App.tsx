import { useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { play, pause } from 'react-native-audio-pro';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

const playlist = [
  {
    id: '1',
    url: 'https://rnap.dev/soundhelix-song-1-tschurger.m4a',
    title: 'Soundhelix Song 1',
    artist: 'T. Schurger',
    artworkUrl: 'https://rnap.dev/usgs-bAji8qv_LlY-unsplash.jpg',
  },
  {
    id: '2',
    url: 'https://rnap.dev/soundhelix-song-5-tschurger.m4a',
    title: 'Soundhelix Song 5',
    artist: 'T. Schurger',
    artworkUrl: 'https://rnap.dev/usgs-PgL1p8TBGNQ-unsplash.jpg',
  },
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalDuration = 240;
  const currentTrack = playlist[currentIndex];

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(currentTrack.url);
    }
    setIsPlaying(!isPlaying);
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
          <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
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
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '40%',
  },
});
