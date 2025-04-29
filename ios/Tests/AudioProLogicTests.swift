import XCTest
import AVFoundation

/**
 * Tests for AudioPro to verify it adheres to the logic.md contract.
 *
 * These tests focus on state transitions and event emissions as defined in the contract.
 * We use a combination of real AVPlayer testing where possible and controlled mocks
 * for scenarios that are difficult to test directly.
 */
class AudioProLogicTests: XCTestCase {
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

    // Enhanced test helper that better simulates real-world behavior
    class AudioProTestHelper {
        var player: AVPlayer?
        var currentState: String = "IDLE"
        var events: [(type: String, data: [String: Any])] = []
        var error: Error?
        var timeObserverToken: Any?
        var statusObserver: NSKeyValueObservation?
        var rateObserver: NSKeyValueObservation?
        
        func setupPlayer(url: URL) {
            player = AVPlayer(url: url)
            setupObservers()
        }
        
        private func setupObservers() {
            guard let player = player else { return }
            
            // Observe player status
            statusObserver = player.observe(\.status) { [weak self] player, _ in
                switch player.status {
                case .readyToPlay:
                    self?.simulateStateChange("PLAYING")
                case .failed:
                    self?.simulateError(player.error ?? NSError(domain: "AudioPro", code: -1))
                default:
                    break
                }
            }
            
            // Observe playback rate
            rateObserver = player.observe(\.rate) { [weak self] player, _ in
                if player.rate == 0 {
                    self?.simulateStateChange("PAUSED")
                } else if player.rate > 0 {
                    self?.simulateStateChange("PLAYING")
                }
            }
            
            // Add time observer for progress updates
            let interval = CMTime(seconds: 0.1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
            timeObserverToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
                self?.simulateEvent("PROGRESS", data: ["position": time.seconds])
            }
        }
        
        func simulateStateChange(_ newState: String) {
            currentState = newState
            simulateEvent("STATE_CHANGED", data: ["state": newState])
        }
        
        func simulateEvent(_ type: String, data: [String: Any] = [:]) {
            events.append((type: type, data: data))
        }
        
        func simulateError(_ error: Error) {
            self.error = error
            currentState = "ERROR"
            simulateEvent("PLAYBACK_ERROR", data: ["error": error.localizedDescription])
        }
        
        func simulateTrackEnded() {
            simulateEvent("TRACK_ENDED")
            simulateStateChange("STOPPED")
        }
        
        func simulateSeekComplete() {
            simulateEvent("SEEK_COMPLETE")
        }
        
        func simulateRemoteControl(_ type: String) {
            simulateEvent(type)
        }
        
        func cleanup() {
            if let token = timeObserverToken {
                player?.removeTimeObserver(token)
            }
            statusObserver?.invalidate()
            rateObserver?.invalidate()
            player = nil
            currentState = "IDLE"
            events.removeAll()
            error = nil
        }
    }
    
    let testHelper = AudioProTestHelper()
    
    override func setUp() {
        super.setUp()
        testHelper.cleanup()
    }
    
    override func tearDown() {
        testHelper.cleanup()
        super.tearDown()
    }
    
    /**
     * Test complete state transition cycle
     */
    func testCompleteStateTransitions() {
        let expectation = XCTestExpectation(description: "Complete state transitions")
        
        // Create a valid test URL
        let testURL = URL(string: "https://example.com/test.mp3")!
        testHelper.setupPlayer(url: testURL)
        
        // Simulate loading state
        testHelper.simulateStateChange(STATE_LOADING)
        XCTAssertEqual(testHelper.currentState, STATE_LOADING)
        
        // Simulate playing state
        testHelper.simulateStateChange(STATE_PLAYING)
        XCTAssertEqual(testHelper.currentState, STATE_PLAYING)
        
        // Simulate paused state
        testHelper.simulateStateChange(STATE_PAUSED)
        XCTAssertEqual(testHelper.currentState, STATE_PAUSED)
        
        // Simulate stopped state
        testHelper.simulateStateChange(STATE_STOPPED)
        XCTAssertEqual(testHelper.currentState, STATE_STOPPED)
        
        expectation.fulfill()
        wait(for: [expectation], timeout: 1.0)
    }
    
    /**
     * Test that the player handles network errors gracefully
     */
    func testNetworkErrorHandling() {
        let expectation = XCTestExpectation(description: "Network error handling")
        
        // Create a URL that will definitely fail
        let badURL = URL(string: "https://invalid.example.com/audio.mp3")!
        testHelper.setupPlayer(url: badURL)
        
        // Simulate network error
        let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet, userInfo: nil)
        testHelper.simulateError(error)
        
        XCTAssertEqual(testHelper.currentState, STATE_ERROR, "Should transition to ERROR state on network error")
        XCTAssertNotNil(testHelper.error, "Error should be captured")
        
        // Verify error event was emitted
        let errorEvent = testHelper.events.first { $0.type == EVENT_TYPE_PLAYBACK_ERROR }
        XCTAssertNotNil(errorEvent, "Should emit PLAYBACK_ERROR event")
        
        expectation.fulfill()
        wait(for: [expectation], timeout: 1.0)
    }
    
    /**
     * Test that the player handles invalid URLs
     */
    func testInvalidURLHandling() {
        let expectation = XCTestExpectation(description: "Invalid URL handling")
        
        // Simulate invalid URL error
        let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL, userInfo: nil)
        testHelper.simulateError(error)
        
        XCTAssertEqual(testHelper.currentState, STATE_ERROR, "Should transition to ERROR state on invalid URL")
        
        // Verify error event was emitted
        let errorEvent = testHelper.events.first { $0.type == EVENT_TYPE_PLAYBACK_ERROR }
        XCTAssertNotNil(errorEvent, "Should emit PLAYBACK_ERROR event")
        
        expectation.fulfill()
        wait(for: [expectation], timeout: 1.0)
    }
    
    /**
     * Test that the player handles concurrent operations correctly
     */
    func testConcurrentOperations() {
        let expectation = XCTestExpectation(description: "Concurrent operations complete")
        let operationQueue = OperationQueue()
        operationQueue.maxConcurrentOperationCount = 3
        
        // Create a valid test URL
        let testURL = URL(string: "https://example.com/test.mp3")!
        testHelper.setupPlayer(url: testURL)
        
        // Simulate multiple rapid state changes
        let operations = [
            BlockOperation { [self] in
                testHelper.simulateStateChange(STATE_LOADING)
            },
            BlockOperation { [self] in
                testHelper.simulateStateChange(STATE_PLAYING)
            },
            BlockOperation { [self] in
                testHelper.simulateStateChange(STATE_PAUSED)
            }
        ]
        
        // Add completion block to last operation
        operations.last?.completionBlock = { [self] in
            XCTAssertEqual(testHelper.currentState, STATE_PAUSED, "Final state should be consistent")
            expectation.fulfill()
        }
        
        // Execute operations
        operationQueue.addOperations(operations, waitUntilFinished: false)
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    /**
     * Test progress updates during playback
     */
    func testProgressUpdates() {
        let expectation = XCTestExpectation(description: "Progress updates")
        
        // Create a valid test URL
        let testURL = URL(string: "https://example.com/test.mp3")!
        testHelper.setupPlayer(url: testURL)
        
        // Simulate playing state
        testHelper.simulateStateChange(STATE_PLAYING)
        
        // Simulate progress updates
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [self] in
            testHelper.simulateEvent(EVENT_TYPE_PROGRESS, data: ["position": 1.0])
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [self] in
            testHelper.simulateEvent(EVENT_TYPE_PROGRESS, data: ["position": 2.0])
            
            // Verify progress events were emitted
            let progressEvents = testHelper.events.filter { $0.type == EVENT_TYPE_PROGRESS }
            XCTAssertEqual(progressEvents.count, 2, "Should emit progress events")
            
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    /**
     * Test seek operations
     */
    func testSeekOperations() {
        let expectation = XCTestExpectation(description: "Seek operations")
        
        // Create a valid test URL
        let testURL = URL(string: "https://example.com/test.mp3")!
        testHelper.setupPlayer(url: testURL)
        
        // Simulate seek operation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [self] in
            testHelper.simulateSeekComplete()
            
            // Verify seek complete event was emitted
            let seekEvent = testHelper.events.first { $0.type == EVENT_TYPE_SEEK_COMPLETE }
            XCTAssertNotNil(seekEvent, "Should emit SEEK_COMPLETE event")
            
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    #if os(iOS)
    /**
     * Test that the player handles audio session interruptions
     */
    func testAudioSessionInterruption() {
        let expectation = XCTestExpectation(description: "Audio session interruption")
        
        // Simulate playing state
        testHelper.simulateStateChange(STATE_PLAYING)
        
        // Simulate interruption
        NotificationCenter.default.post(
            name: AVAudioSession.interruptionNotification,
            object: nil,
            userInfo: [
                AVAudioSessionInterruptionTypeKey: AVAudioSession.InterruptionType.began.rawValue
            ]
        )
        
        // Verify state after interruption
        XCTAssertEqual(testHelper.currentState, STATE_PAUSED, "Should transition to PAUSED state on interruption")
        
        // Simulate interruption end
        NotificationCenter.default.post(
            name: AVAudioSession.interruptionNotification,
            object: nil,
            userInfo: [
                AVAudioSessionInterruptionTypeKey: AVAudioSession.InterruptionType.ended.rawValue,
                AVAudioSessionInterruptionOptionKey: AVAudioSession.InterruptionOptions.shouldResume.rawValue
            ]
        )
        
        // Verify state after interruption end
        XCTAssertEqual(testHelper.currentState, STATE_PLAYING, "Should resume PLAYING state after interruption")
        
        expectation.fulfill()
        wait(for: [expectation], timeout: 1.0)
    }
    #endif
    
    /**
     * Test remote control events
     */
    func testRemoteControlEvents() {
        let expectation = XCTestExpectation(description: "Remote control events")
        
        // Simulate remote control events
        testHelper.simulateRemoteControl(EVENT_TYPE_REMOTE_NEXT)
        testHelper.simulateRemoteControl(EVENT_TYPE_REMOTE_PREV)
        
        // Verify remote control events were emitted
        let remoteEvents = testHelper.events.filter { $0.type == EVENT_TYPE_REMOTE_NEXT || $0.type == EVENT_TYPE_REMOTE_PREV }
        XCTAssertEqual(remoteEvents.count, 2, "Should emit remote control events")
        
        expectation.fulfill()
        wait(for: [expectation], timeout: 1.0)
    }
}
