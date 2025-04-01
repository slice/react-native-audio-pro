# React Native Audio Pro

A React Native module for audio playback from remote URLs. Ideal for audiobook and podcast apps, it supports background playback and lock screen controls on both Android and iOS. Built from the ground up with Media3, our Android integration uses the latest playback engine — no legacy ExoPlayer dependencies. It supports background playback, lock screen controls, and seamless React Native integration using modern service-based architecture.

[![npm version](https://img.shields.io/npm/v/react-native-audio-pro?logo=npm&logoColor=white&labelColor=grey&color=blue)](https://www.npmjs.com/package/react-native-audio-pro)
[![website](https://img.shields.io/badge/website-rnap.dev-grey?logo=google-chrome&logoColor=white&color=blue)](https://rnap.dev)
[![GitHub](https://img.shields.io/badge/evergrace--co-react--native--audio--pro-grey?logo=github&logoColor=white&labelColor=grey&color=blue)](https://github.com/evergrace-co/react-native-audio-pro)

## Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Platform-Specific Setup](#platform-specific-setup)
  - [iOS](#ios)
  - [Android](#android)
- [API Overview](#api-overview)
  - [Methods](#methods)
  - [Event Listeners](#event-listeners)
  - [Enums](#enums)
  - [Types](#types)
- [Basic Usage Example](#basic-usage-example)
- [📱 Example App](#-example-app)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install react-native-audio-pro
```
or
```bash
yarn add react-native-audio-pro
```

## Requirements

- **TypeScript:** 5.0 or higher
- **React Native:** 0.72 or higher
- **iOS:** iOS 15.1 or higher
- **Android:** Android 13 (API 33) or higher

> **Why Android 13+ (API 33) is required**
> While Media3 supports API 21+, this library targets API 33+ to fully leverage modern media session APIs, foreground service behavior, and notification controls without legacy fallbacks. This ensures consistent, clean background playback using the latest Android standards.

## Platform-Specific Setup

### iOS

#### Enable Background Modes

1. Open your project settings in Xcode.
2. Go to **Signing & Capabilities**.
3. Add **Background Modes** and enable **Audio, AirPlay, and Picture in Picture**.

### Android

#### Gradle Configuration

```gradle
// File: android/build.gradle
buildscript {
    ext {
        minSdkVersion = 31
        compileSdkVersion = 33
        targetSdkVersion = 33
        // ...
    }
}
```

## API Overview

### Methods

- **load(track: AudioProTrack): void**
  - Loads the specified track.
- **play(): void**
  - Starts playing the loaded track.
- **pause(): void**
  - Pauses the current playback.
- **resume(): void**
  - Resumes playback if paused.
- **stop(): void**
  - Stops the playback.
- **seekTo(positionMs: number): void**
  - Seeks to a specific position (in milliseconds).
- **seekForward(amountMs?: number): void**
  - Seeks forward (default 30 seconds).
- **seekBack(amountMs?: number): void**
  - Seeks backward (default 30 seconds).
- **configure(options: AudioProSetupOptions): void**
  - Optional. Sets playback options like content type (`'music'` or `'speech'`). Takes effect the next time `play()` is called.

### Event Listeners

- **addListener(callback: AudioProEventCallback): EmitterSubscription**
  - Listens for playback events (e.g., track ended, errors, progress).

### Enums

- **AudioProState:** `STOPPED`, `LOADING`, `PLAYING`, `PAUSED`
- **AudioProEvent:** `TRACK_ENDED`, `PLAYBACK_ERROR`, `PROGRESS`, `SEEK_COMPLETE`, `REMOTE_NEXT`, `REMOTE_PREV`

### Types

```typescript
type AudioProTrack = {
    url: string; // the media url (mp3, m4a)
    title: string;
    artwork: string; // the image url (jpg, png)
    album?: string;
    artist?: string;
};

type AudioProSetupOptions = {
    contentType?: 'music' | 'speech';
    debug?: boolean; // Verbose logging
};
```

### About contentType

The `contentType` option informs the underlying audio engine how to optimize playback. Use `'speech'` for voice-based audio (e.g., stories, podcasts) and `'music'` for music-heavy tracks. This helps the OS route audio appropriately and manage interruptions. This setting is optional and defaults to `'music'`. Changes apply on the next `play()` call.

## The useAudioPro Hook

The `useAudioPro` hook gives you real-time access to the playback state, current position, and total duration.

```typescript jsx
import { useAudioPro } from 'react-native-audio-pro';

const AudioStatus = () => {
  const { state, position, duration } = useAudioPro();

  return (
    <View>
      <Text>Playback State: {state}</Text>
      <Text>Current Position: {position}ms</Text>
      <Text>Total Duration: {duration}ms</Text>
    </View>
  );
};

export default AudioStatus;
```

## Basic Usage Example

```typescript
// Optional: Set playback config
AudioPro.configure({ contentType: 'music', debug: __DEV__ });

// Define an audio track
const track = {
  url: 'https://example.com/audio.mp3',
  title: 'My Track',
  artwork: 'https://example.com/artwork.jpg',
  artist: 'Artist Name',
};

// Load and play the track
AudioPro.load(track);
AudioPro.play(track);

// Control playback
AudioPro.pause();
AudioPro.resume();
AudioPro.seekTo(60);

// Listen for player events
const eventSubscription = AudioPro.addEventListener((event: AudioProEventPayload) => {
  // const {name, position, duration} = event;
  console.log('AudioPro Event:', event);
});
```

## 📱 Example App

A complete working example is provided in the [`example/`](./example) folder.

It demonstrates how to use `react-native-audio-pro` in a real React Native app, including:

- Track metadata (title, artist, artwork)
- Play/Pause/Seek/Skip controls
- Progress slider
- Event listener for events

### To run the example:

* Clone this repo and run the below commands

```bash
yarn install
yarn example start
# In a new terminal:
yarn example android
yarn example ios
```

**OR** open the `./example/ios` folder in XCode, or the `./example/android` folder in Android Studio and run in a simulator or physical device.

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
