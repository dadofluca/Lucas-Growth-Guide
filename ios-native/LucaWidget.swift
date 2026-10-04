import WidgetKit
import SwiftUI
import AppIntents

struct LucaWidgetEntry:TimelineEntry{let date:Date}
struct LucaWidgetProvider:TimelineProvider{
 func placeholder(in context:Context)->LucaWidgetEntry{.init(date:.now)}
 func getSnapshot(in context:Context,completion:@escaping(LucaWidgetEntry)->Void){completion(.init(date:.now))}
 func getTimeline(in context:Context,completion:@escaping(Timeline<LucaWidgetEntry>)->Void){completion(.init(entries:[.init(date:.now)],policy:.never))}
}

struct LogPoopIntent:AppIntent{
 static var title:LocalizedStringResource="Log Poop"
 static var openAppWhenRun=false
 func perform()async throws->some IntentResult{
  try await LucaNativeLogger.log(kind:.poop)
  return .result(dialog:"Poop logged ✓")
 }
}

struct LogBottleIntent:AppIntent{
 static var title:LocalizedStringResource="Log Bottle"
 static var openAppWhenRun=false
 @Parameter(title:"Ounces",default:8) var ounces:Int
 static var parameterSummary:some ParameterSummary{Summary("Log \(.$ounces) oz bottle")}
 func perform()async throws->some IntentResult{
  guard [4,5,6,7,8].contains(ounces) else{throw NativeLoggerError.writeFailed}
  try await LucaNativeLogger.log(kind:.bottle,ounces:Double(ounces))
  return .result(dialog:"\(ounces) oz logged ✓")
 }
}

struct LucaWidgetView:View{
 var entry:LucaWidgetEntry
 var body:some View{
  VStack(spacing:9){
   HStack{Text("Luca").font(.headline);Spacer();Text("🧸")}
   HStack(spacing:8){
    Button(intent:LogBottleIntent(ounces:8)){VStack(spacing:2){Text("🍼").font(.title2);Text("8 oz").font(.caption.bold())}}
    Button(intent:LogPoopIntent()){VStack(spacing:2){Text("💩").font(.title2);Text("Poop").font(.caption.bold())}}
   }
  }.containerBackground(.fill.tertiary,for:.widget)
 }
}

struct LucaWidget:Widget{
 let kind="LucaQuickLog"
 var body:some WidgetConfiguration{
  StaticConfiguration(kind:kind,provider:LucaWidgetProvider()){LucaWidgetView(entry:$0)}
   .configurationDisplayName("Luca Quick Log")
   .description("Log Luca's usual bottle or a poop without opening the app.")
   .supportedFamilies([.systemSmall])
 }
}
@main struct LucaWidgetBundle:WidgetBundle{var body:some Widget{LucaWidget()}}
