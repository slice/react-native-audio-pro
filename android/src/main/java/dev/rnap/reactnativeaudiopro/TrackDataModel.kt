package dev.rnap.reactnativeaudiopro

data class Track(
    val url: String,
    val title: String,
    val artwork: String,
    val album: String? = null,
    val artist: String? = null
)
