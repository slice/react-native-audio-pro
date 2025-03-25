# react-native-audio-pro

A React Native module for audio playback from remote URLs. Ideal for audiobook and podcast apps, it supports background playback and lock screen notification controls on both Android and iOS.

## Requirements

- **React Native:** 0.60 or higher
- **Android:** Android 13 (API Level 33) or higher
- **iOS:** iOS 15.0 or higher

## Platform-Specific Setup

### Android

**Gradle Configuration:**
```gradle
// File: android/build.gradle
buildscript {
    ext {
        minSdkVersion = 33
        compileSdkVersion = 33
        targetSdkVersion = 33
        // ...
    }
}
```

**Permissions:**
```xml
<!-- File: android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

**ProGuard Rules (if using ProGuard):**
```proguard
# File: android/app/proguard-rules.pro
-keep class com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**
```

### iOS

**Enable Background Modes:**
1. In Xcode, open your project settings.
2. Go to Signing & Capabilities.
3. Add *Background Modes* and enable *Audio, AirPlay, and Picture in Picture*.

**Swift Compatibility:**
- Create an empty `.swift` file and accept the bridging header prompt if needed.

**iOS Deployment Target:**
- Set to iOS 15.0 or higher in project settings.

## Features

- **Remote Audio Streaming:** Play audio directly from remote URLs.
- **Background Playback:** Continue playing audio even when the app is in the background.
- **Lock Screen Controls:** Manage playback using lock screen controls on iOS and Android.
- **Comprehensive API:** Control playback (play, pause, resume, stop, seek) and handle events.
- **Event Listeners:** Listen to state changes and playback notices including:
  - **State Events:** PLAYING, PAUSED, STOPPED, LOADING, BUFFERING
  - **Notice Events:** TRACK_ENDED, PLAYBACK_ERROR, PROGRESS, SEEK_COMPLETE, REMOTE_NEXT, REMOTE_PREV

## Installation

Install via npm:

```sh
npm install react-native-audio-pro
```

## API

### Playback Controls

- **play(track: AudioTrack):** Start playback of the given track.
- **pause():** Pause the current playback.
- **resume():** Resume paused playback.
- **stop():** Stop the playback.
- **seekTo(position: number):** Seek to a specific position (in milliseconds).
- **seekBack():** Seek backwards by a default duration (e.g., 30 seconds).
- **seekForward():** Seek forwards by a default duration (e.g., 30 seconds).

### Event Listeners

#### State Listener

Listen to state changes:

```js
import { addAudioProStateListener } from 'react-native-audio-pro';

addAudioProStateListener((event) => {
  // event.state is one of: PLAYING, PAUSED, STOPPED, LOADING, BUFFERING
  console.log('State changed:', event.state);
});
```

#### Notice Listener

Listen to playback notices such as track ended, errors, progress, seek completion, and remote control events:

```js
import { addAudioProNoticeListener, AudioProNotice } from 'react-native-audio-pro';

addAudioProNoticeListener((notice) => {
  switch (notice.notice) {
    case AudioProNotice.TRACK_ENDED:
      // Handle track ended
      break;
    case AudioProNotice.PLAYBACK_ERROR:
      // Handle playback error
      break;
    case AudioProNotice.PROGRESS:
      // Update position and duration
      break;
    case AudioProNotice.SEEK_COMPLETE:
      // Handle seek complete
      break;
    case AudioProNotice.REMOTE_NEXT:
      // Handle remote next event
      break;
    case AudioProNotice.REMOTE_PREV:
      // Handle remote previous event
      break;
    default:
      break;
  }
});
```

## Usage Example

Below is an example that demonstrates how to integrate the module within a React Native app:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import {
  AudioProState,
  play,
  pause,
  resume,
  stop,
  seekTo,
  seekBack,
  seekForward,
  addAudioProStateListener,
  addAudioProNoticeListener,
  AudioProNotice
} from 'react-native-audio-pro';
import { usePlayerStore } from './player-store';

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = /* get current track from your playlist */ null;

  // Setup listeners (could be done in a useEffect hook)
  addAudioProStateListener((event) => {
    const store = usePlayerStore.getState();
    store.setState(event.state);
    if (event.position !== undefined) store.setPosition(event.position);
    if (event.duration !== undefined) store.setDuration(event.duration);
  });

  addAudioProNoticeListener((notice) => {
    const store = usePlayerStore.getState();
    store.setNotice(notice.notice);
    if (notice.position !== undefined) store.setPosition(notice.position);
    if (notice.duration !== undefined) store.setDuration(notice.duration);
  });

  // Playback control functions
  const handlePlayPause = () => {
    const store = usePlayerStore.getState();
    if (store.state === AudioProState.PLAYING) {
      pause();
    } else if (store.state === AudioProState.PAUSED) {
      resume();
    } else {
      play(currentTrack);
    }
  };

  // ... other controls (stop, seek, next, previous)

  return (
    <View>
      {/* UI components to display track info, slider, and controls */}
      <Text>Audio Player</Text>
      <TouchableOpacity onPress={handlePlayPause}>
        <Text>{/* Display Play/Pause based on state */}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
