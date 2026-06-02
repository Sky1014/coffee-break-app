import SwiftUI
import CoffeeBreakCore

struct LockedBreakView: View {
    @ObservedObject var viewModel: WatchBreakViewModel

    var body: some View {
        VStack(spacing: 8) {
            ProgressRingView(progress: 0, locked: true, walking: false) {
                CoffeeCupView(progress: 0.1, locked: true, walking: false)
            }
            Text("Coffee is getting cold.")
                .font(.headline)
                .multilineTextAlignment(.center)
            Text("One full minute. Then you're free.")
                .font(.caption)
                .multilineTextAlignment(.center)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)
        }
    }
}
