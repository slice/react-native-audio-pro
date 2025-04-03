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
    private let EVENT_NAME = "AudioProEvent"

    // Event types
    private let EVENT_TYPE_STATE_CHANGED = "STATE_CHANGED"
    private let EVENT_TYPE_TRACK_ENDED = "TRACK_ENDED"
    private let EVENT_TYPE_PLAYBACK_ERROR = "PLAYBACK_ERROR"
    private let EVENT_TYPE_PROGRESS = "PROGRESS"
    private let EVENT_TYPE_SEEK_COMPLETE = "SEEK_COMPLETE"
    private let EVENT_TYPE_REMOTE_NEXT = "REMOTE_NEXT"
    private let EVENT_TYPE_REMOTE_PREV = "REMOTE_PREV"
    private let EVENT_TYPE_PLAYBACK_SPEED_CHANGED = "PLAYBACK_SPEED_CHANGED"

    // States
    private let STATE_STOPPED = "STOPPED"
    private let STATE_LOADING = "LOADING"
    private let STATE_PLAYING = "PLAYING"
    private let STATE_PAUSED = "PAUSED"

    private let GENERIC_ERROR_CODE = 900
    private let progressInterval: TimeInterval = 1.0
    private var shouldBePlaying = false
    private var isRemoteCommandCenterSetup = false

    private var isRateObserverAdded = false
    private var isStatusObserverAdded = false

    private var currentPlaybackSpeed: Float = 1.0
    private var currentTrack: NSDictionary?

    private var debugLog: Bool = false

    ////////////////////////////////////////////////////////////
    // MARK: - React Native Event Emitter Overrides
    ////////////////////////////////////////////////////////////

    override func supportedEvents() -> [String]! {
        return [EVENT_NAME]
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
    // MARK: - Debug Logging Helper
    ////////////////////////////////////////////////////////////

    private func log(_ items: Any...) {
        guard debugLog else { return }
        print("~~~", items.map { "\($0)" }.joined(separator: " "))
    }

    private func sendEvent(type: String, track: Any?, payload: [String: Any]?) {
        guard hasListeners else { return }

        var body: [String: Any] = [
            "type": type,
            "track": track as Any
        ]

        if let payload = payload {
            body["payload"] = payload
        }

        sendEvent(withName: EVENT_NAME, body: body)
    }


    ////////////////////////////////////////////////////////////
    // MARK: - Timers & Progress Updates
    ////////////////////////////////////////////////////////////

    private func startProgressTimer() {
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.sendProgressNoticeEvent()
            self.timer = Timer.scheduledTimer(withTimeInterval: self.progressInterval, repeats: true) { [weak self] _ in
                self?.sendProgressNoticeEvent()
            }
        }
    }

    private func stopTimer() {
        DispatchQueue.main.async {
            self.timer?.invalidate()
            self.timer = nil
        }
    }

    private func sendProgressNoticeEvent() {
        guard let player = player, let _ = player.currentItem, player.rate != 0 else { return }
        let info = getPlaybackInfo()

        let payload: [String: Any] = [
            "position": info.position,
            "duration": info.duration
        ]
        sendEvent(type: EVENT_TYPE_PROGRESS, track: info.track, payload: payload)
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Playback Control (Play, Pause, Resume, Stop)
    ////////////////////////////////////////////////////////////

    @objc(play:withOptions:)
    func play(track: NSDictionary, options: NSDictionary) {
        currentTrack = track
        debugLog = options["debug"] as? Bool ?? false
        let speed = options["playbackSpeed"] as? Float ?? 1.0
        currentPlaybackSpeed = speed
        log("Play", track["title"] ?? "Unknown", "speed:", speed)

        if player != nil {
            DispatchQueue.main.sync {
                cleanup()
            }
        }

        guard
            let urlString = track["url"] as? String,
            let url = URL(string: urlString),
            let title = track["title"] as? String,
            let artworkUrlString = track["artwork"] as? String,
            let artworkUrl = URL(string: artworkUrlString)
        else {
            onError("Invalid track data")
            cleanup()
            return
        }

        do {
            let contentType = options["contentType"] as? String ?? "MUSIC"
            let mode: AVAudioSession.Mode = (contentType == "SPEECH") ? .spokenAudio : .default
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: mode)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            onError("Audio session setup failed: \(error.localizedDescription)")
            return
        }

        if hasListeners {
            let payload: [String: Any] = [
                "state": STATE_LOADING,
                "position": 0,
                "duration": 0
            ]
            sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: currentTrack, payload: payload)
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

        DispatchQueue.main.async {
            UIApplication.shared.endReceivingRemoteControlEvents()
            UIApplication.shared.beginReceivingRemoteControlEvents()
        }
        self.setupRemoteTransportControls()

        // Create new player item and attach observer
        let item = AVPlayerItem(url: url)
        item.addObserver(self, forKeyPath: "status", options: [.new], context: nil)
        isStatusObserverAdded = true

        // Create a new AVPlayer instance for this track
        player = AVPlayer(playerItem: item)
        player?.addObserver(self, forKeyPath: "rate", options: [.new], context: nil)
        isRateObserverAdded = true

        nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = 0
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1.0
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = item.asset.duration.seconds
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerItemDidPlayToEndTime(_:)),
            name: .AVPlayerItemDidPlayToEndTime,
            object: item
        )

        player?.play()

        if currentPlaybackSpeed != 1.0 {
            player?.rate = currentPlaybackSpeed

            var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
            currentInfo[MPNowPlayingInfoPropertyPlaybackRate] = Double(currentPlaybackSpeed)
            MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if self.player?.rate != 0 && self.hasListeners {
                let info = self.getPlaybackInfo()
                let payload: [String: Any] = [
                    "state": self.STATE_PLAYING,
                    "position": info.position,
                    "duration": info.duration
                ]
                self.sendEvent(type: self.EVENT_TYPE_STATE_CHANGED, track: info.track, payload: payload)
                self.startProgressTimer()
            }
        }

        // Fetch artwork asynchronously and update Now Playing info
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
                    self.cleanup()
                }
            }
        }
    }

    @objc(pause)
    func pause() {
        shouldBePlaying = false
        player?.pause()
        stopTimer()
        sendPausedStateEvent()
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = 0
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player?.currentTime().seconds ?? 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    @objc(resume)
    func resume() {
        shouldBePlaying = true
        player?.play()
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = 1.0
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player?.currentTime().seconds ?? 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    /// stop is meant to halt playback and update the state without destroying persistent info
    /// such as artwork and remote control settings. This allows the lock screen/Control Center
    /// to continue displaying the track details for a potential resume.
    @objc func stop() {
        shouldBePlaying = false

        player?.pause()
        player?.seek(to: .zero)
        stopTimer()
        currentTrack = nil
        sendStoppedStateEvent()

        // Update now playing info to reflect a stopped state but keep the artwork intact.
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = 0
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    /// cleanup fully tears down the player instance and removes observers and remote controls.
    /// This is used when switching tracks or recovering from an error.
    @objc func cleanup() {
        shouldBePlaying = false

        NotificationCenter.default.removeObserver(self)

        if let player = player {
            if isRateObserverAdded {
                player.removeObserver(self, forKeyPath: "rate")
                isRateObserverAdded = false
            }
            if let currentItem = player.currentItem, isStatusObserverAdded {
                currentItem.removeObserver(self, forKeyPath: "status")
                isStatusObserverAdded = false
            }
        }

        player?.pause()
        player = nil

        stopTimer()
        currentTrack = nil
        sendStoppedStateEvent()

        // Unlike stop, cleanup clears the now playing info and remote control events.
        DispatchQueue.main.async {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
            UIApplication.shared.endReceivingRemoteControlEvents()
        }
        removeRemoteTransportControls()
        isRemoteCommandCenterSetup = false
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

        player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
            guard let self = self else { return }
            if completed {
                self.updateNowPlayingInfoWithCurrentTime(validPosition)
                self.completeSeekingAndSendSeekCompleteNoticeEvent(newPosition: validPosition * 1000)

                // Force update the now playing info to ensure controls work
                DispatchQueue.main.async {
                    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = validPosition
                    info[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
                }
            } else {
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
                self.completeSeekingAndSendSeekCompleteNoticeEvent(newPosition: newPosition * 1000)
            } else {
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

        guard player.currentItem != nil else {
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
                self.completeSeekingAndSendSeekCompleteNoticeEvent(newPosition: newPosition * 1000)
            } else {
                if player.rate != 0 {
                    self.startProgressTimer()
                }
            }
        }
    }

    private func beginSeeking() {
        stopTimer()
    }

    private func completeSeekingAndSendSeekCompleteNoticeEvent(newPosition: Double) {
        if hasListeners {
            let info = getPlaybackInfo()

            let payload: [String: Any] = [
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(type: EVENT_TYPE_SEEK_COMPLETE, track: info.track, payload: payload)
        }
        if player?.rate != 0 {
            startProgressTimer()
        }
    }

    ////////////////////////////////////////////////////////////
    // MARK: - Playback Speed
    ////////////////////////////////////////////////////////////

    @objc(setPlaybackSpeed:)
    func setPlaybackSpeed(speed: Double) {
        currentPlaybackSpeed = Float(speed)

        guard let player = player else {
            onError("Cannot set playback speed: no track is playing")
            return
        }

        log("Setting playback speed to ", speed)
        player.rate = Float(speed)

        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = speed
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info

        if hasListeners {
            let playbackInfo = getPlaybackInfo()

            let payload: [String: Any] = [
                "speed": speed
            ]
            sendEvent(type: EVENT_TYPE_PLAYBACK_SPEED_CHANGED, track: playbackInfo.track, payload: payload)
        }
    }

    ////////////////////////////////////////////////////////////
    // MARK: - KVO & Notification Handlers
    ////////////////////////////////////////////////////////////

    @objc private func playerItemDidPlayToEndTime(_ notification: Notification) {
        guard let _ = player?.currentItem else { return }
        let info = getPlaybackInfo()

        if hasListeners {
            let payload: [String: Any] = [
                "position": info.duration,
                "duration": info.duration
            ]
            sendEvent(type: EVENT_TYPE_TRACK_ENDED, track: info.track, payload: payload)
        }
		// When a track naturally finishes, call stop (not cleanup)
		// so that Now Playing info (artwork, track details) remains visible.
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
                        let payload: [String: Any] = [
                            "state": STATE_LOADING,
                            "position": 0,
                            "duration": 0
                        ]
                        sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: currentTrack, payload: payload)
                        stopTimer()
                    }
                } else {
                    if shouldBePlaying && hasListeners {
                        let info = getPlaybackInfo()
                        let payload: [String: Any] = [
                            "state": STATE_PLAYING,
                            "position": info.position,
                            "duration": info.duration
                        ]
                        sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: info.track, payload: payload)
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

    private func getPlaybackInfo() -> (position: Int, duration: Int, track: NSDictionary?) {
        guard let player = player, let currentItem = player.currentItem else {
            return (0, 0, nil)
        }
        let currentTimeSec = player.currentTime().seconds
        let durationSec = currentItem.duration.seconds
        let validCurrentTimeSec = (currentTimeSec.isNaN || currentTimeSec.isInfinite) ? 0 : currentTimeSec
        let validDurationSec = (durationSec.isNaN || durationSec.isInfinite) ? 0 : durationSec
        let positionMs = Int(round(validCurrentTimeSec * 1000))
        let durationMs = Int(round(validDurationSec * 1000))
        return (position: positionMs, duration: durationMs, track: currentTrack)
    }

    private func sendStoppedStateEvent() {
        if hasListeners {
            let payload: [String: Any] = [
                "state": STATE_STOPPED,
                "position": 0,
                "duration": 0
            ]
            sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: nil, payload: payload)
        }
    }

    private func sendPlayingStateEvent() {
        if hasListeners {
            let info = getPlaybackInfo()

            let payload: [String: Any] = [
                "state": STATE_PLAYING,
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: info.track, payload: payload)
        }
    }

    private func sendPausedStateEvent() {
        if hasListeners {
            let info = getPlaybackInfo()

            let payload: [String: Any] = [
                "state": STATE_PAUSED,
                "position": info.position,
                "duration": info.duration
            ]
            sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: info.track, payload: payload)
        }
    }

    private func updateNowPlayingInfoWithCurrentTime(_ time: Double) {
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = time
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player?.rate ?? 0

        if let currentItem = player?.currentItem {
            let duration = currentItem.duration.seconds
            if !duration.isNaN && !duration.isInfinite {
                nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
            }
        }

        // Ensure we have the basic track info
        if let track = currentTrack {
            if nowPlayingInfo[MPMediaItemPropertyTitle] == nil, let title = track["title"] as? String {
                nowPlayingInfo[MPMediaItemPropertyTitle] = title
            }
            if nowPlayingInfo[MPMediaItemPropertyArtist] == nil, let artist = track["artist"] as? String {
                nowPlayingInfo[MPMediaItemPropertyArtist] = artist
            }
            if nowPlayingInfo[MPMediaItemPropertyAlbumTitle] == nil, let album = track["album"] as? String {
                nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
            }
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    func onError(_ errorMessage: String) {
        if hasListeners {
            let payload: [String: Any] = [
                "error": errorMessage,
                "errorCode": GENERIC_ERROR_CODE
            ]
            sendEvent(type: EVENT_TYPE_PLAYBACK_ERROR, track: currentTrack, payload: payload)
        }
        cleanup()
    }

    private func setupRemoteTransportControls() {
        if isRemoteCommandCenterSetup { return }
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = true
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.isEnabled = true

        commandCenter.playCommand.addTarget { [weak self] event in
            guard let self = self else { return .commandFailed }
            if self.player?.rate == 0 {
                self.resume()
                return .success
            }
            return .commandFailed
        }

        commandCenter.pauseCommand.addTarget { [weak self] event in
            guard let self = self else { return .commandFailed }
            if self.player?.rate != 0 {
                self.pause()
                return .success
            }
            return .commandFailed
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] event in
            guard let self = self else { return .commandFailed }

            self.sendEvent(type: self.EVENT_TYPE_REMOTE_NEXT, track: self.currentTrack, payload: [:])

            return .success
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] event in
            guard let self = self else { return .commandFailed }

            self.sendEvent(type: self.EVENT_TYPE_REMOTE_PREV, track: self.currentTrack, payload: [:])

            return .success
        }

        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self = self, let positionEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self.seekTo(position: positionEvent.positionTime * 1000)
            return .success
        }

        isRemoteCommandCenterSetup = true
    }

    private func removeRemoteTransportControls() {
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.playCommand.removeTarget(nil)
        commandCenter.pauseCommand.removeTarget(nil)
        commandCenter.nextTrackCommand.removeTarget(nil)
        commandCenter.previousTrackCommand.removeTarget(nil)
        commandCenter.changePlaybackPositionCommand.removeTarget(nil)
    }
}
