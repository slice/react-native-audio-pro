package dev.rnap.reactnativeaudiopro

import android.content.Intent
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

@UnstableApi
class AudioProService : MediaSessionService() {

    private lateinit var player: ExoPlayer
    private lateinit var mediaSession: MediaSession

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this).build()
        mediaSession = MediaSession.Builder(this, player).build()
        Log.d("AudioProService", "~~~ Service Created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            when (it.action) {
                "ACTION_PLAY" -> it.getStringExtra("URL")?.let { url -> playUrl(url) }
                "ACTION_PAUSE" -> pause()
                else -> {}
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun playUrl(url: String) {
        Log.d("AudioProService", "~~~ Playing URL: $url")
        val mediaItem = MediaItem.fromUri(url)
        player.setMediaItem(mediaItem)
        player.prepare()
        player.play()
    }

    fun pause() {
        if (player.isPlaying) {
            player.pause()
            Log.d("AudioProService", "~~~ Playback paused")
        }
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession {
        return mediaSession
    }

    override fun onDestroy() {
        player.release()
        mediaSession.release()
        super.onDestroy()
    }
}
