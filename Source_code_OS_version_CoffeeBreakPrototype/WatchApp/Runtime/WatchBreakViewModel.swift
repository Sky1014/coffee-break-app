import Foundation
import SwiftUI
import CoffeeBreakCore

@MainActor
final class WatchBreakViewModel: ObservableObject {
    @Published private(set) var state: CoffeeBreakState
    @Published private(set) var dailySummary: DailySummary
    @Published private(set) var settings: UserSettings

    private var machine: BreakStateMachine {
        BreakStateMachine(configuration: ModeConfiguration.configuration(for: settings.selectedMode))
    }

    init(
        state: CoffeeBreakState = .inactive(reason: .userPaused),
        dailySummary: DailySummary = DailySummary(),
        settings: UserSettings = .defaultValue
    ) {
        self.state = state
        self.dailySummary = dailySummary
        self.settings = settings
    }

    func send(_ event: CoffeeBreakEvent) {
        let output = machine.reduce(state: state, event: event)
        state = output.state
        applyLocalSummaryChanges(for: output.sideEffects)
    }

    func updateMode(_ mode: BreakMode) {
        settings.selectedMode = mode
    }

    private func applyLocalSummaryChanges(for sideEffects: [BreakSideEffect]) {
        for effect in sideEffects {
            guard case let .persistResult(result) = effect else { continue }
            switch result {
            case .completedStand:
                dailySummary.completedStandCount += 1
            case .completedWalk:
                dailySummary.completedWalkCount += 1
            case .naturallyCoveredStand, .naturallyCoveredWalk:
                dailySummary.naturallyCoveredCount += 1
            case .skipped:
                dailySummary.skippedCount += 1
            case .abandoned:
                dailySummary.abandonedCount += 1
            case .paused:
                break
            }
        }
    }
}
