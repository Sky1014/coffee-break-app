import SwiftUI
import CoffeeBreakCore

struct WatchHomeView: View {
    @ObservedObject var viewModel: WatchBreakViewModel

    var body: some View {
        VStack(spacing: 8) {
            Text(viewModel.settings.selectedMode.displayName + " Mode")
                .font(.caption2)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)

            ProgressRingView(progress: 0.08, locked: false, walking: false) {
                CoffeeCupView(progress: 0.25, locked: false, walking: false)
            }

            Text("Your next reset is brewing.")
                .font(.headline)
                .multilineTextAlignment(.center)

            Text("\(viewModel.dailySummary.bodyResetCount) resets today")
                .font(.caption)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)
        }
        .foregroundStyle(ClassicCoffeeColors.textPrimary)
    }
}
