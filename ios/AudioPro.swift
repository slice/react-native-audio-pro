import Foundation
import AVFoundation
import React
import MediaPlayer
import UIKit

@objc(AudioPro)
class AudioPro: RCTEventEmitter {

    ////////////////////////////////////////////////////////////
    // MARK: - Properties & Constants
    ////////////////////////////////////////////////////////////

    private var player: AVPlayer?
    private var timer: Timer?
    private var hasListeners = false
    private let STATE_EVENT_NAME = "AudioProStateEvent"
    private let NOTICE_EVENT_NAME = "AudioProNoticeEvent"

    private let STATE_STOPPED = "STOPPED"
    private let STATE_LOADING = "LOADING"
    private let STATE_PLAYING = "PLAYING"
    private let STATE_PAUSED = "PAUSED"

    private let NOTICE_TRACK_ENDED = "TRACK_ENDED"
    private let NOTICE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
    private let NOTICE_PROGRESS = "PROGRESS"
    private let NOTICE_SEEK_COMPLETE = "SEEK_COMPLETE"

    private let GENERIC_ERROR_CODE = 1000
    private let progressInterval: TimeInterval = 1.0
    private var shouldBePlaying = false

    ////////////////////////////////////////////////////////////
    // MARK: - React Native Event Emitter Overrides
    ////////////////////////////////////////////////////////////

    override func supportedEvents() -> [String]! {
        return [STATE_EVENT_NAME, NOTICE_EVENT_NAME]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Timers & Progress Updates
    ////////////////////////////////////////////////////////////

    private func startProgressTimer() {
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.sendProgressEvent()
            self.timer = Timer.scheduledTimer(withTimeInterval: self.progressInterval, repeats: true) { [weak self] _ in
                self?.sendProgressEvent()
            }
        }
    }

    private func stopTimer() {
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.timer = nil
        }
    }

    private func sendProgressEvent() {
        // Only emit progress if the player is playing
        guard let player = player, let _ = player.currentItem, player.rate != 0 else { return }
        let info = getPlaybackInfo()
        let body: [String: Any] = [
            "notice": NOTICE_PROGRESS,
            "position": info.position,
            "duration": info.duration
        ]
        sendEvent(withName: NOTICE_EVENT_NAME, body: body)
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Playback Control (Play, Pause, Resume, Stop)
    ////////////////////////////////////////////////////////////

    @objc(play:)
    func play(track: NSDictionary) {
        guard
            let urlString = track["url"] as? String,
            let url = URL(string: urlString),
            let title = track["title"] as? String,
            let artworkUrlString = track["artwork"] as? String,
            let artworkUrl = URL(string: artworkUrlString)
        else {
            onError("Invalid track data")
            stop()
            return
        }

        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default,
                options: [.duckOthers]
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            onError("Audio session setup failed: \(error.localizedDescription)")
            return
        }

        if hasListeners {
            let body: [String: Any] = [
                "state": STATE_LOADING
            ]
            sendEvent(withName: STATE_EVENT_NAME, body: body)
        }
        shouldBePlaying = true

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

        item.addObserver(self, forKeyPath: "status", options: [.new], context: nil)

        player?.play()
        player?.addObserver(self, forKeyPath: "rate", options: [.new], context: nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if self.player?.rate != 0 && self.hasListeners {
                let info = self.getPlaybackInfo()
                let body: [String: Any] = [
                    "state": self.STATE_PLAYING,
                    "position": info.position,
                    "duration": info.duration
                ]
                self.sendEvent(withName: self.STATE_EVENT_NAME, body: body)
                self.startProgressTimer()
            }
        }

        // Fetch artwork
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
                    self.onError(error.localizedDescription)
                }
                self.stop()
            }
        }
    }

    @objc(pause)
    func pause() {
        shouldBePlaying = false
        player?.pause()
        stopTimer()
        sendPausedEvent()
    }

    @objc(resume)
    func resume() {
        shouldBePlaying = true
        player?.play()
        // The rate observer will handle sending the playing event and starting the progress timer
    }

    @objc func stop() {
        shouldBePlaying = false

        // Clean up NotificationCenter observers
        NotificationCenter.default.removeObserver(self)

        // Clean up KVO observers
        if let player = player {
            player.removeObserver(self, forKeyPath: "rate")
            player.currentItem?.removeObserver(self, forKeyPath: "status")
        }

        // Stop playback and release
        player?.pause()
        player = nil

        // Clear timers and system UI
        stopTimer()
        sendStoppedEvent()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Seeking Methods
    ////////////////////////////////////////////////////////////

    @objc(seekTo:)
    func seekTo(position: Double) {
        guard let player = player else {
            onError("Cannot seek: no track is playing")
            return
        }

        guard let currentItem = player.currentItem else {
            onError("Cannot seek: no item loaded")
            return
        }

        let positionInSeconds = position / 1000.0
        let duration = currentItem.duration.seconds

        if duration.isNaN || duration.isInfinite {
            onError("Cannot seek: invalid track duration")
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
                    self.startProgressTimer()
                }
            }
        }
    }

    @objc(seekForward:)
    func seekForward(amount: Double) {
        guard let player = player else {
            onError("Cannot seek: no track is playing")
            return
        }

        guard let currentItem = player.currentItem else {
            onError("Cannot seek: no item loaded")
            return
        }

        let amountInSeconds = amount / 1000.0
        let currentTime = player.currentTime().seconds
        let duration = currentItem.duration.seconds

        if currentTime.isNaN || currentTime.isInfinite || duration.isNaN || duration.isInfinite {
            onError("Cannot seek: invalid track position or duration")
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
                    self.startProgressTimer()
                }
            }
        }
    }

    @objc(seekBack:)
    func seekBack(amount: Double) {
        guard let player = player else {
            onError("Cannot seek: no track is playing")
            return
        }

        guard let currentItem = player.currentItem else {
            onError("Cannot seek: no item loaded")
            return
        }

        let amountInSeconds = amount / 1000.0
        let currentTime = player.currentTime().seconds

        if currentTime.isNaN || currentTime.isInfinite {
            onError("Cannot seek: invalid track position")
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
                    self.startProgressTimer()
                }
            }
        }
    }

    private func beginSeeking() {
        stopTimer()
    }

    private func completeSeeking(newPosition: Double) {
        if hasListeners {
            let info = getPlaybackInfo()  // Rely on the helper for consistency
            let body: [String: Any] = [
                "notice": NOTICE_SEEK_COMPLETE,
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(withName: NOTICE_EVENT_NAME, body: body)
        }
        // Restart the progress timer only if the player is playing
        if player?.rate != 0 {
            startProgressTimer()
        }
    }

    ////////////////////////////////////////////////////////////
    // MARK: - KVO & Notification Handlers
    ////////////////////////////////////////////////////////////

    @objc private func playerItemDidPlayToEndTime(_ notification: Notification) {
        guard let _ = player?.currentItem else { return }
        let info = getPlaybackInfo()

        if hasListeners {
            let trackEndedBody: [String: Any] = [
                "notice": NOTICE_TRACK_ENDED,
                "position": info.duration,
                "duration": info.duration
            ]
            sendEvent(withName: NOTICE_EVENT_NAME, body: trackEndedBody)

            // Send stopped event with explicit position and duration set to 0
            sendStoppedEvent()
        }

        stop()
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey : Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        if keyPath == "rate" {
            if let newRate = change?[.newKey] as? Float {
                if newRate == 0 {
                    if shouldBePlaying && hasListeners {
                        // Player should be playing but isn't (buffering/loading)
                        let body: [String: Any] = ["state": STATE_LOADING]
                        sendEvent(withName: STATE_EVENT_NAME, body: body)
                        stopTimer()
                    }
                } else {
                    if shouldBePlaying && hasListeners {
                        let info = getPlaybackInfo()
                        let body: [String: Any] = [
                            "state": STATE_PLAYING,
                            "position": info.position,
                            "duration": info.duration
                        ]
                        sendEvent(withName: STATE_EVENT_NAME, body: body)
                        startProgressTimer()
                    }
                }
            }
        } else if keyPath == "status" {
            if let item = object as? AVPlayerItem {
                if item.status == .failed {
                    let errorMessage = item.error?.localizedDescription ?? "Playback failed for unknown reason"
                    onError(errorMessage)
                }
            }
        } else {
            super.observeValue(forKeyPath: keyPath, of: object, change: change, context: context)
        }
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Private Helpers & Error Handling
    ////////////////////////////////////////////////////////////

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

    private func sendStoppedEvent() {
        if hasListeners {
            let body: [String: Any] = [
                "state": STATE_STOPPED,
                "position": 0,
                "duration": 0
            ]
            sendEvent(withName: STATE_EVENT_NAME, body: body)
        }
    }

    private func sendPlayingEvent() {
        if hasListeners {
            let info = getPlaybackInfo()
            let body: [String: Any] = [
                "state": STATE_PLAYING,
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(withName: STATE_EVENT_NAME, body: body)
        }
    }

    private func sendPausedEvent() {
        if hasListeners {
            let info = getPlaybackInfo()
            let body: [String: Any] = [
                "state": STATE_PAUSED,
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(withName: STATE_EVENT_NAME, body: body)
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

    func onError(_ errorMessage: String) {
        if hasListeners {
            sendEvent(withName: NOTICE_EVENT_NAME, body: [
                "notice": NOTICE_PLAYBACK_ERROR,
                "error": errorMessage,
                "errorCode": GENERIC_ERROR_CODE
            ])
        }
        stop()
    }
}
