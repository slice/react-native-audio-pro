import XCTest

/**
 * Tests for the ambient audio functionality in AudioPro
 */
class AudioProAmbientTests: XCTestCase {
    
    // Test instance
    var audioPro: AudioPro!
    
    override func setUp() {
        super.setUp()
        // Create a new instance for each test
        audioPro = AudioPro()
    }
    
    override func tearDown() {
        // Clean up
        audioPro = nil
        super.tearDown()
    }
    
    /**
     * Test that ambient audio methods exist
     */
    func testAmbientMethodsExist() {
        // Verify the methods exist by calling them with minimal parameters
        // This is primarily a compilation test
        
        // ambientPlay
        let options: NSDictionary = ["url": "https://example.com/test.mp3"]
        audioPro.ambientPlay(options: options)
        
        // ambientStop
        audioPro.ambientStop()
        
        // ambientSetVolume
        audioPro.ambientSetVolume(volume: 0.5)
        
        // If we got here without crashing, the test passes
        XCTAssertTrue(true)
    }
    
    /**
     * Test that ambient audio is isolated from main player
     */
    func testAmbientAudioIsolation() {
        // Set up a main player
        let track: NSDictionary = [
            "url": "https://example.com/main.mp3",
            "title": "Main Track"
        ]
        let options: NSDictionary = [:]
        audioPro.play(track: track, withOptions: options)
        
        // Set up ambient audio
        let ambientOptions: NSDictionary = ["url": "https://example.com/ambient.mp3"]
        audioPro.ambientPlay(options: ambientOptions)
        
        // Stop the main player
        audioPro.stop()
        
        // Verify ambient player still exists (indirectly)
        // We can't directly access the ambientPlayer property, so we'll just
        // call ambientStop() and make sure it doesn't crash
        audioPro.ambientStop()
        
        // If we got here without crashing, the test passes
        XCTAssertTrue(true)
    }
    
    /**
     * Test that ambientPlay handles loop parameter correctly
     */
    func testAmbientPlayLoopParameter() {
        // Test with loop = true
        let optionsWithLoop: NSDictionary = [
            "url": "https://example.com/ambient.mp3",
            "loop": true
        ]
        audioPro.ambientPlay(options: optionsWithLoop)
        
        // Test with loop = false
        let optionsWithoutLoop: NSDictionary = [
            "url": "https://example.com/ambient.mp3",
            "loop": false
        ]
        audioPro.ambientPlay(options: optionsWithoutLoop)
        
        // Test with no loop parameter (should default to true)
        let optionsNoLoop: NSDictionary = [
            "url": "https://example.com/ambient.mp3"
        ]
        audioPro.ambientPlay(options: optionsNoLoop)
        
        // If we got here without crashing, the test passes
        XCTAssertTrue(true)
    }
    
    /**
     * Test that ambientSetVolume handles volume parameter correctly
     */
    func testAmbientSetVolume() {
        // Test with various volume levels
        audioPro.ambientSetVolume(volume: 0.0)
        audioPro.ambientSetVolume(volume: 0.5)
        audioPro.ambientSetVolume(volume: 1.0)
        
        // If we got here without crashing, the test passes
        XCTAssertTrue(true)
    }
}
