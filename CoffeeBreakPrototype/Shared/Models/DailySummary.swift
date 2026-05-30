import Foundation

public struct DailySummary: Codable, Equatable {
    public var date: Date
    public var completedStandCount: Int
    public var completedWalkCount: Int
    public var naturallyCoveredCount: Int
    public var skippedCount: Int
    public var abandonedCount: Int
    public var totalCycles: Int

    public init(
        date: Date = Date(),
        completedStandCount: Int = 0,
        completedWalkCount: Int = 0,
        naturallyCoveredCount: Int = 0,
        skippedCount: Int = 0,
        abandonedCount: Int = 0,
        totalCycles: Int = 0
    ) {
        self.date = date
        self.completedStandCount = completedStandCount
        self.completedWalkCount = completedWalkCount
        self.naturallyCoveredCount = naturallyCoveredCount
        self.skippedCount = skippedCount
        self.abandonedCount = abandonedCount
        self.totalCycles = totalCycles
    }

    public var bodyResetCount: Int {
        completedStandCount + completedWalkCount
    }
}

