package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

class AudioProModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val audioPlayer = AudioPlayer(reactContext)

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

    @ReactMethod
    fun play(url: String) {
        audioPlayer.play(url)
        sendEvent(EVENT_IS_PLAYING)
    }

    @ReactMethod
    fun pause() {
        audioPlayer.pause()
        sendEvent(EVENT_IS_PAUSED)
    }

    @ReactMethod
    fun resume() {
        audioPlayer.resume()
        sendEvent(EVENT_IS_PLAYING)
    }

    @ReactMethod
    fun stop() {
        audioPlayer.stop()
        sendEvent(EVENT_IS_STOPPED)
    }

    companion object {
        const val EVENT_IS_PLAYING = "IsPlaying"
        const val EVENT_IS_PAUSED = "IsPaused"
        const val EVENT_IS_STOPPED = "IsStopped"
        const val NAME = "AudioPro"
    }
}
