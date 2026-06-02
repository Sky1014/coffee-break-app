import SwiftUI
import CoffeeBreakCore

struct CompletionView: View {
    @ObservedObject var viewModel: WatchBreakViewModel
    let result: BreakResult

    private var isWalk: Bool {
        result == .completedWalk || result == .naturallyCoveredWalk
    }

    var body: some View {
        VStack(spacing: 8) {
            ProgressRingView(progress: 1, locked: false, walking: isWalk) {
                CoffeeCupView(progress: 1, locked: false, walking: isWalk)
            }
            Text("Body Reset.")
                .font(.headline)
            Text(isWalk ? "Your body is awake again." : "Sitting streak broken.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)
            Button("Done") {
                viewModel.send(.startCycle(now: Date()))
            }
        }
    }
}
