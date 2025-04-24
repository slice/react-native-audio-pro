import XCTest

/**
 * A basic sanity test for the iOS native module.
 * This test doesn't depend on any iOS-specific functionality,
 * making it easy to run from the command line.
 */
class AudioProSanityTests: XCTestCase {

    func testSanityCheck() {
        // This is a simple test to verify that the test infrastructure is working
        XCTAssertEqual(4, 2 + 2)
    }

    func testStringConcatenation() {
        // Another simple test to verify string operations
        let part1 = "Audio"
        let part2 = "Pro"
        XCTAssertEqual("AudioPro", part1 + part2)
    }
}
