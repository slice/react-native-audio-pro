package dev.rnap.reactnativeaudiopro

import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/** A [MediaLibraryService.MediaLibrarySession.Callback] implementation. */
@UnstableApi
open class AudioProMediaLibrarySessionCallback(context: Context) :
  MediaLibraryService.MediaLibrarySession.Callback {

  @OptIn(UnstableApi::class) // MediaSession.ConnectionResult.DEFAULT_SESSION_AND_LIBRARY_COMMANDS
  val mediaNotificationSessionCommands =
    MediaSession.ConnectionResult.DEFAULT_SESSION_AND_LIBRARY_COMMANDS.buildUpon()
//      .also { builder ->
//        // Put all custom session commands in the list that may be used by the notification.
//        commandButtons.forEach { commandButton ->
//          commandButton.sessionCommand?.let { builder.add(it) }
//        }
//      }
      .build()

  // ConnectionResult.DEFAULT_SESSION_AND_LIBRARY_COMMANDS
  // ConnectionResult.AcceptedResultBuilder
  @OptIn(UnstableApi::class)
  override fun onConnect(
    session: MediaSession,
    controller: MediaSession.ControllerInfo,
  ): MediaSession.ConnectionResult {
    if (
      session.isMediaNotificationController(controller) ||
      session.isAutomotiveController(controller) ||
      session.isAutoCompanionController(controller)
    ) {
      // Select the button to display.
      // val customButton = commandButtons[if (session.player.shuffleModeEnabled) 1 else 0]
      return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
        .setAvailableSessionCommands(mediaNotificationSessionCommands)
        // .setMediaButtonPreferences(ImmutableList.of(customButton))
        .build()
    }
    // Default commands without media button preferences for common controllers.
    return MediaSession.ConnectionResult.AcceptedResultBuilder(session).build()
  }

  override fun onAddMediaItems(
    mediaSession: MediaSession,
    controller: MediaSession.ControllerInfo,
    mediaItems: List<MediaItem>,
  ): ListenableFuture<List<MediaItem>> {
    return Futures.immediateFuture(mediaItems)
  }

}
