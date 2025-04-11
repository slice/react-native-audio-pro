package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.LifecycleEventListener
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AudioProModule(private val reactContext: ReactApplicationContext) :
	ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

	companion object {
		const val NAME = "AudioPro"

		const val EVENT_NAME = "AudioProEvent"

		const val STATE_PLAYING = "PLAYING"
		const val STATE_PAUSED = "PAUSED"
		const val STATE_STOPPED = "STOPPED"
		const val STATE_LOADING = "LOADING"
		const val STATE_ERROR = "ERROR"

		const val EVENT_TYPE_STATE_CHANGED = "STATE_CHANGED"
		const val EVENT_TYPE_TRACK_ENDED = "TRACK_ENDED"
		const val EVENT_TYPE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
		const val EVENT_TYPE_PROGRESS = "PROGRESS"
		const val EVENT_TYPE_SEEK_COMPLETE = "SEEK_COMPLETE"
		const val EVENT_TYPE_REMOTE_NEXT = "REMOTE_NEXT"
		const val EVENT_TYPE_REMOTE_PREV = "REMOTE_PREV"
		const val EVENT_TYPE_PLAYBACK_SPEED_CHANGED = "PLAYBACK_SPEED_CHANGED"
	}

	init {
		AudioProController.setReactContext(reactContext)
		// Register for lifecycle events
		reactContext.addLifecycleEventListener(this)
	}

	@ReactMethod
	fun play(track: ReadableMap, options: ReadableMap) {
		CoroutineScope(Dispatchers.Main).launch {
			AudioProController.play(track, options)
		}
	}

	@ReactMethod
	fun pause() {
		AudioProController.pause()
	}

	@ReactMethod
	fun resume() {
		AudioProController.resume()
	}

	@ReactMethod
	fun stop() {
		AudioProController.stop()
	}

	@ReactMethod
	fun seekTo(position: Double) {
		AudioProController.seekTo(position.toLong())
	}

	@ReactMethod
	fun seekForward(amount: Double) {
		AudioProController.seekForward(amount.toLong())
	}

	@ReactMethod
	fun seekBack(amount: Double) {
		AudioProController.seekBack(amount.toLong())
	}

	@ReactMethod
	fun setPlaybackSpeed(speed: Double) {
		AudioProController.setPlaybackSpeed(speed.toFloat())
	}

	override fun getName(): String {
		return NAME
	}

	// LifecycleEventListener methods
	override fun onHostResume() {} // Not used, but required by interface

	override fun onHostPause() {} // Not used, but required by interface

	override fun onHostDestroy() {
		// App is being destroyed
		Log.d("AudioProModule", "App is being destroyed, stopping playback")

		// Stop playback and service using the central method
		AudioProController.stop()
	}

	override fun onCatalystInstanceDestroy() {
		// React Native bridge is being destroyed
		Log.d("AudioProModule", "React Native bridge is being destroyed, stopping playback")

		// Stop playback and service using the central method
		AudioProController.stop()

		// Remove lifecycle listener
		try {
			reactContext.removeLifecycleEventListener(this)
		} catch (e: Exception) {
			Log.e("AudioProModule", "Error removing lifecycle listener", e)
		}

		super.onCatalystInstanceDestroy()
	}
}
