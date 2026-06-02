import Foundation

public enum BreakSideEffect: Equatable {
    case scheduleCycleReminder(at: Date)
    case scheduleSnoozeReminder(at: Date)
    case scheduleSkipFollowUp(at: Date)
    case cancelPendingReminders
    case startDetection(locked: Bool)
    case stopDetection
    case playHaptic(HapticKind)
    case persistResult(BreakResult)
    case syncStateToPhone
}

public struct StateMachineOutput: Equatable {
    public let state: CoffeeBreakState
    public let sideEffects: [BreakSideEffect]

    public init(state: CoffeeBreakState, sideEffects: [BreakSideEffect]) {
        self.state = state
        self.sideEffects = sideEffects
    }
}

