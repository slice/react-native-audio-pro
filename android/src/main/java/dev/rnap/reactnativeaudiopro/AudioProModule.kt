package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AudioProModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "AudioPro"

    const val STATE_EVENT_NAME = "AudioProStateEvent"
    const val STATE_PLAYING = "PLAYING"
    const val STATE_PAUSED = "PAUSED"
    const val STATE_STOPPED = "STOPPED"
    const val STATE_LOADING = "LOADING"

    const val NOTICE_EVENT_NAME = "AudioProNoticeEvent"
    const val NOTICE_SEEK_COMPLETE = "SEEK_COMPLETE"
    const val NOTICE_TRACK_ENDED = "TRACK_ENDED"
    const val NOTICE_PROGRESS = "PROGRESS"
    const val NOTICE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
  }

  @ReactMethod
  fun init() {
    AudioProController.init(reactApplicationContext)
  }

  @ReactMethod
  fun play(url: String) {
    CoroutineScope(Dispatchers.Main).launch {
      AudioProController.play(reactApplicationContext, url, "Unknown", "Unknown")
    }
  }

  @ReactMethod
  fun pause() {
    AudioProController.pause(reactApplicationContext)
  }

  @ReactMethod
  fun resume() {
    AudioProController.resume(reactApplicationContext)
  }

  @ReactMethod
  fun release() {
    AudioProController.release()
  }

  override fun getName(): String {
    return NAME
  }
}
