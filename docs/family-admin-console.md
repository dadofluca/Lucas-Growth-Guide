# Family Admin Console — design contract

## Authorization
- Only a verified, explicitly granted admin **auth user ID** may access this console. The caregiver display name, family code, or client-side hidden tab are not authorization.
- All admin reads/writes must be checked server-side against admin membership and the selected family; deny by default.
- Admin scope is restricted to the family the admin belongs to. No cross-family lookup.
- No password, auth token, private Teddy conversation, raw personal message, or device secret is available to this console.
- Technical error diagnostics must be redacted and limited to necessary metadata.

## Per-caregiver dashboard
- Admin sees configured theme, seasonal preference, layout, app build, last reported sync, and opt-in diagnostic status.
- Admin may preview another caregiver's layout without impersonation or altering their account.
- Admin may edit appearance preferences, reset to defaults, or request a client refresh; never force device permissions.
- Each admin change writes an audit record: actor ID, target ID, family ID, changed setting keys, timestamp, and optional reason. Do not store secrets or private chat content.
- Users see an unobtrusive record of admin changes to their settings.
- When a device is offline, display 'last reported' with timestamp, never claim it is currently healthy.

## Privacy and safeguards
- Teddy conversations remain accessible only to the conversation participant (subject to explicitly disclosed app policy).
- Admin tools cannot open a live screen, camera, microphone, or text messages.
- Appearance changes are reversible and respect accessibility settings, including contrast and reduced motion.
- Limit editable keys to allowlisted presentation settings; reject arbitrary JSON keys.
- Admin controls are optional UI modules; all regular family members keep the normal care-tracking interface.

## Delivery stages
1. Add schema for allowlisted caregiver preferences and redacted device diagnostics with strict family RLS.
2. Add explicit owner grant and server-side admin authorization, reviewed before applying.
3. Add audit trail and reversible admin edits.
4. Add a read-only 'Preview as' component and Agent HQ status.
5. Test cross-family access denial, private Teddy isolation, offline-device behavior, and settings rollback.
6. Deploy only after successful authenticated integration tests and owner approval.

Status: design only; no admin permissions or app behavior changed.
