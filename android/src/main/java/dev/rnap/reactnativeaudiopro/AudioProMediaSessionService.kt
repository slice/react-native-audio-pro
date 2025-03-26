package dev.rnap.reactnativeaudiopro

import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

class AudioProMediaSessionService : MediaSessionService() {
    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return AudioPlayer.mediaSession
    }
}
