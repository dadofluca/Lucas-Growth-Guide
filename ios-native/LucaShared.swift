import Foundation

enum LucaShared {
    static let appGroup = "group.com.lucasgrowthguide.app"
    static let keychainAccessGroup = "$(AppIdentifierPrefix)com.lucasgrowthguide.shared"
    static let baseURL = URL(string: "https://dadofluca.github.io/Lucas-Growth-Guide/")!
    static let supabaseURL = URL(string: "https://znhqaqvocexjsnklnqre.supabase.co")!
    static let publishableKey = "sb_publishable_c69_8XwNYp8MTuyV7tEMbA_NjgCVxkz"

    static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }
    static var caregiver: String {
        get { defaults.string(forKey: "caregiver") ?? "Caregiver" }
        set { defaults.set(newValue, forKey: "caregiver") }
    }
}
