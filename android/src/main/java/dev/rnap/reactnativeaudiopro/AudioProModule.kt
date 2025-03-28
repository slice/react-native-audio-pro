package dev.rnap.reactnativeaudiopro

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AudioProModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  @ReactMethod
  fun play(url: String) {
    AudioProController.setup(reactApplicationContext)
    AudioProController.play(reactApplicationContext, url, "Unknown", "Unknown")
  }

  @ReactMethod
  fun init() {
    AudioProController.init(reactApplicationContext)
  }

  @ReactMethod
  fun release() {
    AudioProController.release()
  }

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "AudioPro"
  }
}
