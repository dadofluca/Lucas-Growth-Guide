# Xcode integration checklist

Targets:
1. Main app bundle id: com.lucasgrowthguide.app
2. Widget extension bundle id: com.lucasgrowthguide.app.widget
3. Deployment target: iOS 17 or newer for interactive widgets.

Both targets:
- Add App Groups capability: group.com.lucasgrowthguide.app
- Add Keychain Sharing: com.lucasgrowthguide.shared
- Include LucaShared.swift, LucaSessionStore.swift, LucaSessionRefresh.swift and LucaNativeLogger.swift in both targets.
- Main app includes LucaApp.swift.
- Widget target includes LucaWidget.swift.
- Apply the matching entitlement file.

Behavior:
- Main app loads the existing Luca web experience.
- native-session-bridge.js publishes an existing Supabase device session to WKWebView's lucaSession handler.
- Main app stores that session in shared Keychain.
- Widget refreshes the normal user token when necessary.
- Widget writes baby_events under that user's RLS permissions.
- No service-role credential is bundled in the app.

First-device acceptance test:
1. Install/open main app.
2. Connect Family Sync if needed.
3. Close/reopen app once.
4. Add Luca Quick Log widget.
5. Tap 8 oz and verify one feed appears with details.source = ios-widget.
6. Tap Poop and verify one poop appears with details.source = ios-widget.
7. Confirm caregiver equals this phone's caregiver.
8. Wait for access token expiry and verify refresh-token path continues to log.
