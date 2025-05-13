package dev.rnap.reactnativeaudiopro

import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.net.toUri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * AmbientAudioController
 *
 * A completely isolated controller for ambient audio playback.
 * This controller is separate from the main AudioProController and does not
 * share any state, events, or resources with it.
 */
object AmbientAudioController {
    private const val TAG = "AudioPro-Ambient"
    private const val AMBIENT_EVENT_NAME = "AudioProAmbientEvent"
    private const val EVENT_TYPE_AMBIENT_TRACK_ENDED = "AMBIENT_TRACK_ENDED"
    private const val EVENT_TYPE_AMBIENT_ERROR = "AMBIENT_ERROR"

    private var reactContext: ReactApplicationContext? = null
    private var player: ExoPlayer? = null
    private var ambientListener: Player.Listener? = null
    private var optionDebug: Boolean = false
    private var optionAmbientLoop: Boolean = true
    private var optionAmbientVolume: Float = 1.0f

    /**
     * Set the React context
     */
    fun setReactContext(context: ReactApplicationContext) {
        reactContext = context
    }

    /**
     * Log a message if debug is enabled
     */
    private fun log(vararg args: Any?) {
        if (optionDebug) {
            Log.d(TAG, "~~~ ${args.joinToString(" ")}")
        }
    }

    /**
     * Play an ambient audio track
     */
    fun ambientPlay(options: ReadableMap) {
        val optionUrl = options.getString("url") ?: run {
            emitAmbientError("Invalid URL provided to ambientPlay()")
            return
        }

        if (options.hasKey("volume")) optionAmbientVolume = options.getDouble("volume").toFloat()
        if (options.hasKey("debug"))   optionDebug        = options.getBoolean("debug")

        // Get loop option, default to true if not provided
        val optionLoop = if (options.hasKey("loop")) options.getBoolean("loop") else true
        optionAmbientLoop = optionLoop

        // Log all options for debugging
        log("Ambient options parsed:",
            "url=$optionUrl",
            "loop=$optionLoop"
        )

        // Stop any existing ambient playback
        ambientStop()

        // Create a new player
        val context = reactContext ?: run {
            emitAmbientError("React context is not set")
            return
        }

        runOnUiThread {
            player = ExoPlayer.Builder(context).build().apply {
                // Set up player
                repeatMode = if (optionAmbientLoop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
                volume = optionAmbientVolume

                // Set up listener
                ambientListener = object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        if (state == Player.STATE_ENDED && !optionAmbientLoop) {
                            // If playback ended and loop is disabled, emit event and clean up
                            emitAmbientTrackEnded()
                            ambientStop()
                        }
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        emitAmbientError(error.message ?: "Unknown ambient playback error")
                        ambientStop()
                    }
                }
                addListener(ambientListener!!)

                // Prepare media item
                // Parse the URL string into a Uri object to properly handle all URI schemes including file://
                val uri = android.net.Uri.parse(optionUrl)
                log("Parsed ambient URI: $uri, scheme: ${uri.scheme}")

                val mediaItem = MediaItem.Builder()
                    .setUri(uri)
                    .build()

                setMediaItem(mediaItem)
                prepare()
                play()
            }
        }
    }

    /**
     * Stop ambient audio playback
     */
    fun ambientStop() {
        log("Ambient Stop")

        runOnUiThread {
            player?.let { exo ->
                ambientListener?.let { exo.removeListener(it) }
                exo.stop()
                exo.release()
            }
            player = null
            ambientListener = null
        }
    }

    /**
     * Pause ambient audio playback
     * No-op if already paused or not playing
     */
    fun ambientPause() {
        log("Ambient Pause")

        runOnUiThread {
            player?.pause()
        }
    }

    /**
     * Resume ambient audio playback
     * No-op if already playing or no active track
     */
    fun ambientResume() {
        log("Ambient Resume")

        runOnUiThread {
            player?.play()
        }
    }

    /**
     * Seek to position in ambient audio track
     * Silently ignore if not supported or no active track
     *
     * @param positionMs Position in milliseconds
     */
    fun ambientSeekTo(positionMs: Long) {
        log("Ambient Seek To", positionMs)

        runOnUiThread {
            player?.seekTo(positionMs)
        }
    }

    /**
     * Set the volume of ambient audio playback
     */
    fun ambientSetVolume(volume: Float) {
        optionAmbientVolume = volume
        log("Ambient Set Volume", optionAmbientVolume)

        runOnUiThread {
            player?.volume = optionAmbientVolume
        }
    }

    /**
     * Emit an ambient track ended event
     */
    private fun emitAmbientTrackEnded() {
        log("Ambient Track Ended")
        emitAmbientEvent(EVENT_TYPE_AMBIENT_TRACK_ENDED, null)
    }

    /**
     * Emit an ambient error event
     */
    private fun emitAmbientError(message: String) {
        log("Ambient Error:", message)

        val payload = Arguments.createMap().apply {
            putString("error", message)
        }

        emitAmbientEvent(EVENT_TYPE_AMBIENT_ERROR, payload)
    }

    /**
     * Emit an ambient event
     */
    private fun emitAmbientEvent(type: String, payload: WritableMap?) {
        val context = reactContext
        if (context is ReactApplicationContext) {
            val body = Arguments.createMap().apply {
                putString("type", type)

                if (payload != null) {
                    putMap("payload", payload)
                }
            }

            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(AMBIENT_EVENT_NAME, body)
        } else {
            Log.w(TAG, "Context is not an instance of ReactApplicationContext")
        }
    }

    /**
     * Run a block on the UI thread
     */
    private fun runOnUiThread(block: () -> Unit) {
        Handler(Looper.getMainLooper()).post(block)
    }
}
