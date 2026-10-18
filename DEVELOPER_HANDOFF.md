# Luca's Growth Guide — Developer Handoff

> **Purpose:** durable breadcrumbs for the next ChatGPT/developer session. Read this file **before changing code**. Update it whenever architecture, behavior, or the active test state changes.

**Repository:** `dadofluca/Lucas-Growth-Guide`  
**Primary branch:** `main`  
**Current release:** **P134 candidate** (2026-10-18); P133 remains the live baseline until this candidate passes browser QA and merges. See the current release note below; older Pxx notes are historical.

## Product intent

Luca's Growth Guide is Sam/Maddie's family baby tracker. Preserve the polished, simple parent-facing experience while making the internals maintainable.

Core behavior:
- Quick baby-event logging; current default bottle is **8 oz**.
- Shared family timeline via Supabase.
- History editing/deletion.
- Insights, Supplies, Leaderboard.
- Schedule showing Sam/Maddie work blocks and outside childcare coverage.
- Optional playful feedback (poop sound/animation, bottle feedback).

## Critical rule: stop patch stacking

The repo accumulated Pxx runtime patches in `sync-fix.js` and overlapping legacy functions in `index.html`. Several regressions happened because a newer `window.*` function wrapped/replaced behavior while old lexical functions in `index.html` continued to call each other directly.

**Before adding another wrapper/decorator:**
1. Search `index.html` and `sync-fix.js` for every definition/call of the function.
2. Identify whether the call is lexical (`pullSchedule()`) or global (`window.pullSchedule()`).
3. Prefer one canonical implementation and migrate callers to it.
4. Do not add another Pxx workaround if the source can be corrected safely.
5. Preserve working user behavior while consolidating.

## Schedule — intended behavior

P48 introduced the intended **weekly** coverage board. It computes the overlap where both Sam and Maddie work, subtracts coverage intervals, and shows:
- work blocks,
- covered intervals,
- missing-coverage gaps,
- caregiver choices for gaps.

The intended UI is **weekly**, with previous/next week navigation. It is NOT the old monthly list.

Coverage requirements:
- Choosing a caregiver for a gap must open an editor rather than immediately hard-code 6 AM–11 PM.
- Editor has exact Start/End time inputs plus draggable time range controls.
- Existing coverage is tappable/editable.
- **Revert Day** removes childcare `kind="coverage"` rows for that day only.
- Revert must **never delete or rewrite Sam/Maddie `kind="work"` rows**.
- Default coverage window should derive from the actual uncovered/overlap interval when possible, not arbitrary hard-coded hours.

Important history:
- P48: weekly coverage board.
- P50–P53: repeated attempts to add coverage editing/sliders and Revert Day.
- P54–P58: further wiring/refactor attempts.
- **Root regression discovered at P59:** Quick Menu's Schedule handler in `index.html` called the old lexical `pullSchedule()`, bypassing `window.pullSchedule` from P48. This is why the app showed the old **October 2026 monthly screen** and none of the editor/Revert decorators appeared.
- P59 changed the menu route to `(window.pullSchedule||pullSchedule)()`.

**Verified on iPhone at P59:** Quick Menu → Luca Schedule now opens the intended weekly board.\n\n**Still failed at P59:** covered rows had no visible edit control/Revert Day; Quick Menu labels remained dark. P60 moves edit/Revert controls directly into the P48 weekly renderer instead of relying on a later decorator. P60 initially failed because sync-fix.js had a runtime-blocking P48 syntax error (escaped template-literal backticks). After repairing it and full-file parse validation, iPhone verification showed the weekly schedule, coverage gap controls, Revert Day, and coverage editor/sliders actually executing. P61 slider redesign verified on iPhone, but Manage Day did not appear because obsolete P57 post-render wire() threw on out-of-scope P48 helpers. P62 removes that wrapper, puts Manage Day directly in the canonical weekly renderer, shows manual coverage on every day (even when Parent available), adds a caregiver selection sheet, and fixes schedule/editor button contrast. P62 awaiting iPhone verification.

## Event persistence / Supabase — HIGH PRIORITY

User-reported regression: **log an event → refresh → event disappears**.

This predates P56. Earlier debugging around P32/P33 showed authentication working while `baby_events` did not contain expected recent writes; P33 attempted Smart Entry persistence repair.

P56 changed `pullShared()` to preserve local unsynced rows and retry them before replacing the local timeline. That is a safety net, **not proof the root write path is fixed**.

Next developer should trace the canonical event flow end-to-end:
1. UI quick log / Smart Entry / manual save.
2. local event creation and `persist()`.
3. `pushEntry(e)`.
4. Supabase `baby_events.insert(...).select().single()`.
5. returned remote ID / `remote:true`.
6. reload via `pullShared()`.
7. realtime callback behavior.

Do not mask a failed insert by merely keeping local data. Surface/log the Supabase error enough to diagnose it. Confirm all entry paths call the same canonical save routine.

## Quick Menu contrast

Known recurring regression: menu labels become muddy/dark green on the navy drawer. The desired result is high-contrast light/cream text on the dark menu.

Multiple old CSS rules use `!important`; fixes were being overridden by later runtime styles. P59 adds a final runtime style for `#sideMenu .sidePanel .menuRow`.

**Current verification needed:** Sam should confirm P59 menu labels are actually light. Longer-term, consolidate competing menu CSS instead of accumulating more `!important` rules.

## Patch timeline relevant to current work

- P32/P33: Family Sync/auth/event persistence investigation; Smart Entry write repair attempt.
- P44–P47: top quick actions, poop/intro behavior, shortcut deep links.
- P48: expandable History + weekly coverage schedule.
- P49: deployment/cache/runtime diagnostics.
- P50: precise coverage editor with time inputs/range.
- P51/P52: attempts to wire editor to real schedule clicks; drawer contrast.
- P53: source-wired coverage editor + per-day Revert.
- P54: schedule wiring cleanup.
- P55: centralized runtime version/schedule config; cleanup started.
- P56: preserve unsynced events during refresh + menu contrast attempt.
- P57: rebuilt weekly coverage editor/Revert.
- P58: schedule refresh routed through active renderer.
- **P59: fixed Quick Menu Schedule source route to call current global schedule implementation. Verified: weekly board opens. Menu contrast still failed.**\n- **P60: renders Edit and Revert Day controls directly inside weekly schedule renderer instead of post-render decoration. Awaiting iPhone verification.**

Use Git history for exact diffs instead of relying only on this summary.

## Immediate test checklist

STOP FEATURE PATCHING. First prove the deployed runtime asset is executing with a runtime-only build marker/diagnostic; then fix the canonical schedule path. P60 did not pass:
- Quick Menu labels readable/light.
- Quick Menu → Luca Schedule opens **weekly** board, not old monthly October screen.
- Assigning coverage opens editor.
- Start/end exact time fields work.
- Time sliders work on iPhone.
- Saving coverage persists after refresh.
- Existing coverage can be tapped and edited.
- Revert Day removes coverage only; Sam/Maddie work schedule remains.
- Log an 8 oz bottle → refresh → it remains.
- Log poop → refresh → it remains.
- History reflects those events after reload.

If a test fails, fix the canonical source path before adding another patch layer.

## Cleanup direction after tests pass

The user explicitly asked for an overhaul that makes future changes easier **without smashing working behavior**. The desired direction is:
- consolidate runtime config/constants,
- eliminate duplicate schedule implementations,
- eliminate duplicate event-save paths,
- reduce Pxx wrapper chains,
- separate rendering from data persistence,
- keep one canonical schedule renderer/controller,
- keep one canonical event repository/sync routine,
- then run a full regression pass before calling the app launch-ready.

Do this incrementally with checkpoints; do not rewrite the whole app blindly.

## Handoff protocol

At the end of every meaningful development session, update this README with:
- current P/version,
- commits made,
- what is verified vs merely implemented,
- known bugs,
- exact next action,
- any architectural discovery that would prevent another session from repeating work.

**Never write “fixed” here until the behavior has been tested in the deployed iPhone app. Use “implemented / awaiting verification” instead.**
\n\n## P63 unified schedule manager\n- Replaces the conceptual Manage-vs-Edit split with one Day Manager opened by tapping a day card.\n- Day Manager shows work rows, all recorded coverage, Add Coverage, Revert Day, and Done.\n- Existing coverage opens the same Coverage Editor used for adding.\n- Coverage Editor now includes caregiver selection plus the existing dual-handle time range and remove action.\n- Revert Day deletes coverage only; work rows are preserved.\n- P63 full sync-fix.js parse check passed before commit. Awaiting iPhone verification.\n

## Teddy AI architecture — recovered product intent
- Teddy is Luca's shared AI interpretation layer, not merely a teddy icon/shortcut.
- Teddy should be surfaced in Insights and callable from other workflows that need interpretation, especially Schedule and Smart Entry.
- Original Smart Entry direction: natural-language input -> parse one or multiple proposed structured events -> preview -> user confirms -> persist. Supported concepts include bottles, solids, poop, naps, caregivers, and schedule/work/coverage entries. Explicit pairings in the user's text override inference.
- Schedule Day Manager should ultimately support three input paths: (1) direct structured editing, (2) Tell Teddy natural-language text, and (3) photo/screenshot upload. Imported/scraped incoming messages can later feed the same Teddy parsing/preview pipeline.
- Teddy must not silently write ambiguous parsed schedule data. Show proposed work/coverage rows for confirmation/editing first.
- Sam/Maddie work rows should become editable with the same polished time-range interaction used for coverage. Preserve an original/base schedule separately enough that Revert can restore intended work schedule rather than destroying it.
- Next schedule architecture work should favor one canonical schedule repository/editor and one Teddy parser/preview interface rather than separate parsing logic for each input source.
\n\n## P64 schedule + Teddy text input\n- Sam/Maddie work rows in Day Manager are now tappable/editable and reuse the time-range editor; work edits update the existing work row and do not expose coverage removal.\n- Day Manager now includes Tell Teddy text entry. It parses explicit person + time-range statements into work/coverage proposals, previews them with checkboxes, and requires Approve & save before writes.\n- Existing same-person/same-kind rows for the day are updated; otherwise new rows are inserted.\n- This is the first local schedule-text parser/preview layer, not yet the full AI/vision ingestion system. Photo/screenshot and imported-message ingestion should feed the same preview contract later.\n- Full sync-fix.js parse check passed. P64 awaiting iPhone verification.\n\n\n## P65 routing fix\n- P64 features were absent because P63 day cards captured the private P63 open() function in their onclick closures. Replacing window.lucaOpenDayManager in P64 therefore did not affect existing card clicks.\n- P65 changes day-card/manage-button handlers to dynamically call window.lucaOpenDayManager at click time, so later/current manager enhancements (editable work + Teddy) execute.\n- Full parse check passed. Awaiting iPhone verification.\n\n\n## P66 iPhone-feedback fixes\n- P65 iPhone verification confirmed work editor opens. User reported work person could not change/remove, Teddy was not discoverable, and gap caregiver button text remained dark on blue.\n- Work editor now allows Sam/Maddie selection, time changes, and Remove this work day.\n- Schedule view now has a visible `🧸 Tell Teddy your schedule` launcher; it opens the current day manager and focuses/scrolls to Teddy schedule text input.\n- Added higher-specificity schedule gap button contrast rule to beat legacy `#scheduleView #scheduleList *` color rule.\n- Full parse passed. Awaiting iPhone verification.\n

## Current care-sync handoff — 2026-10-18 P132
- Canonical care persistence: `care-sync.js` loaded before the classic main script. `saveCareEvent()` is the only UI save entrypoint; `pullShared()` delegates to its single-flight refresh. Do not restore the removed P34/P37/P38 event-write overrides.
- Every local create gets a persisted `syncId` UUID before upload; the insert uses it as the PostgreSQL primary key. A 23505 retry reads the same row under the selected baby filter. Do not generate a new ID per retry or use blind upsert over an edited event.
- Local remote edits have `pendingUpdate`; failed reads/edits retain the local queue. The repository uses revision checks to handle editing while an insert/update is running. Merge current queue after read completion, preserve recently acknowledged writes, and suppress confirmed deleted IDs for the current page.
- `details.original_event` stores original edit provenance. Updates preserve `created_by`; caregiver credit remains in `caregivers`. Undo reuses the remote identity, including a snapshot taken before initial sync.
- `setupSync()` has a shared promise and bounded auth/family lookup. It returns a boolean to pull refresh; widgets do not block core timeline readiness. Auth callbacks defer network work using setTimeout.
- Build source: `#buildVersion` P132 in index.html; compatibility runtime reads that element. Script URLs and service-worker shell cache advance with the release. New `care-sync.js` must be included in preview/release packaging.
- Tests: 166 Node checks passed before PR. Added synthetic authenticated browser flow for Quick Bottle -> History Edit -> offline edit -> retry -> reload, plus visible-version consistency. CI/deployment results must be appended after confirmation. No real care events were changed by QA.
- Remaining validation: actual signed-in iPhone Safari, a second family device, and Muse ingestion. Avoid treating synthetic Chromium success as confirmation of those. Broader schedule/chat/avatar refactoring is outside this care-persistence pass.

- Browser QA root cause found: `render()` still called removed `renderDrawer()`. Its ReferenceError stopped the initial script before automatic `setupSync()` and service-worker registration. Removed the obsolete call and added a startup-status assertion. The first synthetic run exposed this; passing source-shape tests had missed it.
- Phone dock regression: the relocated chat-peek button overlapped the collapsed Teddy button. Moved it above the dock and hide it while the dock is expanded, preserving both real tap targets.

- After startup resumed, browser QA exposed the obsolete P48 History decorator replacing the current accessible History UI. Removed that duplicate renderer and its old bulk-delete path. History now has one renderer and shared event edit/delete controls; the existing P99/P100 browser tests cover them.

- Visual QA after startup restoration showed the old P41 “Luca Now” card duplicating the current daily totals/next-feed section. Removed that decorator and its timer; retain the compact home and one next-feed prediction. The loaded-version browser gate asserts the obsolete card stays absent.


## P132 release verification
- Tested application/source commit: `eb82d35c50dfc61b84ea509f9f56be5697b7124a`.
- GitHub Actions: code checks run `39134789933` SUCCESS (166 checks); browser run `39134789797` SUCCESS (2 care/version checks plus 40 regression checks).
- Final handoff commit changes README/this document only; tested application code is unchanged. Release PR: https://github.com/dadofluca/Lucas-Growth-Guide/pull/82. Inspect that PR for the final merge SHA and its Pages deployment.
- Production: https://dadofluca.github.io/Lucas-Growth-Guide/ with visible P132. Source publication and actual phone-loaded code must be distinguished; do not instruct users to clear storage to get an update, because unsynced logs may be present.
- Remaining external validation: the user's actual signed-in iPhone and a second family device. Synthetic Chromium checks do not prove real device-to-device delivery, and Muse ingestion remains a separate task.


## P133 original Armory, personality and interaction polish — released
- Release PR #83: https://github.com/dadofluca/Lucas-Growth-Guide/pull/83. Tested source commit `3ed578919dc7ad12018eeaddba035e2228bc2f74`; squash merge `1329a032271ce53a2be38397c5d3e980e5a6e812`.
- Verified public app: https://dadofluca.github.io/Lucas-Growth-Guide/ served visible P133 and the P133 stylesheet. SHA-256 byte comparisons matched the tested release for the original PNG, avatar artwork module, profiles, chat, personality, UI stylesheet, care-sync.js and sw.js. Phone-loaded runtime must still be distinguished from source publication; never clear local storage to force an update.
- Artwork: recovered the exact original 42-character “Luca’s Playful Avatar Armory” PNG, unchanged at `agents/assets/avatar-armory-original.png`. `agents/avatar-art.js` frames its portraits from one shared image. All saved preset keys remain valid; the classic SVGs and three extra non-poster presets remain available, with SVG fallback if the image is unavailable. No database migration was required.
- Profiles: searchable categories, selected-character preview, unsaved/saved state and a reachable sticky Save profile action. Chat and family rows use the same portrait factory. Gallery tiles load lazily; visible previews/chat load eagerly, and Save reuses the decoded preview instead of briefly blanking it.
- A profile draft revision guard preserves a newer avatar/name/bio selection when an older save finishes. Do not restore the old unconditional `dirty=false` behavior.
- `agents/ui-polish.css` owns the new short tab/picker/toast transitions, selection badges, contrast, form spacing and reduced-motion behavior. Existing broad theme rules must not re-show the hidden native avatar select or dim text on the dark preview.
- `agents/personality.js` owns device-local After dark / Gentle / Off. Jokes appear only below precise local care-save confirmations. Error and sync status remain literal. Quiet Mode covers legacy chimes; the duplicate toast audio wrapper is removed. The canonical toast cancels its previous hide timer and exposes a polite atomic status announcement.
- Version source, shell URLs/cache and loaded-version browser assertion agree on P133. Optional artwork is cached after use rather than blocking shell installation. Care persistence remains in `care-sync.js`; no new write path was added.
- Validation: **168 code checks and 45 Chromium browser checks passed** on the tested source. Code: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39136804229. Browser: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39136804228. Phone screenshots at 320/390 widths and the final original-art picker were reviewed. Synthetic flows cover Quick Bottle -> History edit -> offline retry -> reload, avatar selection -> save -> reload -> chat, slow-save draft protection, personality persistence, muted audio and reduced motion. No tests changed real family records.
- Remaining external validation: actual signed-in iPhone Safari/PWA, a second family device and Muse ingestion. Synthetic Chromium checks do not prove those real account/device paths. Next work should begin with user feedback from P133, preserving care-sync.js and the single profile/chat portrait factory.


## P134 candidate — refined controls and timed sleep
- User screenshots show unreadable dark-on-navy Open family chat and heavy navy drawer/Ideas buttons. Shared soft-sage actions, warm neutral surfaces, refined form/card/navigation styling now live in `agents/ui-polish.css`, scoped to `body#lucaApp`. Removed the P39/P40 injected form/theme paint and final menu repaint. Layout/behavior compatibility remains in sync-fix.js.
- Family Ideas submit uses the same semantic `confirm` action. Do not create another one-off submit/button palette.
- Sleep quick action opens a dedicated Nap / Night sleep editor with explicit start/end datetimes, live duration, caregiver, optional note, and optional night wake-ups/awake minutes. Save uses `saveCareEvent`, and History/Today editing routes pure sleep entries to the same editor with Undo.
- `agents/sleep-data.js`: pure structured/legacy sleep normalization, bounded intervals, timezone-offset elapsed time, unknown-data handling, overlap union and 24h/7/30-day summaries. `details.sleep` round-trips through the existing care queue; no schema or access changes. Read-only metadata query verified baby_events.details is jsonb; current Supabase JSON docs and changelog reviewed.
- Stats in Insights show logged last 24h, nap count, longest period, a small weekly chart, average nap/overnight windows, adjusted nights only when awake time is known, and wake counts only when recorded. Missing/vague records remain duration-unknown. Legacy timed naps and morning check-ins remain supported. Overnight narrative text is recognized as sleep without guessing its start.
- Source IDs, script/cache versions and loaded-version checks advance together to P134. New local sleep scripts are in the shell and safe-preview dependency graph. The preview builder preserves body attributes when adding its isolation banner.
- Local validation: 175 code checks, inline script parsing and safe preview packaging passed. Added synthetic browser flows for nap -> History edit -> offline retry -> reload -> stats, overnight dates/awake minutes, invalid interval rejection, narrow phone layout, and effective button text contrast for Today/menu/chat peek/Ideas. Await CI screenshots and full regressions. No tests use real family records.
