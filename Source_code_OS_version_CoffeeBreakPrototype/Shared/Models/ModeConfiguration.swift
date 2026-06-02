import Foundation

public struct ModeConfiguration: Codable, Equatable {
    public let mode: BreakMode
    public let checkIntervalSeconds: TimeInterval
    public let breakDurationSeconds: TimeInterval
    public let snoozeDurationSeconds: TimeInterval
    public let maxSnoozes: Int
    public let skipFollowUpSeconds: TimeInterval

    public init(
        mode: BreakMode,
        checkIntervalSeconds: TimeInterval,
        breakDurationSeconds: TimeInterval,
        snoozeDurationSeconds: TimeInterval,
        maxSnoozes: Int,
        skipFollowUpSeconds: TimeInterval
    ) {
        self.mode = mode
        self.checkIntervalSeconds = checkIntervalSeconds
        self.breakDurationSeconds = breakDurationSeconds
        self.snoozeDurationSeconds = snoozeDurationSeconds
        self.maxSnoozes = maxSnoozes
        self.skipFollowUpSeconds = skipFollowUpSeconds
    }
}

public extension ModeConfiguration {
    static let gentle = ModeConfiguration(
        mode: .gentle,
        checkIntervalSeconds: 45 * 60,
        breakDurationSeconds: 60,
        snoozeDurationSeconds: 5 * 60,
        maxSnoozes: 3,
        skipFollowUpSeconds: 5 * 60
    )

    static let standard = ModeConfiguration(
        mode: .standard,
        checkIntervalSeconds: 35 * 60,
        breakDurationSeconds: 60,
        snoozeDurationSeconds: 5 * 60,
        maxSnoozes: 2,
        skipFollowUpSeconds: 2 * 60
    )

    static let strict = ModeConfiguration(
        mode: .strict,
        checkIntervalSeconds: 25 * 60,
        breakDurationSeconds: 60,
        snoozeDurationSeconds: 3 * 60,
        maxSnoozes: 1,
        skipFollowUpSeconds: 60
    )

    static func configuration(for mode: BreakMode) -> ModeConfiguration {
        switch mode {
        case .gentle: return .gentle
        case .standard: return .standard
        case .strict: return .strict
        }
    }
}

