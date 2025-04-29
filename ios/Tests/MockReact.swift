import Foundation

// Mock RCTEventEmitter class for testing
class RCTEventEmitter: NSObject {
    func supportedEvents() -> [String]! {
        return []
    }
    
    func sendEvent(withName name: String, body: Any?) {
        // Mock implementation
    }
    
    func startObserving() {
        // Mock implementation
    }
    
    func stopObserving() {
        // Mock implementation
    }
}

// Mock RCTBridgeModule protocol
@objc protocol RCTBridgeModule {
    static func requiresMainQueueSetup() -> Bool
}

// Mock RCTBridge class
class RCTBridge: NSObject {
    // Mock implementation
} 