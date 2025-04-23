# React Native Audio Pro: Technical Reference

This document serves as an exhaustive technical reference for understanding the runtime behavior and life cycle of the `react-native-audio-pro` library across all platforms.

## 1. TypeScript Layer (React Native)

### API Methods Overview

The TypeScript layer provides a unified API that communicates with native modules and manages state. Here's a detailed analysis of each exported method:

#### `configure(options: AudioProConfigureOptions): void`

**Input Parameters:**
- `options`: Object containing configuration settings
  - `contentType`: "MUSIC" or "SPEECH" (default: "MUSIC")
  - `debug`: Boolean to enable debug logging (default: false)
  - `debugIncludesProgress`: Boolean to include progress events in debug logs (default: false)

**Internal State Transitions:**
- Updates `configureOptions` in the internal store
- Sets debug flags

**Example Values:**
```javascript
// Internal state before:
configureOptions = { contentType: "MUSIC", debug: false, debugIncludesProgress: false }

// After configure({ debug: true, contentType: "SPEECH" }):
configureOptions = { contentType: "SPEECH", debug: true, debugIncludesProgress: false }
```

#### `play(track: AudioProTrack, options?: AudioProPlayOptions)`

**Input Parameters:**
- `track`: Object containing track information
  - `id`: Unique identifier
  - `url`: URL of the audio file (string or require() result)
  - `title`: Track title
  - `artwork`: URL or require() result for artwork
  - `album`: (optional) Album name
  - `artist`: (optional) Artist name
- `options`: (optional) Playback options
  - `autoPlay`: Boolean to start playback immediately (default: true)
  - `headers`: Custom HTTP headers for audio and artwork requests
  - Plus all options from `AudioProConfigureOptions`

**Internal State Transitions:**
- Sets `trackPlaying` to the provided track
- Clears any existing error state
- Resolves asset URLs if provided as require() results
- Validates track data
- Calls native `play` method

**Events Emitted:**
- If track validation fails:
  - `PLAYBACK_ERROR` with payload `{ error: "Invalid track provided", errorCode: -1 }`

**Dependencies:**
- Calls `NativeAudioPro.play(resolvedTrack, nativeOptions)`

**Example Values:**
```javascript
// Internal state during play:
trackPlaying = { id: "123", url: "https://example.com/song.mp3", title: "My Song", artwork: "https://example.com/cover.jpg" }
error = null
```

#### `pause()`

**Internal State Transitions:**
- No direct state changes in TypeScript layer
- Native layer will update state to PAUSED

**Dependencies:**
- Calls `NativeAudioPro.pause()`
- Requires a track to be playing (guarded by `guardTrackPlaying`)
- Requires player to be in a valid state (not STOPPED or ERROR)

#### `resume()`

**Internal State Transitions:**
- Clears any existing error state
- Native layer will update state to PLAYING

**Dependencies:**
- Calls `NativeAudioPro.resume()`
- Requires a track to be playing (guarded by `guardTrackPlaying`)
- Requires player to be in a valid state (not STOPPED or ERROR)

#### `stop()`

**Internal State Transitions:**
- Clears any existing error state
- Native layer will update state to STOPPED and clear current track

**Dependencies:**
- Calls `NativeAudioPro.stop()`

#### `seekTo(positionMs: number)`

**Input Parameters:**
- `positionMs`: Target position in milliseconds

**Dependencies:**
- Calls `NativeAudioPro.seekTo(positionMs)`
- Requires a track to be playing (guarded by `guardTrackPlaying`)
- Requires player to be in a valid state (not STOPPED or ERROR)

#### `seekForward(amountMs: number = DEFAULT_SEEK_MS)`

**Input Parameters:**
- `amountMs`: Amount to seek forward in milliseconds (default: 30000)

**Dependencies:**
- Calls `NativeAudioPro.seekForward(amountMs)`
- Requires a track to be playing (guarded by `guardTrackPlaying`)
- Requires player to be in a valid state (not STOPPED or ERROR)

#### `seekBack(amountMs: number = DEFAULT_SEEK_MS)`

**Input Parameters:**
- `amountMs`: Amount to seek backward in milliseconds (default: 30000)

**Dependencies:**
- Calls `NativeAudioPro.seekBack(amountMs)`
- Requires a track to be playing (guarded by `guardTrackPlaying`)
- Requires player to be in a valid state (not STOPPED or ERROR)

#### `addEventListener(callback: AudioProEventCallback)`

**Input Parameters:**
- `callback`: Function to be called when events are emitted

**Returns:**
- Subscription object with `remove()` method to unsubscribe

**Example:**
```javascript
const subscription = AudioPro.addEventListener((event) => {
  console.log(event.type, event.payload);
});
// Later:
subscription.remove();
```

#### `getTimings()`

**Returns:**
- Object with `position` and `duration` in milliseconds

**Dependencies:**
- Reads from internal store

**Example Values:**
```javascript
// Return value:
{ position: 15000, duration: 180000 }
```

#### `getState()`

**Returns:**
- Current player state (STOPPED, LOADING, PLAYING, PAUSED, ERROR)

**Dependencies:**
- Reads from internal store

#### `getPlayingTrack()`

**Returns:**
- Currently playing track or null

**Dependencies:**
- Reads from internal store

#### `setPlaybackSpeed(speed: number)`

**Input Parameters:**
- `speed`: Playback speed factor (clamped between 0.25 and 2.0)

**Internal State Transitions:**
- Updates `playbackSpeed` in internal store
- If a track is playing, calls native method to update playback speed

**Dependencies:**
- Calls `NativeAudioPro.setPlaybackSpeed(validatedSpeed)` if a track is playing
- Requires player to be in a valid state (not STOPPED or ERROR) for native call

#### `getPlaybackSpeed()`

**Returns:**
- Current playback speed

**Dependencies:**
- Reads from internal store

#### `getError()`

**Returns:**
- Current error object or null

**Dependencies:**
- Reads from internal store

### TypeScript-side Life Cycle

#### State Management
The TypeScript layer uses a Zustand store (`useInternalStore`) to maintain state:

```javascript
{
  playerState: AudioProState.STOPPED,  // Current player state
  position: 0,                         // Current playback position (ms)
  duration: 0,                         // Track duration (ms)
  playbackSpeed: 1.0,                  // Playback speed factor
  debug: false,                        // Debug mode flag
  debugIncludesProgress: false,        // Include progress events in debug logs
  trackPlaying: null,                  // Currently playing track
  configureOptions: { ... },           // Configuration options
  error: null                          // Current error state
}
```

#### Event Handling
Events from native modules are received through the `emitter` and processed by `updateFromEvent` in the store:

1. Events are received from native modules via `NativeEventEmitter`
2. The `updateFromEvent` method updates the store state based on the event type
3. The updated state is available to React components via the `useAudioPro` hook

#### State Transitions

**Initialization:**
- Initial state: `{ playerState: STOPPED, trackPlaying: null, ... }`

**Track Loading:**
1. `play()` is called with track data
2. `trackPlaying` is set to the provided track
3. Native module is called to start playback
4. Native module emits `STATE_CHANGED` with `LOADING` state
5. Store updates `playerState` to `LOADING`

**Playback Start:**
1. Native module loads the track
2. Native module emits `STATE_CHANGED` with `PLAYING` state
3. Store updates `playerState` to `PLAYING`
4. Native module starts emitting `PROGRESS` events

**Pause/Resume:**
1. `pause()` or `resume()` is called
2. Native module pauses or resumes playback
3. Native module emits `STATE_CHANGED` with `PAUSED` or `PLAYING` state
4. Store updates `playerState` accordingly

**Track End:**
1. Native module detects track end
2. Native module emits `STATE_CHANGED` with `STOPPED` state
3. Native module emits `TRACK_ENDED` event
4. Store updates `playerState` to `STOPPED`

**Error Handling:**
1. Native module encounters an error
2. Native module emits `PLAYBACK_ERROR` event with error details
3. Native module emits `STATE_CHANGED` with `ERROR` state
4. Store updates `error` with error details
5. Store updates `playerState` to `ERROR`

#### Event Payload Examples

**STATE_CHANGED (PLAYING):**
```javascript
{
  type: "STATE_CHANGED",
  track: { id: "123", url: "https://example.com/song.mp3", title: "My Song", artwork: "https://example.com/cover.jpg" },
  payload: {
    state: "PLAYING",
    position: 15000,
    duration: 180000
  }
}
```

**PROGRESS:**
```javascript
{
  type: "PROGRESS",
  track: { id: "123", url: "https://example.com/song.mp3", title: "My Song", artwork: "https://example.com/cover.jpg" },
  payload: {
    position: 16000,
    duration: 180000
  }
}
```

**PLAYBACK_ERROR:**
```javascript
{
  type: "PLAYBACK_ERROR",
  track: { id: "123", url: "https://example.com/song.mp3", title: "My Song", artwork: "https://example.com/cover.jpg" },
  payload: {
    error: "Network error: connection timeout",
    errorCode: 500
  }
}
```

## 2. Android (Kotlin)

### Architecture Overview

The Android implementation uses Media3 (ExoPlayer) for audio playback and is structured around the `AudioProController` singleton object, which manages the player lifecycle and communicates with the React Native bridge.

### Key Components

- **AudioProController**: Main controller that manages the player and handles events
- **AudioProModule**: React Native module that exposes methods to JavaScript
- **AudioProPlaybackService**: Service for background playback and notifications

### State Machine

#### State Values

- `lastEmittedState`: Tracks the last state sent to JS to prevent duplicates
- `currentTrack`: Currently playing track information
- `isInErrorState`: Flag indicating if the player is in an error state
- `audioHeaders` and `artworkHeaders`: Custom HTTP headers for requests
- `pendingSeek`: Flag indicating if a seek operation is in progress
- `currentPlaybackSpeed`: Current playback speed factor

#### Lifecycle Events

**Initialization:**
```
1. AudioProModule is created
2. AudioProController.setReactContext() is called
```

**Playback Start:**
```
1. play() is called with track data
2. isInErrorState and lastEmittedState are reset
3. currentTrack is set to the provided track
4. MediaBrowser session is prepared
5. MediaItem is created with track metadata
6. emitState(LOADING) is called
7. MediaBrowser.prepare() and play() are called
8. Player listener detects playback start
9. emitState(PLAYING) is called
10. Progress timer is started
```

**Pause/Resume:**
```
Pause:
1. pause() is called
2. MediaBrowser.pause() is called
3. emitState(PAUSED) is called
4. Progress timer is stopped

Resume:
1. resume() is called
2. MediaBrowser.play() is called
3. emitState(PLAYING) is called
4. Progress timer is started
```

**Stop:**
```
1. stop() is called
2. isInErrorState and lastEmittedState are reset
3. MediaBrowser.stop() is called
4. currentTrack is set to null
5. emitState(STOPPED) is called
6. Progress timer is stopped
7. Player resources are released
8. Playback service is stopped
```

**Seeking:**
```
1. seekTo/seekForward/seekBack is called
2. pendingSeek flags are set
3. MediaBrowser.seekTo() is called
4. Seek timeout is started
5. onPositionDiscontinuity is called when seek completes
6. SEEK_COMPLETE event is emitted
7. pendingSeek flags are reset
```

**Error Handling:**
```
1. onPlayerError is called with error details
2. isInErrorState is set to true
3. emitError() is called with error message
4. emitState(ERROR) is called
5. Playback service is stopped
```

### Method Implementation Details

#### `play(track: ReadableMap, options: ReadableMap)`

**Internal Changes:**
- Resets error state and last emitted state
- Sets current track
- Configures content type, debug mode, and playback speed
- Processes custom headers
- Creates a MediaItem with track metadata
- Prepares the player and starts playback

**State Triggers:**
- Emits `STATE_LOADING` immediately
- Player listener will emit `STATE_PLAYING` when playback starts
- If autoplay is false, emits `STATE_PAUSED` instead

#### `pause()`

**Internal Changes:**
- Pauses the MediaBrowser
- Emits `STATE_PAUSED` with current position and duration

#### `resume()`

**Internal Changes:**
- Starts playback on the MediaBrowser
- Emits `STATE_PLAYING` with current position and duration

#### `stop()`

**Internal Changes:**
- Resets error state and last emitted state
- Stops the MediaBrowser
- Sets currentTrack to null
- Emits `STATE_STOPPED`
- Stops progress timer
- Releases resources
- Stops the playback service

#### `seekTo(position: Long)`

**Internal Changes:**
- Sets pendingSeek flags
- Calls MediaBrowser.seekTo()
- Starts seek timeout
- When seek completes, emits `SEEK_COMPLETE` event

#### Event Emission

The Android implementation emits events to JavaScript using the React Native event emitter:

```kotlin
private fun emitEvent(type: String, track: ReadableMap?, payload: WritableMap?) {
    val context = reactContext
    if (context is ReactApplicationContext) {
        val body = Arguments.createMap().apply {
            putString("type", type)
            if (track != null) {
                putMap("track", track.toHashMap().let { Arguments.makeNativeMap(it) })
            } else {
                putNull("track")
            }
            if (payload != null) {
                putMap("payload", payload)
            }
        }
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(AudioProModule.EVENT_NAME, body)
    }
}
```

### Edge Cases and Error Handling

- **Duplicate State Prevention**: Tracks `lastEmittedState` to prevent emitting the same state multiple times
- **Error State Management**: Uses `isInErrorState` flag to prevent normal state transitions after an error
- **Seek Timeout**: Implements a timeout mechanism for seek operations to ensure `SEEK_COMPLETE` is always emitted
- **State Validation**: Prevents certain operations when in `STOPPED` or `ERROR` states

## 3. iOS (Swift)

### Architecture Overview

The iOS implementation uses AVPlayer for audio playback and integrates with the iOS media system for lock screen controls and background playback.

### Key Components

- **AudioPro**: Main class that implements RCTEventEmitter and manages the player lifecycle
- **AVPlayer**: Core iOS audio playback engine
- **MPNowPlayingInfoCenter**: System service for lock screen media controls
- **MPRemoteCommandCenter**: Handles remote control events (headphones, CarPlay, etc.)

### State Machine

#### State Values

- `player`: AVPlayer instance for audio playback
- `currentTrack`: Currently playing track information
- `shouldBePlaying`: Flag indicating if playback should be active
- `isInErrorState`: Flag indicating if the player is in an error state
- `lastEmittedState`: Tracks the last state sent to JS to prevent duplicates
- `currentPlaybackSpeed`: Current playback speed factor

#### Lifecycle Events

**Initialization:**
```
1. AudioPro module is created
2. hasListeners is set to false (no event emission)
```

**Playback Start:**
```
1. play() is called with track data
2. isInErrorState and lastEmittedState are reset
3. currentTrack is set to the provided track
4. AVAudioSession is configured
5. sendStateEvent(STATE_LOADING) is called
6. shouldBePlaying is set based on autoplay option
7. MPNowPlayingInfoCenter is updated with track metadata
8. AVPlayer is created with the track URL
9. Observers are added for player status and rate
10. If autoplay is true, player.play() is called
11. When playback starts, sendPlayingStateEvent() is called
12. Progress timer is started
13. Artwork is loaded asynchronously and added to Now Playing info
```

**Pause/Resume:**
```
Pause:
1. pause() is called
2. shouldBePlaying is set to false
3. player.pause() is called
4. Progress timer is stopped
5. sendPausedStateEvent() is called
6. Now Playing info is updated with rate=0

Resume:
1. resume() is called
2. shouldBePlaying is set to true
3. player.play() is called
4. Now Playing info is updated with rate=1.0
5. Rate change will trigger KVO observer
6. sendPlayingStateEvent() is called
7. Progress timer is started
```

**Stop:**
```
1. stop() is called
2. isInErrorState and lastEmittedState are reset
3. shouldBePlaying is set to false
4. player.pause() is called
5. player.seek(to: .zero) is called
6. Progress timer is stopped
7. currentTrack is set to null
8. sendStoppedStateEvent() is called
9. Now Playing info is updated with time=0, rate=0
```

**Seeking:**
```
1. seekTo/seekForward/seekBack is called
2. performSeek() calculates the target position
3. beginSeeking() stops the progress timer
4. player.seek() is called with the target position
5. When seek completes, Now Playing info is updated
6. completeSeekingAndSendSeekCompleteNoticeEvent() is called
7. SEEK_COMPLETE event is emitted
8. If playing, progress timer is restarted
```

**Error Handling:**
```
1. onError() is called with error message
2. isInErrorState is set to true
3. PLAYBACK_ERROR event is emitted
4. STATE_ERROR state is emitted
5. Player is stopped without emitting STOPPED state
6. Now Playing info is cleared
7. Remote controls are removed
```

### Method Implementation Details

#### `play(track: NSDictionary, options: NSDictionary)`

**Internal Changes:**
- Resets error state and last emitted state
- Sets current track
- Configures AVAudioSession
- Emits `STATE_LOADING`
- Updates Now Playing info with track metadata
- Sets up remote transport controls
- Creates AVPlayer with track URL
- Adds observers for player status and rate
- Starts playback if autoplay is true
- Loads artwork asynchronously

**Audio Session Configuration:**
```swift
let contentType = options["contentType"] as? String ?? "MUSIC"
let mode: AVAudioSession.Mode = (contentType == "SPEECH") ? .spokenAudio : .default
try AVAudioSession.sharedInstance().setCategory(.playback, mode: mode)
try AVAudioSession.sharedInstance().setActive(true)
```

#### `pause()`

**Internal Changes:**
- Sets shouldBePlaying to false
- Pauses the AVPlayer
- Stops the progress timer
- Emits `STATE_PAUSED`
- Updates Now Playing info with rate=0

#### `resume()`

**Internal Changes:**
- Sets shouldBePlaying to true
- Starts playback on the AVPlayer
- Updates Now Playing info with current time and rate=1.0
- Rate change will trigger KVO observer which emits `STATE_PLAYING`

#### `stop()`

**Internal Changes:**
- Resets error state and last emitted state
- Sets shouldBePlaying to false
- Pauses the AVPlayer and seeks to position zero
- Sets currentTrack to null
- Emits `STATE_STOPPED`
- Updates Now Playing info with time=0, rate=0

#### `setPlaybackSpeed(speed: Double)`

**Internal Changes:**
- Sets currentPlaybackSpeed
- Sets AVPlayer.rate to the new speed
- Updates Now Playing info with the new rate
- Emits `PLAYBACK_SPEED_CHANGED` event

#### Event Emission

The iOS implementation emits events to JavaScript using the RCTEventEmitter:

```swift
private func sendEvent(type: String, track: Any?, payload: [String: Any]?) {
    guard hasListeners else { return }

    var body: [String: Any] = [
        "type": type,
        "track": track as Any
    ]

    if let payload = payload {
        body["payload"] = payload
    }

    sendEvent(withName: EVENT_NAME, body: body)
}
```

### iOS-Specific Features

#### Lock Screen Controls

The iOS implementation integrates with MPNowPlayingInfoCenter and MPRemoteCommandCenter to provide lock screen media controls:

```swift
private func setupRemoteTransportControls() {
    let commandCenter = MPRemoteCommandCenter.shared()

    // Configure commands
    commandCenter.playCommand.isEnabled = true
    commandCenter.pauseCommand.isEnabled = true
    commandCenter.nextTrackCommand.isEnabled = true
    commandCenter.previousTrackCommand.isEnabled = true
    commandCenter.changePlaybackPositionCommand.isEnabled = true

    // Add targets
    commandCenter.playCommand.addTarget { [weak self] _ in
        self?.resume()
        return .success
    }

    // ... other commands
}
```

#### Background Playback

iOS background playback is enabled through proper AVAudioSession configuration:

```swift
try AVAudioSession.sharedInstance().setCategory(.playback, mode: mode)
try AVAudioSession.sharedInstance().setActive(true)
```

#### Artwork Handling

The iOS implementation loads artwork asynchronously and updates the Now Playing info:

```swift
DispatchQueue.global().async {
    do {
        // Load artwork with or without headers
        let data = try Data(contentsOf: artworkUrl)
        guard let image = UIImage(data: data) else {
            throw NSError(domain: "AudioPro", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])
        }
        let mpmArtwork = MPMediaItemArtwork(boundsSize: image.size, requestHandler: { _ in image })
        DispatchQueue.main.async {
            var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
            currentInfo[MPMediaItemPropertyArtwork] = mpmArtwork
            MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
        }
    } catch {
        // Handle error
    }
}
```

## State Synchronization Between Layers

### JS to Native

1. JS layer calls methods on the native module (e.g., `NativeAudioPro.play()`)
2. Native implementation executes the requested operation
3. Native layer emits events back to JS with updated state

### Native to JS

1. Native layer detects state changes (playback started, error occurred, etc.)
2. Native layer emits events to JS via the event emitter
3. JS layer receives events and updates the internal store
4. React components are updated with the new state via the `useAudioPro` hook

### State Caching

- **JS Layer**: Caches all state in the Zustand store
- **Android**: Caches state in the `AudioProController` singleton
- **iOS**: Caches state in the `AudioPro` instance

### Timeline of a Typical Playback Sequence

1. **JS**: `AudioPro.play(track)` is called
2. **JS**: Track is validated and prepared
3. **JS**: `trackPlaying` is set in the store
4. **JS**: `NativeAudioPro.play(track, options)` is called
5. **Native**: Receives play command with track data
6. **Native**: Emits `STATE_CHANGED` with `LOADING` state
7. **JS**: Updates `playerState` to `LOADING`
8. **Native**: Prepares media player and starts loading
9. **Native**: When ready, starts playback
10. **Native**: Emits `STATE_CHANGED` with `PLAYING` state
11. **JS**: Updates `playerState` to `PLAYING`
12. **Native**: Begins emitting `PROGRESS` events every second
13. **JS**: Updates `position` and `duration` in the store

This synchronization ensures that all three layers maintain a consistent view of the player state, with the native implementations handling platform-specific details while the JS layer provides a unified API.
