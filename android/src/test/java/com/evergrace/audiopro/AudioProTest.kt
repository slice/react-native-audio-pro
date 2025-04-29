package com.evergrace.audiopro

import android.media.MediaPlayer
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class AudioProTest {
    @Mock
    private lateinit var mockMediaPlayer: MediaPlayer

    private lateinit var audioPro: AudioPro

    @Before
    fun setup() {
        MockitoAnnotations.initMocks(this)
        audioPro = AudioPro()
        audioPro.mediaPlayer = mockMediaPlayer
    }

    @Test
    fun testStartTimeMsHandling() {
        // Setup
        val startTimeMs = 5000L
        val track = mapOf(
            "id" to "test",
            "url" to "https://example.com/test.mp3",
            "title" to "Test Track"
        )
        val options = mapOf(
            "startTimeMs" to startTimeMs,
            "autoplay" to true
        )

        // Execute
        audioPro.play(track, options)

        // Verify
        verify(mockMediaPlayer).seekTo(startTimeMs.toInt())
        verify(mockMediaPlayer).start()
    }

    @Test
    fun testStartTimeMsWithAutoplayFalse() {
        // Setup
        val startTimeMs = 5000L
        val track = mapOf(
            "id" to "test",
            "url" to "https://example.com/test.mp3",
            "title" to "Test Track"
        )
        val options = mapOf(
            "startTimeMs" to startTimeMs,
            "autoplay" to false
        )

        // Execute
        audioPro.play(track, options)

        // Verify
        verify(mockMediaPlayer).seekTo(startTimeMs.toInt())
        verify(mockMediaPlayer, never()).start()
    }

    @Test
    fun testStartTimeMsClearedAfterSeek() {
        // Setup
        val startTimeMs = 5000L
        val track = mapOf(
            "id" to "test",
            "url" to "https://example.com/test.mp3",
            "title" to "Test Track"
        )
        val options = mapOf(
            "startTimeMs" to startTimeMs,
            "autoplay" to true
        )

        // Execute
        audioPro.play(track, options)
        audioPro.onSeekComplete(mockMediaPlayer)

        // Verify
        verify(mockMediaPlayer).seekTo(startTimeMs.toInt())
        verify(mockMediaPlayer).start()
        // Verify that startTimeMs is cleared after seek completes
        assert(audioPro.pendingStartTimeMs == null)
    }

    @Test
    fun testStartTimeMsClearedOnError() {
        // Setup
        val startTimeMs = 5000L
        val track = mapOf(
            "id" to "test",
            "url" to "https://example.com/test.mp3",
            "title" to "Test Track"
        )
        val options = mapOf(
            "startTimeMs" to startTimeMs,
            "autoplay" to true
        )

        // Execute
        audioPro.play(track, options)
        audioPro.onPlayerError(mockMediaPlayer, 0, 0)

        // Verify
        verify(mockMediaPlayer).seekTo(startTimeMs.toInt())
        // Verify that startTimeMs is cleared on error
        assert(audioPro.pendingStartTimeMs == null)
    }
} 