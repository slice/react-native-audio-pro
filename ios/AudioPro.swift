import Foundation
import AVFoundation
import React
import MediaPlayer
import UIKit

@objc(AudioPro)
class AudioPro: RCTEventEmitter {
  private var player: AVPlayer?
  private var timer: Timer?
  private var hasListeners = false
  private let eventName = "AudioProEvent"
  private let playing = "playing"
  private let paused = "paused"
  private let stopped = "stopped"
  private let errorEvent = "error"

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

    let currentTimeSec = player.currentTime().seconds
    let durationSec = currentItem.duration.seconds

    let validCurrentTimeSec = currentTimeSec.isNaN || currentTimeSec.isInfinite ? 0 : currentTimeSec
    let validDurationSec = durationSec.isNaN || durationSec.isInfinite ? 0 : durationSec

    let currentTimeMs = Int(round(validCurrentTimeSec * 1000))
    let durationMs = Int(round(validDurationSec * 1000))

    let body: [String: Any] = [
      "state": playing,
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
  func play(track: NSDictionary) {
    guard
      let urlString = track["url"] as? String,
      let url = URL(string: urlString),
      let title = track["title"] as? String,
      let artworkUrlString = track["artwork"] as? String,
      let artworkUrl = URL(string: artworkUrlString)
    else {
      triggerErrorEvent("Invalid track data")
      stop()
      return
    }

    let album = track["album"] as? String
    let artist = track["artist"] as? String

    var nowPlayingInfo = [String: Any]()
    nowPlayingInfo[MPMediaItemPropertyTitle] = title
    if let album = album {
      nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
    }
    if let artist = artist {
      nowPlayingInfo[MPMediaItemPropertyArtist] = artist
    }

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

    let item = AVPlayerItem(url: url)
    player = AVPlayer(playerItem: item)
    player?.play()

    if hasListeners {
      let currentTimeSec = player?.currentTime().seconds ?? 0
      let durationSec = player?.currentItem?.duration.seconds ?? 0

      let validCurrentTimeSec = currentTimeSec.isNaN || currentTimeSec.isInfinite ? 0 : currentTimeSec
      let validDurationSec = durationSec.isNaN || durationSec.isInfinite ? 0 : durationSec

      let currentTimeMs = Int(round(validCurrentTimeSec * 1000))
      let durationMs = Int(round(validDurationSec * 1000))

      let body: [String: Any] = [
        "state": playing,
        "position": currentTimeMs,
        "duration": durationMs
      ]

      sendEvent(withName: eventName, body: body)
    }

    startTimer()

    DispatchQueue.global().async {
      do {
        let data = try Data(contentsOf: artworkUrl)
        guard let image = UIImage(data: data) else {
          throw NSError(domain: "AudioPro", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])
        }
        let mpmArtwork = MPMediaItemArtwork(boundsSize: image.size, requestHandler: { _ in image })
        DispatchQueue.main.async {
          var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
          currentInfo[MPMediaItemPropertyArtwork] = mpmArtwork
          MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
        }
      } catch {
        DispatchQueue.main.async {
          self.triggerErrorEvent(error.localizedDescription)
        }
        self.stop()
      }
    }
  }

  @objc(pause)
  func pause() {
    player?.pause()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": paused])
    }
    stopTimer()
  }

  @objc(resume)
  func resume() {
    player?.play()
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": playing])
    }
    startTimer()
  }

  @objc(stop)
  func stop() {
    player?.pause()
    player = nil
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": stopped])
    }
    stopTimer()
  }

  @objc(seekTo:)
  func seekTo(position: Double) {
    guard let player = player, let currentItem = player.currentItem else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    let positionInSeconds = position / 1000.0
    let duration = currentItem.duration.seconds

    if duration.isNaN || duration.isInfinite {
      triggerErrorEvent("Cannot seek: invalid track duration")
      return
    }

    let validPosition = max(0, min(positionInSeconds, duration))

    let time = CMTime(seconds: validPosition, preferredTimescale: 1000)

    player.seek(to: time) { [weak self] completed in
      if completed {
        self?.updateNowPlayingInfoWithCurrentTime(validPosition)
        self?.sendTimingEvent()
      }
    }
  }

  @objc(seekForward:)
  func seekForward(amount: Double) {
    guard let player = player, let currentItem = player.currentItem else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    let amountInSeconds = amount / 1000.0
    let currentTime = player.currentTime().seconds
    let duration = currentItem.duration.seconds

    if currentTime.isNaN || currentTime.isInfinite || duration.isNaN || duration.isInfinite {
      triggerErrorEvent("Cannot seek: invalid track position or duration")
      return
    }

    let newPosition = min(currentTime + amountInSeconds, duration)

    let time = CMTime(seconds: newPosition, preferredTimescale: 1000)

    player.seek(to: time) { [weak self] completed in
      if completed {
        self?.updateNowPlayingInfoWithCurrentTime(newPosition)
        self?.sendTimingEvent()
      }
    }
  }

  @objc(seekBack:)
  func seekBack(amount: Double) {
    guard let player = player else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    let amountInSeconds = amount / 1000.0
    let currentTime = player.currentTime().seconds

    if currentTime.isNaN || currentTime.isInfinite {
      triggerErrorEvent("Cannot seek: invalid track position")
      return
    }

    let newPosition = max(0, currentTime - amountInSeconds)

    let time = CMTime(seconds: newPosition, preferredTimescale: 1000)

    player.seek(to: time) { [weak self] completed in
      if completed {
        self?.updateNowPlayingInfoWithCurrentTime(newPosition)
        self?.sendTimingEvent()
      }
    }
  }

  private func updateNowPlayingInfoWithCurrentTime(_ time: Double) {
    var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = time

    if let currentItem = player?.currentItem {
      let duration = currentItem.duration.seconds
      if !duration.isNaN && !duration.isInfinite {
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
      }
    }

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
  }

  func triggerErrorEvent(_ errorMessage: String) {
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": errorEvent, "error": errorMessage])
    }
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
