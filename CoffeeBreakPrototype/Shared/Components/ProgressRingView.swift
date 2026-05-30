import SwiftUI

public struct ProgressRingView<Content: View>: View {
    public let progress: Double
    public let locked: Bool
    public let walking: Bool
    private let content: Content

    public init(
        progress: Double,
        locked: Bool,
        walking: Bool,
        @ViewBuilder content: () -> Content
    ) {
        self.progress = progress
        self.locked = locked
        self.walking = walking
        self.content = content()
    }

    private var activeColor: Color {
        if locked { return ClassicCoffeeColors.lockedCool }
        return walking ? ClassicCoffeeColors.accentGold : ClassicCoffeeColors.accentWarm
    }

    public var body: some View {
        ZStack {
            Circle()
                .stroke(ClassicCoffeeColors.ringTrack, lineWidth: 8)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(activeColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.25), value: progress)
            content
        }
        .frame(width: 140, height: 140)
    }
}
