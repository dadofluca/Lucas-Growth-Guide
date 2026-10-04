# Native iOS source staging

These Swift files stage the native pieces that will be added to the generated Xcode project.

- LucaApp.swift: native app shell / WKWebView host.
- LucaShared.swift: shared App Group settings for caregiver/device identity.
- LucaWidget.swift: WidgetKit + App Intents quick logging UI.

The widget's event-writing methods intentionally remain stubbed until device authentication is shared securely between the main app and widget extension. No service-role or backend secret belongs in the app bundle.
