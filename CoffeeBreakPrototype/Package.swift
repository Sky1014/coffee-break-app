// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "CoffeeBreakCore",
    platforms: [
        .iOS(.v17),
        .watchOS(.v10),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "CoffeeBreakCore",
            targets: ["CoffeeBreakCore"]
        )
    ],
    targets: [
        .target(
            name: "CoffeeBreakCore",
            path: "Shared"
        ),
        .testTarget(
            name: "CoffeeBreakCoreTests",
            dependencies: ["CoffeeBreakCore"],
            path: "Tests"
        )
    ]
)

