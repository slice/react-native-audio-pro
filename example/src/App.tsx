import { Image, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import {
  AudioProState,
  pause,
  play,
  resume,
  seekBack,
  seekForward,
  seekTo,
  stop,
} from 'react-native-audio-pro';
import { usePlayerStore } from './usePlayerStore';
import { useState } from 'react';
import { formatTime } from './utils';
import { playlist } from './playlist';
import { styles } from './styles';

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = playlist[currentIndex];

  const playerState = usePlayerStore((state) => state.state);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const lastNotice = usePlayerStore((state) => state.lastNotice);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (playerState === AudioProState.PLAYING) {
      pause();
    } else if (playerState === AudioProState.PAUSED) {
      resume();
    } else {
      play(currentTrack);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSeek = (value: number) => {
    seekTo(value);
  };

  const handleSeekBack = () => {
    seekBack(); // Use default 30s
  };

  const handleSeekForward = () => {
    seekForward(); // Use default 30s
  };

  const handlePrevious = () => {
    // If position > 5 seconds, restart current track
    if (position > 5000) {
      seekTo(0);
    } else if (currentIndex > 0) {
      // Otherwise, go to previous track if possible
      setCurrentIndex(currentIndex - 1);
    } else {
      // If at first track, just restart
      seekTo(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const trackDisplay = `${currentIndex + 1}/${playlist.length}`;

  return (
    <View style={styles.container}>
      <Text>{trackDisplay}</Text>
      <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
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
          onValueChange={(value) => {
            console.log('~~~ value', value);
          }}
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
          <Text style={[styles.controlText, styles.playPauseText]}>
            {playerState === AudioProState.PLAYING ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex >= playlist.length - 1}
        >
          <Text
            style={[
              styles.controlText,
              currentIndex >= playlist.length - 1 && styles.disabledText,
            ]}
          >
            Next
          </Text>
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
      <View style={styles.stopRow}>
        <TouchableOpacity onPress={handleStop}>
          <Text style={styles.controlText}>Stop</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stateText}>State: {playerState}</Text>
      <Text style={styles.stateText}>Last Notice: {lastNotice}</Text>
    </View>
  );
}
