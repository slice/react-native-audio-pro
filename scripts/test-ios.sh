#!/bin/bash

# Exit on error
set -e

echo "Running iOS tests..."

# Navigate to the iOS directory
cd ios

# Create a temporary Package.swift file for testing
cat > Package.swift << 'EOL'
// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "AudioProTests",
    platforms: [.iOS(.v13)],
    products: [
        .library(name: "AudioProTests", targets: ["AudioProTests"]),
    ],
    targets: [
        .target(name: "AudioProTests", dependencies: []),
        .testTarget(
            name: "AudioProTestsTests",
            dependencies: ["AudioProTests"],
            path: "Tests",
            resources: [.process("test_audio.mp3")]
        ),
    ]
)
EOL

# Create a dummy source file for the package
mkdir -p Sources/AudioProTests
cat > Sources/AudioProTests/AudioProTests.swift << 'EOL'
public struct AudioProTests {
    public init() {}
}
EOL

# Run the tests using Swift Package Manager
swift test

# Clean up temporary files
rm -rf Package.swift Sources .build

echo "iOS tests completed successfully!"
