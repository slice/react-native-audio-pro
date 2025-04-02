package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.content.Context
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
	private var reactContext: ReactApplicationContext? = null

	private fun log(vararg args: Any?) {
		if (debug) Log.d("AudioPro", "~~~ ${args.joinToString(" ")}")
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
		val contentType = if (options.hasKey("contentType")) {
			options.getString("contentType") ?: "music"
		} else "music"
		val enableDebug = options.hasKey("debug") && options.getBoolean("debug")

		debug = enableDebug
		audioContentType = when (contentType.lowercase()) {
			"speech" -> C.AUDIO_CONTENT_TYPE_SPEECH
			else -> C.AUDIO_CONTENT_TYPE_MUSIC
		}

		log("Configured with contentType=$contentType debug=$debug")

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
				it.play()
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
		ensureSession()
		runOnUiThread {
			browser?.stop()
			browser?.let {
				val pos = it.currentPosition
				val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
				emitState(AudioProModule.STATE_STOPPED, pos, dur)
			}
		}
		stopProgressTimer()
		release()
	}

	fun release() {
		runOnUiThread {
			if (::browserFuture.isInitialized) {
				MediaBrowser.releaseFuture(browserFuture)
			}
			browser = null
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
			browser?.seekTo(validPosition)
			emitNotice(AudioProModule.NOTICE_SEEK_COMPLETE, validPosition, dur)
		}
	}

	fun seekForward(amount: Long) {
		ensureSession()
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val dur = browser?.duration ?: 0L
			val newPos = (current + amount).coerceAtMost(dur)
			browser?.seekTo(newPos)
			emitNotice(AudioProModule.NOTICE_SEEK_COMPLETE, newPos, dur)
		}
	}

	fun seekBack(amount: Long) {
		ensureSession()
		runOnUiThread {
			val current = browser?.currentPosition ?: 0L
			val newPos = (current - amount).coerceAtLeast(0L)
			val dur = browser?.duration ?: 0L
			browser?.seekTo(newPos)
			emitNotice(AudioProModule.NOTICE_SEEK_COMPLETE, newPos, dur)
		}
	}

	fun attachPlayerListener() {
		browser?.addListener(object : Player.Listener {

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
						emitNotice(AudioProModule.NOTICE_TRACK_ENDED, dur, dur)
						emitState(AudioProModule.STATE_STOPPED, dur, dur)
					}

					Player.STATE_IDLE -> {
						stopProgressTimer()
						emitState(AudioProModule.STATE_STOPPED, 0L, 0L)
					}
				}
			}

			override fun onPlayerError(error: PlaybackException) {
				val message = error.message ?: "Unknown error"
				emitError(message, 500)
				emitState(AudioProModule.STATE_STOPPED, 0L, 0L)
			}
		})
	}

	private fun startProgressTimer() {
		stopProgressTimer()
		progressHandler = Handler(Looper.getMainLooper())
		progressRunnable = object : Runnable {
			override fun run() {
				val pos = browser?.currentPosition ?: 0L
				val dur = browser?.duration ?: 0L
				emitNotice(AudioProModule.NOTICE_PROGRESS, pos, dur)
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

	private fun emitEvent(context: Context?, eventName: String, params: WritableMap) {
		if (context is ReactApplicationContext) {
			context
				.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
				.emit(eventName, params)
		} else {
			Log.w("AudioProController", "Context is not an instance of ReactApplicationContext")
		}
	}

	private fun emitState(state: String, position: Long, duration: Long) {
		val body = Arguments.createMap().apply {
			putString("state", state)
			putDouble("position", position.toDouble())
			putDouble("duration", duration.toDouble())
		}
		emitEvent(reactContext, AudioProModule.STATE_EVENT_NAME, body)
	}

	private fun emitNotice(notice: String, position: Long, duration: Long) {
		val body = Arguments.createMap().apply {
			putString("notice", notice)
			putDouble("position", position.toDouble())
			putDouble("duration", duration.toDouble())
		}
		emitEvent(reactContext, AudioProModule.NOTICE_EVENT_NAME, body)
	}

	private fun emitError(message: String, code: Int) {
		val body = Arguments.createMap().apply {
			putString("notice", AudioProModule.NOTICE_PLAYBACK_ERROR)
			putString("error", message)
			putInt("errorCode", code)
		}
		emitEvent(reactContext, AudioProModule.NOTICE_EVENT_NAME, body)
	}

	fun emitNext() {
		val body = Arguments.createMap().apply {
			putString("notice", AudioProModule.NOTICE_REMOTE_NEXT)
		}
		emitEvent(reactContext, AudioProModule.NOTICE_EVENT_NAME, body)
	}

	fun emitPrev() {
		val body = Arguments.createMap().apply {
			putString("notice", AudioProModule.NOTICE_REMOTE_PREV)
		}
		emitEvent(reactContext, AudioProModule.NOTICE_EVENT_NAME, body)
	}
}
