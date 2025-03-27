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
import androidx.media3.common.util.UnstableApi

@UnstableApi
class AudioProModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    lateinit var reactContext: ReactApplicationContext

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
    const val GENERIC_ERROR_CODE = 1000
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
    AudioProPlayer.playbackStateChangedCallback = { state, playWhenReady ->
      AudioProPlayer.getCurrentPosition { position ->
        AudioProPlayer.getDuration { duration ->
          when (state) {
            androidx.media3.common.Player.STATE_BUFFERING -> {
              sendStateEvent(STATE_LOADING, position, duration)
            }

            androidx.media3.common.Player.STATE_READY -> {
              if (playWhenReady) {
                sendStateEvent(STATE_PLAYING, position, duration)
                startProgressTimer()
              } else {
                sendStateEvent(STATE_PAUSED, position, duration)
                stopProgressTimer()
              }
            }

            androidx.media3.common.Player.STATE_IDLE -> {
              sendStateEvent(STATE_STOPPED, position, duration)
              stopProgressTimer()
            }
          }
        }
      }
    }
    AudioProPlayer.playbackErrorCallback = { errorMessage, errorCode ->
      sendErrorEvent(errorMessage, errorCode)
      cleanup()
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

  private fun sendErrorEvent(errorMessage: String, errorCode: Int) {
    val eventBody: WritableMap = Arguments.createMap()
    eventBody.putString("notice", NOTICE_PLAYBACK_ERROR)
    eventBody.putString("error", errorMessage)
    eventBody.putInt("errorCode", errorCode)
    sendEvent(NOTICE_EVENT_NAME, eventBody)
  }

  private fun startProgressTimer() {
    stopProgressTimer()
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

  private fun cleanup() {
    AudioProPlayer.stop()
    stopProgressTimer()
    sendStateEvent(STATE_STOPPED, 0L, 0L)
  }

  @ReactMethod
  fun play(track: ReadableMap) {
    AudioProPlayer.play(track)
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
