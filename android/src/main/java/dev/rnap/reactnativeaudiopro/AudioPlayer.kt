package dev.rnap.reactnativeaudiopro

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.PlaybackException
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.ui.PlayerNotificationManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

data class AudioProTrack(
    val url: String,
    val title: String,
    val artwork: String,
    val album: String? = null,
    val artist: String? = null
)

object AudioPlayer {

    private const val CHANNEL_ID = "audiopro_channel"
    private const val NOTIFICATION_ID = 1

    // Playback states
    const val STATE_STOPPED = "STOPPED"
    const val STATE_LOADING = "LOADING"
    const val STATE_PLAYING = "PLAYING"
    const val STATE_PAUSED = "PAUSED"

    // Playback notices
    const val NOTICE_TRACK_ENDED = "TRACK_ENDED"
    const val NOTICE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
    const val NOTICE_PROGRESS = "PROGRESS"
    const val NOTICE_SEEK_COMPLETE = "SEEK_COMPLETE"
    const val NOTICE_REMOTE_NEXT = "REMOTE_NEXT"
    const val NOTICE_REMOTE_PREV = "REMOTE_PREV"

    private var exoPlayer: ExoPlayer? = null
    lateinit var mediaSession: MediaSession
    private var notificationManager: PlayerNotificationManager? = null

    private var progressHandler: Handler? = null
    private var progressRunnable: Runnable? = null

    // Holds the React context for event emission
    private var reactContext: ReactContext? = null

    fun initialize(context: Context, reactContext: ReactContext) {
        if (exoPlayer != null) return  // already initialized

        this.reactContext = reactContext
        exoPlayer = ExoPlayer.Builder(context).build()

        // Set up MediaSession (which automatically binds the player)
        mediaSession = MediaSession.Builder(context, exoPlayer!!).build()

        val channelId = CHANNEL_ID
        val channelName = "Audio Pro Playback"
        val channelDescription = "Audio playback controls for react-native-audio-pro"

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val importance = android.app.NotificationManager.IMPORTANCE_LOW
            val channel = android.app.NotificationChannel(channelId, channelName, importance).apply {
                description = channelDescription
            }

            val notificationManager = context.getSystemService(android.app.NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            Log.d("AudioPro", "Notification channel created")
        }

        notificationManager = PlayerNotificationManager.Builder(
            context,
            NOTIFICATION_ID,
            CHANNEL_ID
        )
            .setMediaDescriptionAdapter(object : PlayerNotificationManager.MediaDescriptionAdapter {
                override fun getCurrentContentTitle(player: Player): CharSequence {
                    return player.mediaMetadata.title ?: ""
                }

                override fun createCurrentContentIntent(player: Player): android.app.PendingIntent? = null

                override fun getCurrentContentText(player: Player): CharSequence? {
                    return player.mediaMetadata.artist ?: ""
                }

                override fun getCurrentLargeIcon(
                    player: Player,
                    callback: PlayerNotificationManager.BitmapCallback
                ): Bitmap? = null
            }).build().apply {
                setPlayer(exoPlayer)
            }

        android.util.Log.d("AudioPro", "NotificationManager temporarily disabled for debugging.")

        setupPlayerListeners()
    }

    private fun setupPlayerListeners() {
        exoPlayer?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                when (state) {
                    Player.STATE_BUFFERING -> {
                        sendStateEvent(STATE_LOADING)
                        stopProgressUpdates()
                    }
                    Player.STATE_READY -> {
                        if (exoPlayer?.playWhenReady == true) {
                            sendStateEvent(STATE_PLAYING)
                            startProgressUpdates()
                        } else {
                            sendStateEvent(STATE_PAUSED)
                            stopProgressUpdates()
                        }
                    }
                    Player.STATE_ENDED -> {
                        sendNoticeEvent(NOTICE_TRACK_ENDED, exoPlayer?.duration ?: 0, exoPlayer?.duration ?: 0)
                        sendStateEvent(STATE_STOPPED)
                        stop()
                    }
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                sendNoticeEvent(NOTICE_PLAYBACK_ERROR, 0, 0, error.message ?: "Playback error")
                stop()
            }
        })
    }

    fun play(track: AudioProTrack) {
        // Stop any existing playback
        stop()

        // Emit LOADING state immediately
        sendStateEvent(STATE_LOADING)

        // Build MediaItem with metadata
        val mediaItem = MediaItem.Builder()
            .setUri(Uri.parse(track.url))
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(track.title)
                    .setArtist(track.artist ?: "")
                    .setArtworkUri(Uri.parse(track.artwork))
                    .build()
            )
            .build()

        exoPlayer?.setMediaItem(mediaItem)
        exoPlayer?.prepare()
        exoPlayer?.playWhenReady = true
    }

    fun pause() {
        exoPlayer?.playWhenReady = false
        sendStateEvent(STATE_PAUSED)
        stopProgressUpdates()
    }

    fun resume() {
        exoPlayer?.playWhenReady = true
        sendStateEvent(STATE_PLAYING)
        startProgressUpdates()
    }

    fun stop() {
        stopProgressUpdates()
        exoPlayer?.stop()
        exoPlayer?.release()
        exoPlayer = null
        notificationManager?.setPlayer(null)
        notificationManager = null
        mediaSession.release()
        sendStateEvent(STATE_STOPPED)
    }

    fun seekTo(positionMs: Long) {
        if (exoPlayer == null) {
            sendNoticeEvent(NOTICE_PLAYBACK_ERROR, 0, 0, "Cannot seek: no track is playing")
            return
        }
        exoPlayer?.seekTo(positionMs)
        sendNoticeEvent(NOTICE_SEEK_COMPLETE, exoPlayer?.currentPosition ?: 0, exoPlayer?.duration ?: 0)
    }

    fun seekForward(amountMs: Long) {
        val currentPos = exoPlayer?.currentPosition ?: 0
        val duration = exoPlayer?.duration ?: 0
        val newPosition = (currentPos + amountMs).coerceAtMost(duration)
        seekTo(newPosition)
    }

    fun seekBack(amountMs: Long) {
        val currentPos = exoPlayer?.currentPosition ?: 0
        val newPosition = (currentPos - amountMs).coerceAtLeast(0)
        seekTo(newPosition)
    }

    private fun startProgressUpdates() {
        if (progressHandler == null) {
            progressHandler = Handler(Looper.getMainLooper())
        }
        progressRunnable = object : Runnable {
            override fun run() {
                val pos = exoPlayer?.currentPosition ?: 0
                val dur = exoPlayer?.duration ?: 0
                sendNoticeEvent(NOTICE_PROGRESS, pos, dur)
                progressHandler?.postDelayed(this, 1000)
            }
        }
        progressHandler?.post(progressRunnable!!)
    }

    private fun stopProgressUpdates() {
        progressHandler?.removeCallbacks(progressRunnable ?: return)
        progressRunnable = null
    }

    // Event emission helpers – events are sent to JS via DeviceEventEmitter
    private fun sendStateEvent(state: String, position: Long = exoPlayer?.currentPosition ?: 0, duration: Long = exoPlayer?.duration ?: 0) {
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("AudioProStateEvent", mapOf(
                "state" to state,
                "position" to position,
                "duration" to duration
            ))
    }

    private fun sendNoticeEvent(notice: String, position: Long, duration: Long, error: String? = null) {
        val payload = mutableMapOf<String, Any>(
            "notice" to notice,
            "position" to position,
            "duration" to duration
        )
        error?.let {
            payload["error"] = it
            payload["errorCode"] = 1000
        }
        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("AudioProNoticeEvent", payload)
    }
}
