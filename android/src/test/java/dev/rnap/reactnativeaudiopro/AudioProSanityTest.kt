package dev.rnap.reactnativeaudiopro

import org.junit.Test
import org.junit.Assert.assertEquals

/**
 * A basic sanity test for the Android native module.
 * This test doesn't depend on any Android-specific functionality,
 * making it easy to run from the command line.
 */
class AudioProSanityTest {

    @Test
    fun testSanityCheck() {
        // This is a simple test to verify that the test infrastructure is working
        assertEquals(4, 2 + 2)
    }

    @Test
    fun testStringConcatenation() {
        // Another simple test to verify string operations
        val part1 = "Audio"
        val part2 = "Pro"
        assertEquals("AudioPro", part1 + part2)
    }
}
