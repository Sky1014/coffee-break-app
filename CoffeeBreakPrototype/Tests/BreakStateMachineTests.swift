import XCTest
@testable import CoffeeBreakCore

final class BreakStateMachineTests: XCTestCase {
    func testStartCycleSchedulesStandardReminder() {
        let now = Date(timeIntervalSince1970: 100)
        let machine = BreakStateMachine(configuration: .standard)

        let output = machine.reduce(
            state: .inactive(reason: .userPaused),
            event: .startCycle(now: now)
        )

        XCTAssertEqual(output.sideEffects, [
            .scheduleCycleReminder(at: now.addingTimeInterval(35 * 60)),
            .syncStateToPhone
        ])

        guard case let .brewing(_, startedAt) = output.state else {
            return XCTFail("Expected brewing state")
        }
        XCTAssertEqual(startedAt, now)
    }

    func testTimerElapsedMovesBrewingToReady() {
        let now = Date(timeIntervalSince1970: 100)
        let cycleID = UUID()
        let machine = BreakStateMachine(configuration: .standard)

        let output = machine.reduce(
            state: .brewing(cycleID: cycleID, startedAt: now),
            event: .cycleTimerElapsed(now: now.addingTimeInterval(35 * 60))
        )

        XCTAssertEqual(output.state, .ready(cycleID: cycleID, escalationLevel: 0, snoozeCount: 0, skipCount: 0))
        XCTAssertTrue(output.sideEffects.contains(.playHaptic(.normalReminder)))
    }

    func testStrictSecondSnoozeEntersLocked() {
        let now = Date(timeIntervalSince1970: 100)
        let cycleID = UUID()
        let machine = BreakStateMachine(configuration: .strict)
        let state = CoffeeBreakState.ready(cycleID: cycleID, escalationLevel: 1, snoozeCount: 1, skipCount: 0)

        let output = machine.reduce(state: state, event: .snoozeTapped(now: now))

        XCTAssertEqual(output.state, .locked(cycleID: cycleID, enteredAt: now))
        XCTAssertTrue(output.sideEffects.contains(.playHaptic(.locked)))
    }

    func testDetectionTypeSwitchResetsProgress() {
        let now = Date(timeIntervalSince1970: 100)
        let cycleID = UUID()
        let machine = BreakStateMachine(configuration: .standard)
        let state = CoffeeBreakState.detecting(cycleID: cycleID, type: .standing, progress: 0.7, locked: false)

        let output = machine.reduce(
            state: state,
            event: .detectionProgress(.walking, progress: 0.8, now: now)
        )

        XCTAssertEqual(output.state, .detecting(cycleID: cycleID, type: .walking, progress: 0, locked: false))
    }

    func testWalkingCompletionPersistsCompletedWalk() {
        let now = Date(timeIntervalSince1970: 100)
        let cycleID = UUID()
        let machine = BreakStateMachine(configuration: .standard)
        let state = CoffeeBreakState.detecting(cycleID: cycleID, type: .walking, progress: 1, locked: false)

        let output = machine.reduce(
            state: state,
            event: .detectionCompleted(.walking, now: now)
        )

        XCTAssertEqual(output.state, .completed(cycleID: cycleID, result: .completedWalk))
        XCTAssertTrue(output.sideEffects.contains(.persistResult(.completedWalk)))
    }
}

