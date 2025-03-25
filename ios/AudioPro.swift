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
  private let STATE_EVENT_NAME = "AudioProStateEvent"
  private let NOTICE_EVENT_NAME = "AudioProNoticeEvent"

  private let STATE_STOPPED = "STOPPED"
  private let STATE_LOADING = "LOADING"
  private let STATE_BUFFERING = "BUFFERING"
  private let STATE_PLAYING = "PLAYING"
  private let STATE_PAUSED = "PAUSED"

  private let NOTICE_TRACK_ENDED = "TRACK_ENDED"
  private let NOTICE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
  private let NOTICE_PROGRESS = "PROGRESS"
  private let NOTICE_SEEK_COMPLETE = "SEEK_COMPLETE"

  private let GENERIC_ERROR_CODE = 1000

  override func supportedEvents() -> [String]! {
    return [STATE_EVENT_NAME, NOTICE_EVENT_NAME]
  }

  // MARK: - Helper Methods

  /// Returns the current playback position and duration (in milliseconds)
  private func getPlaybackInfo() -> (position: Int, duration: Int) {
    guard let player = player, let currentItem = player.currentItem else {
      return (0, 0)
    }
    let currentTimeSec = player.currentTime().seconds
    let durationSec = currentItem.duration.seconds
    let validCurrentTimeSec = (currentTimeSec.isNaN || currentTimeSec.isInfinite) ? 0 : currentTimeSec
    let validDurationSec = (durationSec.isNaN || durationSec.isInfinite) ? 0 : durationSec
    let positionMs = Int(round(validCurrentTimeSec * 1000))
    let durationMs = Int(round(validDurationSec * 1000))
    return (position: positionMs, duration: durationMs)
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
    guard let _ = player, let _ = player?.currentItem else { return }
    let info = getPlaybackInfo()
    let body: [String: Any] = [
      "notice": NOTICE_PROGRESS,
      "position": info.position,
      "duration": info.duration
    ]
    sendEvent(withName: NOTICE_EVENT_NAME, body: body)
  }

  private func beginSeeking() {
    stopTimer()
  }

  private func completeSeeking(newPosition: Double) {
    if hasListeners {
      let info = getPlaybackInfo()  // Although the new position is provided, we rely on the helper for consistency
      let body: [String: Any] = [
        "notice": NOTICE_SEEK_COMPLETE,
        "position": info.position,
        "duration": info.duration
      ]
      sendEvent(withName: NOTICE_EVENT_NAME, body: body)
    }

    // Only restart timer if player is currently playing
    if player?.rate != 0 {
      startTimer()
    }
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  // MARK: - Exposed Methods

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

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playerItemDidPlayToEndTime(_:)),
      name: .AVPlayerItemDidPlayToEndTime,
      object: item
    )

    // Emit loading state without position or duration
    if hasListeners {
      let body: [String: Any] = [
        "state": STATE_LOADING
      ]
      sendEvent(withName: STATE_EVENT_NAME, body: body)
    }

    player?.play()
    startTimer()

    // Fetch artwork asynchronously
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
      let info = getPlaybackInfo()
      let body: [String: Any] = [
        "state": STATE_PAUSED,
        "position": info.position,
        "duration": info.duration
      ]
      sendEvent(withName: STATE_EVENT_NAME, body: body)
    }
    stopTimer()
  }

  @objc(resume)
  func resume() {
    player?.play()
    if hasListeners {
      let info = getPlaybackInfo()
      let body: [String: Any] = [
        "state": STATE_PLAYING,
        "position": info.position,
        "duration": info.duration
      ]
      sendEvent(withName: STATE_EVENT_NAME, body: body)
    }
    startTimer()
  }

  @objc(stop)
  func stop() {
    player?.pause()
    player = nil
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    if hasListeners {
      let body: [String: Any] = ["state": STATE_STOPPED]
      sendEvent(withName: STATE_EVENT_NAME, body: body)
    }
    stopTimer()
  }

  @objc(seekTo:)
  func seekTo(position: Double) {
    guard let player = player else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    guard let currentItem = player.currentItem else {
      triggerErrorEvent("Cannot seek: no item loaded")
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

    beginSeeking()

    // The key fix - AVPlayer seeking works in both playing and paused states
    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
      guard let self = self else { return }

      if completed {
        self.updateNowPlayingInfoWithCurrentTime(validPosition)
        self.completeSeeking(newPosition: validPosition * 1000)
      } else {
        // Only restart timer if we were playing before the seek
        if player.rate != 0 {
          self.startTimer()
        }
      }
    }
  }

  @objc(seekForward:)
  func seekForward(amount: Double) {
    guard let player = player else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    guard let currentItem = player.currentItem else {
      triggerErrorEvent("Cannot seek: no item loaded")
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

    beginSeeking()

    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
      guard let self = self else { return }

      if completed {
        self.updateNowPlayingInfoWithCurrentTime(newPosition)
        self.completeSeeking(newPosition: newPosition * 1000)
      } else {
        // Only restart timer if we were playing before the seek
        if player.rate != 0 {
          self.startTimer()
        }
      }
    }
  }

  @objc(seekBack:)
  func seekBack(amount: Double) {
    guard let player = player else {
      triggerErrorEvent("Cannot seek: no track is playing")
      return
    }

    guard let currentItem = player.currentItem else {
      triggerErrorEvent("Cannot seek: no item loaded")
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

    beginSeeking()

    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
      guard let self = self else { return }

      if completed {
        self.updateNowPlayingInfoWithCurrentTime(newPosition)
        self.completeSeeking(newPosition: newPosition * 1000)
      } else {
        // Only restart timer if we were playing before the seek
        if player.rate != 0 {
          self.startTimer()
        }
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
      sendEvent(withName: NOTICE_EVENT_NAME, body: [
        "notice": NOTICE_PLAYBACK_ERROR,
        "error": errorMessage,
        "errorCode": GENERIC_ERROR_CODE
      ])
    }
  }

  @objc private func playerItemDidPlayToEndTime(_ notification: Notification) {
    guard let currentItem = player?.currentItem else { return }
    let durationSec = currentItem.duration.seconds
    let validDurationSec = (durationSec.isNaN || durationSec.isInfinite) ? 0 : durationSec
    let durationMs = Int(round(validDurationSec * 1000))
    let positionMs = durationMs

    if hasListeners {
      let trackEndedBody: [String: Any] = [
        "notice": NOTICE_TRACK_ENDED,
        "position": positionMs,
        "duration": durationMs
      ]
      sendEvent(withName: NOTICE_EVENT_NAME, body: trackEndedBody)

      let stoppedBody: [String: Any] = ["state": STATE_STOPPED]
      sendEvent(withName: STATE_EVENT_NAME, body: stoppedBody)
    }

    stop()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
