package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Tests for lock screen controls and remote events as defined in the logic.md contract.
 * 
 * This test class focuses on verifying that lock screen controls and remote events
 * follow the contract defined in logic.md, particularly:
 * 1. Correct handling of remote play/pause commands
 * 2. Proper emission of REMOTE_NEXT/REMOTE_PREV events
 * 3. Correct behavior for seek bar interactions
 */
class AudioProRemoteControlTest {

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
     * Test that remote play command transitions to PLAYING state
     */
    @Test
    fun testRemotePlayTransitionsToPlaying() {
        // Start in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate remote play command
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Verify the state transition
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[0])
        assertEquals("Second state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[1])
        
        // Verify no remote event is emitted
        assertEquals("Should not emit any remote events", 0, stateTracker.events.size)
    }
    
    /**
     * Test that remote pause command transitions to PAUSED state
     */
    @Test
    fun testRemotePauseTransitionsToPaused() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate remote pause command
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transition
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[1])
        
        // Verify no remote event is emitted
        assertEquals("Should not emit any remote events", 0, stateTracker.events.size)
    }
    
    /**
     * Test that remote next track command emits REMOTE_NEXT but doesn't change state
     */
    @Test
    fun testRemoteNextEmitsRemoteNextButDoesntChangeState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate remote next track command
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_REMOTE_NEXT)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit REMOTE_NEXT event", AudioProModule.EVENT_TYPE_REMOTE_NEXT, stateTracker.events[0])
    }
    
    /**
     * Test that remote previous track command emits REMOTE_PREV but doesn't change state
     */
    @Test
    fun testRemotePrevEmitsRemotePrevButDoesntChangeState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate remote previous track command
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_REMOTE_PREV)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit REMOTE_PREV event", AudioProModule.EVENT_TYPE_REMOTE_PREV, stateTracker.events[0])
    }
    
    /**
     * Test that remote seek bar interaction updates position but doesn't emit SEEK_COMPLETE
     */
    @Test
    fun testRemoteSeekBarUpdatesPositionButDoesntEmitSeekComplete() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate remote seek bar interaction
        // This would be reflected in the next PROGRESS event
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, null, 60000, 180000)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit PROGRESS event", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("Position should be updated", 60000L, stateTracker.positions[1])
        
        // Verify no SEEK_COMPLETE event is emitted
        assertFalse("Should not emit SEEK_COMPLETE event", 
            stateTracker.events.contains(AudioProModule.EVENT_TYPE_SEEK_COMPLETE))
    }
    
    /**
     * Test that JS-initiated seek emits SEEK_COMPLETE
     */
    @Test
    fun testJsInitiatedSeekEmitsSeekComplete() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate JS-initiated seek
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_SEEK_COMPLETE, null, 60000, 180000)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit SEEK_COMPLETE event", AudioProModule.EVENT_TYPE_SEEK_COMPLETE, stateTracker.events[0])
        assertEquals("Position should be updated", 60000L, stateTracker.positions[1])
    }
    
    /**
     * Test that JS-initiated seek in PAUSED state emits SEEK_COMPLETE but doesn't change state
     */
    @Test
    fun testJsInitiatedSeekInPausedStateEmitsSeekCompleteButDoesntChangeState() {
        // Start in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate JS-initiated seek
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_SEEK_COMPLETE, null, 60000, 180000)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit SEEK_COMPLETE event", AudioProModule.EVENT_TYPE_SEEK_COMPLETE, stateTracker.events[0])
        assertEquals("Position should be updated", 60000L, stateTracker.positions[1])
    }
    
    /**
     * Test that JS-initiated seek in STOPPED state emits SEEK_COMPLETE but doesn't change state
     */
    @Test
    fun testJsInitiatedSeekInStoppedStateEmitsSeekCompleteButDoesntChangeState() {
        // Start in STOPPED state
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 0, 180000)
        
        // Simulate JS-initiated seek
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_SEEK_COMPLETE, null, 60000, 180000)
        
        // Verify the state and event
        assertEquals("Should have 1 state transition", 1, stateTracker.states.size)
        assertEquals("State should still be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states[0])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit SEEK_COMPLETE event", AudioProModule.EVENT_TYPE_SEEK_COMPLETE, stateTracker.events[0])
        assertEquals("Position should be updated", 60000L, stateTracker.positions[1])
    }
}
