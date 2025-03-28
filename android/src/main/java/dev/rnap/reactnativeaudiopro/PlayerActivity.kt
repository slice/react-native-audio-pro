
package dev.rnap.reactnativeaudiopro

import android.content.ComponentName
import android.os.Bundle
import android.util.Log
import androidx.annotation.OptIn
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.media3.common.Player
import androidx.media3.common.Player.EVENT_MEDIA_ITEM_TRANSITION
import androidx.media3.common.Player.EVENT_TRACKS_CHANGED
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.guava.await
import kotlinx.coroutines.launch

private const val TAG = "PlayerActivity"

class PlayerActivity : AppCompatActivity() {
  private lateinit var controllerFuture: ListenableFuture<MediaController>
  private lateinit var controller: MediaController

//  private lateinit var playerView: PlayerView
//  private lateinit var mediaItemListView: ListView
//  private lateinit var mediaItemListAdapter: MediaItemListAdapter
//  private val mediaItemList: MutableList<MediaItem> = mutableListOf()

  @OptIn(UnstableApi::class) // PlayerView.hideController
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    lifecycleScope.launch {
      lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
        try {
          initializeController()
          awaitCancellation()
        } finally {
//          playerView.player = null
          releaseController()
        }
      }
    }

//    setContentView(R.layout.activity_player)
//    playerView = findViewById(R.id.player_view)

//    mediaItemListView = findViewById(R.id.current_playing_list)
//    mediaItemListAdapter = MediaItemListAdapter(this, R.layout.folder_items, mediaItemList)
//    mediaItemListView.adapter = mediaItemListAdapter
//    mediaItemListView.setOnItemClickListener { _, _, position, _ ->
//      run {
//        if (controller.currentMediaItemIndex == position) {
//          controller.playWhenReady = !controller.playWhenReady
//          if (controller.playWhenReady) {
//            playerView.hideController()
//          }
//        } else {
//          controller.seekToDefaultPosition(/* mediaItemIndex= */ position)
////          mediaItemListAdapter.notifyDataSetChanged()
//        }
//      }
//    }
  }

  private suspend fun initializeController() {
    controllerFuture =
      MediaController.Builder(
          this,
          SessionToken(this, ComponentName(this, PlaybackService::class.java)),
        )
        .buildAsync()
//    updateMediaMetadataUI()
    setController()
  }

  private fun releaseController() {
    MediaController.releaseFuture(controllerFuture)
  }

  @OptIn(UnstableApi::class) // PlayerView.setShowSubtitleButton
  private suspend fun setController() {
    try {
      controller = controllerFuture.await()
    } catch (t: Throwable) {
      Log.w(TAG, "Failed to connect to MediaController", t)
      return
    }
//    playerView.player = controller

//    playerView.setShowSubtitleButton(controller.currentTracks.isTypeSupported(TRACK_TYPE_TEXT))

    controller.addListener(
      object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) {
          if (events.contains(EVENT_TRACKS_CHANGED)) {
//            playerView.setShowSubtitleButton(player.currentTracks.isTypeSupported(TRACK_TYPE_TEXT))
          }
          if (events.contains(EVENT_MEDIA_ITEM_TRANSITION)) {
            // Trigger adapter update to change highlight of current item.
//            mediaItemListAdapter.notifyDataSetChanged()
          }
        }
      }
    )
  }

//  private inner class MediaItemListAdapter(
//    context: Context,
//    viewID: Int,
//    mediaItemList: List<MediaItem>,
//  ) : ArrayAdapter<MediaItem>(context, viewID, mediaItemList) {
//    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
//      val mediaItem = getItem(position)!!
//      val returnConvertView =
//        convertView ?: LayoutInflater.from(context).inflate(R.layout.playlist_items, parent, false)
//
//      returnConvertView.findViewById<TextView>(R.id.media_item).text = mediaItem.mediaMetadata.title
//
//      val deleteButton = returnConvertView.findViewById<Button>(R.id.delete_button)
//      if (::controller.isInitialized && position == controller.currentMediaItemIndex) {
//        // Styles for the current media item list item.
//        returnConvertView.setBackgroundColor(
//          ContextCompat.getColor(context, R.color.playlist_item_background)
//        )
//        returnConvertView
//          .findViewById<TextView>(R.id.media_item)
//          .setTextColor(ContextCompat.getColor(context, R.color.white))
//        deleteButton.visibility = View.GONE
//      } else {
//        // Styles for any other media item list item.
//        returnConvertView.setBackgroundColor(
//          ContextCompat.getColor(context, R.color.player_background)
//        )
//        returnConvertView
//          .findViewById<TextView>(R.id.media_item)
//          .setTextColor(ContextCompat.getColor(context, R.color.white))
//        deleteButton.visibility = View.VISIBLE
//        deleteButton.setOnClickListener {
//          controller.removeMediaItem(position)
//        }
//      }
//
//      return returnConvertView
//    }
//  }
}
