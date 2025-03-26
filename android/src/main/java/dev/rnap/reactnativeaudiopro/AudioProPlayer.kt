package dev.rnap.reactnativeaudiopro

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import com.facebook.react.bridge.ReadableMap
import android.os.Handler
import android.os.Looper

object AudioProPlayer {
  private var exoPlayer: ExoPlayer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  fun initialize(context: Context) {
    if (exoPlayer == null) {
      exoPlayer = ExoPlayer.Builder(context).build()
    }
  }

  fun play(track: ReadableMap) {
    val url = track.getString("url") ?: return

    mainHandler.post {
      val mediaItem = MediaItem.fromUri(url)
      exoPlayer?.setMediaItem(mediaItem)
      exoPlayer?.prepare()
      exoPlayer?.play()
    }
  }

  fun release() {
    mainHandler.post {
      exoPlayer?.release()
      exoPlayer = null
    }
  }

  fun pause() {
    mainHandler.post {
      exoPlayer?.pause()
    }
  }

  fun resume() {
    mainHandler.post {
      exoPlayer?.play()
    }
  }

  fun stop() {
    mainHandler.post {
      exoPlayer?.stop()
      exoPlayer?.clearMediaItems()
    }
  }

  // Retrieve the current playback position in milliseconds (thread-safe)
  fun getCurrentPosition(callback: (Long) -> Unit) {
    mainHandler.post {
      val position = exoPlayer?.currentPosition ?: 0
      callback(position)
    }
  }

  // Retrieve the total duration of the currently loaded media item in milliseconds (thread-safe)
  fun getDuration(callback: (Long) -> Unit) {
    mainHandler.post {
      val duration = exoPlayer?.duration ?: 0
      callback(duration)
    }
  }
}
