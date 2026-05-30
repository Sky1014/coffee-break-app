import SwiftUI
import CoffeeBreakCore

struct PhoneRootView: View {
    @StateObject private var viewModel = PhoneAppViewModel()

    var body: some View {
        TabView {
            TodayView(viewModel: viewModel)
                .tabItem { Label("Today", systemImage: "cup.and.saucer.fill") }
            ModeView(viewModel: viewModel)
                .tabItem { Label("Mode", systemImage: "slider.horizontal.3") }
            ScheduleView(viewModel: viewModel)
                .tabItem { Label("Schedule", systemImage: "moon.zzz.fill") }
            WatchStatusView(viewModel: viewModel)
                .tabItem { Label("Watch", systemImage: "applewatch") }
            ThemesView()
                .tabItem { Label("Themes", systemImage: "paintpalette.fill") }
        }
    }
}
