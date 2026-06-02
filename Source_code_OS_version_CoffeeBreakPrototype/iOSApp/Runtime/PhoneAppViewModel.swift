import Foundation
import SwiftUI
import CoffeeBreakCore

@MainActor
final class PhoneAppViewModel: ObservableObject {
    @Published var settings: UserSettings = .defaultValue
    @Published var watchState: CoffeeBreakState? = .brewing(cycleID: UUID(), startedAt: Date())
    @Published var dailySummary: DailySummary = DailySummary(completedStandCount: 2, completedWalkCount: 1, naturallyCoveredCount: 1)

    func updateMode(_ mode: BreakMode) {
        settings.selectedMode = mode
    }

    func pauseToday() {
        watchState = .paused(reason: .userPaused)
    }

    func resume() {
        watchState = .brewing(cycleID: UUID(), startedAt: Date())
    }
}
