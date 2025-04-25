# React Native Audio Pro

Modern, background-capable audio playback for React Native — built for podcasts, audiobooks, live streams, and long-form media.

- ✅ Native lock screen controls
- ✅ Lightweight hooks API
- ✅ Background playback support
- ✅ Works with remote files, streams, and local assets
- ✅ Ambient audio playback support

[![npm version](https://img.shields.io/npm/v/react-native-audio-pro?logo=npm&logoColor=white&labelColor=grey&color=blue)](https://www.npmjs.com/package/react-native-audio-pro)
[![website](https://img.shields.io/badge/website-rnap.dev-grey?logo=google-chrome&logoColor=white&color=blue)](https://rnap.dev)
[![GitHub](https://img.shields.io/badge/evergrace--co-react--native--audio--pro-grey?logo=github&logoColor=white&labelColor=grey&color=blue)](https://github.com/evergrace-co/react-native-audio-pro)

> ⚠️ **Stability Notice**
>
> This library has evolved rapidly and is now considered **stable and production-ready** starting from **v9.2**.
>
> The core architecture and event/state contracts are now locked in, with most edge cases resolved and thorough testing in place.

---

## ⚙️ Requirements

- **TypeScript:** 5.0+
- **React Native:** 0.72+
- **iOS:** 15.1+
- **Android:** 7.0 (API 26)+

---

## 🚀 Installation

```bash
npm install react-native-audio-pro
npx pod-install
```

<details>
<summary>🔧 iOS Configuration</summary>

1. Open your project in Xcode.
2. Go to **Signing & Capabilities**.
3. Add **Background Modes**:
   - Audio, AirPlay, and Picture in Picture

</details>

<details>
<summary>🔧 Android Configuration</summary>

Ensure in `android/build.gradle`:

```gradle
buildscript {
    ext {
        minSdkVersion = 26
        compileSdkVersion = 35
        targetSdkVersion = 35
    }
}
```
</details>

---

## 📚 API Overview

### 🔉 Playback Methods

| Method | Description |
|--------|-------------|
| `play(track, options?)` | Load and start a track. |
| `pause()` / `resume()` | Pause or resume playback. |
| `stop()` | Stop playback and reset to position 0. |
| `clear()` | Reset player to IDLE and remove sessions. |
| `seekTo(ms)` / `seekForward(ms?)` / `seekBack(ms?)` | Seek to position or jump forward/backward. |
| `configure(options)` | Configure playback type or debug flags. |
| `setVolume(value)` / `getVolume()` | Set/get relative volume (0.0 - 1.0). |
| `setPlaybackSpeed(value)` / `getPlaybackSpeed()` | Set/get speed (0.25 - 2.0). |
| `setProgressInterval(ms)` / `getProgressInterval()` | Set/get PROGRESS event frequency. |
| `getState()` | Get current playback state. |
| `getPlayingTrack()` | Get current track. |
| `getTimings()` | Get `{ position, duration }`. |
| `getError()` | Get last error (if any). |

<details>
<summary>📘 Example: Basic Playback</summary>

```ts
import { AudioPro } from 'react-native-audio-pro';

AudioPro.play({
  id: '1',
  url: 'https://example.com/audio.mp3',
  title: 'Track Title',
  artwork: 'https://example.com/image.jpg',
  artist: 'Artist Name',
});
```

</details>

---

## ⚡️ useAudioPro Hook

```ts
const { state, position, duration, playingTrack, playbackSpeed, volume, error } = useAudioPro();
```

Returns live values for state, position, track, volume, etc.

---

## 🎧 Events

```ts
AudioPro.addEventListener((event) => {
  switch (event.type) {
    case 'STATE_CHANGED': console.log(event.payload?.state); break;
    case 'TRACK_ENDED':   /* handle next */ break;
  }
});
```

| Event | Description |
|-------|-------------|
| `STATE_CHANGED` | Player state changed |
| `PROGRESS` | Time update |
| `TRACK_ENDED` | Finished playing |
| `SEEK_COMPLETE` | Seek finished |
| `PLAYBACK_ERROR` | Non-fatal error |
| `REMOTE_NEXT` / `REMOTE_PREV` | Lock screen pressed |

---

## 🔊 Ambient Audio

Ambient audio plays lightweight background sound independently of the main player.

> ⚠️ **Background Behavior**
> Ambient audio often survives backgrounding but should not be relied on alone. Keep a main track active for more robust behavior.

### Ambient Methods

```ts
AudioPro.ambientPlay({
  url: 'https://example.com/bg.mp3',
  loop: true, // default true
});
AudioPro.ambientStop();
AudioPro.ambientSetVolume(0.4);
```

### Ambient Events

```ts
AudioPro.addAmbientListener((event) => {
  if (event.type === 'AMBIENT_TRACK_ENDED') { /* done */ }
});
```

---

## 🧱 Types & Details

<details>
<summary>Track Definition</summary>

```ts
type AudioProTrack = {
  id: string;
  url: string | number;
  title: string;
  artwork: string | number;
  artist?: string;
  album?: string;
};
```

</details>

<details>
<summary>Ambient Options</summary>

```ts
type AmbientAudioPlayOptions = {
  url: string | number;
  loop?: boolean; // default: true
};
```

</details>

<details>
<summary>Debug Options</summary>

```ts
AudioPro.configure({
  contentType: 'SPEECH' | 'MUSIC',
  debug: true,
  debugIncludesProgress: false,
});
```

</details>

<details>
<summary>Progress Interval</summary>

- Set via `configure()` or `setProgressInterval(ms)`
- Range: 100–10000 ms
- Default: 1000 ms

</details>

---

## 🧪 Example App

<details>
<summary>How to Run</summary>

```bash
git clone https://github.com/evergrace-co/react-native-audio-pro
cd react-native-audio-pro
yarn install
yarn example start
yarn example ios # or android
```

Features:
- Track controls
- Hook usage
- Ambient audio demo
</details>

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
