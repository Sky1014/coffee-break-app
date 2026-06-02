import SwiftUI

public struct CoffeeCupView: View {
    public var progress: Double
    public var locked: Bool
    public var walking: Bool

    public init(progress: Double, locked: Bool, walking: Bool) {
        self.progress = progress
        self.locked = locked
        self.walking = walking
    }

    private var fillColor: Color {
        if locked { return ClassicCoffeeColors.lockedCool }
        return walking ? ClassicCoffeeColors.accentGold : ClassicCoffeeColors.coffeeMedium
    }

    public var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 14)
                .stroke(ClassicCoffeeColors.coffeeDark, lineWidth: 4)
                .frame(width: 72, height: 58)
                .overlay(alignment: .trailing) {
                    Circle()
                        .stroke(ClassicCoffeeColors.coffeeDark, lineWidth: 4)
                        .frame(width: 26, height: 26)
                        .offset(x: 17)
                }

            RoundedRectangle(cornerRadius: 10)
                .fill(fillColor)
                .frame(width: 62, height: max(6, 48 * progress))
                .padding(.bottom, 5)
                .animation(.easeInOut(duration: 0.25), value: progress)

            if !locked {
                VStack(spacing: 3) {
                    Capsule().fill(ClassicCoffeeColors.cream.opacity(0.6)).frame(width: 4, height: 16)
                    Capsule().fill(ClassicCoffeeColors.cream.opacity(0.45)).frame(width: 4, height: 12)
                }
                .offset(y: -70)
            }
        }
        .frame(width: 110, height: 110)
    }
}
