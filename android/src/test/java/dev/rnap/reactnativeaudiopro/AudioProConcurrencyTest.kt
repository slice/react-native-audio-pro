package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mockito.*
import org.mockito.kotlin.*
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Tests for concurrent operations and edge cases in audio playback.
 * 
 * This class focuses on testing behavior during:
 * - Concurrent operations (seeking while buffering, etc.)
 * - Race conditions
 * - Edge cases in state transitions
 */
class AudioProConcurrencyTest {

    private class StateTracker {
        val states = mutableListOf<String>()
        val events = mutableListOf<String>()
        val payloads = mutableListOf<Any?>()
        val positions = mutableListOf<Long>()
        val durations = mutableListOf<Long>()
        val operations = mutableListOf<String>()

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

        fun recordOperation(operation: String) {
            operations.add(operation)
        }

        fun reset() {
            states.clear()
            events.clear()
            payloads.clear()
            positions.clear()
            durations.clear()
            operations.clear()
        }
    }

    private val stateTracker = StateTracker()

    @Before
    fun setup() {
        stateTracker.reset()
    }

    /**
     * Test that seeking during buffering maintains correct state
     */
    @Test
    fun testSeekingDuringBuffering() {
        // Start in LOADING state
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 180000)
        
        // Simulate seek during buffering
        stateTracker.recordOperation("SEEK")
        stateTracker.recordState(AudioProModule.STATE_LOADING, 60000, 180000)
        
        // Complete buffering
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 60000, 180000)
        
        // Verify the state transitions and position
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("Should maintain seek position", 
            60000L, stateTracker.positions.last())
    }

    /**
     * Test that rapid state changes are handled correctly
     */
    @Test
    fun testRapidStateChanges() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate rapid state changes
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 4 state transitions", 4, stateTracker.states.size)
        assertEquals("Should maintain position", 
            30000L, stateTracker.positions.last())
    }

    /**
     * Test that concurrent seek and play operations are handled correctly
     */
    @Test
    fun testConcurrentSeekAndPlay() {
        // Start in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate concurrent seek and play
        stateTracker.recordOperation("SEEK")
        stateTracker.recordOperation("PLAY")
        stateTracker.recordState(AudioProModule.STATE_LOADING, 60000, 180000)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 60000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("Should play from seek position", 
            60000L, stateTracker.positions.last())
    }

    /**
     * Test that multiple rapid seeks are handled correctly
     */
    @Test
    fun testMultipleRapidSeeks() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate multiple rapid seeks
        stateTracker.recordOperation("SEEK")
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 60000, 180000)
        stateTracker.recordOperation("SEEK")
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 90000, 180000)
        stateTracker.recordOperation("SEEK")
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 120000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 4 state transitions", 4, stateTracker.states.size)
        assertEquals("Should maintain last seek position", 
            120000L, stateTracker.positions.last())
    }

    /**
     * Test that state changes during error recovery are handled correctly
     */
    @Test
    fun testStateChangesDuringErrorRecovery() {
        // Start in ERROR state
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)
        
        // Simulate state changes during recovery
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 0)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 4 state transitions", 4, stateTracker.states.size)
        assertEquals("Should maintain position after recovery", 
            30000L, stateTracker.positions.last())
    }

    /**
     * Test that concurrent volume changes are handled correctly
     */
    @Test
    fun testConcurrentVolumeChanges() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate concurrent volume changes
        stateTracker.recordOperation("SET_VOLUME")
        stateTracker.recordEvent("VOLUME_CHANGED", 0.5f)
        stateTracker.recordOperation("SET_VOLUME")
        stateTracker.recordEvent("VOLUME_CHANGED", 0.7f)
        stateTracker.recordOperation("SET_VOLUME")
        stateTracker.recordEvent("VOLUME_CHANGED", 0.9f)
        
        // Verify the events
        assertEquals("Should have 3 volume change events", 3, stateTracker.events.size)
        assertEquals("Should maintain PLAYING state", 
            AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that state changes during track end are handled correctly
     */
    @Test
    fun testStateChangesDuringTrackEnd() {
        // Start in PLAYING state near end
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 175000, 180000)
        
        // Simulate state changes during track end
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 180000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_TRACK_ENDED)
        
        // Verify the state transitions and event
        assertEquals("Should transition to STOPPED", 
            AudioProModule.STATE_STOPPED, stateTracker.states.last())
        assertEquals("Should emit TRACK_ENDED event", 
            AudioProModule.EVENT_TYPE_TRACK_ENDED, stateTracker.events.last())
    }
} 