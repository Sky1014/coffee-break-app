import SwiftUI
import CoffeeBreakCore

struct WatchRootView: View {
    @StateObject private var viewModel = WatchBreakViewModel()

    var body: some View {
        VStack(spacing: 8) {
            currentView
            DebugControlsView(viewModel: viewModel)
        }
        .padding(.horizontal, 8)
        .background(ClassicCoffeeColors.backgroundPrimary)
    }

    @ViewBuilder
    private var currentView: some View {
        switch viewModel.state {
        case .inactive, .brewing, .covered:
            WatchHomeView(viewModel: viewModel)
        case let .ready(_, escalationLevel, _, _):
            ReminderView(viewModel: viewModel, escalated: escalationLevel > 0)
        case let .detecting(_, type, progress, locked):
            DetectionView(viewModel: viewModel, type: type, progress: progress, locked: locked)
        case let .snoozed(_, _, until):
            SnoozedView(viewModel: viewModel, until: until)
        case .skipped:
            SkippedView(viewModel: viewModel)
        case .locked:
            LockedBreakView(viewModel: viewModel)
        case let .completed(_, result):
            CompletionView(viewModel: viewModel, result: result)
        case let .abandoned(cycleID):
            Text("Paused before reset was completed.")
                .font(.caption)
                .onTapGesture {
                    viewModel.send(.startCycle(now: Date()))
                }
        case let .paused(reason):
            PausedView(viewModel: viewModel, reason: reason)
        }
    }
}
