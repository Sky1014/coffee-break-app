import SwiftUI
import CoffeeBreakCore

struct DetectionView: View {
    @ObservedObject var viewModel: WatchBreakViewModel
    let type: DetectionType
    let progress: Double
    let locked: Bool

    var body: some View {
        VStack(spacing: 8) {
            ProgressRingView(progress: progress, locked: locked, walking: type == .walking) {
                CoffeeCupView(progress: progress, locked: locked, walking: type == .walking)
            }

            Text(type == .walking ? "Walking reset" : "Standing reset")
                .font(.headline)

            Text(type == .walking ? "Keep walking." : "Keep standing.")
                .font(.caption)
                .foregroundStyle(ClassicCoffeeColors.textSecondary)
        }
    }
}
