import SwiftUI
import WebKit

@main
struct LucaGrowthGuideApp: App {
    var body: some Scene {
        WindowGroup { LucaWebView().ignoresSafeArea() }
    }
}

struct LucaWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.add(context.coordinator, name: "lucaSession")
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.scrollView.contentInsetAdjustmentBehavior = .automatic
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: LucaShared.baseURL))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "lucaSession",
                  let body = message.body as? [String: Any],
                  let accessToken = body["accessToken"] as? String,
                  let refreshToken = body["refreshToken"] as? String,
                  let expires = body["expiresAt"] as? Double,
                  let userID = body["userID"] as? String,
                  let familyID = body["familyID"] as? String,
                  let babyID = body["babyID"] as? String,
                  let caregiver = body["caregiver"] as? String else { return }
            let session = LucaSession(accessToken: accessToken, refreshToken: refreshToken, expiresAt: Date(timeIntervalSince1970: expires), userID: userID, familyID: familyID, babyID: babyID, caregiver: caregiver)
            try? LucaSessionStore.save(session)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Existing signed-in PWA sessions can publish their current
            // session after load through the lucaSession message handler.
        }
    }
}
