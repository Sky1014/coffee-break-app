import SwiftUI
import CoffeeBreakCore

struct ReminderView: View {
    @ObservedObject var viewModel: WatchBreakViewModel
    let escalated: Bool

    var body: some View {
        VStack(spacing: 8) {
            ProgressRingView(progress: 0, locked: false, walking: false) {
                CoffeeCupView(progress: escalated ? 0.15 : 0.2, locked: false, walking: false)
            }

            Text(escalated ? "Coffee is still waiting." : "Coffee Break is ready.")
                .font(.headline)
                .multilineTextAlignment(.center)

            Text(escalated ? "Let's not leave your body behind." : "Let's bring your body back.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)

            HStack {
                Button("Snooze") { viewModel.send(.snoozeTapped(now: Date())) }
                Button("Skip") { viewModel.send(.skipTapped(now: Date())) }
            }
            .font(.caption)
        }
    }
}
