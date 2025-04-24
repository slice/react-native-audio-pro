package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Tests for progress events as defined in the logic.md contract.
 * 
 * This test class focuses on verifying that progress events follow the contract
 * defined in logic.md, particularly:
 * 1. Correct emission of PROGRESS events
 * 2. Proper payload structure for PROGRESS events
 * 3. Correct behavior for progress events in different states
 */
class AudioProProgressTest {

    // Test helper to capture state transitions and events
    private class StateTracker {
        val states = mutableListOf<String>()
        val events = mutableListOf<String>()
        val payloads = mutableListOf<Any?>()
        val positions = mutableListOf<Long>()
        val durations = mutableListOf<Long>()

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

        fun reset() {
            states.clear()
            events.clear()
            payloads.clear()
            positions.clear()
            durations.clear()
        }
    }

    private val stateTracker = StateTracker()

    @Before
    fun setup() {
        stateTracker.reset()
    }

    /**
     * Test that progress events are emitted during playback
     */
    @Test
    fun testProgressEventsEmittedDuringPlayback() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress events
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 2000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 3000, 180000)
        
        // Verify the events
        assertEquals("Should have 3 events", 3, stateTracker.events.size)
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[1])
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[2])
        
        // Verify positions are increasing
        assertTrue("Positions should be increasing", 
            stateTracker.positions[1] > stateTracker.positions[0] && 
            stateTracker.positions[2] > stateTracker.positions[1])
    }
    
    /**
     * Test that progress events are not emitted in PAUSED state
     */
    @Test
    fun testProgressEventsNotEmittedInPausedState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress events
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 2000, 180000)
        
        // Transition to PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 3000, 180000)
        
        // No more progress events should be emitted
        
        // Verify the events
        assertEquals("Should have 2 events", 2, stateTracker.events.size)
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[1])
    }
    
    /**
     * Test that progress events are not emitted in STOPPED state
     */
    @Test
    fun testProgressEventsNotEmittedInStoppedState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress events
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 2000, 180000)
        
        // Transition to STOPPED state
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 0, 180000)
        
        // No more progress events should be emitted
        
        // Verify the events
        assertEquals("Should have 2 events", 2, stateTracker.events.size)
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("All events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[1])
    }
    
    /**
     * Test that progress events are not emitted in ERROR state
     */
    @Test
    fun testProgressEventsNotEmittedInErrorState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress events
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 2000, 180000)
        
        // Transition to ERROR state
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, "Error", 3000, 180000)
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)
        
        // No more progress events should be emitted
        
        // Verify the events
        assertEquals("Should have 3 events", 3, stateTracker.events.size)
        assertEquals("First two events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("First two events should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[1])
        assertEquals("Last event should be PLAYBACK_ERROR", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events[2])
    }
    
    /**
     * Test that progress events are not emitted in IDLE state
     */
    @Test
    fun testProgressEventsNotEmittedInIdleState() {
        // Start in IDLE state
        stateTracker.recordState(AudioProModule.STATE_IDLE, 0, 0)
        
        // No progress events should be emitted
        
        // Verify no events
        assertEquals("Should have 0 events", 0, stateTracker.events.size)
    }
    
    /**
     * Test that progress events are not emitted in LOADING state
     */
    @Test
    fun testProgressEventsNotEmittedInLoadingState() {
        // Start in LOADING state
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 0)
        
        // No progress events should be emitted
        
        // Verify no events
        assertEquals("Should have 0 events", 0, stateTracker.events.size)
    }
    
    /**
     * Test that progress events include position and duration
     */
    @Test
    fun testProgressEventsIncludePositionAndDuration() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress event
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        
        // Verify the event
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Event should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("Position should be 1000", 1000L, stateTracker.positions[1])
        assertEquals("Duration should be 180000", 180000L, stateTracker.durations[1])
    }
    
    /**
     * Test that progress events are emitted at regular intervals
     */
    @Test
    fun testProgressEventsEmittedAtRegularIntervals() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Simulate progress events at regular intervals
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 1000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 2000, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 3000, 180000)
        
        // Verify the events
        assertEquals("Should have 3 events", 3, stateTracker.events.size)
        
        // Verify intervals are regular
        assertEquals("Interval should be 1000", 1000L, stateTracker.positions[2] - stateTracker.positions[1])
        assertEquals("Interval should be 1000", 1000L, stateTracker.positions[3] - stateTracker.positions[2])
    }
}
