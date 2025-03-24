package dev.rnap.reactnativeaudiopro

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession

class AudioPlayer(private val context: Context) {
  private var player: ExoPlayer? = null
  private var mediaSession: MediaSession? = null

  fun play(url: String) {
    player = ExoPlayer.Builder(context).build()
    mediaSession = MediaSession.Builder(context, player!!).build()
    val mediaItem = MediaItem.fromUri(url)
    player?.setMediaItem(mediaItem)
    player?.prepare()
    player?.play()
  }

  fun pause() {
    player?.pause()
  }

  fun resume() {
    player?.play()
  }

  fun stop() {
    player?.stop()
    player?.release()
    player = null
    mediaSession?.release()
    mediaSession = null
  }
}
