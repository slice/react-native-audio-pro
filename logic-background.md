# Background Audio Logic

## Overview

Background audio provides a minimal, isolated layer for ambient or looping audio in `react-native-audio-pro`. It is designed to **play a second audio track independently** of the main playback system — with no cross-interference, minimal API, and fully separate internal implementation.

## Key Principles

- **Fully isolated implementation**: background audio logic must be **completely separate** from main playback logic, both architecturally and in code organization.
  - No shared variables, player instances, or event emitters.
  - All function names, variables, and event keys must be **clearly prefixed** with `background`.
- **Auto-plays** immediately when `backgroundPlay()` is called.
- **Loops by default** unless `loop: false` is explicitly set.
- **No state tracking** — background audio does not track volume, progress, or playback state.
- **No volume getter**, state queries, or progress tracking.
- **All cleanup is internal** — calling `backgroundStop()` or letting playback end (if `loop: false`) tears down the player.
- **Main player has no effect** on background audio: `play()`, `pause()`, `stop()`, `clear()` do **not** interact with it.

## API

### Methods

| Method                   | Arguments                                 | Return Type | Description                                                   |
|--------------------------|-------------------------------------------|-------------|---------------------------------------------------------------|
| `backgroundPlay(options)`| `{ url: string; loop?: boolean }`         | `void`      | Plays a background track in loop mode by default.             |
| `backgroundStop()`       | None                                      | `void`      | Stops and tears down background playback.                     |
| `setBackgroundVolume()`  | `value: number` (0.0 to 1.0)               | `void`      | Sets the background track's volume. No getter.                |

### Notes:
- `loop` defaults to `true`.
- Volume is **not tracked** — this is a direct setter that applies at the time of call.

## Events

Emitted on a **separate emitter key**: `AudioProBackgroundEvent`

| Event Type               | Payload              | Description                              |
|--------------------------|----------------------|------------------------------------------|
| `BACKGROUND_TRACK_ENDED`| `{}`                 | Emitted when the background track ends and `loop` is `false`. |
| `BACKGROUND_ERROR`       | `{ error: string }`  | Emitted on playback error. Automatically triggers internal cleanup (same behavior as backgroundStop()). |

### Listening Example

```ts
import { NativeEventEmitter, NativeModules } from 'react-native';

const backgroundEmitter = new NativeEventEmitter(NativeModules.AudioPro);

backgroundEmitter.addListener('AudioProBackgroundEvent', (event) => {
  if (event.type === 'BACKGROUND_TRACK_ENDED') {
    // handle background end
  }
});
```

## Example App

- One `Play Background` button calls `backgroundPlay({ url })`.
- One `Stop Background` button calls `backgroundStop()`.

No other UI or logic is required.

## Behavior on Track End

If `loop` is `false`, background playback will:

- **Automatically stop**
- **Emit `BACKGROUND_TRACK_ENDED`**
- **Fully tear down and release all audio resources**

## Behavior on Playback Error

If a background playback error occurs, the player will:

- **Emit `BACKGROUND_ERROR`**
- **Automatically stop and clean up background playback**
- **Release all resources associated with the background track**

This ensures no lingering playback continues after failure.
