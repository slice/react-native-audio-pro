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
    private let STATE_ERROR = "ERROR"

    private let GENERIC_ERROR_CODE = 900
    private let progressInterval: TimeInterval = 1.0
    private var shouldBePlaying = false
    private var isRemoteCommandCenterSetup = false

    private var isRateObserverAdded = false
    private var isStatusObserverAdded = false

    private var currentPlaybackSpeed: Float = 1.0
    private var currentTrack: NSDictionary?

    private var debugLog: Bool = false
    private var debugIncludesProgress: Bool = false
    private var isInErrorState: Bool = false
    private var lastEmittedState: String = ""

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

        if !debugIncludesProgress && items.count > 0 {
            if let firstItem = items.first, "\(firstItem)" == EVENT_TYPE_PROGRESS {
                return
            }
        }

        print("~~~ [AudioPro]", items.map { "\($0)" }.joined(separator: " "))
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

        log(type)

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
        // Reset error state when playing a new track
        isInErrorState = false
        // Reset last emitted state when playing a new track
        lastEmittedState = ""
        currentTrack = track
        debugLog = options["debug"] as? Bool ?? false
        debugIncludesProgress = options["debugIncludesProgress"] as? Bool ?? false
        let speed = options["playbackSpeed"] as? Float ?? 1.0
        let autoplay = options["autoplay"] as? Bool ?? true
        currentPlaybackSpeed = speed
        log("Play", track["title"] ?? "Unknown", "speed:", speed, "autoplay:", autoplay)

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

        // Use sendStateEvent to ensure lastEmittedState is updated
        sendStateEvent(state: STATE_LOADING, position: 0, duration: 0)
        shouldBePlaying = autoplay

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

        // Create new player item with custom headers if provided
        let item: AVPlayerItem

        // Check if audio headers are provided
        if let headers = options["headers"] as? NSDictionary, let audioHeaders = headers["audio"] as? NSDictionary {
            // Convert headers to Swift dictionary
            var headerFields = [String: String]()
            for (key, value) in audioHeaders {
                if let headerField = key as? String, let headerValue = value as? String {
                    headerFields[headerField] = headerValue
                }
            }

            // Create an AVAsset with the headers
            let asset = AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": headerFields])
            item = AVPlayerItem(asset: asset)
        } else {
            // No headers, use simple URL initialization
            item = AVPlayerItem(url: url)
        }

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

        // Set up playback speed
        if currentPlaybackSpeed != 1.0 {
            player?.rate = currentPlaybackSpeed

            var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
            currentInfo[MPNowPlayingInfoPropertyPlaybackRate] = Double(currentPlaybackSpeed)
            MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
        }

        if autoplay {
            player?.play()
        } else {
            DispatchQueue.main.async {
                // Use sendStateEvent to ensure lastEmittedState is updated
                self.sendStateEvent(state: self.STATE_PAUSED, position: 0, duration: 0)
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            // Don't emit PLAYING state if we're in an error state
            if self.isInErrorState {
                self.log("Ignoring delayed PLAYING state after ERROR")
                return
            }

            if self.player?.rate != 0 && self.hasListeners {
                // Use sendPlayingStateEvent to ensure lastEmittedState is updated
                self.sendPlayingStateEvent()
                self.startProgressTimer()
            }
        }

        // Fetch artwork asynchronously and update Now Playing info
        DispatchQueue.global().async {
            do {
                // Check if artwork headers are provided
                if let headers = options["headers"] as? NSDictionary, let artworkHeaders = headers["artwork"] as? NSDictionary {
                    // Create a simple URL request with headers
                    var request = URLRequest(url: artworkUrl)
                    for (key, value) in artworkHeaders {
                        if let headerField = key as? String, let headerValue = value as? String {
                            request.setValue(headerValue, forHTTPHeaderField: headerField)
                        }
                    }

                    // Use a semaphore to make the async call synchronous in this background thread
                    let semaphore = DispatchSemaphore(value: 0)
                    var imageData: Data? = nil
                    var requestError: Error? = nil

                    URLSession.shared.dataTask(with: request) { (data, response, error) in
                        imageData = data
                        requestError = error
                        semaphore.signal()
                    }.resume()

                    // Wait for the request to complete
                    semaphore.wait()

                    if let error = requestError {
                        throw error
                    }

                    guard let data = imageData else {
                        throw NSError(domain: "AudioPro", code: 0, userInfo: [NSLocalizedDescriptionKey: "No image data received"])
                    }

                    guard let image = UIImage(data: data) else {
                        throw NSError(domain: "AudioPro", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])
                    }

                    let mpmArtwork = MPMediaItemArtwork(boundsSize: image.size, requestHandler: { _ in image })
                    DispatchQueue.main.async {
                        var currentInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()
                        currentInfo[MPMediaItemPropertyArtwork] = mpmArtwork
                        MPNowPlayingInfoCenter.default().nowPlayingInfo = currentInfo
                    }
                } else {
                    // No headers, use simple Data initialization
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
        updateNowPlayingInfo(time: player?.currentTime().seconds ?? 0, rate: 0)
    }

    @objc(resume)
    func resume() {
        shouldBePlaying = true
        player?.play()
        updateNowPlayingInfo(time: player?.currentTime().seconds ?? 0, rate: 1.0)
        // Note: We don't need to call sendPlayingStateEvent() here because
        // the rate change will trigger observeValue which now calls sendPlayingStateEvent()
    }

    /// stop is meant to halt playback and update the state without destroying persistent info
    /// such as artwork and remote control settings. This allows the lock screen/Control Center
    /// to continue displaying the track details for a potential resume.
    @objc func stop() {
        // Reset error state when explicitly stopping
        isInErrorState = false
        // Reset last emitted state when stopping playback
        lastEmittedState = ""
        shouldBePlaying = false

        player?.pause()
        player?.seek(to: .zero)
        stopTimer()
        currentTrack = nil
        sendStoppedStateEvent()

        // Update now playing info to reflect a stopped state but keep the artwork intact.
        updateNowPlayingInfo(time: 0, rate: 0)
    }

    /// cleanup fully tears down the player instance and removes observers and remote controls.
    /// This is used when switching tracks or recovering from an error.
    /// - Parameter emitStateChange: Whether to emit a STOPPED state change event (default: true)
    @objc func cleanup(emitStateChange: Bool = true) {
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

        // Only emit state change if requested and not in error state
        if emitStateChange && !isInErrorState {
            sendStoppedStateEvent()
        }

        // Clear the now playing info and remote control events
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

    /// Common seek implementation used by all seek methods
    private func performSeek(to position: Double, isAbsolute: Bool = true) {
        guard let player = player else {
            onError("Cannot seek: no track is playing")
            return
        }

        guard let currentItem = player.currentItem else {
            onError("Cannot seek: no item loaded")
            return
        }

        let duration = currentItem.duration.seconds
        let currentTime = player.currentTime().seconds

        // For relative seeking (forward/back), we need valid current time
        if !isAbsolute && (currentTime.isNaN || currentTime.isInfinite) {
            onError("Cannot seek: invalid track position")
            return
        }

        // For all seeks, we need valid duration
        if duration.isNaN || duration.isInfinite {
            onError("Cannot seek: invalid track duration")
            return
        }

        // Calculate target position based on whether this is absolute or relative
        let targetPosition: Double
        if isAbsolute {
            // For seekTo, convert ms to seconds
            targetPosition = position / 1000.0
        } else {
            // For seekForward/Back, position is the amount in ms
            let amountInSeconds = position / 1000.0
            targetPosition = isAbsolute ? amountInSeconds :
                             (position >= 0) ? min(currentTime + amountInSeconds, duration) :
                                              max(0, currentTime + amountInSeconds)
        }

        // Ensure position is within valid range
        let validPosition = max(0, min(targetPosition, duration))
        let time = CMTime(seconds: validPosition, preferredTimescale: 1000)

        beginSeeking()

        player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] completed in
            guard let self = self else { return }
            if completed {
                self.updateNowPlayingInfoWithCurrentTime(validPosition)
                self.completeSeekingAndSendSeekCompleteNoticeEvent(newPosition: validPosition * 1000)

                // Force update the now playing info to ensure controls work
                if isAbsolute { // Only do this for absolute seeks to avoid redundant updates
                    DispatchQueue.main.async {
                        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = validPosition
                        info[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
                        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
                    }
                }
            } else if player.rate != 0 {
                self.startProgressTimer()
            }
        }
    }

    @objc(seekTo:)
    func seekTo(position: Double) {
        performSeek(to: position, isAbsolute: true)
    }

    @objc(seekForward:)
    func seekForward(amount: Double) {
        performSeek(to: amount, isAbsolute: false)
    }

    @objc(seekBack:)
    func seekBack(amount: Double) {
        performSeek(to: -amount, isAbsolute: false)
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

        updateNowPlayingInfo(rate: Float(speed))

        if hasListeners {
            let playbackInfo = getPlaybackInfo()
            let payload: [String: Any] = ["speed": speed]
            sendEvent(type: EVENT_TYPE_PLAYBACK_SPEED_CHANGED, track: playbackInfo.track, payload: payload)
        }
    }

    ////////////////////////////////////////////////////////////
    // MARK: - KVO & Notification Handlers
    ////////////////////////////////////////////////////////////

    @objc private func playerItemDidPlayToEndTime(_ notification: Notification) {
        guard let _ = player?.currentItem else { return }

        // Don't process track end if we're in an error state
        if isInErrorState {
            log("Ignoring track end notification while in ERROR state")
            return
        }

        let info = getPlaybackInfo()

        // When a track naturally finishes, call stop (not cleanup)
        // so that Now Playing info (artwork, track details) remains visible.
        // Call stop() first to ensure STOPPED state is emitted before TRACK_ENDED
        stop()

        if hasListeners {
            let payload: [String: Any] = [
                "position": info.duration,
                "duration": info.duration
            ]
            sendEvent(type: EVENT_TYPE_TRACK_ENDED, track: info.track, payload: payload)
        }
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey : Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        // Don't process any KVO notifications if we're in an error state
        if isInErrorState {
            log("Ignoring KVO notification while in ERROR state: \(keyPath ?? "unknown")")
            return
        }

        if keyPath == "rate" {
            if let newRate = change?[.newKey] as? Float {
                if newRate == 0 {
                    if shouldBePlaying && hasListeners {
                        // Use sendStateEvent to ensure lastEmittedState is updated
                        sendStateEvent(state: STATE_LOADING, position: 0, duration: 0)
                        stopTimer()
                    }
                } else {
                    if shouldBePlaying && hasListeners {
                        // Use sendPlayingStateEvent to ensure lastEmittedState is updated
                        sendPlayingStateEvent()
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

        // Calculate position and duration in milliseconds
        let positionMs = Int(round(validCurrentTimeSec * 1000))
        let durationMs = Int(round(validDurationSec * 1000))

        // Sanitize negative values
        let sanitizedPositionMs = positionMs < 0 ? 0 : positionMs
        let sanitizedDurationMs = durationMs < 0 ? 0 : durationMs

        return (position: sanitizedPositionMs, duration: sanitizedDurationMs, track: currentTrack)
    }

    private func sendStateEvent(state: String, position: Int? = nil, duration: Int? = nil, track: NSDictionary? = nil) {
        guard hasListeners else { return }

        // When in error state, only allow ERROR state to be emitted
        if isInErrorState && state != STATE_ERROR {
            log("Ignoring \(state) state after ERROR")
            return
        }

        // Filter out duplicate state emissions
        // This prevents rapid-fire transitions of the same state being emitted repeatedly
        if state == lastEmittedState {
            log("Ignoring duplicate \(state) state emission")
            return
        }

        // Use provided values or get from getPlaybackInfo() which already sanitizes values
        let info = position == nil || duration == nil ? getPlaybackInfo() : (position: position!, duration: duration!, track: track)

        let payload: [String: Any] = [
            "state": state,
            "position": info.position,
            "duration": info.duration
        ]
        sendEvent(type: EVENT_TYPE_STATE_CHANGED, track: info.track, payload: payload)

        // Track the last emitted state
        lastEmittedState = state
    }

    private func sendStoppedStateEvent() {
        sendStateEvent(state: STATE_STOPPED, position: 0, duration: 0, track: nil)
    }

    private func sendPlayingStateEvent() {
        sendStateEvent(state: STATE_PLAYING)
    }

    private func sendPausedStateEvent() {
        sendStateEvent(state: STATE_PAUSED)
    }

    /// Stops playback without emitting a state change event
    /// Used for error handling to avoid emitting STOPPED after ERROR
    private func stopPlaybackWithoutStateChange() {
        // Use the cleanup method with emitStateChange set to false
        cleanup(emitStateChange: false)
    }

    /// Updates Now Playing Info with specified parameters, preserving existing values
    private func updateNowPlayingInfo(time: Double? = nil, rate: Float? = nil, duration: Double? = nil, track: NSDictionary? = nil) {
        var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [String: Any]()

        // Update time if provided
        if let time = time {
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = time
        }

        // Update rate if provided, otherwise use current player rate
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = rate ?? player?.rate ?? 0

        // Update duration if provided, otherwise try to get from current item
        if let duration = duration {
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        } else if let currentItem = player?.currentItem {
            let itemDuration = currentItem.duration.seconds
            if !itemDuration.isNaN && !itemDuration.isInfinite {
                nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = itemDuration
            }
        }

        // Ensure we have the basic track info from either provided track or current track
        let trackInfo = track ?? currentTrack
        if let trackInfo = trackInfo {
            if nowPlayingInfo[MPMediaItemPropertyTitle] == nil, let title = trackInfo["title"] as? String {
                nowPlayingInfo[MPMediaItemPropertyTitle] = title
            }
            if nowPlayingInfo[MPMediaItemPropertyArtist] == nil, let artist = trackInfo["artist"] as? String {
                nowPlayingInfo[MPMediaItemPropertyArtist] = artist
            }
            if nowPlayingInfo[MPMediaItemPropertyAlbumTitle] == nil, let album = trackInfo["album"] as? String {
                nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
            }
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    private func updateNowPlayingInfoWithCurrentTime(_ time: Double) {
        updateNowPlayingInfo(time: time)
    }

    func onError(_ errorMessage: String) {
        // If we're already in an error state, just log and return
        if isInErrorState {
            log("Already in error state, ignoring additional error: \(errorMessage)")
            return
        }

        // Set error state flag
        isInErrorState = true

        if hasListeners {
            // Send the error payload
            let errorPayload: [String: Any] = [
                "error": errorMessage,
                "errorCode": GENERIC_ERROR_CODE
            ]
            sendEvent(type: EVENT_TYPE_PLAYBACK_ERROR, track: currentTrack, payload: errorPayload)

            // Also send a state change to ERROR using sendStateEvent to ensure lastEmittedState is updated
            let position = player?.currentTime().seconds.isNaN ?? true ? 0 : Int(player?.currentTime().seconds ?? 0) * 1000
            let duration = player?.currentItem?.duration.seconds.isNaN ?? true ? 0 : Int(player?.currentItem?.duration.seconds ?? 0) * 1000
            sendStateEvent(state: STATE_ERROR, position: position, duration: duration)
        }

        // Store the current track before cleanup
        let trackBeforeCleanup = currentTrack

        // Don't call cleanup() which would emit STOPPED state
        // Just stop playback and timers without changing state
        stopPlaybackWithoutStateChange()

        // Clear notification center controls when in ERROR state
        DispatchQueue.main.async {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
            UIApplication.shared.endReceivingRemoteControlEvents()
        }
        removeRemoteTransportControls()
        isRemoteCommandCenterSetup = false

        // Restore the track after cleanup (since cleanup sets it to nil)
        currentTrack = trackBeforeCleanup
    }

    private func setupRemoteTransportControls() {
        if isRemoteCommandCenterSetup { return }
        let commandCenter = MPRemoteCommandCenter.shared()

        // Configure all commands at once
        let commands: [(MPRemoteCommand, Bool)] = [
            (commandCenter.playCommand, true),
            (commandCenter.pauseCommand, true),
            (commandCenter.nextTrackCommand, true),
            (commandCenter.previousTrackCommand, true),
            (commandCenter.changePlaybackPositionCommand, true)
        ]

        // Enable all commands
        commands.forEach { $0.0.isEnabled = $0.1 }

        // Add targets
        commandCenter.playCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            if self.player?.rate == 0 {
                self.resume()
                return .success
            }
            return .commandFailed
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            if self.player?.rate != 0 {
                self.pause()
                return .success
            }
            return .commandFailed
        }

        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.sendEvent(type: self.EVENT_TYPE_REMOTE_NEXT, track: self.currentTrack, payload: [:])
            return .success
        }

        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.sendEvent(type: self.EVENT_TYPE_REMOTE_PREV, track: self.currentTrack, payload: [:])
            return .success
        }

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
