import Foundation
import AVFoundation
import React

@objc(AudioPro)
class AudioPro: RCTEventEmitter {
  private var player: AVPlayer?
  private var timer: Timer?
  private var hasListeners = false
  private let eventName = "AudioProEvent"
  private let isPlaying = "IsPlaying"
  private let isPaused = "IsPaused"
  private let isStopped = "IsStopped"

  override func supportedEvents() -> [String]! {
    return [eventName]
  }

  private func startTimer() {
    DispatchQueue.main.async {
      self.timer?.invalidate()
      self.timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
        self?.sendTimingEvent()
      }
    }
  }

  private func stopTimer() {
    DispatchQueue.main.async {
      self.timer?.invalidate()
      self.timer = nil
    }
  }

  private func sendTimingEvent() {
    guard let player = player, let currentItem = player.currentItem else { return }
    let currentTimeMs = Int(round(player.currentTime().seconds * 1000))
    let durationSeconds = player.currentItem?.duration.seconds ?? 0
    let durationMs = Int(round(durationSeconds * 1000))
    let body: [String: Any] = [
      "state": isPlaying,
      "position": currentTimeMs,
      "duration": durationMs
    ]
    sendEvent(withName: eventName, body: body)
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
    startTimer()
  }

  @objc(pause)
  func pause() {
    player?.pause()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isPaused])
    }
    stopTimer()
  }

  @objc(resume)
  func resume() {
    player?.play()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isPlaying])
    }
    startTimer()
  }

  @objc(stop)
  func stop() {
    player?.pause()
    player = nil
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isStopped])
    }
    stopTimer()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
