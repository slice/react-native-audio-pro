# React Native Audio Pro

Modern, background-capable audio playback for React Native — built for podcasts, audiobooks, live streams, and long-form media. Works out of the box with background playback, lock screen controls, and clean hooks-based state. Under the hood: Android uses Media3 (not old-school ExoPlayer), giving you up-to-date media session support without any of the legacy baggage. iOS uses AVFoundation, Apple's native audio engine for professional-grade media playback. Web uses the HTML5 Audio API for cross-browser compatibility. Supports both static audio files and live streaming URLs across all platforms.

[![npm version](https://img.shields.io/npm/v/react-native-audio-pro?logo=npm&logoColor=white&labelColor=grey&color=blue)](https://www.npmjs.com/package/react-native-audio-pro)
[![website](https://img.shields.io/badge/website-rnap.dev-grey?logo=google-chrome&logoColor=white&color=blue)](https://rnap.dev)
[![GitHub](https://img.shields.io/badge/evergrace--co-react--native--audio--pro-grey?logo=github&logoColor=white&labelColor=grey&color=blue)](https://github.com/evergrace-co/react-native-audio-pro)

## Table of Contents

- [🚀 Installation](#-installation)
- [⚙️ Requirements](#-requirements)
- [🔧 Platform-Specific Setup](#-platform-specific-setup)
- [📚 API Overview](#api-overview)
- [⚡️ useAudioPro Hook Example](#useaudiopro-hook-example)
- [📦 API Usage Example](#api-usage-example)
- [📱 Example App](#-example-app)
- [🤝 Contributing](#contributing)
- [🪪 License](#license)

## 🚀 Installation

```bash
npm install react-native-audio-pro
```
or
```bash
yarn add react-native-audio-pro
```

## ⚙️ Requirements

- **TypeScript:** 5.0 or higher
- **React Native:** 0.72 or higher
- **iOS:** iOS 15.1 or higher
- **Android:** Android 7.0 (API 24) or higher (tested on API 28+)

## 🔧 Platform-Specific Setup

<details>
<summary><b>🍎 iOS Setup</b></summary>

#### Enable Background Modes

1. Open your project settings in Xcode.
2. Go to **Signing & Capabilities**.
3. Add **Background Modes** and enable **Audio, AirPlay, and Picture in Picture**.
</details>

<details>
<summary><b>🤖 Android Setup</b></summary>

> **SDK Support:** Android 7.0 (API 24)+
> Media3 APIs are supported from API 21+, but testing is focused on API 28+.

> ℹ️ This library requires `compileSdkVersion = 35` and `targetSdkVersion = 35` to support the latest Media3 features and ensure compatibility with modern Android Studio tooling.

#### Gradle Configuration

In `android/build.gradle`:

```gradle
buildscript {
    ext {
        minSdkVersion = 24
        compileSdkVersion = 35
        targetSdkVersion = 35
        // ...
    }
}
```
</details>

<details>
<summary><b>🌐 Web Support</b></summary>

> **Browser Support:** Modern browsers with HTML5 Audio API support (Chrome, Firefox, Safari, Edge)

No additional setup is required for web support. The library automatically uses the HTML5 Audio API when running in a web environment.

#### Supported Audio Formats

Supported formats depend on the browser. Generally, these formats are well-supported:
- MP3 (.mp3)
- AAC (.m4a, .aac)
- WAV (.wav)
- Ogg Vorbis (.ogg, .oga)
- Opus (.opus)
- WebM (.webm)

#### Web Limitations

- Lock screen controls are not available on web platforms
- Some streaming protocols may have limited support depending on the browser
</details>

## 📚 API Overview

React Native Audio Pro supports various audio formats including MP3, AAC, WAV, and streaming protocols like HLS, DASH, RTSP, and RTMP.

### 🛠 Methods

- **play(track: AudioProTrack)**
  - Loads and starts playing the specified track in one step.
- **pause()**
  - Pauses the current playback.
- **resume()**
  - Resumes playback if paused.
- **stop()**
  - Stops the playback, resetting to position 0 and clearing the playing track.
- **seekTo(positionMs: number)**
  - Seeks to a specific position (in milliseconds).
- **seekForward(amountSec?: number)**
  - Seeks forward by specified seconds (default: 30 seconds).
- **seekBack(amountSec?: number)**
  - Seeks backward by specified seconds (default: 30 seconds).
- **configure(options: AudioProSetupOptions)**
  - Optional. Sets playback options like content type (`'MUSIC'` or `'SPEECH'`). Takes effect the next time `play()` is called.
- **getTimings(): { position: number, duration: number }**
  - Returns the current playback position and total duration in milliseconds.
- **getState(): AudioProState**
  - Returns the current playback state (STOPPED, LOADING, PLAYING, PAUSED, ERROR).
- **getTrack(): AudioProTrack | null**
  - Returns the currently playing track, or null if no track is playing.
- **setPlaybackSpeed(speed: number)**
  - Sets the playback speed rate (0.25 to 2.0). Normal speed is 1.0.
- **getPlaybackSpeed(): number**
  - Returns the current playback speed rate.
- **getError(): AudioProPlaybackErrorPayload | null**
  - Returns the last error that occurred, or null if no error has occurred.

### 🎧 Event Listeners

- **addEventListener(callback: AudioProEventCallback): EmitterSubscription**
  - Listens for playback events (e.g., state changes, track ended, errors, progress).

### 🧱 Enums

- **AudioProState:** `STOPPED`, `LOADING`, `PLAYING`, `PAUSED`, `ERROR`
- **AudioProEventType:** `STATE_CHANGED`, `TRACK_ENDED`, `PLAYBACK_ERROR`, `PROGRESS`, `SEEK_COMPLETE`, `REMOTE_NEXT`, `REMOTE_PREV`, `PLAYBACK_SPEED_CHANGED`
- **AudioProContentType:** `MUSIC`, `SPEECH`

### Lock Screen Controls

Both iOS and Android support lock screen and notification controls for play/pause, seek, and track navigation (next/previous).

### 🧩 Types

<details>
<summary><b>Track and Configuration Types</b></summary>

```typescript
type AudioProTrack = {
    id: string;
    url: string; // the media url (mp3, m4a, streaming URLs)
    title: string;
    artwork: string | number; // the image url (jpg, png), or local asset via require()
    album?: string;
    artist?: string;
};

type AudioProSetupOptions = {
    contentType?: AudioProContentType; // MUSIC or SPEECH
    debug?: boolean; // Verbose logging
};
```
</details>

<details>
<summary><b>Event Types</b></summary>

```typescript
// Unified event structure
interface AudioProEvent {
    type: AudioProEventType;
    track: AudioProTrack | null; // Required for all events except REMOTE_NEXT and REMOTE_PREV
    payload?: {
        state?: AudioProState;
        position?: number;
        duration?: number;
        error?: string;
        errorCode?: number;
        speed?: number;
    };
}

// Note: Command events (REMOTE_NEXT, REMOTE_PREV) don't update state and don't require track information.
// All other events must include track to ensure state consistency.

// Event payload examples
interface AudioProStateChangedPayload {
    state: AudioProState;
    position: number;
    duration: number;
}

interface AudioProTrackEndedPayload {
    position: number;
    duration: number;
}

interface AudioProPlaybackErrorPayload {
    error: string;
    errorCode?: number;
}

interface AudioProPlaybackSpeedChangedPayload {
    speed: number;
}
```
</details>

<details>
<summary><b>About contentType</b></summary>

Use `AudioProContentType.SPEECH` for podcasts or audiobooks, `AudioProContentType.MUSIC` for songs or music-heavy audio. This optimizes playback behavior like audio focus and routing. Defaults to `AudioProContentType.MUSIC`.
</details>

### Handling Remote Events

To handle next and previous track events from lock screen controls:

```typescript
import { AudioPro, AudioProEventType } from 'react-native-audio-pro';

// Set up listeners outside React components (see warning section below)
const subscription = AudioPro.addEventListener((event) => {
  switch (event.type) {
    case AudioProEventType.REMOTE_NEXT:
      // Handle next track button press
      console.log('User pressed Next button');
      // Load and play next track
      break;

    case AudioProEventType.REMOTE_PREV:
      // Handle previous track button press
      console.log('User pressed Previous button');
      // Load and play previous track
      break;

    case AudioProEventType.STATE_CHANGED:
      // Handle state changes
      console.log('State changed to:', event.payload?.state);
      break;
  }
});

// Later, when you want to remove the listener
subscription.remove();
```

## ⚡️ useAudioPro Hook Example

The `useAudioPro` hook gives you real-time access to the playback state, current position, total duration, and the currently playing track.

```typescript jsx
import { useAudioPro } from 'react-native-audio-pro';

const AudioStatus = () => {
  const { state, position, duration, track, playbackSpeed, error } = useAudioPro();

  return (
    <View>
      <Text>Playback State: {state}</Text>
      <Text>Current Position: {position}ms</Text>
      <Text>Total Duration: {duration}ms</Text>
      <Text>Playback Speed: {playbackSpeed}x</Text>
      {error && (
        <View style={{ backgroundColor: '#ffeeee', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: 'red' }}>Error: {error.error}</Text>
          <Text style={{ color: 'red' }}>Code: {error.errorCode}</Text>
        </View>
      )}
      {track && (
        <View>
          <Text>Track ID: {track.id}</Text>
          <Text>Now Playing: {track.title}</Text>
          <Text>Artist: {track.artist}</Text>
        </View>
      )}
    </View>
  );
};

export default AudioStatus;
```

## 📦 API Usage Example

```typescript
import { AudioPro, AudioProContentType } from 'react-native-audio-pro';

// Optional: Set playback config
AudioPro.configure({ contentType: AudioProContentType.MUSIC, debug: __DEV__ });

// Define an audio track (supports both static files and live streams)
const track = {
  id: 'track-001',
  url: 'https://example.com/audio.mp3', // Can also be a live stream URL
  title: 'My Track',
  artwork: 'https://example.com/artwork.jpg', // Can also be a local asset via require()
  artist: 'Artist Name',
};

// Load and play the track
AudioPro.play(track);

// Control playback
AudioPro.pause();
AudioPro.resume();
AudioPro.seekTo(60);

// Adjust playback speed (1.0 is normal speed)
AudioPro.setPlaybackSpeed(1.5); // 1.5x speed for faster playback
AudioPro.setPlaybackSpeed(0.8); // 0.8x speed for slower playback

// Get current state without using the hook
const { position, duration } = AudioPro.getTimings();
const state = AudioPro.getState();
const track = AudioPro.getTrack();
const speed = AudioPro.getPlaybackSpeed();
const error = AudioPro.getError();
console.log(`Currently playing: ${track?.title} (${position}/${duration}ms) - State: ${state} - Speed: ${speed}x`);
```

## ⚠️ Important: Event Listeners and React Lifecycle

When React Native apps go to the background, React may unmount your components or even your entire app. To ensure continuous audio playback and event handling, **always set up audio event listeners outside the React component lifecycle**.

### Example Setup Pattern

```javascript
// index.js - App Entry Point
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { setupAudio } from './audioSetup';

// Register the React component
AppRegistry.registerComponent(appName, () => App);

// Initialize audio logic OUTSIDE of React lifecycle
setupAudio();
```

```javascript
// audioSetup.js example
import { AudioPro, AudioProEventType, AudioProContentType } from 'react-native-audio-pro';

export function setupAudio() {
  // Configure audio settings
  AudioPro.configure({
    contentType: AudioProContentType.MUSIC,
    debug: __DEV__
  });

  // Set up event listeners that persist for the app's lifetime
  AudioPro.addEventListener((event) => {
    switch (event.type) {
      case AudioProEventType.TRACK_ENDED:
        // Auto-play next track when current track ends
        const nextTrack = determineNextTrack();
        if (nextTrack) {
          AudioPro.play(nextTrack);
        }
        break;

      case AudioProEventType.REMOTE_NEXT:
        // Handle next button press from lock screen/notification
        const nextTrackFromRemote = determineNextTrack();
        AudioPro.play(nextTrackFromRemote);
        break;
    }
  });
}

function determineNextTrack() { /* Your logic here */ }
```

## 📱 Example App

<details>
<summary><b>Running the Example App</b></summary>

A complete working example is provided in the [`example/`](./example) folder.

It demonstrates how to use `react-native-audio-pro` in a real React Native app, including:

- Track metadata (title, artist, artwork)
- Play/Pause/Seek/Skip controls
- Progress slider
- Event listeners set up outside the React lifecycle

### To run the example:

* Clone this repo and run the below commands

```bash
yarn install
yarn example start
```
And in a new terminal window/pane:

```bash
yarn example ios
# or
yarn example android
```

**OR** open the `./example/ios` folder in XCode, or the `./example/android` folder in Android Studio and run the app on a simulator or physical device.
</details>

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
