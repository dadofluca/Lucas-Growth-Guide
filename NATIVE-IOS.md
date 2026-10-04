# Luca's Growth Guide — Native iOS

This branch is the native iOS transition branch.

## Phase 1
- Preserve the existing Luca web UI and Supabase data model.
- Run it inside a Capacitor iOS shell.
- Keep authentication and family sync intact.
- Add native app identity, launch behavior, and iOS-safe navigation.

## Phase 2
- Add WidgetKit/App Intents for Quick Bottle and Quick Poop.
- Use an App Group / secure shared native storage for widget identity.
- Widget actions write to the existing Supabase-backed Luca event system.
- Add push notifications after the native shell is stable.

## Local generation
Install Node dependencies, then run:
npm install
npx cap add ios
npx cap sync ios
npx cap open ios

The generated Xcode project is then signed with the owner's Apple Developer account for device/TestFlight distribution.
