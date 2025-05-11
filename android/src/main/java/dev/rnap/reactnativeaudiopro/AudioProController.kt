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
	private var progressIntervalMs: Long = 1000
	var showNextPrevControls: Boolean = true
	private var reactContext: ReactApplicationContext? = null
	private var playerListener: Player.Listener? = null
	private var currentPlaybackSpeed: Float = 1.0f
	private var currentVolume: Float = 1.0f
	private var currentTrack: ReadableMap? = null
	private var isInErrorState: Boolean = false

	// Suppress PAUSED immediately after LOADING to avoid misleading UI
	private const val PAUSED_AFTER_LOADING_SUPPRESSION_MS: Long = 300L
	private var lastStateEmittedTimeMs: Long = 0L
	private var lastEmittedState: String = ""

	var audioHeaders: Map<String, String>? = null
	var artworkHeaders: Map<String, String>? = null

	private var pendingSeekPosition: Long? = null

	private fun log(vararg args: Any?) {
		if (debug) {
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

	/**
	 * Prepares the player for new playback without emitting state changes or destroying the media session
	 * - This function:
	 * - Pauses the player if it's playing
	 * - Stops the progress timer
	 * - Does not emit any state or clear currentTrack
	 * - Does not destroy the media session
	 */
	private fun prepareForNewPlayback() {
		log("Preparing for new playback")

		runOnUiThread {
			browser?.pause()
		}

		stopProgressTimer()

		pendingSeekPosition = null
	}

	suspend fun play(track: ReadableMap, options: ReadableMap) {
		isInErrorState = false
		lastEmittedState = ""
		currentTrack = track
		val contentType = if (options.hasKey("contentType")) {
			options.getString("contentType") ?: "MUSIC"
		} else "MUSIC"
		val enableDebug = options.hasKey("debug") && options.getBoolean("debug")
		val includeProgressInDebug =
			options.hasKey("debugIncludesProgress") && options.getBoolean("debugIncludesProgress")
		val speed = if (options.hasKey("playbackSpeed")) {
			options.getDouble("playbackSpeed").toFloat()
		} else 1.0f
		val volume = if (options.hasKey("volume")) {
			options.getDouble("volume").toFloat()
		} else 1.0f
		val autoPlay = if (options.hasKey("autoPlay")) {
			options.getBoolean("autoPlay")
		} else true
		val startTimeMs = if (options.hasKey("startTimeMs")) {
			options.getDouble("startTimeMs").toLong()
		} else null

		val progressInterval = if (options.hasKey("progressIntervalMs")) {
			options.getDouble("progressIntervalMs").toLong()
		} else 1000L

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
				audioHeaders = extractHeaders(headers.getMap("audio"))
				artworkHeaders = extractHeaders(headers.getMap("artwork"))
			}
		}

		// Configure the player
		browser?.setPlaybackSpeed(speed)
		browser?.setVolume(volume)
		browser?.playWhenReady = autoPlay

		// If startTimeMs is provided and autoPlay is true, set pendingSeekPosition
		if (startTimeMs != null && autoPlay) {
			pendingSeekPosition = startTimeMs
		}

		// Prepare the player
		browser?.prepare()

		debug = enableDebug
		debugIncludesProgress = includeProgressInDebug
		audioContentType = when (contentType) {
			"SPEECH" -> C.AUDIO_CONTENT_TYPE_SPEECH
			else -> C.AUDIO_CONTENT_TYPE_MUSIC
		}
		currentPlaybackSpeed = speed
		currentVolume = volume
		progressIntervalMs = progressInterval
		showNextPrevControls =
			if (options.hasKey("showNextPrevControls")) options.getBoolean("showNextPrevControls") else true

		log("Configured with contentType=$contentType debug=$debug speed=$speed volume=$volume autoPlay=$autoPlay")

		if (browser != null) {
			prepareForNewPlayback()
		} else {
			internalPrepareSession()
		}

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

		// Parse the URL string into a Uri object to properly handle all URI schemes including file://
		val uri = url.toUri()
		log("Parsed URI: $uri, scheme: ${uri.scheme}")

		val mediaItem = MediaItem.Builder()
			.setUri(uri)
			.setMediaId("custom_track_1")
			.setMediaMetadata(metadataBuilder.build())
			.build()

		runOnUiThread {
			log("Play", title, url)
			emitState(AudioProModule.STATE_LOADING, 0L, 0L)

			browser?.let {
				// Set the new media item and prepare the player
				it.setMediaItem(mediaItem)
				it.prepare()

				// Set playback speed regardless of autoPlay
				it.setPlaybackSpeed(currentPlaybackSpeed)
				// Set volume regardless of autoPlay
				it.setVolume(currentVolume)

				if (autoPlay) {
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
			// Do not detach player listener to ensure lock screen controls still work
			// and state changes are emitted when playback is resumed from lock screen

			// Seek to position 0 before stopping
			browser?.seekTo(0)
			browser?.stop()
			browser?.let {
				// Use position 0 for STOPPED state as per logic.md contract
				val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
				// Do not set currentTrack = null as STOPPED state should preserve track metadata
				emitState(AudioProModule.STATE_STOPPED, 0L, dur)
			}
		}
		stopProgressTimer()

		// Cancel any pending seek operations
		pendingSeekPosition = null

		// Do not call release() as stop() should not tear down the player
		// Only clear() and unrecoverable onError() should call release()

		// Do not destroy the playback service in stop() as it should maintain the media session
		// stop() is a non-destructive state that stops playback and seeks to 0,
		// but retains lock screen info, current track, and player state
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
		log("Reset internal, final state: $finalState")

		// Reset error state
		isInErrorState = finalState == AudioProModule.STATE_ERROR
		// Reset last emitted state
		lastEmittedState = ""

		// Clear pending seek state
		pendingSeekPosition = null

		// Stop playback
		runOnUiThread {
			detachPlayerListener()
			browser?.stop()
		}

		// Clear track and stop timers
		currentTrack = null
		stopProgressTimer()

		// Reset playback settings
		currentPlaybackSpeed = 1.0f
		currentVolume = 1.0f

		// Release resources
		release()

		// Destroy the playback service to remove notification and tear down the media session
		destroyPlaybackService()

		// Emit final state
		emitState(finalState, 0L, 0L)
	}

	fun release() {
		runOnUiThread {
			if (::browserFuture.isInitialized) {
				MediaBrowser.releaseFuture(browserFuture)
			}
			browser = null
		}
	}

	/**
	 * Explicitly destroys the AudioProPlaybackService to remove notification and tear down the media session
	 * This is the central method for destroying the service and removing the notification
	 * It should only be called from clear() and unrecoverable error scenarios, not from stop()
	 */
	fun destroyPlaybackService() {
		log("Destroying AudioProPlaybackService")
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


	fun seekTo(position: Long) {
		ensureSession()
		runOnUiThread {
			val dur = browser?.duration ?: 0L
			val validPosition = when {
				position < 0 -> 0L
				position > dur -> dur
				else -> position
			}

			// Set pending seek position
			pendingSeekPosition = validPosition

			// Stop progress timer during seek
			stopProgressTimer()

			log("Seeking to position: $validPosition")
			browser?.seekTo(validPosition)

			// SEEK_COMPLETE will be emitted in onPositionDiscontinuity
		}
	}

	fun seekForward(amount: Long) {
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val dur = browser?.duration ?: 0L
			val newPos = (current + amount).coerceAtMost(dur)

			log("Seeking forward to position: $newPos")
			seekTo(newPos)
		}
	}

	fun seekBack(amount: Long) {
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val newPos = (current - amount).coerceAtLeast(0L)

			log("Seeking back to position: $newPos")
			seekTo(newPos)
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
						// If there's a pending seek position, perform the seek now that the player is ready
						pendingSeekPosition?.let { seekPos ->
							log("Performing pending seek to $seekPos in STATE_READY")
							browser?.seekTo(seekPos)
							// pendingSeekPosition will be cleared in onPositionDiscontinuity
						}

						if (isActuallyPlaying) {
							emitState(AudioProModule.STATE_PLAYING, pos, dur)
							startProgressTimer()
						} else {
							emitState(AudioProModule.STATE_PAUSED, pos, dur)
							stopProgressTimer()
						}
					}

					/**
					 * Handles track completion according to the contract in logic.md:
					 * - Native is responsible for detecting the end of a track
					 * - Native must pause the player, seek to position 0, and emit both:
					 *   - STATE_CHANGED: STOPPED
					 *   - TRACK_ENDED
					 */
					Player.STATE_ENDED -> {
						stopProgressTimer()

						// Reset error state and last emitted state
						isInErrorState = false
						lastEmittedState = ""

						// Seek to position 0
						browser?.seekTo(0)

						// Cancel any pending seek operations
						pendingSeekPosition = null

						// First, emit STATE_CHANGED: STOPPED
						emitState(AudioProModule.STATE_STOPPED, 0L, dur)
						// Then, emit TRACK_ENDED
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
				if (pendingSeekPosition != null && (reason == Player.DISCONTINUITY_REASON_SEEK || reason == Player.DISCONTINUITY_REASON_SEEK_ADJUSTMENT)) {
					log("Seek completed: position=${newPosition.positionMs}, reason=$reason")

					// Get current position and duration
					val pos = pendingSeekPosition ?: 0L
					val dur = browser?.duration ?: 0L

					// Emit SEEK_COMPLETE event
					emitNotice(
						AudioProModule.EVENT_TYPE_SEEK_COMPLETE,
						pos,
						dur
					)

					// Resume progress timer if a seek was pending
					startProgressTimer()

					// Reset pending seek position
					pendingSeekPosition = null
				}
			}

			/**
			 * Handles critical errors according to the contract in logic.md:
			 * - onError() should transition to ERROR state
			 * - onError() should emit STATE_CHANGED: ERROR and PLAYBACK_ERROR
			 * - onError() should clear the player state just like clear()
			 *
			 * This method is for unrecoverable player failures that require player teardown.
			 * For non-critical errors that don't require state transition, use emitError() directly.
			 */
			override fun onPlayerError(error: PlaybackException) {
				// If we're already in an error state, just log and return
				if (isInErrorState) {
					log("Already in error state, ignoring additional error: ${error.message}")
					return
				}

				val message = error.message ?: "Unknown error"
				// First, emit PLAYBACK_ERROR event with error details
				emitError(message, 500)

				// Then use the shared resetInternal function to:
				// 1. Clear the player state (like clear())
				// 2. Emit STATE_CHANGED: ERROR
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
				progressHandler?.postDelayed(this, progressIntervalMs)
			}
		}
		progressRunnable?.let { progressHandler?.postDelayed(it, progressIntervalMs) }
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
		// Suppress PAUSED if it follows LOADING too quickly
		if (state == AudioProModule.STATE_PAUSED &&
			lastEmittedState == AudioProModule.STATE_LOADING &&
			System.currentTimeMillis() - lastStateEmittedTimeMs < PAUSED_AFTER_LOADING_SUPPRESSION_MS) {
			log("Suppressing PAUSED state emitted too soon after LOADING")
			return
		}

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
		// Record time of this state emission
		lastStateEmittedTimeMs = System.currentTimeMillis()
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

	/**
	 * Emits a PLAYBACK_ERROR event without transitioning to the ERROR state.
	 * Use this for non-critical errors that don't require player teardown.
	 *
	 * According to the contract in logic.md:
	 * - PLAYBACK_ERROR and ERROR state are separate and must not be conflated
	 * - PLAYBACK_ERROR can be emitted with or without a corresponding state change
	 * - Useful for soft errors (e.g., image fetch failed, headers issue, non-fatal network retry)
	 */
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

	fun setVolume(volume: Float) {
		ensureSession()
		currentVolume = volume
		runOnUiThread {
			log("Setting volume to", volume)
			browser?.setVolume(volume)
		}
	}
}
