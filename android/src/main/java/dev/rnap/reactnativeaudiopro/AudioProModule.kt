package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class AudioProModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        AudioPlayer.initialize(reactContext, reactContext)
    }

    override fun getName(): String {
        return "AudioPro"
    }

    @ReactMethod
    fun play(track: ReadableMap) {
        val url = track.getString("url") ?: return
        val title = track.getString("title") ?: ""
        val artwork = track.getString("artwork") ?: ""
        val album = if (track.hasKey("album")) track.getString("album") else null
        val artist = if (track.hasKey("artist")) track.getString("artist") else null

        val audioTrack = AudioProTrack(
            url = url,
            title = title,
            artwork = artwork,
            album = album,
            artist = artist
        )
        AudioPlayer.play(audioTrack)
    }

    @ReactMethod
    fun pause() {
        AudioPlayer.pause()
    }

    @ReactMethod
    fun resume() {
        AudioPlayer.resume()
    }

    @ReactMethod
    fun stop() {
        AudioPlayer.stop()
    }

    @ReactMethod
    fun seekTo(position: Double) {
        AudioPlayer.seekTo(position.toLong())
    }

    @ReactMethod
    fun seekForward(amount: Double) {
        AudioPlayer.seekForward(amount.toLong())
    }

    @ReactMethod
    fun seekBack(amount: Double) {
        AudioPlayer.seekBack(amount.toLong())
    }
}
