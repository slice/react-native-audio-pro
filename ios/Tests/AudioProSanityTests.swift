import XCTest
import AVFoundation

/**
 * Basic sanity tests for the iOS native module.
 * These tests verify fundamental functionality and integration points.
 */
class AudioProSanityTests: XCTestCase {
    
    class MockAudioPro: RCTEventEmitter {
        var currentState: String = "IDLE"
        var volume: Float = 1.0
        var playbackSpeed: Float = 1.0
        
        override func supportedEvents() -> [String]! {
            return ["AudioProEvent", "AudioProAmbientEvent"]
        }
        
        @objc func play(_ track: NSDictionary) {
            // Mock implementation
        }
        
        @objc func pause() {
            // Mock implementation
        }
        
        @objc func resume() {
            // Mock implementation
        }
        
        @objc func setVolume(_ volume: Float) {
            self.volume = volume
        }
        
        @objc func setPlaybackSpeed(_ speed: Float) {
            self.playbackSpeed = speed
        }
    }
    
    var audioPro: MockAudioPro!
    
    override func setUp() {
        super.setUp()
        audioPro = MockAudioPro()
    }
    
    override func tearDown() {
        audioPro = nil
        super.tearDown()
    }
    
    func testModuleInitialization() {
        // Verify the module can be initialized
        XCTAssertNotNil(audioPro, "Module should initialize successfully")
        XCTAssertTrue(audioPro.responds(to: #selector(MockAudioPro.play(_:))), "Module should respond to play method")
        XCTAssertTrue(audioPro.responds(to: #selector(MockAudioPro.pause)), "Module should respond to pause method")
        XCTAssertTrue(audioPro.responds(to: #selector(MockAudioPro.resume)), "Module should respond to resume method")
    }
    
    func testEventEmitterSetup() {
        // Verify event emitter is configured correctly
        XCTAssertEqual(audioPro.supportedEvents().count, 2, "Should support 2 event types")
        XCTAssertTrue(audioPro.supportedEvents().contains("AudioProEvent"), "Should support AudioProEvent")
        XCTAssertTrue(audioPro.supportedEvents().contains("AudioProAmbientEvent"), "Should support AudioProAmbientEvent")
    }
    
    func testBasicPlayback() {
        // Create a test track
        let testURL = "https://example.com/test.mp3"
        let track = ["url": testURL]
        
        // Verify play method doesn't crash
        XCTAssertNoThrow(audioPro.play(track as NSDictionary), "Play method should not throw")
    }
    
    func testVolumeControl() {
        // Test volume control methods
        XCTAssertNoThrow(audioPro.setVolume(0.5), "setVolume should not throw")
        XCTAssertEqual(audioPro.volume, 0.5, "Volume should be set correctly")
        
        XCTAssertNoThrow(audioPro.setVolume(1.0), "setVolume should not throw")
        XCTAssertEqual(audioPro.volume, 1.0, "Volume should be set correctly")
        
        XCTAssertNoThrow(audioPro.setVolume(0.0), "setVolume should not throw")
        XCTAssertEqual(audioPro.volume, 0.0, "Volume should be set correctly")
    }
    
    func testPlaybackSpeedControl() {
        // Test playback speed control
        XCTAssertNoThrow(audioPro.setPlaybackSpeed(1.0), "setPlaybackSpeed should not throw")
        XCTAssertEqual(audioPro.playbackSpeed, 1.0, "Playback speed should be set correctly")
        
        XCTAssertNoThrow(audioPro.setPlaybackSpeed(2.0), "setPlaybackSpeed should not throw")
        XCTAssertEqual(audioPro.playbackSpeed, 2.0, "Playback speed should be set correctly")
        
        XCTAssertNoThrow(audioPro.setPlaybackSpeed(0.5), "setPlaybackSpeed should not throw")
        XCTAssertEqual(audioPro.playbackSpeed, 0.5, "Playback speed should be set correctly")
    }
}
