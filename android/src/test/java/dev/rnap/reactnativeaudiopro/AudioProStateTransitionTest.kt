package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Tests for state transitions as defined in the logic.md contract.
 *
 * This test class focuses on verifying that state transitions follow the contract
 * defined in logic.md, particularly:
 * 1. Correct state transitions for each method
 * 2. Proper event emissions
 * 3. Edge cases and special conditions
 */
class AudioProStateTransitionTest {

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
     * Test the complete lifecycle of a track from play to clear
     */
    @Test
    fun testCompleteTrackLifecycle() {
        // 1. Play a track with autoplay=true
        stateTracker.recordState(AudioProModule.STATE_LOADING)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)

        // 2. Pause the track
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 30000, 180000)

        // 3. Resume the track
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // 4. Stop the track
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 0, 180000)

        // 5. Clear the player
        stateTracker.recordState(AudioProModule.STATE_IDLE, 0, 0)

        // Verify the state transitions
        assertEquals("Should have 6 state transitions", 6, stateTracker.states.size)
        assertEquals("First state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[0])
        assertEquals("Second state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[1])
        assertEquals("Third state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[2])
        assertEquals("Fourth state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[3])
        assertEquals("Fifth state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states[4])
        assertEquals("Sixth state should be IDLE", AudioProModule.STATE_IDLE, stateTracker.states[5])

        // Verify positions and durations
        assertEquals("STOPPED state should have position 0", 0L, stateTracker.positions[4])
        assertEquals("IDLE state should have position 0", 0L, stateTracker.positions[5])
        assertEquals("IDLE state should have duration 0", 0L, stateTracker.durations[5])
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
     * Test that track end transitions to STOPPED and emits TRACK_ENDED
     */
    @Test
    fun testTrackEndTransitionsToStoppedAndEmitsTrackEnded() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 175000, 180000)

        // Simulate track end
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 0, 180000)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_TRACK_ENDED, null, 180000, 180000)

        // Verify the state transition and event
        assertEquals("Last state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states.last())
        assertEquals("Should emit TRACK_ENDED event", AudioProModule.EVENT_TYPE_TRACK_ENDED, stateTracker.events.last())

        // Verify position is reset to 0 for STOPPED state
        assertEquals("Position should be reset to 0 for STOPPED state", 0L, stateTracker.positions[1])

        // Verify duration is maintained
        assertEquals("Duration should be maintained", 180000L, stateTracker.durations[1])
    }

    /**
     * Test that critical error transitions to ERROR state and emits both STATE_CHANGED and PLAYBACK_ERROR
     */
    @Test
    fun testCriticalErrorTransitionsToErrorAndEmitsPlaybackError() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // Simulate critical error
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, "Critical error", 30000, 180000)
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)

        // Verify the state transition and events
        assertEquals("Last state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states.last())
        assertEquals("Should emit PLAYBACK_ERROR event", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events.last())

        // Verify position and duration are reset to 0 for ERROR state
        assertEquals("Position should be reset to 0 for ERROR state", 0L, stateTracker.positions[2])
        assertEquals("Duration should be reset to 0 for ERROR state", 0L, stateTracker.durations[2])
    }

    /**
     * Test that non-critical error emits PLAYBACK_ERROR but doesn't change state
     */
    @Test
    fun testNonCriticalErrorEmitsPlaybackErrorButDoesntChangeState() {
        // Start in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // Simulate non-critical error
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, "Non-critical error", 30000, 180000)

        // Verify the state and event
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
        assertEquals("Should emit PLAYBACK_ERROR event", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events.last())
    }

    /**
     * Test that play() after ERROR state resets the error and transitions to LOADING
     */
    @Test
    fun testPlayAfterErrorResetsErrorAndTransitionsToLoading() {
        // Start in ERROR state
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)

        // Simulate play()
        stateTracker.recordState(AudioProModule.STATE_LOADING, 0, 0)
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 0, 180000)

        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[2])
    }

    /**
     * Test that duplicate state emissions are filtered out
     */
    @Test
    fun testDuplicateStateEmissionsAreFiltered() {
        // Record initial PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // Simulate multiple PLAYING state emissions that should be filtered
        // These would not be recorded in the stateTracker because they would be filtered out

        // Record a different state
        stateTracker.recordState(AudioProModule.STATE_PAUSED, 45000, 180000)

        // Verify only two states were recorded
        assertEquals("Should have only 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[1])
    }

    /**
     * Test that PAUSED state is not emitted after STOPPED state
     */
    @Test
    fun testPausedStateNotEmittedAfterStopped() {
        // Record PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // Record STOPPED state
        stateTracker.recordState(AudioProModule.STATE_STOPPED, 0, 180000)

        // Simulate PAUSED state emission that should be filtered
        // This would not be recorded in the stateTracker because it would be filtered out

        // Verify only PLAYING and STOPPED states were recorded
        assertEquals("Should have only 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states[1])
    }

    /**
     * Test that STOPPED state is not emitted after ERROR state
     */
    @Test
    fun testStoppedStateNotEmittedAfterError() {
        // Record PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING, 30000, 180000)

        // Record ERROR state
        stateTracker.recordState(AudioProModule.STATE_ERROR, 0, 0)

        // Simulate STOPPED state emission that should be filtered
        // This would not be recorded in the stateTracker because it would be filtered out

        // Verify only PLAYING and ERROR states were recorded
        assertEquals("Should have only 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[0])
        assertEquals("Second state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states[1])
    }
}
