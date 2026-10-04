import Foundation
import Security

struct LucaSession: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let userID: String
    let familyID: String
    let babyID: String
    let caregiver: String
}

enum LucaSessionStore {
    private static let service = "com.lucasgrowthguide.session"
    private static let account = "family-session"

    static func save(_ session: LucaSession) throws {
        let data = try JSONEncoder().encode(session)
        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: LucaShared.keychainAccessGroup
        ]
        SecItemDelete(base as CFDictionary)
        var item = base
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(item as CFDictionary, nil)
        guard status == errSecSuccess else { throw SessionStoreError.keychain(status) }
        LucaShared.caregiver = session.caregiver
    }

    static func load() throws -> LucaSession? {
        var q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessGroup as String: LucaShared.keychainAccessGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var out: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &out)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = out as? Data else { throw SessionStoreError.keychain(status) }
        return try JSONDecoder().decode(LucaSession.self, from: data)
    }
}

enum SessionStoreError: Error { case keychain(OSStatus) }
