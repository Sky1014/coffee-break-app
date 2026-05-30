import SwiftUI
import CoffeeBreakCore

struct WatchStatusView: View {
    @ObservedObject var viewModel: PhoneAppViewModel

    var body: some View {
        NavigationStack {
            List {
                StatusChecklistRow(title: "Apple Watch connected", ready: true)
                StatusChecklistRow(title: "Watch app installed", ready: true)
                StatusChecklistRow(title: "Notifications enabled", ready: false)
                StatusChecklistRow(title: "Motion detection ready", ready: false)
                StatusChecklistRow(title: "Quiet hours set", ready: viewModel.settings.quietHoursEnabled)
            }
            .navigationTitle("Watch setup")
        }
    }
}

private struct StatusChecklistRow: View {
    let title: String
    let ready: Bool

    var body: some View {
        HStack {
            Image(systemName: ready ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .foregroundStyle(ready ? ClassicCoffeeColors.success : ClassicCoffeeColors.accentWarm)
            Text(title)
            Spacer()
            if !ready {
                Button("Fix") {}
                    .buttonStyle(.bordered)
            }
        }
    }
}
