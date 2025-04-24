package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.net.toUri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.session.MediaBrowser
import androidx.media3.session.SessionToken
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.guava.await

object AudioProController {
	private lateinit var browserFuture: ListenableFuture<MediaBrowser>
	private var browser: MediaBrowser? = null
	private var progressHandler: Handler? = null
	private var progressRunnable: Runnable? = null
	var audioContentType: Int = C.AUDIO_CONTENT_TYPE_MUSIC
	private var debug: Boolean = false
	private var debugIncludesProgress: Boolean = false
	private var reactContext: ReactApplicationContext? = null
	private var playerListener: Player.Listener? = null
	private var lastEmittedState: String = ""
	private var currentPlaybackSpeed: Float = 1.0f
	private var currentTrack: ReadableMap? = null
	private var isInErrorState: Boolean = false
	var audioHeaders: Map<String, String>? = null
	var artworkHeaders: Map<String, String>? = null

	// Variables to track seek operations
	private var pendingSeek: Boolean = false
	private var pendingSeekPosition: Long = 0
	private var pendingSeekDuration: Long = 0
	private var seekTimeoutHandler: Handler? = null
	private var seekTimeoutRunnable: Runnable? = null
	private val SEEK_TIMEOUT_MS = 1000L // 1 second timeout for seek operations

	private fun log(vararg args: Any?) {
		if (debug) {
			// Skip logging PROGRESS events if debugIncludesProgress is false
			if (!debugIncludesProgress && args.isNotEmpty() && args[0] == AudioProModule.EVENT_TYPE_PROGRESS) {
				return
			}
			Log.d("AudioPro", "~~~ ${args.joinToString(" ")}")
		}
	}

	fun setReactContext(context: ReactApplicationContext) {
		reactContext = context
	}

	private fun ensureSession() {
		if (!::browserFuture.isInitialized || browser == null) {
			CoroutineScope(Dispatchers.Main).launch {
				internalPrepareSession()
			}
		}
	}

	private suspend fun internalPrepareSession() {
		log("Preparing MediaBrowser session")
		val token =
			SessionToken(
				reactContext!!,
				ComponentName(reactContext!!, AudioProPlaybackService::class.java)
			)
		browserFuture = MediaBrowser.Builder(reactContext!!, token).buildAsync()
		browser = browserFuture.await()
		attachPlayerListener()
		log("MediaBrowser is ready")
	}

	suspend fun play(track: ReadableMap, options: ReadableMap) {
		// Reset error state when playing a new track
		isInErrorState = false
		// Reset last emitted state when playing a new track
		lastEmittedState = ""
		currentTrack = track
		val contentType = if (options.hasKey("contentType")) {
			options.getString("contentType") ?: "MUSIC"
		} else "MUSIC"
		val enableDebug = options.hasKey("debug") && options.getBoolean("debug")
		val includeProgressInDebug = options.hasKey("debugIncludesProgress") && options.getBoolean("debugIncludesProgress")
		val speed = if (options.hasKey("playbackSpeed")) {
			options.getDouble("playbackSpeed").toFloat()
		} else 1.0f
		val autoplay = if (options.hasKey("autoplay")) {
			options.getBoolean("autoplay")
		} else true

		// Helper function to extract headers from a ReadableMap
		fun extractHeaders(headersMap: ReadableMap?): Map<String, String>? {
			if (headersMap == null) return null

			val headerMap = mutableMapOf<String, String>()
			val iterator = headersMap.keySetIterator()
			while (iterator.hasNextKey()) {
				val key = iterator.nextKey()
				val value = headersMap.getString(key)
				if (value != null) {
					headerMap[key] = value
				}
			}
			return if (headerMap.isNotEmpty()) headerMap else null
		}

		// Process custom headers if provided
		audioHeaders = null
		artworkHeaders = null
		if (options.hasKey("headers")) {
			val headers = options.getMap("headers")
			if (headers != null) {
				// Process audio headers
				if (headers.hasKey("audio")) {
					audioHeaders = extractHeaders(headers.getMap("audio"))?.also {
						log("Custom audio headers provided: $it")
					}
				}

				// Process artwork headers
				if (headers.hasKey("artwork")) {
					artworkHeaders = extractHeaders(headers.getMap("artwork"))?.also {
						log("Custom artwork headers provided: $it")
					}
				}
			}
		}

		debug = enableDebug
		debugIncludesProgress = includeProgressInDebug
		audioContentType = when (contentType) {
			"SPEECH" -> C.AUDIO_CONTENT_TYPE_SPEECH
			else -> C.AUDIO_CONTENT_TYPE_MUSIC
		}
		currentPlaybackSpeed = speed

		log("Configured with contentType=$contentType debug=$debug speed=$speed autoplay=$autoplay")

		internalPrepareSession()
		val url = track.getString("url") ?: run {
			log("Missing track URL")
			return
		}
		val title = track.getString("title") ?: "Unknown Title"
		val artist = track.getString("artist") ?: "Unknown Artist"
		val album = track.getString("album") ?: "Unknown Album"
		val artwork = track.getString("artwork")?.toUri()

		val metadataBuilder = MediaMetadata.Builder()
			.setTitle(title)
			.setArtist(artist)
			.setAlbumTitle(album)

		if (artwork != null) {
			metadataBuilder.setArtworkUri(artwork)
		}

		val mediaItem = MediaItem.Builder()
			.setUri(url)
			.setMediaId("custom_track_1")
			.setMediaMetadata(metadataBuilder.build())
			.build()

		runOnUiThread {
			log("Play", title, url)
			emitState(AudioProModule.STATE_LOADING, 0L, 0L)

			browser?.let {
				it.setMediaItem(mediaItem)
				it.prepare()
				// Set playback speed regardless of autoplay
				it.setPlaybackSpeed(currentPlaybackSpeed)

				if (autoplay) {
					it.play()
				} else {
					emitState(AudioProModule.STATE_PAUSED, 0L, 0L)
				}
			} ?: Log.w("AudioProController", "MediaBrowser not ready")
		}
	}

	fun pause() {
		ensureSession()
		runOnUiThread {
			browser?.pause()
			browser?.let {
				val pos = it.currentPosition
				val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
				emitState(AudioProModule.STATE_PAUSED, pos, dur)
			}
		}
	}

	fun resume() {
		ensureSession()
		runOnUiThread {
			browser?.play()
			browser?.let {
				val pos = it.currentPosition
				val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
				emitState(AudioProModule.STATE_PLAYING, pos, dur)
			}
		}
	}

	fun stop() {
		// Reset error state when explicitly stopping
		isInErrorState = false
		// Reset last emitted state when stopping playback
		lastEmittedState = ""
		ensureSession()
		runOnUiThread {
			detachPlayerListener()
			browser?.stop()
			browser?.let {
				val pos = it.currentPosition
				val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
				currentTrack = null
				emitState(AudioProModule.STATE_STOPPED, pos, dur)
			}
		}
		stopProgressTimer()

		// Cancel any pending seek operations
		cancelSeekTimeout()
		pendingSeek = false
		pendingSeekPosition = 0
		pendingSeekDuration = 0

		release()

		// Stop the service to remove notification
		stopPlaybackService()
	}

	/**
	 * Resets the player to IDLE state, fully tears down the player instance,
	 * and removes all media sessions.
	 */
	fun clear() {
		resetInternal(AudioProModule.STATE_IDLE)
	}

	/**
	 * Shared internal function that performs the teardown and emits the correct state.
	 * Used by both clear() and error transitions.
	 */
	private fun resetInternal(finalState: String) {
		// Reset error state
		isInErrorState = finalState != AudioProModule.STATE_ERROR
		// Reset last emitted state
		lastEmittedState = ""

		// Stop playback
		runOnUiThread {
			detachPlayerListener()
			browser?.stop()
		}

		// Clear track and stop timers
		currentTrack = null
		stopProgressTimer()

		// Cancel any pending seek operations
		cancelSeekTimeout()
		pendingSeek = false
		pendingSeekPosition = 0
		pendingSeekDuration = 0

		// Release resources
		release()

		// Stop the service to remove notification
		stopPlaybackService()

		// Emit the final state
		emitState(finalState, 0L, 0L)
	}

	fun release() {
		runOnUiThread {
			if (::browserFuture.isInitialized) {
				MediaBrowser.releaseFuture(browserFuture)
			}
			browser = null

			// Cancel any pending seek operations
			cancelSeekTimeout()
		}
	}

	/**
	 * Explicitly stops the AudioProPlaybackService to remove notification
	 * This is the central method for stopping the service and removing the notification
	 */
	fun stopPlaybackService() {
		log("Stopping AudioProPlaybackService")
		try {
			reactContext?.let { context ->
				// Try to cancel notification directly
				try {
					val notificationManager =
						context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
					notificationManager.cancel(789) // Using the same NOTIFICATION_ID as in AudioProPlaybackService
				} catch (e: Exception) {
					Log.e("AudioProController", "Error canceling notification", e)
				}

				// Stop the service
				val intent = android.content.Intent(context, AudioProPlaybackService::class.java)
				context.stopService(intent)
			}
		} catch (e: Exception) {
			Log.e("AudioProController", "Error stopping service", e)
		}
	}

	/**
	 * Helper method to start a seek timeout that will emit SEEK_COMPLETE if
	 * onPositionDiscontinuity is not called within the timeout period
	 */
	private fun startSeekTimeout() {
		// Cancel any existing timeout
		cancelSeekTimeout()

		// Create a new timeout
		seekTimeoutHandler = Handler(Looper.getMainLooper())
		seekTimeoutRunnable = Runnable {
			if (pendingSeek) {
				log("Seek timeout reached, emitting SEEK_COMPLETE")
				emitNotice(
					AudioProModule.EVENT_TYPE_SEEK_COMPLETE,
					pendingSeekPosition,
					pendingSeekDuration
				)
				pendingSeek = false
				pendingSeekPosition = 0
				pendingSeekDuration = 0
			}
		}

		// Schedule the timeout
		seekTimeoutRunnable?.let { seekTimeoutHandler?.postDelayed(it, SEEK_TIMEOUT_MS) }
	}

	/**
	 * Helper method to cancel a seek timeout
	 */
	private fun cancelSeekTimeout() {
		seekTimeoutRunnable?.let { seekTimeoutHandler?.removeCallbacks(it) }
		seekTimeoutHandler = null
		seekTimeoutRunnable = null
	}

	fun seekTo(position: Long) {
		ensureSession()
		runOnUiThread {
			val dur = browser?.duration ?: 0L
			val validPosition = when {
				position < 0 -> 0L
				position > dur -> dur
				else -> position
			}

			// Set pending seek variables
			pendingSeek = true
			pendingSeekPosition = validPosition
			pendingSeekDuration = dur

			log("Seeking to position: $validPosition")
			browser?.seekTo(validPosition)

			// Start seek timeout
			startSeekTimeout()

			// SEEK_COMPLETE will be emitted in onPositionDiscontinuity or when timeout is reached
		}
	}

	fun seekForward(amount: Long) {
		ensureSession()
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val dur = browser?.duration ?: 0L
			val newPos = (current + amount).coerceAtMost(dur)

			// Set pending seek variables
			pendingSeek = true
			pendingSeekPosition = newPos
			pendingSeekDuration = dur

			log("Seeking forward to position: $newPos")
			browser?.seekTo(newPos)

			// Start seek timeout
			startSeekTimeout()

			// SEEK_COMPLETE will be emitted in onPositionDiscontinuity or when timeout is reached
		}
	}

	fun seekBack(amount: Long) {
		ensureSession()
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val newPos = (current - amount).coerceAtLeast(0L)
			val dur = browser?.duration ?: 0L

			// Set pending seek variables
			pendingSeek = true
			pendingSeekPosition = newPos
			pendingSeekDuration = dur

			log("Seeking back to position: $newPos")
			browser?.seekTo(newPos)

			// Start seek timeout
			startSeekTimeout()

			// SEEK_COMPLETE will be emitted in onPositionDiscontinuity or when timeout is reached
		}
	}

	fun detachPlayerListener() {
		log("Detaching player listener")
		playerListener?.let {
			browser?.removeListener(it)
			playerListener = null
		}
	}

	fun attachPlayerListener() {
		detachPlayerListener()

		playerListener = object : Player.Listener {

			override fun onIsPlayingChanged(isPlaying: Boolean) {
				val pos = browser?.currentPosition ?: 0L
				val dur = browser?.duration ?: 0L

				if (isPlaying) {
					emitState(AudioProModule.STATE_PLAYING, pos, dur)
					startProgressTimer()
				} else {
					emitState(AudioProModule.STATE_PAUSED, pos, dur)
					stopProgressTimer()
				}
			}

			override fun onPlaybackStateChanged(state: Int) {
				val pos = browser?.currentPosition ?: 0L
				val dur = browser?.duration ?: 0L
				val isPlayIntended = browser?.playWhenReady == true
				val isActuallyPlaying = browser?.isPlaying == true

				when (state) {
					Player.STATE_BUFFERING -> {
						if (isPlayIntended) {
							emitState(AudioProModule.STATE_LOADING, pos, dur)
						} else {
							emitState(AudioProModule.STATE_PAUSED, pos, dur)
						}
					}

					Player.STATE_READY -> {
						if (isActuallyPlaying) {
							emitState(AudioProModule.STATE_PLAYING, pos, dur)
							startProgressTimer()
						} else {
							emitState(AudioProModule.STATE_PAUSED, pos, dur)
							stopProgressTimer()
						}
					}

					Player.STATE_ENDED -> {
						stopProgressTimer()
						// Emit STOPPED state before TRACK_ENDED to ensure correct event ordering
						emitState(AudioProModule.STATE_STOPPED, dur, dur)
						emitNotice(AudioProModule.EVENT_TYPE_TRACK_ENDED, dur, dur)
					}

					Player.STATE_IDLE -> {
						stopProgressTimer()
						emitState(AudioProModule.STATE_STOPPED, 0L, 0L)
					}
				}
			}

			override fun onPositionDiscontinuity(
				oldPosition: Player.PositionInfo,
				newPosition: Player.PositionInfo,
				reason: Int
			) {
				// Check if this is a seek operation
				if (pendingSeek && (reason == Player.DISCONTINUITY_REASON_SEEK || reason == Player.DISCONTINUITY_REASON_SEEK_ADJUSTMENT)) {
					log("Seek completed: position=${newPosition.positionMs}, reason=$reason")

					// Cancel the seek timeout
					cancelSeekTimeout()

					// Emit SEEK_COMPLETE event
					emitNotice(
						AudioProModule.EVENT_TYPE_SEEK_COMPLETE,
						pendingSeekPosition,
						pendingSeekDuration
					)

					// Reset pending seek variables
					pendingSeek = false
					pendingSeekPosition = 0
					pendingSeekDuration = 0
				}
			}

			override fun onPlayerError(error: PlaybackException) {
				// If we're already in an error state, just log and return
				if (isInErrorState) {
					log("Already in error state, ignoring additional error: ${error.message}")
					return
				}

				val message = error.message ?: "Unknown error"
				// Emit the error event before resetting
				emitError(message, 500)

				// Use the shared resetInternal function to handle the error state
				resetInternal(AudioProModule.STATE_ERROR)
			}
		}

		browser?.addListener(playerListener!!)
	}

	private fun startProgressTimer() {
		stopProgressTimer()
		progressHandler = Handler(Looper.getMainLooper())
		progressRunnable = object : Runnable {
			override fun run() {
				val pos = browser?.currentPosition ?: 0L
				val dur = browser?.duration ?: 0L
				emitNotice(AudioProModule.EVENT_TYPE_PROGRESS, pos, dur)
				progressHandler?.postDelayed(this, 1000)
			}
		}
		progressRunnable?.let { progressHandler?.postDelayed(it, 1000) }
	}

	private fun stopProgressTimer() {
		progressRunnable?.let { progressHandler?.removeCallbacks(it) }
		progressHandler = null
		progressRunnable = null
	}

	private fun runOnUiThread(block: () -> Unit) {
		Handler(Looper.getMainLooper()).post(block)
	}

	private fun emitEvent(type: String, track: ReadableMap?, payload: WritableMap?) {
		val context = reactContext
		if (context is ReactApplicationContext) {
			val body = Arguments.createMap().apply {
				putString("type", type)

				if (track != null) {
					putMap("track", track.toHashMap().let { Arguments.makeNativeMap(it) })
				} else {
					putNull("track")
				}

				if (payload != null) {
					putMap("payload", payload)
				}
			}

			context
				.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
				.emit(AudioProModule.EVENT_NAME, body)
		} else {
			Log.w("AudioProController", "Context is not an instance of ReactApplicationContext")
		}
	}

	private fun emitState(state: String, position: Long, duration: Long) {
		// Don't emit PAUSED if we've already emitted STOPPED
		if (state == AudioProModule.STATE_PAUSED && lastEmittedState == AudioProModule.STATE_STOPPED) {
			log("Ignoring PAUSED state after STOPPED")
			return
		}

		// Don't emit STOPPED if we're in an error state
		if (state == AudioProModule.STATE_STOPPED && isInErrorState) {
			log("Ignoring STOPPED state after ERROR")
			return
		}

		// Filter out duplicate state emissions
		// This prevents rapid-fire transitions of the same state being emitted repeatedly
		if (state == lastEmittedState) {
			log("Ignoring duplicate $state state emission")
			return
		}

		// Sanitize negative values
		val sanitizedPosition = if (position < 0) 0L else position
		val sanitizedDuration = if (duration < 0) 0L else duration

		val payload = Arguments.createMap().apply {
			putString("state", state)
			putDouble("position", sanitizedPosition.toDouble())
			putDouble("duration", sanitizedDuration.toDouble())
		}
		emitEvent(AudioProModule.EVENT_TYPE_STATE_CHANGED, currentTrack, payload)

		// Track the last emitted state
		lastEmittedState = state
	}

	private fun emitNotice(eventType: String, position: Long, duration: Long) {
		// Sanitize negative values
		val sanitizedPosition = if (position < 0) 0L else position
		val sanitizedDuration = if (duration < 0) 0L else duration

		val payload = Arguments.createMap().apply {
			putDouble("position", sanitizedPosition.toDouble())
			putDouble("duration", sanitizedDuration.toDouble())
		}
		emitEvent(eventType, currentTrack, payload)
	}

	private fun emitError(message: String, code: Int) {
		val payload = Arguments.createMap().apply {
			putString("error", message)
			putInt("errorCode", code)
		}
		emitEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, currentTrack, payload)
	}

	fun emitNext() {
		emitEvent(AudioProModule.EVENT_TYPE_REMOTE_NEXT, currentTrack, Arguments.createMap())
	}

	fun emitPrev() {
		emitEvent(AudioProModule.EVENT_TYPE_REMOTE_PREV, currentTrack, Arguments.createMap())
	}

	fun setPlaybackSpeed(speed: Float) {
		ensureSession()
		currentPlaybackSpeed = speed
		runOnUiThread {
			log("Setting playback speed to", speed)
			browser?.setPlaybackSpeed(speed)

			val payload = Arguments.createMap().apply {
				putDouble("speed", speed.toDouble())
			}
			emitEvent(AudioProModule.EVENT_TYPE_PLAYBACK_SPEED_CHANGED, currentTrack, payload)
		}
	}
}
