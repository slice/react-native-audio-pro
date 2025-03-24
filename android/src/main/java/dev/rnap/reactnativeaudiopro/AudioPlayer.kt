package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession

class AudioPlayer(private val context: Context) {
    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null
    private var audioProService: AudioProService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as AudioProService.LocalBinder
            audioProService = binder.getService()
            isBound = true

            // Set player to service after binding
            player?.let { player ->
                mediaSession?.let { session ->
                    audioProService?.setPlayer(player, session)
                }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            audioProService = null
            isBound = false
        }
    }

    fun play(track: Track) {
        // Release existing player if any
        release()

        // Create new player
        player = ExoPlayer.Builder(context).build()
        mediaSession = MediaSession.Builder(context, player!!).build()

        // Configure player
        val mediaMetadata = MediaMetadata.Builder()
            .setTitle(track.title)
            .setArtist(track.artist ?: "")
            .setAlbumTitle(track.album ?: "")
            .build()

        val mediaItem = MediaItem.Builder()
            .setUri(track.url)
            .setMediaMetadata(mediaMetadata)
            .build()

        player?.setMediaItem(mediaItem)
        player?.prepare()
        player?.play()

        // Start service
        startService()
    }

    private fun startService() {
        val serviceIntent = Intent(context, AudioProService::class.java)
        context.startForegroundService(serviceIntent)

        // Bind to service
        context.bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    fun pause() {
        player?.pause()
    }

    fun resume() {
        player?.play()
    }

    fun stop() {
        player?.stop()
        unbindService()
    }

    fun release() {
        player?.stop()
        player?.release()
        player = null

        mediaSession?.release()
        mediaSession = null

        unbindService()
    }

    private fun unbindService() {
        if (isBound) {
            context.unbindService(serviceConnection)
            isBound = false
        }

        // Stop the service
        val serviceIntent = Intent(context, AudioProService::class.java)
        context.stopService(serviceIntent)
    }

    fun getCurrentPosition(): Long {
        return player?.currentPosition ?: 0
    }

    fun getDuration(): Long {
        return player?.duration ?: 0
    }

    fun seekTo(position: Long) {
        player?.seekTo(position)
    }
}
