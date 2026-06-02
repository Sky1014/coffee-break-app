import SwiftUI
import CoffeeBreakCore

struct TodayView: View {
    @ObservedObject var viewModel: PhoneAppViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    CoffeeHeroView(progress: 0.25, locked: false)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Your next reset is brewing.")
                            .font(.largeTitle.bold())
                        Text("Coffee Break is watching your rhythm from your Watch.")
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        MetricTile(title: "Body resets", value: "\(viewModel.dailySummary.bodyResetCount)")
                        MetricTile(title: "Naturally covered", value: "\(viewModel.dailySummary.naturallyCoveredCount)")
                    }

                    Button("Pause Today") {
                        viewModel.pauseToday()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .background(ClassicCoffeeColors.backgroundPrimary)
            .navigationTitle("Coffee Break")
        }
    }
}

private struct MetricTile: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(value)
                .font(.title.bold())
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.white.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
