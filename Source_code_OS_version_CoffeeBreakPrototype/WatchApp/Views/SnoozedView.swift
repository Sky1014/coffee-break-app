import SwiftUI
import CoffeeBreakCore

struct SnoozedView: View {
    @ObservedObject var viewModel: WatchBreakViewModel
    let until: Date

    var body: some View {
        VStack(spacing: 8) {
            ProgressRingView(progress: 0, locked: false, walking: false) {
                CoffeeCupView(progress: 0.12, locked: false, walking: false)
            }
            Text("Brewing a little longer.")
                .font(.headline)
                .multilineTextAlignment(.center)
            Text("Your reset is still waiting.")
                .font(.caption)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)
            Button("Reset Now") {
                viewModel.send(.snoozeElapsed(now: Date()))
            }
        }
    }
}
