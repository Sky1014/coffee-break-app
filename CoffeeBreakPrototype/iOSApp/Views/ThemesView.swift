import SwiftUI
import CoffeeBreakCore

struct ThemesView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    CoffeeHeroView(progress: 0.75, locked: false)
                    Text("Classic Coffee")
                        .font(.title.bold())
                    Text("Warm cup, soft steam, calm reset rhythm.")
                        .foregroundStyle(.secondary)

                    Divider()

                    CoffeeHeroView(progress: 0.2, locked: true)
                    Text("Locked preview")
                        .font(.headline)
                    Text("When a reset waits too long, the coffee cools down.")
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .background(ClassicCoffeeColors.backgroundPrimary)
            .navigationTitle("Themes")
        }
    }
}
