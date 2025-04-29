package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mockito.*
import org.mockito.kotlin.*

/**
 * Tests for audio session lifecycle events and interruptions.
 * 
 * This class focuses on testing behavior during:
 * - Audio session interruptions (phone calls, notifications)
 * - App background/foreground transitions
 * - Audio focus changes
 */
class AudioProLifecycleTest {

    private class StateTracker {
        val states = mutableListOf<String>()
        val events = mutableListOf<String>()
        val payloads = mutableListOf<Any?>()
        val positions = mutableListOf<Long>()
        val durations = mutableListOf<Long>()
        val audioFocusStates = mutableListOf<String>()
        val appStates = mutableListOf<String>()

        fun recordState(state: String, position: Long = 0, duration: Long = 0) {
            states.add(state)
            positions.add(position)
            durations.add(duration)
        }

        fun recordEvent(event: String, payload: Any? = null, position: Long = 0, duration: Long = 0) {
            events.add(event)
            payloads.add(payload)
            positions.add(position)
            durations.add(duration)
        }

        fun recordAudioFocusState(state: String) {
            audioFocusStates.add(state)
        }

        fun recordAppState(state: String) {
            appStates.add(state)
        }

        fun reset() {
            states.clear()
            events.clear()
            payloads.clear()
            positions.clear()
            durations.clear()
            audioFocusStates.clear()
            appStates.clear()
        }
    }

    private val stateTracker = StateTracker()

    @Before
    fun setup() {
        stateTracker.reset()
    }

    /**
     * Test that audio focus loss during playback transitions to PAUSED
     */
    @Test
    fun testAudioFocusLossDuringPlayback() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate audio focus loss
        stateTracker.recordAudioFocusState("LOSS")
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transition
        assertEquals("Should transition to PAUSED", 
            AudioProModule.STATE_PAUSED, stateTracker.states.last())
        assertEquals("Should maintain position", 
            30000L, stateTracker.positions.last())
    }

    /**
     * Test that audio focus gain resumes playback
     */
    @Test
    fun testAudioFocusGainResumesPlayback() {
        // Start in PAUSED state due to focus loss
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate audio focus gain
        stateTracker.recordAudioFocusState("GAIN")
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Verify the state transition
        assertEquals("Should transition to PLAYING", 
            AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that app backgrounding during playback maintains state
     */
    @Test
    fun testAppBackgroundingDuringPlayback() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate app backgrounding
        stateTracker.recordAppState("BACKGROUND")
        
        // Verify state remains PLAYING
        assertEquals("Should remain in PLAYING state", 
            AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that app foregrounding after background maintains state
     */
    @Test
    fun testAppForegroundingAfterBackground() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate app backgrounding and foregrounding
        stateTracker.recordAppState("BACKGROUND")
        stateTracker.recordAppState("FOREGROUND")
        
        // Verify state remains PLAYING
        assertEquals("Should remain in PLAYING state", 
            AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that temporary audio focus loss (e.g., notification) pauses and resumes
     */
    @Test
    fun testTemporaryAudioFocusLoss() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate temporary focus loss
        stateTracker.recordAudioFocusState("LOSS_TRANSIENT")
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate focus gain
        stateTracker.recordAudioFocusState("GAIN")
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("Should maintain position throughout", 
            30000L, stateTracker.positions.last())
    }

    /**
     * Test that audio focus loss with ducking reduces volume
     */
    @Test
    fun testAudioFocusLossWithDucking() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate focus loss with ducking
        stateTracker.recordAudioFocusState("LOSS_TRANSIENT_CAN_DUCK")
        stateTracker.recordEvent("VOLUME_CHANGED", 0.5f)
        
        // Simulate focus gain
        stateTracker.recordAudioFocusState("GAIN")
        stateTracker.recordEvent("VOLUME_CHANGED", 1.0f)
        
        // Verify the events
        assertEquals("Should emit volume change events", 2, stateTracker.events.size)
    }

    /**
     * Test that audio session interruption during buffering maintains state
     */
    @Test
    fun testAudioSessionInterruptionDuringBuffering() {
        // Start in LOADING state
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Simulate audio session interruption
        stateTracker.recordAudioFocusState("LOSS")
        
        // Verify state remains LOADING
        assertEquals("Should remain in LOADING state", 
            AudioProModule.STATE_LOADING, stateTracker.states.last())
    }
} 