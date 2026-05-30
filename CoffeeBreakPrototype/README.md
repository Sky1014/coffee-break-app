# Coffee Break Prototype

This folder contains the Phase 1 source skeleton for Coffee Break.

It is designed to be copied into an Xcode project with:

- an iOS SwiftUI app target
- a watchOS SwiftUI app target
- the included local Swift package named `CoffeeBreakCore`
- a unit test target for the shared state machine

Current scope:

- Shared models
- Pure state machine
- Mock runtime
- Watch SwiftUI flow skeleton
- iPhone SwiftUI tab skeleton
- Unit test examples

Not included yet:

- Real Xcode project file
- Real notifications
- WatchConnectivity
- CoreMotion / sensor detection
- HealthKit

Recommended target membership:

- `Shared/**`: included through the `CoffeeBreakCore` Swift package
- `WatchApp/**`: watchOS app only
- `iOSApp/**`: iOS app only
- `Tests/**`: test target only

On macOS/Xcode, add `CoffeeBreakPrototype` as a local package dependency, then link `CoffeeBreakCore` to the iOS and watchOS app targets.
