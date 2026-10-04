import WidgetKit
import SwiftUI
import AppIntents

struct LucaWidgetEntry: TimelineEntry { let date: Date }
struct LucaWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LucaWidgetEntry { .init(date: .now) }
    func getSnapshot(in context: Context, completion: @escaping (LucaWidgetEntry) -> Void) { completion(.init(date: .now)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LucaWidgetEntry>) -> Void) { completion(.init(entries:[.init(date:.now)],policy:.never)) }
}

struct LogPoopIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Poop"
    func perform() async throws -> some IntentResult {
        try await LucaNativeLogger.log(kind: .poop)
        return .result()
    }
}

struct LogBottleIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Bottle"
    @Parameter(title: "Ounces", default: 8) var ounces: Int
    func perform() async throws -> some IntentResult {
        try await LucaNativeLogger.log(kind: .bottle, ounces: Double(ounces))
        return .result()
    }
}

struct LucaWidgetView: View {
    var entry: LucaWidgetEntry
    var body: some View {
        VStack(spacing: 10) {
            Text("Luca").font(.headline)
            HStack(spacing: 12) {
                Button(intent: LogBottleIntent()) { VStack { Text("🍼").font(.title); Text("Bottle") } }
                Button(intent: LogPoopIntent()) { VStack { Text("💩").font(.title); Text("Poop") } }
            }.buttonStyle(.borderedProminent)
        }.containerBackground(.fill.tertiary, for: .widget)
    }
}

struct LucaWidget: Widget {
    let kind="LucaQuickLog"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind:kind,provider:LucaWidgetProvider()){ LucaWidgetView(entry:$0) }
            .configurationDisplayName("Luca Quick Log")
            .description("Quickly log Luca's bottle or diaper.")
            .supportedFamilies([.systemSmall,.systemMedium])
    }
}
@main struct LucaWidgetBundle: WidgetBundle { var body: some Widget { LucaWidget() } }
