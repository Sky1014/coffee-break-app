import SwiftUI
import CoffeeBreakCore

struct DebugControlsView: View {
    @ObservedObject var viewModel: WatchBreakViewModel

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Button("Start") { viewModel.send(.startCycle(now: Date())) }
                Button("Due") { viewModel.send(.cycleTimerElapsed(now: Date())) }
            }
            HStack {
                Button("Stand") { viewModel.send(.detectionStarted(.standing, now: Date())) }
                Button("Walk") { viewModel.send(.detectionStarted(.walking, now: Date())) }
            }
            HStack {
                Button("+50%") { sendProgress(0.5) }
                Button("Done") { completeCurrentDetection() }
                Button("Break") { viewModel.send(.detectionContinuityBroken(now: Date())) }
            }
            HStack {
                Button("Lock") { viewModel.send(.enterLocked(now: Date())) }
                Button("Pause") { viewModel.send(.pause(.userPaused, now: Date())) }
            }
        }
        .font(.system(size: 10))
        .buttonStyle(.bordered)
    }

    private func sendProgress(_ progress: Double) {
        if case let .detecting(_, type, _, _) = viewModel.state {
            viewModel.send(.detectionProgress(type, progress: progress, now: Date()))
        }
    }

    private func completeCurrentDetection() {
        if case let .detecting(_, type, _, _) = viewModel.state {
            viewModel.send(.detectionCompleted(type, now: Date()))
        }
    }
}
