# react-native-audio-pro

A React Native module for audio playback from remote URLs. Ideal for audiobook and podcast apps, it supports background playback and lock screen controls on both Android and iOS.

[![npm version](https://img.shields.io/npm/v/react-native-audio-pro)](https://www.npmjs.com/package/react-native-audio-pro)
[![Website](https://img.shields.io/badge/Website-rnap.dev-blue?logo=react)](https://rnap.dev)

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

Install via npm:

```bash
npm install react-native-audio-pro
```

Or using yarn:

```bash
yarn add react-native-audio-pro
```

## Requirements

- **React Native:** 0.60 or higher
- **iOS:** iOS 15.0 or higher
- **Android:** Android 13 (API Level 33) or higher

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

#### Permissions

```xml
<!-- File: android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

#### Deployment Target

- Set the deployment target to iOS 15.0 or higher.

## API Overview

### Methods

- **play(track: AudioProTrack): void**
  - Starts playing the specified track.
- **pause(): void**
  - Pauses the current playback.
- **resume(): void**
  - Resumes playback if paused.
- **stop(): void**
  - Stops the playback.
- **seekTo(position: number): void**
  - Seeks to a specific position (in milliseconds).
- **seekForward(amount?: number): void**
  - Seeks forward by a given amount (default is 30 seconds).
- **seekBack(amount?: number): void**
  - Seeks backward by a given amount (default is 30 seconds).

### Event Listeners

- **addStateListener(callback: AudioProStateCallback): EmitterSubscription**
  - Listens for playback state changes.
- **addNoticeListener(callback: AudioProNoticeCallback): EmitterSubscription**
  - Listens for playback notices (e.g., track ended, errors, progress).

### Enums

- **AudioProState:** `STOPPED`, `LOADING`, `PLAYING`, `PAUSED`
- **AudioProNotice:** `TRACK_ENDED`, `PLAYBACK_ERROR`, `PROGRESS`, `SEEK_COMPLETE`, `REMOTE_NEXT`, `REMOTE_PREV`

### Types

```typescript
type AudioProTrack = {
    url: string; // the media url (mp3, m4a)
    title: string;
    artwork: string; // the image url (jpg, png)
    album?: string;
    artist?: string;
};
```

## Basic Usage Example

```javascript
import AudioPro, { AudioProState, AudioProNotice } from 'react-native-audio-pro';

// Define an audio track
const track = {
  url: 'https://example.com/audio.mp3',
  title: 'My Track',
  artwork: 'https://example.com/artwork.jpg',
  artist: 'Artist Name',
};

// Play the track
AudioPro.play(track);

// Pause playback
AudioPro.pause();

// Resume playback
AudioPro.resume();

// Seek to a specific millisecond position (e.g., 60 seconds in)
AudioPro.seekTo(60000);

// Listen for state changes
const stateSubscription = AudioPro.addStateListener((event) => {
  console.log('Playback State:', event.state);
  if (event.state === AudioProState.PLAYING) {
    console.log(`Position: ${event.position} / Duration: ${event.duration}`);
  }
});

// Listen for playback notices
const noticeSubscription = AudioPro.addNoticeListener((notice) => {
  console.log('Notice:', notice.notice);
});
```

## 📱 Example App

A complete working example is provided in the [`example/`](./example) folder.

It demonstrates how to use `react-native-audio-pro` in a real React Native app, including:

- Track metadata (title, artist, artwork)
- Play/Pause/Seek/Skip controls
- Progress slider
- Event listeners for playback state and notices

### To run the example:

```bash
npm install
npm run example start
# In a new terminal:
cd example
npm run ios     # or npm run android
```

## Contributing

See the [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
