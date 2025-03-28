package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaBrowser
import androidx.media3.session.SessionToken
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.guava.await

object AudioProController {
  private lateinit var browserFuture: ListenableFuture<MediaBrowser>
  private var browser: MediaBrowser? = null

  fun init(context: Context) {
    val sessionToken =
      SessionToken(context, ComponentName(context, AudioProPlaybackService::class.java))
    browserFuture = MediaBrowser.Builder(context, sessionToken).buildAsync()
    browserFuture.addListener({
      browser = browserFuture.get()
    }, ContextCompat.getMainExecutor(context))
  }

  private fun runOnUiThread(block: () -> Unit) {
    Handler(Looper.getMainLooper()).post(block)
  }

  suspend fun play(
    context: Context,
    url: String,
    title: String = "Unknown",
    artist: String = "Unknown"
  ) {
    if (!::browserFuture.isInitialized) {
      val sessionToken =
        SessionToken(context, ComponentName(context, AudioProPlaybackService::class.java))
      browserFuture = MediaBrowser.Builder(context, sessionToken).buildAsync()
    }

    browser = browserFuture.await()
    attachPlayerListener(context)

    val mediaItem = MediaItem.Builder()
      .setUri(url)
      .setMediaId("custom_track_1")
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(title)
          .setArtist(artist)
          .setArtworkUri("https://rnap.dev/artwork-usgs-bAji8qv_LlY-unsplash.jpg".toUri())
          .build()
      )
      .build()

    runOnUiThread {
      browser?.let {
        val pos = it.currentPosition
        val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
        emitState(context, AudioProModule.STATE_LOADING, pos, dur)

        it.setMediaItem(mediaItem)
        it.prepare()
        it.play()
      } ?: Log.w("AudioProController", "MediaBrowser not ready yet")
    }
  }

  fun pause(context: Context) {
    runOnUiThread {
      browser?.pause()
      browser?.let {
        val pos = it.currentPosition
        val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
        emitState(context, AudioProModule.STATE_PAUSED, pos, dur)
      }
    }
  }

  fun resume(context: Context) {
    runOnUiThread {
      browser?.play()
      browser?.let {
        val pos = it.currentPosition
        val dur = it.duration.takeIf { d -> d > 0 } ?: 0L
        emitState(context, AudioProModule.STATE_PLAYING, pos, dur)
      }
    }
  }

  fun release() {
    if (::browserFuture.isInitialized) {
      MediaBrowser.releaseFuture(browserFuture)
    }
    browser = null
  }

  fun attachPlayerListener(context: Context) {
    browser?.addListener(object : Player.Listener {

      override fun onIsPlayingChanged(isPlaying: Boolean) {
        val pos = browser?.currentPosition ?: 0L
        val dur = browser?.duration ?: 0L

        if (isPlaying) {
          emitState(context, AudioProModule.STATE_PLAYING, pos, dur)
        } else {
          emitState(context, AudioProModule.STATE_PAUSED, pos, dur)
        }
      }

      override fun onPlaybackStateChanged(state: Int) {
        if (state == Player.STATE_ENDED) {
          val pos = browser?.duration ?: 0L
          emitState(context, AudioProModule.STATE_STOPPED, pos, pos)
        }
      }
    })
  }

  private fun emitEvent(context: Context, eventName: String, params: WritableMap) {
    if (context is ReactApplicationContext) {
      context
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    }
  }

  private fun emitState(context: Context, state: String, position: Long, duration: Long) {
    val body = Arguments.createMap().apply {
      putString("state", state)
      putDouble("position", position.toDouble())
      putDouble("duration", duration.toDouble())
    }
    emitEvent(context, AudioProModule.STATE_EVENT_NAME, body)
  }
}
