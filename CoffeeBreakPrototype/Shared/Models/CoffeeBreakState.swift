import Foundation

public enum CoffeeBreakState: Equatable, Codable {
    case inactive(reason: PauseReason)
    case brewing(cycleID: UUID, startedAt: Date)
    case covered(cycleID: UUID, result: BreakResult)
    case ready(cycleID: UUID, escalationLevel: Int, snoozeCount: Int, skipCount: Int)
    case detecting(cycleID: UUID, type: DetectionType, progress: Double, locked: Bool)
    case snoozed(cycleID: UUID, snoozeCount: Int, until: Date)
    case skipped(cycleID: UUID, skipCount: Int)
    case locked(cycleID: UUID, enteredAt: Date)
    case completed(cycleID: UUID, result: BreakResult)
    case abandoned(cycleID: UUID)
    case paused(reason: PauseReason)
}

public extension CoffeeBreakState {
    var cycleID: UUID? {
        switch self {
        case .inactive, .paused:
            return nil
        case let .brewing(id, _),
             let .covered(id, _),
             let .ready(id, _, _, _),
             let .detecting(id, _, _, _),
             let .snoozed(id, _, _),
             let .skipped(id, _),
             let .locked(id, _),
             let .completed(id, _),
             let .abandoned(id):
            return id
        }
    }

    var isLockedContext: Bool {
        switch self {
        case .locked:
            return true
        case let .detecting(_, _, _, locked):
            return locked
        default:
            return false
        }
    }
}

