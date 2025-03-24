package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReadableMap
import android.os.Handler
import android.os.Looper
import android.content.Intent

class AudioProModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val audioPlayer = AudioPlayer(reactContext)
    private var timingHandler: Handler? = null
    private var timingRunnable: Runnable? = null

    override fun getName(): String {
        return NAME
    }

    private fun sendEvent(state: String, errorMessage: String? = null) {
        val params: WritableMap = Arguments.createMap()
        params.putString("state", state)
        if (errorMessage != null) {
            params.putString("error", errorMessage)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AudioProEvent", params)
    }

    private fun sendTimingEvent() {
        val params: WritableMap = Arguments.createMap()
        params.putString("state", EVENT_PLAYING)

        val position = audioPlayer.getCurrentPosition().coerceAtLeast(0)
        val duration = audioPlayer.getDuration().coerceAtLeast(0)
        params.putInt("position", Math.round(position.toFloat()))
        params.putInt("duration", Math.round(duration.toFloat()))

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AudioProEvent", params)
    }

    private fun startTimingUpdates() {
        if (timingHandler == null) {
            timingHandler = Handler(Looper.myLooper() ?: Looper.getMainLooper())
        }
        if (timingRunnable == null) {
            timingRunnable = object : Runnable {
                override fun run() {
                    sendTimingEvent()
                    timingHandler?.postDelayed(this, 1000)
                }
            }
        }
        timingHandler?.post(timingRunnable!!)
    }

    private fun stopTimingUpdates() {
        timingRunnable?.let { timingHandler?.removeCallbacks(it) }
        timingRunnable = null
    }

    @ReactMethod
    fun play(track: ReadableMap) {
        val url = if (track.hasKey("url")) track.getString("url") else null
        val title = if (track.hasKey("title")) track.getString("title") else null
        val artwork = if (track.hasKey("artwork")) track.getString("artwork") else null
        val album = if (track.hasKey("album")) track.getString("album") else null
        val artist = if (track.hasKey("artist")) track.getString("artist") else null

        if (url == null || title == null || artwork == null) {
            sendEvent(EVENT_ERROR, "Invalid track data")
            stop()
            return
        }

        val trackObj = Track(url, title, artwork, album, artist)
        audioPlayer.play(trackObj)

        val params: WritableMap = Arguments.createMap()
        params.putString("state", EVENT_PLAYING)
        val position = audioPlayer.getCurrentPosition().coerceAtLeast(0)
        val duration = audioPlayer.getDuration().coerceAtLeast(0)
        params.putInt("position", Math.round(position.toFloat()))
        params.putInt("duration", Math.round(duration.toFloat()))
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AudioProEvent", params)

        startTimingUpdates()
    }

    @ReactMethod
    fun pause() {
        audioPlayer.pause()
        sendEvent(EVENT_PAUSED)
        stopTimingUpdates()
    }

    @ReactMethod
    fun resume() {
        audioPlayer.resume()
        sendEvent(EVENT_PLAYING)
        startTimingUpdates()
    }

    @ReactMethod
    fun stop() {
        audioPlayer.stop()
        sendEvent(EVENT_STOPPED)
        audioPlayer.stopForegroundNotification()
        stopTimingUpdates()
    }

    companion object {
        const val EVENT_PLAYING = "playing"
        const val EVENT_PAUSED = "paused"
        const val EVENT_STOPPED = "stopped"
        const val EVENT_ERROR = "error"
        const val NAME = "AudioPro"
    }
}
