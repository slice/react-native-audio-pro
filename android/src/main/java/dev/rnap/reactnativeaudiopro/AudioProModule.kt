package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import android.os.Handler
import android.os.Looper

class AudioProModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val audioPlayer = AudioPlayer(reactContext)
    private var timingHandler: Handler? = null
    private var timingRunnable: Runnable? = null

    override fun getName(): String {
        return NAME
    }

    private fun sendEvent(state: String) {
        val params: WritableMap = Arguments.createMap()
        params.putString("state", state)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AudioProEvent", params)
    }

    private fun sendTimingEvent() {
        val params: WritableMap = Arguments.createMap()
        // ExoPlayer returns milliseconds as Long; convert to Int if needed.
        params.putString("state", EVENT_IS_PLAYING)

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
    fun play(url: String) {
        audioPlayer.play(url)
        sendEvent(EVENT_IS_PLAYING)
        startTimingUpdates()
    }

    @ReactMethod
    fun pause() {
        audioPlayer.pause()
        sendEvent(EVENT_IS_PAUSED)
        stopTimingUpdates()
    }

    @ReactMethod
    fun resume() {
        audioPlayer.resume()
        sendEvent(EVENT_IS_PLAYING)
        startTimingUpdates()
    }

    @ReactMethod
    fun stop() {
        audioPlayer.stop()
        sendEvent(EVENT_IS_STOPPED)
        stopTimingUpdates()
    }

    companion object {
        const val EVENT_IS_PLAYING = "IsPlaying"
        const val EVENT_IS_PAUSED = "IsPaused"
        const val EVENT_IS_STOPPED = "IsStopped"
        const val NAME = "AudioPro"
    }
}
