package dev.rnap.reactnativeaudiopro

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.Player
import com.facebook.react.bridge.ReadableMap
import android.os.Handler
import android.os.Looper

object AudioProPlayer {
  private var exoPlayer: ExoPlayer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  var trackEndedCallback: (() -> Unit)? = null

  fun initialize(context: Context) {
    if (exoPlayer == null) {
      exoPlayer = ExoPlayer.Builder(context).build()
      exoPlayer?.addListener(object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
          if (playbackState == Player.STATE_ENDED) {
            trackEndedCallback?.invoke()
          }
        }
      })
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

  fun getCurrentPosition(callback: (Long) -> Unit) {
    mainHandler.post {
      val position = exoPlayer?.currentPosition ?: 0
      callback(position)
    }
  }

  fun getDuration(callback: (Long) -> Unit) {
    mainHandler.post {
      val duration = exoPlayer?.duration ?: 0
      callback(duration)
    }
  }

  fun seekTo(position: Long) {
    mainHandler.post {
      val duration = exoPlayer?.duration ?: 0
      val validPosition = when {
        position < 0 -> 0
        position > duration -> duration
        else -> position
      }
      exoPlayer?.seekTo(validPosition)
    }
  }

  fun seekForward(amount: Long) {
    mainHandler.post {
      val currentPos = exoPlayer?.currentPosition ?: 0
      val duration = exoPlayer?.duration ?: 0
      val newPos = currentPos + amount
      val validPosition = if (newPos > duration) duration else newPos
      exoPlayer?.seekTo(validPosition)
    }
  }

  fun seekBack(amount: Long) {
    mainHandler.post {
      val currentPos = exoPlayer?.currentPosition ?: 0
      val newPos = currentPos - amount
      val validPosition = if (newPos < 0) 0 else newPos
      exoPlayer?.seekTo(validPosition)
    }
  }
}
