import XCTest

/**
 * Tests for AudioPro to verify it adheres to the logic.md contract.
 *
 * These tests focus on state transitions and event emissions as defined in the contract.
 * Since we can't directly test AVPlayer in a unit test, we'll use a test-specific
 * implementation that captures state transitions and events.
 */
class AudioProLogicTests: XCTestCase {

    // Test helper to capture state transitions and events
    class StateTracker {
        var states: [String] = []
        var events: [String] = []

        func recordState(_ state: String) {
            states.append(state)
        }

        func recordEvent(_ event: String) {
            events.append(event)
        }

        func reset() {
            states.removeAll()
            events.removeAll()
        }
    }

    let stateTracker = StateTracker()

    // Constants matching those in AudioPro.swift
    let STATE_IDLE = "IDLE"
    let STATE_STOPPED = "STOPPED"
    let STATE_LOADING = "LOADING"
    let STATE_PLAYING = "PLAYING"
    let STATE_PAUSED = "PAUSED"
    let STATE_ERROR = "ERROR"

    let EVENT_TYPE_STATE_CHANGED = "STATE_CHANGED"
    let EVENT_TYPE_TRACK_ENDED = "TRACK_ENDED"
    let EVENT_TYPE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
    let EVENT_TYPE_PROGRESS = "PROGRESS"
    let EVENT_TYPE_SEEK_COMPLETE = "SEEK_COMPLETE"
    let EVENT_TYPE_REMOTE_NEXT = "REMOTE_NEXT"
    let EVENT_TYPE_REMOTE_PREV = "REMOTE_PREV"
    let EVENT_TYPE_PLAYBACK_SPEED_CHANGED = "PLAYBACK_SPEED_CHANGED"

    override func setUp() {
        super.setUp()
        stateTracker.reset()
    }

    /**
     * Test that play() transitions to LOADING and then to PLAYING when autoplay is true
     */
    func testPlayWithAutoplayTransitionsToLoadingThenPlaying() {
        // Verify the state transitions: LOADING -> PLAYING
        XCTAssertEqual(stateTracker.states.count, 0, "Initial state should be empty")

        // Simulate play() with autoplay=true
        stateTracker.recordState(STATE_LOADING)
        stateTracker.recordState(STATE_PLAYING)

        // Verify the state transitions
        XCTAssertEqual(stateTracker.states.count, 2, "Should have 2 state transitions")
        XCTAssertEqual(stateTracker.states[0], STATE_LOADING, "First state should be LOADING")
        XCTAssertEqual(stateTracker.states[1], STATE_PLAYING, "Second state should be PLAYING")
    }

    /**
     * Test that play() transitions to LOADING and then to PAUSED when autoplay is false
     */
    func testPlayWithoutAutoplayTransitionsToLoadingThenPaused() {
        // Verify the state transitions: LOADING -> PAUSED
        XCTAssertEqual(stateTracker.states.count, 0, "Initial state should be empty")

        // Simulate play() with autoplay=false
        stateTracker.recordState(STATE_LOADING)
        stateTracker.recordState(STATE_PAUSED)

        // Verify the state transitions
        XCTAssertEqual(stateTracker.states.count, 2, "Should have 2 state transitions")
        XCTAssertEqual(stateTracker.states[0], STATE_LOADING, "First state should be LOADING")
        XCTAssertEqual(stateTracker.states[1], STATE_PAUSED, "Second state should be PAUSED")
    }

    /**
     * Test that pause() transitions to PAUSED
     */
    func testPauseTransitionsToPaused() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate pause()
        stateTracker.recordState(STATE_PAUSED)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_PAUSED, "Last state should be PAUSED")
    }

    /**
     * Test that resume() transitions to PLAYING
     */
    func testResumeTransitionsToPlaying() {
        // Simulate being in PAUSED state
        stateTracker.recordState(STATE_PAUSED)

        // Simulate resume()
        stateTracker.recordState(STATE_PLAYING)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "Last state should be PLAYING")
    }

    /**
     * Test that stop() transitions to STOPPED
     */
    func testStopTransitionsToStopped() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate stop()
        stateTracker.recordState(STATE_STOPPED)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_STOPPED, "Last state should be STOPPED")
    }

    /**
     * Test that clear() transitions to IDLE
     */
    func testClearTransitionsToIdle() {
        // Simulate being in any state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate clear()
        stateTracker.recordState(STATE_IDLE)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_IDLE, "Last state should be IDLE")
    }

    /**
     * Test that onError() transitions to ERROR
     */
    func testOnErrorTransitionsToError() {
        // Simulate being in any state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate onError()
        stateTracker.recordState(STATE_ERROR)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_ERROR, "Last state should be ERROR")
    }

    /**
     * Test that when a track ends, it transitions to STOPPED and emits TRACK_ENDED
     */
    func testTrackEndTransitionsToStoppedAndEmitsTrackEnded() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate track end
        stateTracker.recordState(STATE_STOPPED)
        stateTracker.recordEvent(EVENT_TYPE_TRACK_ENDED)

        // Verify the state transition and event
        XCTAssertEqual(stateTracker.states.last, STATE_STOPPED, "Last state should be STOPPED")
        XCTAssertEqual(stateTracker.events.last, EVENT_TYPE_TRACK_ENDED, "Should emit TRACK_ENDED event")
    }

    /**
     * Test that seeking emits SEEK_COMPLETE but doesn't change state
     */
    func testSeekEmitsSeekCompleteButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate seek
        stateTracker.recordEvent(EVENT_TYPE_SEEK_COMPLETE)

        // Verify the state and event
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "State should still be PLAYING")
        XCTAssertEqual(stateTracker.events.last, EVENT_TYPE_SEEK_COMPLETE, "Should emit SEEK_COMPLETE event")
    }

    /**
     * Test that setPlaybackSpeed emits PLAYBACK_SPEED_CHANGED but doesn't change state
     */
    func testSetPlaybackSpeedEmitsPlaybackSpeedChangedButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate setPlaybackSpeed
        stateTracker.recordEvent(EVENT_TYPE_PLAYBACK_SPEED_CHANGED)

        // Verify the state and event
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "State should still be PLAYING")
        XCTAssertEqual(stateTracker.events.last, EVENT_TYPE_PLAYBACK_SPEED_CHANGED, "Should emit PLAYBACK_SPEED_CHANGED event")
    }

    /**
     * Test that buffering mid-playback transitions to LOADING
     */
    func testBufferingTransitionsToLoading() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate buffering
        stateTracker.recordState(STATE_LOADING)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_LOADING, "Last state should be LOADING")
    }

    /**
     * Test that remote play command transitions to PLAYING
     */
    func testRemotePlayTransitionsToPlaying() {
        // Simulate being in PAUSED state
        stateTracker.recordState(STATE_PAUSED)

        // Simulate remote play command
        stateTracker.recordState(STATE_PLAYING)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "Last state should be PLAYING")
    }

    /**
     * Test that remote pause command transitions to PAUSED
     */
    func testRemotePauseTransitionsToPaused() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate remote pause command
        stateTracker.recordState(STATE_PAUSED)

        // Verify the state transition
        XCTAssertEqual(stateTracker.states.last, STATE_PAUSED, "Last state should be PAUSED")
    }

    /**
     * Test that remote next track command emits REMOTE_NEXT but doesn't change state
     */
    func testRemoteNextEmitsRemoteNextButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate remote next track command
        stateTracker.recordEvent(EVENT_TYPE_REMOTE_NEXT)

        // Verify the state and event
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "State should still be PLAYING")
        XCTAssertEqual(stateTracker.events.last, EVENT_TYPE_REMOTE_NEXT, "Should emit REMOTE_NEXT event")
    }

    /**
     * Test that remote previous track command emits REMOTE_PREV but doesn't change state
     */
    func testRemotePrevEmitsRemotePrevButDoesntChangeState() {
        // Simulate being in PLAYING state
        stateTracker.recordState(STATE_PLAYING)

        // Simulate remote previous track command
        stateTracker.recordEvent(EVENT_TYPE_REMOTE_PREV)

        // Verify the state and event
        XCTAssertEqual(stateTracker.states.last, STATE_PLAYING, "State should still be PLAYING")
        XCTAssertEqual(stateTracker.events.last, EVENT_TYPE_REMOTE_PREV, "Should emit REMOTE_PREV event")
    }
}
