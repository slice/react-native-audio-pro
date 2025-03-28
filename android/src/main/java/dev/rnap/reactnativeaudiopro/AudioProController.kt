package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.content.Context
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.session.MediaBrowser
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture

object AudioProController {
  private lateinit var browserFuture: ListenableFuture<MediaBrowser>
  private var browser: MediaBrowser? = null

  fun init(context: Context) {
    val sessionToken = SessionToken(context, ComponentName(context, PlaybackService::class.java))
    browserFuture = MediaBrowser.Builder(context, sessionToken).buildAsync()
    browserFuture.addListener({
      browser = browserFuture.get()
      Log.d("AudioProController", "MediaBrowser ready")
    }, ContextCompat.getMainExecutor(context))
  }

  fun setup(context: Context) {
    if (!::browserFuture.isInitialized) init(context)
  }

  fun play(context: Context, url: String, title: String = "Unknown", artist: String = "Unknown") {
    if (!::browserFuture.isInitialized) init(context)

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

    browser?.let {
      it.setMediaItem(mediaItem)
      it.prepare()
      it.play()
    } ?: Log.w("AudioProController", "MediaBrowser not ready yet")
  }

  fun release() {
    if (::browserFuture.isInitialized) {
      MediaBrowser.releaseFuture(browserFuture)
    }
    browser = null
  }
}
