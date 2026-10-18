# P93 Release Quality Audit — 2026-10-17/18

Status: code inspection and synthetic CI only; **not** a production iPhone, signed-in Supabase, or family-data verification. Do not claim end-to-end certification.

## Findings (ranked)

### High — Event sync is not idempotent
- `index.html` `pullShared()` uploads every `!remote` local entry with `pushEntry(e)`.
- `pushEntry()` uses a new `baby_events.insert(...).select().single()` with no stable client-generated event identifier or upsert conflict key.
- If the server commits but the response is lost, retry can create a duplicate. This is a plausible failure mode, **not proof** of actual duplicate rows.
- Release gate: test server-commit/client-timeout/retry and ensure exactly one remote event before changing production write paths. Requires a designed unique client-event key, migration review and rollback plan.

### High — Chat can look signed out while family setup is still loading
- Chat tab initializes only if `syncFamily` and `syncUser` are already set; otherwise asks user to reopen it.
- Chat preview initially displays an inaccurate sign-in state and retries every 30 seconds.
- P91 proposes session-ready event, auto-mount of an already open Chat tab, and immediate rendering of message rows ahead of slower profile lookup. Synthetic tests are required; signed-in iOS validation remains pending.

### High — Remote delete and edit failures are silently hidden
- `del(id)` removes an entry from the local array and persists **before** awaiting `deleteRemote(id)`, then shows “Entry deleted” regardless of the remote operation result.
- `deleteRemote(id)` and `updateRemote(e)` do not inspect returned Supabase `error`. A network/RLS failure can leave the remote event unchanged; a subsequent sync may resurrect a deleted item or overwrite an edited local item.
- Release gate: simulated failed delete/update must preserve an honest pending/error state and offer retry or undo; do not delete real family records during testing.

### Medium — Message rendering was coupled to profile lookup
- `agents/family-chat.js` originally awaited `family_profiles` before rendering retrieved messages. A slow avatar/name lookup delays all chat history.
- P91 proposes showing messages first and enriching sender profiles when the separate query returns.

### Medium — Stale release badge / inconsistent versioning
- `index.html` still displays literal `P87`; `sw.js` uses `luca-v73-emergency-offline` and scripts contain `?v=66`.
- These represent different concerns but are not centrally coordinated; hardcoded P87 cannot communicate the latest merged release.
- Release gate: single generated build identifier + update/refresh validation on installed iPhone PWA, without destructive cache clears.

### Medium — Existing browser coverage does not exercise real signed-in care sync
- `agents/browser-smoke.spec.mjs` deliberately aborts Supabase in several tests. `agents/watchdog.mjs` is a pure planner, not an end-to-end monitor.
- Green Chromium CI proves only tested synthetic behavior. It does not prove real Safari, auth, family isolation, upload, media access, or reliable synchronization.
- Release gate: isolated staging family and authenticated E2E tests with disposable synthetic records; never use production family records.

### Medium — Spark is not yet autonomous visual anomaly recognition
- P92 adds scheduled synthetic screenshot evidence and objective viewport/contrast checks, but no approved screenshot baselines or automatic issue triage.
- Release gate: curated screenshot baselines with intentional-difference review, deterministic diff thresholds, and sanitized failure artifacts. Avoid auto-fixing or auto-merging based on pixel changes.

## Minimum regression matrix before any major release
1. 320/375/390/430 px viewport, normal + 125% text, menu open/close, keyboard, reduced motion.
2. Chat opened **before** family session ready: transitions to real messages without reopening; chat preview updates immediately.
3. Message query succeeds while profile lookup stalls: message body still renders.
4. Chat media: authorized image/GIF/video, expired signed URL, rejected oversize, cross-family isolation.
5. Bottle and diaper: one tap/confirmation, correct caregiver, persist after refresh and on another device.
6. Offline/timeout: pending event remains recoverable; server commit + lost response does not create duplicates on retry.
7. Edit, delete, undo and schedule revert: ensure remote/local state stays consistent after refresh.
8. Installed iOS PWA: old-to-new release update, offline emergency backup, navigation and Display Zoom.
9. Spark screenshots reviewed at least once against intentional reference designs.
10. No identifiable baby data, tokens or private chat contents in public CI logs/artifacts.

## Policy
- A PR must pass CI **and** have tests that cover its claimed fix; a green status is not a substitute for coverage.
- No production schema changes, care-data mutation, or risky migration as part of UI-only work.
- Require explicit human acceptance for signed-in iPhone release validation and any data-layer migration.
- Document each unresolved finding and distinguish code-review hypotheses from observed failures.
