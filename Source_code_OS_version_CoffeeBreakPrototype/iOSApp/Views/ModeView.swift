import SwiftUI
import CoffeeBreakCore

struct ModeView: View {
    @ObservedObject var viewModel: PhoneAppViewModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(BreakMode.allCases) { mode in
                        Button {
                            viewModel.updateMode(mode)
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(mode.displayName)
                                        .font(.headline)
                                    Text(mode.subtitle)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if viewModel.settings.selectedMode == mode {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(ClassicCoffeeColors.success)
                                }
                            }
                        }
                    }
                } footer: {
                    Text("A reset always means 60 continuous seconds of standing or walking.")
                }
            }
            .navigationTitle("Choose your rhythm")
        }
    }
}
