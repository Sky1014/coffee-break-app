import SwiftUI
import CoffeeBreakCore

struct CoffeeHeroView: View {
    let progress: Double
    let locked: Bool

    var body: some View {
        ZStack {
            Circle()
                .fill((locked ? ClassicCoffeeColors.lockedCool : ClassicCoffeeColors.accentWarm).opacity(0.12))
                .frame(width: 220, height: 220)

            ProgressRingView(progress: progress, locked: locked, walking: false) {
                CoffeeCupView(progress: progress, locked: locked, walking: false)
            }
            .frame(width: 170, height: 170)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }
}
