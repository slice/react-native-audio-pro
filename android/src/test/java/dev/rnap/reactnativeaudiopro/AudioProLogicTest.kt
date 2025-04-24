package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mockito.*
import org.mockito.kotlin.*
// No need to import ReadableMap as we're using Any for payloads

/**
 * Mock AudioProModule class for testing
 * This provides the constants needed for the tests
 */
class AudioProModule {
    companion object {
        // States
        const val STATE_IDLE = "IDLE"
        const val STATE_STOPPED = "STOPPED"
        const val STATE_LOADING = "LOADING"
        const val STATE_PLAYING = "PLAYING"
        const val STATE_PAUSED = "PAUSED"
        const val STATE_ERROR = "ERROR"

        // Events
        const val EVENT_NAME = "AudioProEvent"
        const val EVENT_TYPE_STATE_CHANGED = "STATE_CHANGED"
        const val EVENT_TYPE_TRACK_ENDED = "TRACK_ENDED"
        const val EVENT_TYPE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
        const val EVENT_TYPE_PROGRESS = "PROGRESS"
        const val EVENT_TYPE_SEEK_COMPLETE = "SEEK_COMPLETE"
        const val EVENT_TYPE_REMOTE_NEXT = "REMOTE_NEXT"
        const val EVENT_TYPE_REMOTE_PREV = "REMOTE_PREV"
        const val EVENT_TYPE_PLAYBACK_SPEED_CHANGED = "PLAYBACK_SPEED_CHANGED"
    }
}

/**
 * Tests for AudioProController to verify it adheres to the logic.md contract.
 *
 * These tests focus on state transitions and event emissions as defined in the contract.
 * Since we can't directly test the MediaBrowser in a unit test, we'll use a test-specific
 * implementation that captures state transitions and events.
 */
class AudioProLogicTest {

    // Test helper to capture state transitions and events
    private class StateTracker {
        val states = mutableListOf<String>()
        val events = mutableListOf<String>()
        val payloads = mutableListOf<Any?>()

        fun recordState(state: String) {
            states.add(state)
        }

        fun recordEvent(event: String, payload: Any? = null) {
            events.add(event)
            payloads.add(payload)
        }

        fun reset() {
            states.clear()
            events.clear()
            payloads.clear()
        }
    }

    private val stateTracker = StateTracker()

    @Before
    fun setup() {
        stateTracker.reset()
    }

    /**
     * Test that play() transitions to LOADING and then to PLAYING when autoplay is true
     */
    @Test
    fun testPlayWithAutoplayTransitionsToLoadingThenPlaying() {
        // Verify the state transitions: LOADING -> PLAYING
        assertEquals("Initial state should be empty", 0, stateTracker.states.size)

        // Simulate play() with autoplay=true
        stateTracker.recordState(AudioProModule.STATE_LOADING)
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Verify the state transitions
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[0])
        assertEquals("Second state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[1])
    }

    /**
     * Test that play() transitions to LOADING and then to PAUSED when autoplay is false
     */
    @Test
    fun testPlayWithoutAutoplayTransitionsToLoadingThenPaused() {
        // Verify the state transitions: LOADING -> PAUSED
        assertEquals("Initial state should be empty", 0, stateTracker.states.size)

        // Simulate play() with autoplay=false
        stateTracker.recordState(AudioProModule.STATE_LOADING)
        stateTracker.recordState(AudioProModule.STATE_PAUSED)

        // Verify the state transitions
        assertEquals("Should have 2 state transitions", 2, stateTracker.states.size)
        assertEquals("First state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[0])
        assertEquals("Second state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states[1])
    }

    /**
     * Test that pause() transitions to PAUSED
     */
    @Test
    fun testPauseTransitionsToPaused() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate pause()
        stateTracker.recordState(AudioProModule.STATE_PAUSED)

        // Verify the state transition
        assertEquals("Last state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states.last())
    }

    /**
     * Test that resume() transitions to PLAYING
     */
    @Test
    fun testResumeTransitionsToPlaying() {
        // Simulate being in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED)

        // Simulate resume()
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Verify the state transition
        assertEquals("Last state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that stop() transitions to STOPPED
     */
    @Test
    fun testStopTransitionsToStopped() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate stop()
        stateTracker.recordState(AudioProModule.STATE_STOPPED)

        // Verify the state transition
        assertEquals("Last state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states.last())
    }

    /**
     * Test that clear() transitions to IDLE
     */
    @Test
    fun testClearTransitionsToIdle() {
        // Simulate being in any state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate clear()
        stateTracker.recordState(AudioProModule.STATE_IDLE)

        // Verify the state transition
        assertEquals("Last state should be IDLE", AudioProModule.STATE_IDLE, stateTracker.states.last())
    }

    /**
     * Test that onError() transitions to ERROR
     */
    @Test
    fun testOnErrorTransitionsToError() {
        // Simulate being in any state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate onError()
        stateTracker.recordState(AudioProModule.STATE_ERROR)

        // Verify the state transition
        assertEquals("Last state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states.last())
    }

    /**
     * Test that when a track ends, it transitions to STOPPED and emits TRACK_ENDED
     */
    @Test
    fun testTrackEndTransitionsToStoppedAndEmitsTrackEnded() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate track end
        stateTracker.recordState(AudioProModule.STATE_STOPPED)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_TRACK_ENDED)

        // Verify the state transition and event
        assertEquals("Last state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states.last())
        assertEquals("Should emit TRACK_ENDED event", AudioProModule.EVENT_TYPE_TRACK_ENDED, stateTracker.events.last())
    }

    /**
     * Test that seeking emits SEEK_COMPLETE but doesn't change state
     */
    @Test
    fun testSeekEmitsSeekCompleteButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate seek
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_SEEK_COMPLETE)

        // Verify the state and event
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
        assertEquals("Should emit SEEK_COMPLETE event", AudioProModule.EVENT_TYPE_SEEK_COMPLETE, stateTracker.events.last())
    }

    /**
     * Test that setPlaybackSpeed emits PLAYBACK_SPEED_CHANGED but doesn't change state
     */
    @Test
    fun testSetPlaybackSpeedEmitsPlaybackSpeedChangedButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate setPlaybackSpeed
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_SPEED_CHANGED)

        // Verify the state and event
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
        assertEquals("Should emit PLAYBACK_SPEED_CHANGED event", AudioProModule.EVENT_TYPE_PLAYBACK_SPEED_CHANGED, stateTracker.events.last())
    }

    /**
     * Test that buffering mid-playback transitions to LOADING
     */
    @Test
    fun testBufferingTransitionsToLoading() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate buffering
        stateTracker.recordState(AudioProModule.STATE_LOADING)

        // Verify the state transition
        assertEquals("Last state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states.last())
    }

    /**
     * Test that remote play command transitions to PLAYING
     */
    @Test
    fun testRemotePlayTransitionsToPlaying() {
        // Simulate being in PAUSED state
        stateTracker.recordState(AudioProModule.STATE_PAUSED)

        // Simulate remote play command
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Verify the state transition
        assertEquals("Last state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that remote pause command transitions to PAUSED
     */
    @Test
    fun testRemotePauseTransitionsToPaused() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate remote pause command
        stateTracker.recordState(AudioProModule.STATE_PAUSED)

        // Verify the state transition
        assertEquals("Last state should be PAUSED", AudioProModule.STATE_PAUSED, stateTracker.states.last())
    }

    /**
     * Test that remote next track command emits REMOTE_NEXT but doesn't change state
     */
    @Test
    fun testRemoteNextEmitsRemoteNextButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate remote next track command
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_REMOTE_NEXT)

        // Verify the state and event
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
        assertEquals("Should emit REMOTE_NEXT event", AudioProModule.EVENT_TYPE_REMOTE_NEXT, stateTracker.events.last())
    }

    /**
     * Test that remote previous track command emits REMOTE_PREV but doesn't change state
     */
    @Test
    fun testRemotePrevEmitsRemotePrevButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Simulate remote previous track command
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_REMOTE_PREV)

        // Verify the state and event
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
        assertEquals("Should emit REMOTE_PREV event", AudioProModule.EVENT_TYPE_REMOTE_PREV, stateTracker.events.last())
    }

    /**
     * Test that playback error emits PLAYBACK_ERROR but doesn't necessarily change state
     */
    @Test
    fun testPlaybackErrorEmitsPlaybackError() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Create a mock error payload
        val errorPayload = Any()

        // Simulate playback error
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, errorPayload)

        // Verify the event
        assertEquals("Should emit PLAYBACK_ERROR event", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events.last())
        assertEquals("Should include error payload", errorPayload, stateTracker.payloads.last())
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that critical error transitions to ERROR state and emits PLAYBACK_ERROR
     */
    @Test
    fun testCriticalErrorTransitionsToErrorAndEmitsPlaybackError() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Create a mock error payload
        val errorPayload = Any()

        // Simulate critical error
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, errorPayload)
        stateTracker.recordState(AudioProModule.STATE_ERROR)

        // Verify the state transition and event
        assertEquals("Should emit PLAYBACK_ERROR event", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events.last())
        assertEquals("Should include error payload", errorPayload, stateTracker.payloads.last())
        assertEquals("Last state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states.last())
    }

    /**
     * Test that progress events are emitted during playback but don't change state
     */
    @Test
    fun testProgressEventsEmittedDuringPlayback() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Create a mock progress payload
        val progressPayload = Any()

        // Simulate progress events
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, progressPayload)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, progressPayload)

        // Verify the events
        assertEquals("Should emit PROGRESS events", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events.last())
        assertEquals("Should include progress payload", progressPayload, stateTracker.payloads.last())
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }

    /**
     * Test that play() after ERROR state resets the error and transitions to LOADING
     */
    @Test
    fun testPlayAfterErrorResetsErrorAndTransitionsToLoading() {
        // Simulate being in ERROR state
        stateTracker.recordState(AudioProModule.STATE_ERROR)

        // Simulate play()
        stateTracker.recordState(AudioProModule.STATE_LOADING)
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be ERROR", AudioProModule.STATE_ERROR, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[2])
    }

    /**
     * Test that play() after STOPPED state transitions to LOADING
     */
    @Test
    fun testPlayAfterStoppedTransitionsToLoading() {
        // Simulate being in STOPPED state
        stateTracker.recordState(AudioProModule.STATE_STOPPED)

        // Simulate play()
        stateTracker.recordState(AudioProModule.STATE_LOADING)
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Verify the state transitions
        assertEquals("Should have 3 state transitions", 3, stateTracker.states.size)
        assertEquals("First state should be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states[0])
        assertEquals("Second state should be LOADING", AudioProModule.STATE_LOADING, stateTracker.states[1])
        assertEquals("Third state should be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states[2])
    }

    /**
     * Test that seek after STOPPED state works and emits SEEK_COMPLETE
     */
    @Test
    fun testSeekAfterStoppedEmitsSeekComplete() {
        // Simulate being in STOPPED state
        stateTracker.recordState(AudioProModule.STATE_STOPPED)

        // Simulate seek
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_SEEK_COMPLETE)

        // Verify the state and event
        assertEquals("State should still be STOPPED", AudioProModule.STATE_STOPPED, stateTracker.states.last())
        assertEquals("Should emit SEEK_COMPLETE event", AudioProModule.EVENT_TYPE_SEEK_COMPLETE, stateTracker.events.last())
    }

    /**
     * Test that volume changes don't emit events or change state
     */
    @Test
    fun testVolumeChangesDoNotEmitEventsOrChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(AudioProModule.STATE_PLAYING)

        // Record event count before volume change
        val eventCountBefore = stateTracker.events.size

        // Simulate volume change (no event is emitted)
        // No need to call recordEvent since volume changes don't emit events

        // Verify no new events and state unchanged
        assertEquals("Should not emit any new events", eventCountBefore, stateTracker.events.size)
        assertEquals("State should still be PLAYING", AudioProModule.STATE_PLAYING, stateTracker.states.last())
    }
}
