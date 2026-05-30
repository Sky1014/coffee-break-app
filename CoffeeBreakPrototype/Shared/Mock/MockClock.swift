import Foundation

public protocol ClockProviding {
    var now: Date { get }
}

public struct SystemClock: ClockProviding {
    public init() {}
    public var now: Date { Date() }
}

public final class MockClock: ClockProviding {
    public private(set) var now: Date

    public init(now: Date = Date(timeIntervalSince1970: 0)) {
        self.now = now
    }

    public func advance(by seconds: TimeInterval) {
        now = now.addingTimeInterval(seconds)
    }
}

