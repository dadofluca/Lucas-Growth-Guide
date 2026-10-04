import Foundation

struct SupabaseTokenResponse: Decodable {
    let access_token: String
    let refresh_token: String
    let expires_in: Double
    struct User: Decodable { let id: String }
    let user: User?
}

enum LucaSessionRefresh {
    static func validSession() async throws -> LucaSession {
        guard let stored = try LucaSessionStore.load() else { throw NativeLoggerError.sessionNotConfigured }
        if stored.expiresAt > Date().addingTimeInterval(120) { return stored }

        var components = URLComponents(url: LucaShared.supabaseURL.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]
        var req = URLRequest(url: components.url!)
        req.httpMethod = "POST"
        req.setValue(LucaShared.publishableKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": stored.refreshToken])

        let (data,response)=try await URLSession.shared.data(for:req)
        guard let http=response as? HTTPURLResponse,(200..<300).contains(http.statusCode) else { throw NativeLoggerError.sessionExpired }
        let token=try JSONDecoder().decode(SupabaseTokenResponse.self,from:data)
        let refreshed=LucaSession(
            accessToken:token.access_token,
            refreshToken:token.refresh_token,
            expiresAt:Date().addingTimeInterval(token.expires_in),
            userID:token.user?.id ?? stored.userID,
            familyID:stored.familyID,
            babyID:stored.babyID,
            caregiver:stored.caregiver
        )
        try LucaSessionStore.save(refreshed)
        return refreshed
    }
}
