# Emergency mode and safe auto-repair

## Emergency text log
`emergency.html` is an independent, minimal offline-capable page with an always-visible link from the main app. It stores timestamped, caregiver-attributed **raw notes** in browser localStorage under `luca_emergency_log_v1`, with a JSON export. It does not need Supabase or the main JavaScript bundle.

**Limits:** This is per-device, not synced. Browser storage may be cleared by the operating system, app removal, private browsing, or device failure. Export regularly. Offline availability requires a successful initial service worker install/cache; the emergency page cannot help if the entire hosting domain or PWA install has never loaded. It is not a replacement for critical medical communication.

## Recovery and reconciliation
`agents/emergency-reconcile.mjs` accepts exported JSON, flags invalid and duplicate IDs, proposes event type/amount, and marks compound or ambiguous notes for review. **It does not write any live events.** Next required work: an authenticated family-scoped import UI with per-event correction, dedupe persisted server-side, transactional commit and reconciliation markers. Do not claim history has been restored before this exists and passes multi-device tests.

## Automatic repairs
The default-branch workflow `builder-approved-recipes.yml` runs twice daily, checks out development, and applies a single reviewed source-text recipe for stale Family Chat responses **only if the guard is missing**. It refuses unfamiliar source code, runs tests, and can open a draft PR. It never merges or deploys. This is limited automatic repair, not general AI-driven code generation.

Before broadening autonomy: use a trusted recipe catalog, file allowlists, limited permissions, audit logs, and human-approved production deployment. Never allow untrusted user bug reports to execute shell commands or arbitrary generated code.
