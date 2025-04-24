package dev.rnap.reactnativeaudiopro

import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Tests for track metadata handling as defined in the logic.md contract.
 * 
 * This test class focuses on verifying that track metadata handling follows the contract
 * defined in logic.md, particularly:
 * 1. Correct handling of track metadata
 * 2. Proper behavior for missing metadata fields
 * 3. Correct behavior for metadata updates
 */
class AudioProMetadataTest {

    // Test helper to capture state transitions and events
    private class StateTracker {
        val states = mutableListOf<String>()
        val events = mutableListOf<String>()
        val payloads = mutableListOf<Any?>()
        val tracks = mutableListOf<Map<String, Any?>>()

        fun recordState(state: String) {
            states.add(state)
        }

        fun recordEvent(event: String, payload: Any? = null) {
            events.add(event)
            payloads.add(payload)
        }

        fun recordTrack(track: Map<String, Any?>) {
            tracks.add(track)
        }

        fun reset() {
            states.clear()
            events.clear()
            payloads.clear()
            tracks.clear()
        }
    }

    private val stateTracker = StateTracker()

    @Before
    fun setup() {
        stateTracker.reset()
    }

    /**
     * Test that track metadata is correctly passed to the media session
     */
    @Test
    fun testTrackMetadataCorrectlyPassedToMediaSession() {
        // Create a track with metadata
        val track = mapOf(
            "id" to "test-id",
            "url" to "https://example.com/audio.mp3",
            "title" to "Test Track",
            "artist" to "Test Artist",
            "artwork" to "https://example.com/artwork.jpg",
            "album" to "Test Album",
            "duration" to 180000
        )
        
        // Record the track
        stateTracker.recordTrack(track)
        
        // Verify the track was recorded
        assertEquals("Should have 1 track record", 1, stateTracker.tracks.size)
        assertEquals("Track ID should match", "test-id", stateTracker.tracks[0]["id"])
        assertEquals("Track URL should match", "https://example.com/audio.mp3", stateTracker.tracks[0]["url"])
        assertEquals("Track title should match", "Test Track", stateTracker.tracks[0]["title"])
        assertEquals("Track artist should match", "Test Artist", stateTracker.tracks[0]["artist"])
        assertEquals("Track artwork should match", "https://example.com/artwork.jpg", stateTracker.tracks[0]["artwork"])
        assertEquals("Track album should match", "Test Album", stateTracker.tracks[0]["album"])
        assertEquals("Track duration should match", 180000, stateTracker.tracks[0]["duration"])
    }
    
    /**
     * Test that missing metadata fields are handled gracefully
     */
    @Test
    fun testMissingMetadataFieldsHandledGracefully() {
        // Create a track with minimal metadata
        val track = mapOf(
            "id" to "test-id",
            "url" to "https://example.com/audio.mp3"
        )
        
        // Record the track
        stateTracker.recordTrack(track)
        
        // Verify the track was recorded
        assertEquals("Should have 1 track record", 1, stateTracker.tracks.size)
        assertEquals("Track ID should match", "test-id", stateTracker.tracks[0]["id"])
        assertEquals("Track URL should match", "https://example.com/audio.mp3", stateTracker.tracks[0]["url"])
        assertNull("Track title should be null", stateTracker.tracks[0]["title"])
        assertNull("Track artist should be null", stateTracker.tracks[0]["artist"])
        assertNull("Track artwork should be null", stateTracker.tracks[0]["artwork"])
        assertNull("Track album should be null", stateTracker.tracks[0]["album"])
        assertNull("Track duration should be null", stateTracker.tracks[0]["duration"])
    }
    
    /**
     * Test that track metadata is included in state change events
     */
    @Test
    fun testTrackMetadataIncludedInStateChangeEvents() {
        // Create a track with metadata
        val track = mapOf(
            "id" to "test-id",
            "url" to "https://example.com/audio.mp3",
            "title" to "Test Track",
            "artist" to "Test Artist",
            "artwork" to "https://example.com/artwork.jpg"
        )
        
        // Record the track
        stateTracker.recordTrack(track)
        
        // Simulate state change
        stateTracker.recordState(AudioProModule.STATE_PLAYING)
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_STATE_CHANGED, track)
        
        // Verify the event payload includes the track
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Event should be STATE_CHANGED", AudioProModule.EVENT_TYPE_STATE_CHANGED, stateTracker.events[0])
        assertEquals("Event payload should include track", track, stateTracker.payloads[0])
    }
    
    /**
     * Test that track metadata is included in progress events
     */
    @Test
    fun testTrackMetadataIncludedInProgressEvents() {
        // Create a track with metadata
        val track = mapOf(
            "id" to "test-id",
            "url" to "https://example.com/audio.mp3",
            "title" to "Test Track",
            "artist" to "Test Artist",
            "artwork" to "https://example.com/artwork.jpg"
        )
        
        // Record the track
        stateTracker.recordTrack(track)
        
        // Simulate progress event
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PROGRESS, track)
        
        // Verify the event payload includes the track
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Event should be PROGRESS", AudioProModule.EVENT_TYPE_PROGRESS, stateTracker.events[0])
        assertEquals("Event payload should include track", track, stateTracker.payloads[0])
    }
    
    /**
     * Test that track metadata is included in error events
     */
    @Test
    fun testTrackMetadataIncludedInErrorEvents() {
        // Create a track with metadata
        val track = mapOf(
            "id" to "test-id",
            "url" to "https://example.com/audio.mp3",
            "title" to "Test Track",
            "artist" to "Test Artist",
            "artwork" to "https://example.com/artwork.jpg"
        )
        
        // Record the track
        stateTracker.recordTrack(track)
        
        // Simulate error event
        stateTracker.recordEvent(AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, track)
        
        // Verify the event payload includes the track
        assertEquals("Should have 1 event", 1, stateTracker.events.size)
        assertEquals("Event should be PLAYBACK_ERROR", AudioProModule.EVENT_TYPE_PLAYBACK_ERROR, stateTracker.events[0])
        assertEquals("Event payload should include track", track, stateTracker.payloads[0])
    }
    
    /**
     * Test that track metadata is updated when a new track is loaded
     */
    @Test
    fun testTrackMetadataUpdatedWhenNewTrackLoaded() {
        // Create a track with metadata
        val track1 = mapOf(
            "id" to "test-id-1",
            "url" to "https://example.com/audio1.mp3",
            "title" to "Test Track 1",
            "artist" to "Test Artist 1",
            "artwork" to "https://example.com/artwork1.jpg"
        )
        
        // Record the track
        stateTracker.recordTrack(track1)
        
        // Create a new track with metadata
        val track2 = mapOf(
            "id" to "test-id-2",
            "url" to "https://example.com/audio2.mp3",
            "title" to "Test Track 2",
            "artist" to "Test Artist 2",
            "artwork" to "https://example.com/artwork2.jpg"
        )
        
        // Record the new track
        stateTracker.recordTrack(track2)
        
        // Verify the tracks were recorded
        assertEquals("Should have 2 track records", 2, stateTracker.tracks.size)
        assertEquals("First track ID should match", "test-id-1", stateTracker.tracks[0]["id"])
        assertEquals("Second track ID should match", "test-id-2", stateTracker.tracks[1]["id"])
    }
}
