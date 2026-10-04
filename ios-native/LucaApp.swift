import SwiftUI
import WebKit

@main
struct LucaGrowthGuideApp: App {
    var body: some Scene {
        WindowGroup {
            LucaWebView()
                .ignoresSafeArea()
        }
    }
}

struct LucaWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.scrollView.contentInsetAdjustmentBehavior = .automatic
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: LucaShared.baseURL))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
