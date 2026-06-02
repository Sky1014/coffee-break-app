# Xcode Integration Notes

This prototype is source-first. Create the Xcode project on macOS, then add these files to the right targets.

## Recommended Xcode Setup

1. Create a new iOS App project named `CoffeeBreak`.
2. Add a watchOS App target.
3. Add a Swift package or framework target named `CoffeeBreakCore`.
4. Add a unit test target named `CoffeeBreakCoreTests`.

## Target Membership

Add these files to `CoffeeBreakCore`:

- `Shared/Models/*.swift`
- `Shared/StateMachine/*.swift`
- `Shared/Mock/*.swift`
- `Shared/Design/*.swift`
- `Shared/Components/*.swift`

Add these files to the watchOS target:

- `WatchApp/**/*.swift`

Add these files to the iOS target:

- `iOSApp/**/*.swift`

Add these files to the test target:

- `Tests/*.swift`

## Imports

If shared files are in a separate module named `CoffeeBreakCore`, add this import to iOS and watchOS files:

```swift
import CoffeeBreakCore
```

If shared files are directly included in each app target, do not add that import.

## Important

There are two `@main` app files:

- `iOSApp/App/CoffeeBreakPhoneApp.swift`
- `WatchApp/App/CoffeeBreakWatchApp.swift`

Only include the iOS app entry in the iOS target and only include the Watch app entry in the watchOS target.
