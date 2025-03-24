import Foundation
import AVFoundation

@objc(AudioPro)
class AudioPro: NSObject {
  private var player: AVPlayer?

  @objc(play:)
  func play(urlString: NSString) {
    guard let url = URL(string: urlString as String) else { return }
    let item = AVPlayerItem(url: url)
    player = AVPlayer(playerItem: item)
    player?.play()
  }

  @objc(pause)
  func pause() {
    player?.pause()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
