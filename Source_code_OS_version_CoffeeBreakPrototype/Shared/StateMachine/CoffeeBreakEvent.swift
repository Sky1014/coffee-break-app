import Foundation

public enum CoffeeBreakEvent: Equatable {
    case startCycle(now: Date)
    case cycleTimerElapsed(now: Date)
    case naturalCoverageDetected(DetectionType, now: Date)
    case reminderOpened(now: Date)
    case snoozeTapped(now: Date)
    case skipTapped(now: Date)
    case skipFollowUpElapsed(now: Date)
    case snoozeElapsed(now: Date)
    case detectionStarted(DetectionType, now: Date)
    case detectionProgress(DetectionType, progress: Double, now: Date)
    case detectionContinuityBroken(now: Date)
    case detectionCompleted(DetectionType, now: Date)
    case enterLocked(now: Date)
    case pause(PauseReason, now: Date)
    case resume(now: Date)
    case abandon(now: Date)
}

