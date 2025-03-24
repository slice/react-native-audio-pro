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
  func play(track: NSDictionary) {
    guard
      let urlString = track["url"] as? String,
      let url = URL(string: urlString),
      let title = track["title"] as? String,
      let artworkUrlString = track["artwork"] as? String,
      let artworkUrl = URL(string: artworkUrlString)
    else {
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
      sendEvent(withName: eventName, body: ["state": isPlaying])
    }
    startTimer()

    DispatchQueue.global().async {
      if let data = try? Data(contentsOf: artworkUrl), let image = UIImage(data: data) {
        let mpmArtwork = MPMediaItemArtwork(boundsSize: image.size, requestHandler: { _ in image })
        DispatchQueue.main.async {
          var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
          currentInfo[MPMediaItemPropertyArtwork] = mpmArtwork
          MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
        }
      }
    }
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
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    if hasListeners {
      sendEvent(withName: eventName, body: ["state": isStopped])
    }
    stopTimer()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
