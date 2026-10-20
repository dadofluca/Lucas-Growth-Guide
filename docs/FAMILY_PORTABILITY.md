# A fresh family, not a copy of Luca’s data

The product direction is one app with isolated family accounts. Copying the app’s source is optional; copying a family’s live database is never the onboarding path. The existing family remains intact.

P148 keeps supply products under `family_supplies.family_id`; push subscriptions bind a verified account, family, baby and device. Notification preferences and pending supply changes are scoped to that identity. Push delivery rechecks membership. A signed-out phone unsubscribes. No history, example messages, Stars, caregiver identities, product choices or notification subscriptions are seeded into another family. The four default supply categories have no product, buyer or low-stock history.

| Layer | Fresh-family behavior |
| --- | --- |
| Family and baby | New IDs, invitation code, baby name, birthday and time zone chosen in onboarding |
| Care and sleep | Empty history; no learned feed interval until real data exists; fallback remains labeled |
| People and permissions | Current verified members; a family owner manages roles. Sam’s existing administrative authority must stay within his current family |
| Products | Empty product/variant/store/buyer choices; reusable category names only |
| Alerts | Off until each person opts in on each device; no previous-family subscription or historical notification replay |
| Progress and chat | Empty ledger, unlocks, messages, media, schedules and unread counters |
| Practice | Isolated synthetic playground with its existing Reset demo action; never a production reset |

## Before public onboarding or an App Store release

1. Add explicit family/baby selection and a transactional create-family onboarding path. The current `my_family_setup()` selects a single membership. Do not present it as a complete multi-family switcher.
2. Replace remaining personal defaults in the shell, baby birthday/age logic, caregiver parser/pickers, recurring Sam/Maddie work calendar and original-family role bootstrap with configuration loaded by family. Preserve automatic recognition rules so mentioning a baby’s name cannot steal caregiver credit.
3. Scope the existing care cache, draft entries, delete/Undo receipts, auth return routes and offline queues by family and baby. The current care queue protects records with a known baby ID; unassigned pre-sign-in entries still need an explicit import decision. Never auto-upload an old phone’s unassigned records into a newly created family.
4. Make a fresh family start empty through database transactions; test two unrelated accounts and removal of membership, including pending offline work. An owner-facing reset requires export, an explicit preview of what is removed, and a deliberate confirmation. P148 does not add a destructive family reset button.
5. Use the deployment’s own URL/project and a newly generated server-side VAPID pair when installing a separate instance. Set `app_notification_config.app_url` and the scheduler function’s Edge Function URL for that installation; never export private configuration rows or subscriptions. The bundler uses the same feed/sleep code in the browser and server.
6. Add a native notification transport adapter for APNs/FCM if shipping a native shell. Retain family preferences, suppression rules, event identities and delivery receipts. Add privacy policy, account deletion/export, store disclosures and real-device tests before describing the app as App Store ready.

## Delivery and operational limits

Web Push is opt-in and best-effort. The dispatcher runs each minute, retries transient failures with bounded leases, deduplicates each feed/supply cycle, and disables expired endpoints. iPhone Focus, offline delivery and OS settings can delay or hide a banner. Feed pushes expire quickly and stop for logged sleep or quiet hours; they are estimates, not an alarm or a feeding instruction.

Chat batches a recent burst, excludes one’s own messages, avoids alerting a recently visible chat, hides previews by default and expires old notifications. Supply alerts use the current family product and buyer. A link opens a retailer page only; no item is purchased or silently added to a cart. An ordinary product URL is acceptable when a retailer does not offer persistent checkout links.

The initial dispatcher is bounded to 1,000 opted-in devices per invocation and 10,000 care rows per recent baby window. Before onboarding at scale, move scanning to a paginated job queue with capacity/error monitoring and per-user rate limits. These limits do not make the current personal app a production SaaS service.
