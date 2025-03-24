package dev.rnap.reactnativeaudiopro

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.ui.PlayerNotificationManager

class AudioProService : Service() {
    private var player: Player? = null
    private var mediaSession: MediaSession? = null
    private var notificationManager: PlayerNotificationManager? = null
    
    private val binder = LocalBinder()
    
    companion object {
        private const val CHANNEL_ID = "dev.rnap.reactnativeaudiopro.channel"
        private const val NOTIFICATION_ID = 1001
    }
    
    inner class LocalBinder : Binder() {
        fun getService(): AudioProService = this@AudioProService
    }
    
    override fun onBind(intent: Intent): IBinder {
        return binder
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Audio Pro Playback",
            NotificationManager.IMPORTANCE_LOW
        )
        channel.description = "Used for audio playback controls and information"
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
    
    @UnstableApi
    fun setPlayer(player: Player, session: MediaSession) {
        this.player = player
        this.mediaSession = session
        
        setupNotificationManager()
    }
    
    @UnstableApi
    private fun setupNotificationManager() {
        // Create a description adapter
        val descriptionAdapter = object : PlayerNotificationManager.MediaDescriptionAdapter {
            override fun getCurrentContentTitle(player: Player): CharSequence {
                return player.mediaMetadata.title ?: "Unknown Title"
            }

            override fun createCurrentContentIntent(player: Player): android.app.PendingIntent? {
                // Return PendingIntent to open your app when notification is clicked
                return null // Implement as needed
            }

            override fun getCurrentContentText(player: Player): CharSequence? {
                return player.mediaMetadata.artist
            }

            override fun getCurrentLargeIcon(
                player: Player,
                callback: PlayerNotificationManager.BitmapCallback
            ): androidx.media.app.NotificationCompat.BitmapLoader? {
                // Load artwork if available
                return null // Implement bitmap loading if needed
            }
        }
        
        val notificationListener = object : PlayerNotificationManager.NotificationListener {
            override fun onNotificationCancelled(notificationId: Int, dismissedByUser: Boolean) {
                stopSelf()
            }

            override fun onNotificationPosted(notificationId: Int, notification: android.app.Notification, ongoing: Boolean) {
                startForeground(NOTIFICATION_ID, notification)
            }
        }
        
        // Build the notification manager
        notificationManager = PlayerNotificationManager.Builder(
            this,
            NOTIFICATION_ID,
            CHANNEL_ID
        )
        .setNotificationListener(notificationListener)
        .setMediaDescriptionAdapter(descriptionAdapter)
        .build()
        
        notificationManager?.setPlayer(player)
        notificationManager?.setMediaSessionToken(mediaSession?.sessionToken)
        
        // Set notification styles and actions
        notificationManager?.setUsePlayPauseActions(true)
        notificationManager?.setUseNextAction(true)
        notificationManager?.setUsePreviousAction(true)
    }
    
    override fun onDestroy() {
        notificationManager?.setPlayer(null)
        player = null
        mediaSession?.release()
        mediaSession = null
        super.onDestroy()
    }
}