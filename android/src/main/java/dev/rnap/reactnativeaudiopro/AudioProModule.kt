package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AudioProModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val audioPlayer = AudioPlayer(reactContext)

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun play(url: String) {
        audioPlayer.play(url)
    }

    @ReactMethod
    fun pause() {
        audioPlayer.pause()
    }

    @ReactMethod
    fun resume() {
        audioPlayer.resume()
    }

    companion object {
        const val NAME = "AudioPro"
    }
}
