WORK IN PROGRESS!

NOT ACCURATE YET!


## ❓ Frequently Asked Questions

<details>
<summary><strong>Can I play local audio files?</strong></summary>

Yes. You can use:
- `require('./audio.mp3')` for bundled assets.
- A full path string (e.g., from `react-native-fs`) for downloaded files.

</details>

<details>
<summary><strong>Does this library support web?</strong></summary>

Yes. Web support is included. It falls back to HTML5 Audio and only supports basic features. Advanced features like ambient audio and lock screen controls are not available on web.

</details>

<details>
<summary><strong>What audio formats are supported?</strong></summary>

Any format supported by the native platforms:
- iOS: MP3, AAC, WAV, ALAC, etc.
- Android: MP3, AAC, OGG, WAV, FLAC, etc.
- Also supports HLS, DASH, RTSP, and RTMP streaming.

</details>

<details>
<summary><strong>What happens if the app is terminated?</strong></summary>

- Main audio playback can continue briefly depending on OS policy, but usually stops.
- Ambient playback will stop and is not guaranteed to resume.
- For persistent playback, ensure proper background modes are enabled and keep a main track active.

</details>

<details>
<summary><strong>Can I use this with Expo?</strong></summary>

Yes, but only with Expo Dev Client or EAS builds. It will not work in the classic Expo Go app because native modules must be compiled.

</details>

<details>
<summary><strong>Does ambient playback support progress, seeking, or pause?</strong></summary>

No. Ambient audio is intentionally minimal. It only supports:
- `AudioPro.ambientPlay({ url })`
- `AudioPro.ambientStop()`
- `AudioPro.ambientSetVolume()`

No hooks, no getters, no seeking — just play and stop.

</details>

<details>
<summary><strong>Can I loop or repeat main tracks?</strong></summary>

Not currently. Looping is only supported for ambient playback. Track repeat logic must be implemented in your app via the `TRACK_ENDED` event.

</details>

## ❓ Frequently Asked Questions

<details>
<summary><strong>How do I load a local audio file?</strong></summary>
Use `require('./audio.mp3')` to reference local bundled files directly.
</details>

<details>
<summary><strong>How do I load a file downloaded with react-native-fs?</strong></summary>
Pass the file path as a string. On iOS, prefix with `file://` (e.g. `file://${path}`); on Android, raw paths like `/data/user/0/...` are supported natively.
</details>

<details>
<summary><strong>Do I need to use require() or can I pass a string for local files?</strong></summary>
You can pass a string path for downloaded or runtime files. `require()` is only needed for statically bundled files.
</details>

<details>
<summary><strong>Why is the minimum Android version 7.0 / API 26?</strong></summary>
To use Media3’s modern APIs for media sessions and notifications, the library targets Android API 26+.
</details>

<details>
<summary><strong>Why do I need to enable Background Modes in Xcode?</strong></summary>
iOS requires this entitlement to allow audio to continue playing when the app is backgrounded.
</details>

<details>
<summary><strong>Can I use this in a bare React Native app or only with Expo?</strong></summary>
Works with bare React Native and with Expo Dev Client or EAS builds. Not supported in Expo Go.
</details>

<details>
<summary><strong>What’s the difference between stop() and clear()?</strong></summary>
`stop()` pauses playback and resets position to 0 but retains metadata and media session.
`clear()` fully tears down the player, resets to IDLE, and removes media session and track info.
</details>

<details>
<summary><strong>Why does playback stop when I background the app?</strong></summary>
Ensure background modes are enabled. Ambient audio may not always persist; keep a main track playing for reliability.
</details>

<details>
<summary><strong>Can I resume playback after the app restarts?</strong></summary>
Not automatically. You must persist track info and state in your app, and reload manually after app launch.
</details>

<details>
<summary><strong>Can I preload a track without playing it?</strong></summary>
Yes. Call `play(track, { autoPlay: false })` to load the track and pause it immediately.
</details>

<details>
<summary><strong>Does the player support streaming protocols like HLS or DASH?</strong></summary>
Yes, on both platforms. Just pass a URL to the streaming file.
</details>

<details>
<summary><strong>Why is my STATE_CHANGED event missing after play()?</strong></summary>
Ensure listeners are added before calling `play()`. Events are not replayed retroactively.
</details>

<details>
<summary><strong>Why is getPlayingTrack() returning null?</strong></summary>
The player is likely in IDLE or STOPPED state, or has not yet loaded a track.
</details>

<details>
<summary><strong>Why does my track play at full volume after stop() and play()?</strong></summary>
Ensure you're calling `setVolume()` again or using `configure()` to set the default. Volume resets between plays.
</details>

<details>
<summary><strong>Why do progress events stop after playing from the lock screen?</strong></summary>
The progress timer may need to be restarted. Ensure native state updates trigger it correctly.
</details>

<details>
<summary><strong>What does the ERROR state mean and how should I handle it?</strong></summary>
It indicates a critical player error (e.g., failed to load). Listen for `PLAYBACK_ERROR` and `STATE_CHANGED: ERROR`, and show a UI fallback or retry.
</details>

<details>
<summary><strong>Why is there a mismatch between track duration and actual audio length?</strong></summary>
Initial durations may be zero or approximate. Wait for `PROGRESS` updates to get more accurate duration values.
</details>

<details>
<summary><strong>What happens when a PLAYBACK_ERROR event is emitted?</strong></summary>
A soft error occurred (e.g., fetch issue). This does not always change the player state. Handle errors gracefully in your app.
</details>

<details>
<summary><strong>Does this work on Web?</strong></summary>
Yes. Web fallback uses HTML5 Audio, but advanced features (lock screen, ambient) are not supported.
</details>

<details>
<summary><strong>Does this support Apple Watch or CarPlay?</strong></summary>
No. These are not currently supported by this library.
</details>

<details>
<summary><strong>How does ambient audio behave when the app is backgrounded?</strong></summary>
Ambient audio usually continues in background, but is not guaranteed by OS. For reliability, pair it with an active main track.
</details>

<details>
<summary><strong>Can I play multiple tracks at once?</strong></summary>
Only with ambient audio + main audio. Concurrent playback of multiple main tracks is not supported.
</details>

<details>
<summary><strong>Is it safe to use this for long-form audio like 1hr+ podcasts?</strong></summary>
Yes. It's designed for stability and background behavior during long sessions.
</details>

<details>
<summary><strong>Why is state emitted from native, not JS?</strong></summary>
The native player owns the source of truth and lifecycle of media playback. JS listens and responds but does not control state transitions directly.
</details>

<details>
<summary><strong>Why is the ambient system kept isolated from the main player?</strong></summary>
To keep it lightweight and avoid coupling. Ambient audio has its own lifecycle, events, and methods.
</details>

<details>
<summary><strong>Can I build my own queue system on top of this?</strong></summary>
Yes. The library gives you single-track control. Queues, playlists, and repeat logic should be managed at the app level.
</details>

<details>
<summary><strong>How lightweight is ambient audio compared to the main player?</strong></summary>
It’s extremely lightweight. No state tracking, no lock screen integration, minimal playback management.
</details>

---
