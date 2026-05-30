import Foundation

public struct UserSettings: Codable, Equatable {
    public var selectedMode: BreakMode
    public var quietHoursEnabled: Bool
    public var quietHoursStartHour: Int
    public var quietHoursStartMinute: Int
    public var quietHoursEndHour: Int
    public var quietHoursEndMinute: Int
    public var workdays: Set<Int>
    public var themeID: String
    public var onboardingCompleted: Bool
    public var pauseUntil: Date?

    public init(
        selectedMode: BreakMode,
        quietHoursEnabled: Bool,
        quietHoursStartHour: Int,
        quietHoursStartMinute: Int,
        quietHoursEndHour: Int,
        quietHoursEndMinute: Int,
        workdays: Set<Int>,
        themeID: String,
        onboardingCompleted: Bool,
        pauseUntil: Date?
    ) {
        self.selectedMode = selectedMode
        self.quietHoursEnabled = quietHoursEnabled
        self.quietHoursStartHour = quietHoursStartHour
        self.quietHoursStartMinute = quietHoursStartMinute
        self.quietHoursEndHour = quietHoursEndHour
        self.quietHoursEndMinute = quietHoursEndMinute
        self.workdays = workdays
        self.themeID = themeID
        self.onboardingCompleted = onboardingCompleted
        self.pauseUntil = pauseUntil
    }
}

public extension UserSettings {
    static let defaultValue = UserSettings(
        selectedMode: .standard,
        quietHoursEnabled: true,
        quietHoursStartHour: 22,
        quietHoursStartMinute: 0,
        quietHoursEndHour: 7,
        quietHoursEndMinute: 0,
        workdays: [2, 3, 4, 5, 6],
        themeID: "classic_coffee",
        onboardingCompleted: false,
        pauseUntil: nil
    )
}

