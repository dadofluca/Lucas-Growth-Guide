import Foundation

enum LucaEventKind: String, Codable { case bottle = "feed"; case poop = "poop" }

struct LucaEventPayload: Codable {
    let baby_id: String
    let event_type: String
    let event_time: String
    let amount_oz: Double?
    let tags: [String]
    let caregivers: [String]
    let details: [String: String]
}

enum LucaNativeLogger {
    static func log(kind: LucaEventKind, ounces: Double? = nil) async throws {
        let session = try await LucaSessionRefresh.validSession()
        let payload = LucaEventPayload(
            baby_id: session.babyID,
            event_type: kind.rawValue,
            event_time: ISO8601DateFormatter().string(from: .now),
            amount_oz: kind == .bottle ? ounces : nil,
            tags: kind == .poop ? ["poop"] : [],
            caregivers: [session.caregiver],
            details: ["source": "ios-widget"]
        )
        var req=URLRequest(url:LucaShared.supabaseURL.appending(path:"rest/v1/baby_events"))
        req.httpMethod="POST"
        req.setValue(LucaShared.publishableKey,forHTTPHeaderField:"apikey")
        req.setValue("Bearer \(session.accessToken)",forHTTPHeaderField:"Authorization")
        req.setValue("application/json",forHTTPHeaderField:"Content-Type")
        req.setValue("return=minimal",forHTTPHeaderField:"Prefer")
        req.httpBody=try JSONEncoder().encode(payload)
        let (_,response)=try await URLSession.shared.data(for:req)
        guard let http=response as? HTTPURLResponse,(200..<300).contains(http.statusCode) else { throw NativeLoggerError.writeFailed }
    }
}

enum NativeLoggerError: LocalizedError {
    case sessionNotConfigured,sessionExpired,writeFailed
    var errorDescription:String? {
        switch self {
        case .sessionNotConfigured:return "Open Luca's Growth Guide once to finish widget setup."
        case .sessionExpired:return "Open Luca's Growth Guide to reconnect this phone."
        case .writeFailed:return "Luca couldn't save that entry."
        }
    }
}
