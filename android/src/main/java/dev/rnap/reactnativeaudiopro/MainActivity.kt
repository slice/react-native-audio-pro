package dev.rnap.reactnativeaudiopro

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.session.MediaBrowser
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import androidx.core.net.toUri

class MainActivity : AppCompatActivity() {
  private lateinit var browserFuture: ListenableFuture<MediaBrowser>
  private val browser: MediaBrowser?
    get() = if (browserFuture.isDone && !browserFuture.isCancelled) browserFuture.get() else null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
//    setContentView(R.layout.activity_main)

//    findViewById<Button>(R.id.direct_play_button).setOnClickListener {
//      val sessionToken = SessionToken(this, ComponentName(this, PlaybackService::class.java))
//
//      val browserFuture = MediaBrowser.Builder(this, sessionToken).buildAsync()
//      browserFuture.addListener({
//        val browser = browserFuture.get()
//
//        val mediaItem = MediaItem.Builder()
//          .setUri("https://rnap.dev/audio-soundhelix-song-1-tschurger.mp3")
//          .setMediaId("custom_track_1")
//          .setMediaMetadata(
//            MediaMetadata.Builder()
//              .setTitle("Tschurger Demo")
//              .setArtist("SoundHelix")
//              .setArtworkUri("https://rnap.dev/artwork-usgs-bAji8qv_LlY-unsplash.jpg".toUri())
//              .build()
//          )
//          .build()
//
//        browser.setMediaItem(mediaItem)
//        browser.prepare()
//        browser.play()
//      }, ContextCompat.getMainExecutor(this))
//    }

    if (
      Build.VERSION.SDK_INT >= 33 &&
      checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 0)
    }
  }

  override fun onStart() {
    super.onStart()
    initializeBrowser()
  }

  override fun onStop() {
    releaseBrowser()
    super.onStop()
  }

  private fun initializeBrowser() {
    browserFuture =
      MediaBrowser.Builder(
        this,
        SessionToken(this, ComponentName(this, PlaybackService::class.java))
      )
        .buildAsync()
  }

  private fun releaseBrowser() {
    MediaBrowser.releaseFuture(browserFuture)
  }

}
