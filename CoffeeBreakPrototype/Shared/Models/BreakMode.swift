import Foundation

public enum BreakMode: String, Codable, CaseIterable, Identifiable {
    case gentle
    case standard
    case strict

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .gentle: return "Gentle"
        case .standard: return "Standard"
        case .strict: return "Strict"
        }
    }

    public var subtitle: String {
        switch self {
        case .gentle: return "A softer start."
        case .standard: return "Balanced and recommended."
        case .strict: return "For serious sitting control."
        }
    }
}

