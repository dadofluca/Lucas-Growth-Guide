import WidgetKit
import SwiftUI
import AppIntents

struct LucaWidgetEntry: TimelineEntry {
    let date: Date
}

struct LucaWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LucaWidgetEntry { .init(date: .now) }
    func getSnapshot(in context: Context, completion: @escaping (LucaWidgetEntry) -> Void) { completion(.init(date: .now)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LucaWidgetEntry>) -> Void) {
        completion(Timeline(entries: [.init(date: .now)], policy: .never))
    }
}

struct LogPoopIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Poop"
    func perform() async throws -> some IntentResult {
        // Native Supabase event write is wired after the shared device session is established.
        return .result()
    }
}

struct LogBottleIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Bottle"

    @Parameter(title: "Ounces", default: 8)
    var ounces: Int

    func perform() async throws -> some IntentResult {
        // Native Supabase event write is wired after the shared device session is established.
        return .result()
    }
}

struct LucaWidgetView: View {
    var entry: LucaWidgetEntry

    var body: some View {
        VStack(spacing: 10) {
            Text("Luca")
                .font(.headline)
            HStack(spacing: 12) {
                Button(intent: LogBottleIntent()) {
                    Label("Bottle", systemImage: "waterbottle.fill")
                }
                Button(intent: LogPoopIntent()) {
                    Label("Poop", systemImage: "sparkles")
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct LucaWidget: Widget {
    let kind = "LucaQuickLog"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LucaWidgetProvider()) { entry in
            LucaWidgetView(entry: entry)
        }
        .configurationDisplayName("Luca Quick Log")
        .description("Quickly log Luca's bottle or diaper.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct LucaWidgetBundle: WidgetBundle {
    var body: some Widget {
        LucaWidget()
    }
}
