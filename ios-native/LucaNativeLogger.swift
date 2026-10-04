import Foundation

enum LucaEventKind: String, Codable {
    case bottle = "feed"
    case poop = "poop"
}

struct LucaEventPayload: Codable {
    let event_type: String
    let event_time: String
    let amount_oz: Double?
    let tags: [String]
    let caregivers: [String]
    let details: [String: String]
}

enum LucaNativeLogger {
    static func payload(kind: LucaEventKind, ounces: Double? = nil) -> LucaEventPayload {
        LucaEventPayload(
            event_type: kind.rawValue,
            event_time: ISO8601DateFormatter().string(from: .now),
            amount_oz: kind == .bottle ? ounces : nil,
            tags: kind == .poop ? ["poop"] : [],
            caregivers: [LucaShared.caregiver],
            details: ["source": "ios-native"]
        )
    }

    // Network insertion will use the signed-in Luca family session shared through
    // the App Group/Keychain. This intentionally does not contain privileged keys.
    static func log(kind: LucaEventKind, ounces: Double? = nil) async throws {
        _ = payload(kind: kind, ounces: ounces)
        throw NativeLoggerError.sessionNotConfigured
    }
}

enum NativeLoggerError: LocalizedError {
    case sessionNotConfigured

    var errorDescription: String? {
        "Open Luca's Growth Guide once to finish secure widget setup."
    }
}
