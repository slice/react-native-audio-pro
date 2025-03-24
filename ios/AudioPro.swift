import Foundation
import AVFoundation
import React

@objc(AudioPro)
class AudioPro: RCTEventEmitter {
  private var player: AVPlayer?
  private var hasListeners = false
  private let eventName = "AudioProEvent"
  private let isPlaying = "IsPlaying"
  private let isPaused = "IsPaused"
  private let isStopped = "IsStopped"

  override func supportedEvents() -> [String]! {
    return [eventName]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(play:)
  func play(urlString: NSString) {
    guard let url = URL(string: urlString as String) else { return }
    let item = AVPlayerItem(url: url)
    player = AVPlayer(playerItem: item)
    player?.play()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isPlaying])
    }
  }

  @objc(pause)
  func pause() {
    player?.pause()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isPaused])
    }
  }

  @objc(resume)
  func resume() {
    player?.play()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isPlaying])
    }
  }

  @objc(stop)
  func stop() {
    player?.pause()
    player = nil
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isStopped])
    }
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
