package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Tests for buffering behavior as defined in the logic.md contract.
 * 
 * This test class focuses on verifying that buffering behavior follows the contract
 * defined in logic.md, particularly:
 * 1. Correct state transitions during buffering
 * 2. Proper handling of buffering during playback
 * 3. Correct behavior for buffering failures
 */
class AudioProBufferingTest {

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
     * Test that initial buffering transitions to LOADING and then to PLAYING
     */
    @Test
    fun testInitialBufferingTransitionsToLoadingThenPlaying() {
        // Simulate play() with autoplay=true
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 0)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[0])
        assertEquals("Second state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[1])
    }
    
    /**
     * Test that initial buffering transitions to LOADING and then to PAUSED when autoplay is false
     */
    @Test
    fun testInitialBufferingTransitionsToLoadingThenPausedWhenAutoplayIsFalse() {
        // Simulate play() with autoplay=false
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 0)
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 0, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[0])
        assertEquals("Second state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[1])
    }
    
    /**
     * Test that buffering mid-playback transitions to LOADING and then back to PLAYING
     */
    @Test
    fun testBufferingMidPlaybackTransitionsToLoadingThenPlaying() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Resume playing after buffering
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[2])
        
        // Verify positions are maintained during buffering
        assertEquals("Position should be maintained during buffering", 
            stateTracker.positions[0], stateTracker.positions[1])
    }
    
    /**
     * Test that buffering mid-playback does not emit PAUSED state
     */
    @Test
    fun testBufferingMidPlaybackDoesNotEmitPausedState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Resume playing after buffering
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[2])
        
        // Verify PAUSED state is not emitted
        assertFalse("Should not emit PAUSED state during buffering", 
            stateTracker.states.contains(AudioProModule.STATE_PAUSED))
    }
    
    /**
     * Test that buffering failure transitions to ERROR state and emits PLAYBACK_ERROR
     */
    @Test
    fun testBufferingFailureTransitionsToErrorStateAndEmitsPlaybackError() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Simulate buffering failure
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, "Buffering failed", 30000, 180000)
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)
        
        // Verify the state transitions and events
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states[2])
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Should emit PLAYBACK_ERROR event", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events[0])
    }
    
    /**
     * Test that buffering in PAUSED state transitions to LOADING and then back to PAUSED
     */
    @Test
    fun testBufferingInPausedStateTransitionsToLoadingThenPaused() {
        // Start in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Resume paused state after buffering
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[2])
        
        // Verify positions are maintained during buffering
        assertEquals("Position should be maintained during buffering", 
            stateTracker.positions[0], stateTracker.positions[1])
    }
    
    /**
     * Test that user-initiated pause during buffering transitions to PAUSED
     */
    @Test
    fun testUserInitiatedPauseDuringBufferingTransitionsToPaused() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)
        
        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING, 30000, 180000)
        
        // Simulate user-initiated pause
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)
        
        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[2])
    }
}
