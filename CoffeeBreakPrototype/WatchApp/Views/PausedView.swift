import SwiftUI
import CoffeeBreakCore

struct PausedView: View {
    @ObservedObject var viewModel: WatchBreakViewModel
    let reason: PauseReason

    var body: some View {
        VStack(spacing: 10) {
            CoffeeCupView(progress: 0, locked: true, walking: false)
            Text(reason.message)
                .font(.headline)
                .multilineTextAlignment(.center)
            Button("Resume") {
                viewModel.send(.resume(now: Date()))
            }
        }
    }
}
