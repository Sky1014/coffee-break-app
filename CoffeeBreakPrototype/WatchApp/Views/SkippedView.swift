import SwiftUI
import CoffeeBreakCore

struct SkippedView: View {
    @ObservedObject var viewModel: WatchBreakViewModel

    var body: some View {
        VStack(spacing: 8) {
            CoffeeCupView(progress: 0.1, locked: false, walking: false)
            Text("Skipped for now.")
                .font(.headline)
            Text("Coffee Break will come back soon.")
                .font(.caption)
                .multilineTextAlignment(.center)
            Button("Simulate Follow-up") {
                viewModel.send(.skipFollowUpElapsed(now: Date()))
            }
            .font(.caption)
        }
    }
}
