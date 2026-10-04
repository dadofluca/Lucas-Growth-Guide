import Foundation

enum LucaShared {
    static let appGroup = "group.com.lucasgrowthguide.app"
    static let baseURL = URL(string: "https://dadofluca.github.io/Lucas-Growth-Guide/")!

    static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    static var caregiver: String {
        get { defaults.string(forKey: "caregiver") ?? "Caregiver" }
        set { defaults.set(newValue, forKey: "caregiver") }
    }
}
