import Foundation

public struct BreakStateMachine {
    public let configuration: ModeConfiguration

    public init(configuration: ModeConfiguration) {
        self.configuration = configuration
    }

    public func reduce(
        state: CoffeeBreakState,
        event: CoffeeBreakEvent
    ) -> StateMachineOutput {
        switch event {
        case let .startCycle(now), let .resume(now):
            return startCycle(now: now)

        case let .cycleTimerElapsed(now):
            guard case let .brewing(cycleID, _) = state else {
                return unchanged(state)
            }
            return StateMachineOutput(
                state: .ready(cycleID: cycleID, escalationLevel: 0, snoozeCount: 0, skipCount: 0),
                sideEffects: [.playHaptic(.normalReminder), .syncStateToPhone]
            )

        case let .naturalCoverageDetected(type, _):
            guard case let .brewing(cycleID, _) = state else {
                return unchanged(state)
            }
            let result: BreakResult = type == .standing ? .naturallyCoveredStand : .naturallyCoveredWalk
            return StateMachineOutput(
                state: .covered(cycleID: cycleID, result: result),
                sideEffects: [.cancelPendingReminders, .persistResult(result), .syncStateToPhone]
            )

        case let .snoozeTapped(now):
            guard case let .ready(cycleID, escalationLevel, snoozeCount, skipCount) = state else {
                return unchanged(state)
            }
            let nextCount = snoozeCount + 1
            if nextCount > configuration.maxSnoozes {
                return enterLocked(cycleID: cycleID, now: now)
            }
            let until = now.addingTimeInterval(configuration.snoozeDurationSeconds)
            return StateMachineOutput(
                state: .snoozed(cycleID: cycleID, snoozeCount: nextCount, until: until),
                sideEffects: [.scheduleSnoozeReminder(at: until), .syncStateToPhone]
            )

        case let .snoozeElapsed(now):
            guard case let .snoozed(cycleID, snoozeCount, _) = state else {
                return unchanged(state)
            }
            if snoozeCount >= configuration.maxSnoozes {
                return enterLocked(cycleID: cycleID, now: now)
            }
            return StateMachineOutput(
                state: .ready(cycleID: cycleID, escalationLevel: snoozeCount, snoozeCount: snoozeCount, skipCount: 0),
                sideEffects: [.playHaptic(.escalatedReminder), .syncStateToPhone]
            )

        case let .skipTapped(now):
            guard case let .ready(cycleID, escalationLevel, snoozeCount, skipCount) = state else {
                return unchanged(state)
            }
            let nextSkipCount = skipCount + 1
            let followUp = now.addingTimeInterval(configuration.skipFollowUpSeconds)
            return StateMachineOutput(
                state: .skipped(cycleID: cycleID, skipCount: nextSkipCount),
                sideEffects: [
                    .persistResult(.skipped),
                    .scheduleSkipFollowUp(at: followUp),
                    .playHaptic(escalationLevel > 0 ? .escalatedReminder : .normalReminder),
                    .syncStateToPhone
                ]
            )

        case .skipFollowUpElapsed:
            guard case let .skipped(cycleID, skipCount) = state else {
                return unchanged(state)
            }
            return StateMachineOutput(
                state: .ready(cycleID: cycleID, escalationLevel: skipCount, snoozeCount: 0, skipCount: skipCount),
                sideEffects: [.playHaptic(.escalatedReminder), .syncStateToPhone]
            )

        case let .detectionStarted(type, _):
            if case let .ready(cycleID, _, _, _) = state {
                return StateMachineOutput(
                    state: .detecting(cycleID: cycleID, type: type, progress: 0, locked: false),
                    sideEffects: [.startDetection(locked: false), .syncStateToPhone]
                )
            }
            if case let .locked(cycleID, _) = state {
                return StateMachineOutput(
                    state: .detecting(cycleID: cycleID, type: type, progress: 0, locked: true),
                    sideEffects: [.startDetection(locked: true), .syncStateToPhone]
                )
            }
            return unchanged(state)

        case let .detectionProgress(type, progress, _):
            guard case let .detecting(cycleID, activeType, _, locked) = state else {
                return unchanged(state)
            }
            let clamped = min(max(progress, 0), 1)
            let nextProgress = type == activeType ? clamped : 0
            return StateMachineOutput(
                state: .detecting(cycleID: cycleID, type: type, progress: nextProgress, locked: locked),
                sideEffects: [.syncStateToPhone]
            )

        case .detectionContinuityBroken:
            guard case let .detecting(cycleID, type, _, locked) = state else {
                return unchanged(state)
            }
            return StateMachineOutput(
                state: .detecting(cycleID: cycleID, type: type, progress: 0, locked: locked),
                sideEffects: [.playHaptic(.gentleReset), .syncStateToPhone]
            )

        case let .detectionCompleted(type, _):
            guard case let .detecting(cycleID, _, _, _) = state else {
                return unchanged(state)
            }
            let result: BreakResult = type == .standing ? .completedStand : .completedWalk
            return StateMachineOutput(
                state: .completed(cycleID: cycleID, result: result),
                sideEffects: [
                    .stopDetection,
                    .cancelPendingReminders,
                    .persistResult(result),
                    .playHaptic(.success),
                    .syncStateToPhone
                ]
            )

        case let .enterLocked(now):
            guard let cycleID = state.cycleID else { return unchanged(state) }
            return enterLocked(cycleID: cycleID, now: now)

        case let .pause(reason, _):
            return StateMachineOutput(
                state: .paused(reason: reason),
                sideEffects: [.cancelPendingReminders, .stopDetection, .syncStateToPhone]
            )

        case .abandon:
            guard let cycleID = state.cycleID else { return unchanged(state) }
            return StateMachineOutput(
                state: .abandoned(cycleID: cycleID),
                sideEffects: [.stopDetection, .persistResult(.abandoned), .syncStateToPhone]
            )

        case .reminderOpened:
            return unchanged(state)
        }
    }

    private func startCycle(now: Date) -> StateMachineOutput {
        let cycleID = UUID()
        let reminderAt = now.addingTimeInterval(configuration.checkIntervalSeconds)
        return StateMachineOutput(
            state: .brewing(cycleID: cycleID, startedAt: now),
            sideEffects: [.scheduleCycleReminder(at: reminderAt), .syncStateToPhone]
        )
    }

    private func enterLocked(cycleID: UUID, now: Date) -> StateMachineOutput {
        StateMachineOutput(
            state: .locked(cycleID: cycleID, enteredAt: now),
            sideEffects: [.cancelPendingReminders, .playHaptic(.locked), .syncStateToPhone]
        )
    }

    private func unchanged(_ state: CoffeeBreakState) -> StateMachineOutput {
        StateMachineOutput(state: state, sideEffects: [])
    }
}

