import Foundation

public enum DetectionType: String, Codable, Equatable {
    case standing
    case walking

    public var displayName: String {
        switch self {
        case .standing: return "Standing"
        case .walking: return "Walking"
        }
    }
}

public enum BreakResult: String, Codable, Equatable {
    case completedStand
    case completedWalk
    case naturallyCoveredStand
    case naturallyCoveredWalk
    case skipped
    case abandoned
    case paused
}

public enum PauseReason: String, Codable, Equatable {
    case quietHours
    case userPaused
    case watchOffWrist
    case missingPermissions
    case sleep

    public var message: String {
        switch self {
        case .quietHours: return "Paused for quiet hours."
        case .userPaused: return "Coffee Break is paused."
        case .watchOffWrist: return "Paused while your Watch is off wrist."
        case .missingPermissions: return "Motion access needed."
        case .sleep: return "Paused during sleep."
        }
    }
}

public enum HapticKind: String, Codable, Equatable {
    case normalReminder
    case escalatedReminder
    case locked
    case success
    case gentleReset
}

