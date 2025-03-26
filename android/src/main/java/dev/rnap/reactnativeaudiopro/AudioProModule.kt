package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.os.Handler
import android.os.Looper

class AudioProModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    lateinit var reactContext: ReactApplicationContext

    const val STATE_EVENT_NAME = "AudioProStateEvent"
    const val STATE_PLAYING = "PLAYING"
    const val STATE_PAUSED = "PAUSED"
    const val STATE_STOPPED = "STOPPED"

    const val NOTICE_EVENT_NAME = "AudioProNoticeEvent"
    const val NOTICE_SEEK_COMPLETE = "SEEK_COMPLETE"
    const val NOTICE_TRACK_ENDED = "TRACK_ENDED"
    const val NOTICE_PROGRESS = "PROGRESS"
  }

  private var progressHandler: Handler? = null
  private var progressRunnable: Runnable? = null

  init {
    AudioProModule.reactContext = reactContext
    AudioProPlayer.initialize(reactContext)
    AudioProPlayer.trackEndedCallback = {
      AudioProPlayer.getDuration { duration ->
        sendNoticeEvent(NOTICE_TRACK_ENDED, duration, duration)
        stop()
      }
    }
  }

  override fun getName(): String {
    return "AudioPro"
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  private fun sendStateEvent(state: String, position: Long, duration: Long) {
    val eventBody: WritableMap = Arguments.createMap()
    eventBody.putString("state", state)
    eventBody.putDouble("position", position.toDouble())
    eventBody.putDouble("duration", duration.toDouble())
    sendEvent(STATE_EVENT_NAME, eventBody)
  }

  private fun sendNoticeEvent(notice: String, position: Long, duration: Long) {
    val eventBody: WritableMap = Arguments.createMap()
    eventBody.putString("notice", notice)
    eventBody.putDouble("position", position.toDouble())
    eventBody.putDouble("duration", duration.toDouble())
    sendEvent(NOTICE_EVENT_NAME, eventBody)
  }

  private fun startProgressTimer() {
    stopProgressTimer() // Ensure any existing timer is stopped
    progressHandler = Handler(Looper.getMainLooper())
    progressRunnable = object : Runnable {
      override fun run() {
        AudioProPlayer.getCurrentPosition { pos ->
          AudioProPlayer.getDuration { dur ->
            sendNoticeEvent(NOTICE_PROGRESS, pos, dur)
            progressRunnable?.let { progressHandler?.postDelayed(it, 1000) }
          }
        }
      }
    }
    progressRunnable?.let { progressHandler?.postDelayed(it, 1000) }
  }

  private fun stopProgressTimer() {
    val runnable = progressRunnable
    if (runnable != null) {
      progressHandler?.removeCallbacks(runnable)
    }
    progressHandler = null
    progressRunnable = null
  }

  @ReactMethod
  fun play(track: ReadableMap) {
    AudioProPlayer.play(track)
    sendStateEvent(STATE_PLAYING, 0, 0)
    startProgressTimer()
  }

  @ReactMethod
  fun pause() {
    AudioProPlayer.pause()
    AudioProPlayer.getCurrentPosition { position ->
      AudioProPlayer.getDuration { duration ->
        sendStateEvent(STATE_PAUSED, position, duration)
      }
    }
    stopProgressTimer()
  }

  @ReactMethod
  fun resume() {
    AudioProPlayer.resume()
    AudioProPlayer.getCurrentPosition { position ->
      AudioProPlayer.getDuration { duration ->
        sendStateEvent(STATE_PLAYING, position, duration)
      }
    }
    startProgressTimer()
  }

  @ReactMethod
  fun stop() {
    AudioProPlayer.stop()
    AudioProPlayer.getDuration { duration ->
      sendStateEvent(STATE_STOPPED, 0L, duration)
    }
    stopProgressTimer()
  }

  @ReactMethod
  fun seekTo(position: Double) {
    AudioProPlayer.seekTo(position.toLong())
    AudioProPlayer.getCurrentPosition { pos ->
      AudioProPlayer.getDuration { dur ->
        sendNoticeEvent(NOTICE_SEEK_COMPLETE, pos, dur)
      }
    }
  }

  @ReactMethod
  fun seekForward(amount: Double) {
    AudioProPlayer.seekForward(amount.toLong())
    AudioProPlayer.getCurrentPosition { pos ->
      AudioProPlayer.getDuration { dur ->
        sendNoticeEvent(NOTICE_SEEK_COMPLETE, pos, dur)
      }
    }
  }

  @ReactMethod
  fun seekBack(amount: Double) {
    AudioProPlayer.seekBack(amount.toLong())
    AudioProPlayer.getCurrentPosition { pos ->
      AudioProPlayer.getDuration { dur ->
        sendNoticeEvent(NOTICE_SEEK_COMPLETE, pos, dur)
      }
    }
  }
}
