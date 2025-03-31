import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioPro, type AudioProTrack } from 'react-native-audio-pro';

import { formatTime } from './utils';
import { playlist } from './playlist';
import { styles } from './styles';
import { AudioProState } from '../../src/values';
import { AudioPro } from '../../src/audioPro';

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = playlist[currentIndex];

  const { position, duration, state } = useAudioPro();

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (state === AudioProState.PLAYING) {
      AudioPro.pause();
    } else if (state === AudioProState.PAUSED) {
      AudioPro.resume();
    } else {
      AudioPro.load(currentTrack);
      AudioPro.play();
    }
  };

  const handleStop = () => {
    AudioPro.stop();
  };

  const handleSeek = (value: number) => {
    AudioPro.seekTo(value);
  };

  const handleSeekBack = () => {
    AudioPro.seekBack(30);
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
      setCurrentIndex(newIndex);
      AudioPro.load(playlist[newIndex] as AudioProTrack);
      AudioPro.play();
    }
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(newIndex);
    if (state === AudioProState.PLAYING) {
      AudioPro.load(playlist[newIndex] as AudioProTrack);
      AudioPro.play();
    } else {
      AudioPro.seekTo(0);
    }
  };

  return (
    <View style={styles.container}>
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
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity onPress={handlePlayPause}>
            <Text style={[styles.controlText, styles.playPauseText]}>
              {state === AudioProState.PLAYING ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.controlText}>Next</Text>
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
      <Text style={styles.stateText}>State: {state}</Text>
    </View>
  );
}
