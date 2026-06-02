import SwiftUI
import CoffeeBreakCore

struct ScheduleView: View {
    @ObservedObject var viewModel: PhoneAppViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Quiet Hours") {
                    Toggle("Enabled", isOn: $viewModel.settings.quietHoursEnabled)
                    Text("Coffee Break stays quiet during this window.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section("Pause") {
                    Button("Pause Today") { viewModel.pauseToday() }
                    Button("Resume Coffee Break") { viewModel.resume() }
                }
            }
            .navigationTitle("Protect quiet time")
        }
    }
}
