package dev.rnap.reactnativeaudiopro

import android.app.PendingIntent
import android.app.PendingIntent.FLAG_UPDATE_CURRENT
import android.app.PendingIntent.getActivity
import android.content.Intent
import androidx.core.app.TaskStackBuilder

class PlaybackService : DemoPlaybackService() {

  companion object {
    private val immutableFlag = PendingIntent.FLAG_IMMUTABLE
  }

  override fun getSingleTopActivity(): PendingIntent? {
    return getActivity(
      this,
      0,
      Intent(this, PlayerActivity::class.java),
      immutableFlag or FLAG_UPDATE_CURRENT
    )
  }

  override fun getBackStackedActivity(): PendingIntent? {
    return TaskStackBuilder.create(this).run {
      addNextIntent(Intent(this@PlaybackService, MainActivity::class.java))
      addNextIntent(Intent(this@PlaybackService, PlayerActivity::class.java))
      getPendingIntent(0, immutableFlag or FLAG_UPDATE_CURRENT)
    }
  }
}
