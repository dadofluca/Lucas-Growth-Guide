# Luca's Growth Guide — Developer Handoff

> **Purpose:** durable breadcrumbs for the next ChatGPT/developer session. Read this file **before changing code**. Update it whenever architecture, behavior, or the active test state changes.

**Repository:** `dadofluca/Lucas-Growth-Guide`  
**Primary branch:** `main`  
**Current release:** **P139** (2026-10-18), merged and verified on the public app. See the latest release note below; older Pxx notes are historical.

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


## P134 — refined UI and timed sleep, released
- Release PR #84: https://github.com/dadofluca/Lucas-Growth-Guide/pull/84. Tested source `c90e66d245d0e0df9da9b056fe90bb6e40b887d4`; squash merge `9b97f95e85799ac4a6354460899726c5f1e4c37e`.
- Public app https://dadofluca.github.io/Lucas-Growth-Guide/ served **P134**. SHA-256 byte comparisons matched the tested source for index.html, sleep-data.js, sleep-ui.js, ui-polish.css, family-ideas.js, sync-fix.js, care-sync.js and sw.js. Script URLs, shell cache and visible/runtime version agree on P134. Do not clear local storage to force updates.
- Shared control/surface styling is in `agents/ui-polish.css`, scoped to `body#lucaApp`: soft sage actions, warm neutral surfaces, readable dark text, refined cards/forms/navigation, reduced motion and darker small section labels. The P39/P40 injected theme/form paint, final menu repaint and obsolete Today-only nav selectors were removed. Future visual work should use this shared style layer, not another compatibility repaint.
- Quick menu, Chat peek and Family Ideas submit use readable light controls. Ideas submit uses `confirm`, and floating utilities hide while the Ideas form is active. Original avatar artwork/personality/audio behavior remains intact.
- Sleep quick action opens the one editor in `agents/sleep-ui.js`: Nap / Night sleep, explicit start/end datetimes, live recorded duration, caregiver, optional note, and optional night wake-ups/awake minutes. Invalid, future or reversed intervals do not save. Save calls `saveCareEvent`; pure sleep entries opened from Today/History use the same editor and existing Undo. Mixed-event History labels retain the other event types.
- `agents/sleep-data.js` owns structured sleep normalization, legacy timed-nap/morning-check-in compatibility, unknown-data handling, timezone-offset elapsed time, overlap union and rolling/7/30-day summaries. Version-1 `details.sleep` stores `kind`, `start_at`, `end_at`, `awake_minutes` and `wakeups`; datetimes are ISO timestamps. It round-trips unchanged through the existing care queue. No new save path, database migration or access-policy change was introduced.
- Insights reports logged last 24h, nap count, longest period, weekly bars, average nap/overnight windows, adjusted nights only when awake minutes are known, and wake counts only when recorded. Missing/vague records are duration-unknown. Sleep narratives are recognized without guessing their start; existing Other-tagged sleep notes can be recognized read-only and filled in through editing.
- The canonical `esc` helper now converts with `String(value ?? "")`, preserving numeric zero and allowing populated sleep counts to render. Keep it safe for numeric values; the first browser run exposed the old string-only assumption.
- Validation: **175 code checks and 48 Chromium browser checks passed** on the tested source. Code run: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39139530610. Browser run: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39139530617. Settled 320/390 phone screenshots reviewed for Today, timed nap/night editor, sleep stats, menu, Chat peek and Ideas. Synthetic flows cover nap -> History time edit -> offline retry -> reload -> stats, overnight dates/awake adjustment, invalid intervals, effective action contrast >=4.5:1 and the existing care/profile/chat regressions.
- Read-only Supabase metadata checks confirmed baby_events.details is jsonb with no restrictive CHECK constraints; current JSON documentation and changelog were reviewed. No tests changed real family records, and no schema/auth changes were made.
- Remaining external checks: actual signed-in iPhone Safari/PWA picker behavior, a second family device and Muse ingestion. Begin the next pass from P134 user feedback and preserve the shared care queue, portrait factory and sleep normalizer/editor.

## P135 — compact quick care and earned flair, released
- PR #85: https://github.com/dadofluca/Lucas-Growth-Guide/pull/85. Tested source `e0f46083bccc99180bfd0e6ea5f26844c9d43289`; squash merge `2b756b3b65dfac3ddba9db21d693cfab433c8d21`. Public P135 and SHA-256 byte equality verified for index, care queue, worker, compatibility runtime, quick actions, playfulness, achievements/data/UI/flair, chat/profiles, shared CSS and both sleep modules.
- `agents/quick-actions.js` owns the two fixed, viewport-clamped pop-outs, anchored to the shortcut actually tapped. Opening/cancelling never saves. Bottle remains one-tap 4–8 oz; Poop has caregiver (including Yolanda, Lindsay and custom), size, Wet / messy and explicit Log diaper. Both call the same `saveCareEvent` queue. Do not restore old inline form/scroll handlers.
- `agents/playfulness.js` owns soft clicks, rare decorative falling slider/bottle orbit and the hidden L-block click discovery. Quiet Mode gates audio; personality Off and Little surprises Off disable surprises. Reduced motion skips decorative movement. The accessible range and saved value stay intact. Interface clicks and surprises have separate device-local preferences.
- `renderHistory` remains the single renderer. It now has search, an event filter, compact day summaries/event cards and icon-labelled Edit/Delete. Existing remote-delete confirmation, failed-delete retention, editing and Undo remain canonical.
- `avatarLabel` is exported by `agents/family-profiles.js`; chat/profile rows use it beside the original portrait factory. `agents/flair-ui.js` renders validated, earned banner IDs through textContent, shared by chat, profiles and achievements.
- `agents/achievements.js` is the pure 13-achievement catalog/evaluator/normalizer. Logging awards use original `created_by` (now preserved as `createdBy` by care-sync.js); caregiver credit remains on the existing Leaderboard. Three-day bottle/diaper streaks and seven-day care streaks use distinct local calendar days. Completed-week MVP requires at least 5 entries and 2 participating authors, with shared ties. Ghost Mode requires 3 actual visit dates plus confirmed zero own care logs and zero chat messages; unknown counts never qualify. Banners are explicitly chosen, never automatically applied to other people.
- `agents/achievements-ui.js` owns family/user-scoped flair state, narrow profile writes, pending local retry, session checks and concurrent-discovery merging. `family_profiles.flair` stores version, unlocked IDs, discovered eggs, at most 31 visit dates and selected banner. It is cosmetic client-authored data; it is never an authorization or care-decision input. The additive migration `20261018153356_profile_achievement_flair.sql` was applied; profile RLS/grants are unchanged. Rollback-only real database assertions passed for owner writes, object-shape rejection, and non-member read/write denial. Security advisors remain at the pre-existing baseline.
- Final validation: **183 Node checks and 55 Chromium browser checks passed**. Code run: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39141679951. Browser run: https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39141679958. Phone screenshot artifact 12142335588; reviewed 320/390 layouts. Synthetic checks cover local/remote retries, diaper size/wetness edits and reload, original character labels, hidden finds, banner equip/reload/chat, concurrent discovery merging, quiet/opt-out and reduced motion. Manual diaper edits update both notes and structured details.poop, preserving other details.
- Do not claim signed-in iPhone/two-device production verification. Browser tests use isolated synthetic accounts/data. Never publish screenshots with real family messages or care records.

## P136 — contextual sleep, calling cards and friend practice, released
- PR #86: https://github.com/dadofluca/Lucas-Growth-Guide/pull/86. Tested source `09c55177a1cd26caaf0c00158b683a428cdc55ee`; squash merge `f139694fe51068fb55c167dc9827acd08f1226af`. Public index/demo both served P136, and 20 SHA-256 byte comparisons matched the tested source (app/demo, worker, care/compatibility runtime, all changed runtime modules, shared CSS, Doctor and agent instructions). The final handoff update changes README/this file only.
- App: https://dadofluca.github.io/Lucas-Growth-Guide/. Friend playground: https://dadofluca.github.io/Lucas-Growth-Guide/demo.html. The profile Tools & support menu copies this exact demo URL without auth fragments or a family code. It opens as a synthetic Test Pilot with sample care, profiles, chat and schedule rows. Each browser keeps its own practice changes; Reset demo clears only that namespace.
- `agents/demo-mode.js` wraps localStorage and sessionStorage with the `luca-practice-v1:` prefix before app code runs. A local Supabase-shaped client operates only on synthetic tables. `agents/build-friend-demo.mjs` generates the committed demo.html from index, removing the real client/CDN/key, worker registration, PWA manifest and backup-page escape. A CSP blocks outgoing connections. Storage isolation fails closed. Regenerate after every index change, then run `node agents/build-friend-demo.mjs --check`. Source packaging includes the demo; asset checks inspect it. Practice Teddy returns a labeled local example reply; practice media previews use current-page object URLs.
- Production sw.js handles a failed-network `/demo.html` navigation separately, returning a practice-offline message without consulting the real app cache. It never precaches the demo as a production shell. Node behavior checks and a Chromium worker with a forced failed fetch verify that branch. Main app offline recovery remains canonical.
- `agents/sleep-inference.js` is a pure read-only derived view, loaded before sleep-data. It combines same-baby night start/wake observations within 18 hours and resolves clear nap ranges using entry time and AM/PM context. Example: Oct 17 22:15 “Down for the night at 10:15” + Oct 18 “Slept last night until 7 am” yields one 8h45m window; “Napped 8–9” at 8 AM yields 1h. Original notes remain intact. Approximate/open-ended wake counts remain unknown. Plans, questions, distant pairs and future ends do not create completed durations. These are observed windows, not a claim of uninterrupted sleep.
- `LucaSleep.resolve(entries)` supplies linked sessions to Today/History. Sleep summaries union/deduplicate windows and count inference only within the selected period. The single sleep editor pre-fills inferred endpoints and labels them; saving confirms explicit structured times through care-sync.js. A nearby confirmed window takes precedence over narrative evidence, including the companion note, without double-counting. No automatic backend backfill or schema change.
- Shared CSS uses muted stone/sage light surfaces. History remains the compact searchable journal. The original 42-character PNG is unchanged. Eager portraits request synchronous decoding, and chat reuses portraits/profile enrichment within each family session. Settled phone screenshots verify Dada's Dude beside the original portrait and selected chat banner.
- Calling-card catalog now has 23 entries. Easy starters: Fresh Recruit (first signed-in day), Reporting for Duty (first own care log), First Responder (first own poop log), Ceasefire Clerk (first own sleep log). All four unlock Certified Chaos Crew mastery. Other new cards include correction credit, a return visit, three care types, Caffeine Corps and hidden Silent Operator/Bottle Inspector. Existing streak/MVP/Ghost rules and profile flair CAS remain intact. A home prompt and collection filters make starters visible. Banners use original CSS ribbons and respect reduced motion; optional discoveries respect surprise/personality controls and Quiet Mode gates sound.
- Design research used the official Call of Duty progression/challenges guide for career/hidden/mastery collection structure: https://www.callofduty.com/uk/en/blog/2024/10/call-of-duty-black-ops-6-launch-progression-leveling-prestiging-challenges-intel and Activision's progression documentation: https://support.activision.com/content/atvi/support/web/en_gb/black-ops-6/articles/progression-in-black-ops-6.html.
- The schedule starts on the current week, with matching week navigation labels/help. The coverage editor's default overlap computation now owns its date-key helper instead of referencing a private P48 helper. Removed the obsolete dead post-render wire function, and editor saves/removals refresh the canonical weekly renderer. Synthetic practice coverage defaults to the actual 07:00–15:00 work overlap; reload/revert preserve both work rows.
- Start future sessions with `node agents/doctor.mjs --run`. It validates version/cache/asset consistency, exact generated demo isolation and contextual sleep fixtures, runs Node checks, and optionally consumes Playwright JSON reports. Outputs: `artifacts/doctor/health.json` and NEXT_AGENT.md. Missing evidence stays unverified; failed/flaky evidence yields actionable tasks and a nonzero exit. Browser tasks retain exact errors and test locations. Coverage failures route to sync-fix.js, while sandbox failures also identify the worker. The existing PR, six-hour synthetic and daily browser workflows upload these reports and put them in job summaries. No new timer, model service, production-data access or automatic deployment was added. Read AGENTS.md and docs/AGENT_PLAYBOOK.md.
- Final verification: **201 Node checks + 60 Chromium browser checks passed**, zero failures/skips/flakes. Code run https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39143781511; browser run https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39143781444. Diagnostic artifact `12143025421` reports synthetic-checks-passed, empty nextTasks, productionDataRead=false, productionWrites=false, automaticDeployment=false. Screenshot artifact `12142518355`; reviewed phone layouts, original chat portrait, starter collection, contextual sleep totals and friend mode.
- Practice browser tests exercise create/edit/delete/reload/reset, chat/profile changes and schedule coverage/revert, preserving native history/auth/session sentinels with zero backend requests. Existing care offline retry/edit/delete/Undo and profile/flair regressions remain green. Tests never changed real family records. Local QA reports/screenshots are under artifacts/ and must stay out of git; the CI artifact IDs above are durable retrieval pointers within their retention period.
- Remaining external checks: actual signed-in iPhone Safari/PWA input and audio behavior, a second production family device and Muse ingestion. Do not represent synthetic Chromium or public source verification as physical-device confirmation. No further implementation failure is known from the current synthetic suite.

## P137 — calendar-safe schedules and source-bound QA, released
- PR #87: https://github.com/dadofluca/Lucas-Growth-Guide/pull/87. Final source `2e7a7874becbe8e8c1ce40791ed767008f085da8`; actual CI checkout `8852d4b4179bbd8c519ae1ed4df0af53ef2b65d9`; squash merge `5333bd2aab79bfbb37a38d42bb3433727ee714bb`. All three have tree `0e9e517a32ab686fc060776c3c13b0e82fd374f8`. The final README/handoff update is documentation-only.
- Public app https://dadofluca.github.io/Lucas-Growth-Guide/ and isolated friend playground https://dadofluca.github.io/Lucas-Growth-Guide/demo.html both served P137. Twenty SHA-256 byte comparisons matched the tested release, including app/demo, worker, care/compatibility runtimes, sleep, quick actions, playfulness, calling cards, profiles/chat, shared CSS, Doctor and agent instructions. Local verification evidence is `artifacts/p137-public-verification.json`; keep artifacts out of git.
- This is a bounded continuation of P136, not another UI rewrite. Muted stone/sage light surfaces, original avatar artwork and Dada's Dude chat identity, inferred/confirmed sleep windows, compact quick actions, searchable History, 23 calling cards and the isolated friend playground remain intact. No production records, backend schema or access policies were touched.
- Corrected the owning P48 schedule renderer and existing P63 day-manager route in `sync-fix.js`: each day card now carries `data-schedule-day` from the actual local calendar key. Never derive an action date by parsing a localized label or appending the current year. Two phone-sized synthetic flows (en-US/es-DO) start Dec 31, 2026, open Jan 1, 2027, save Nona's actual 07:00–15:00 overlap and preserve both work rows. No added runtime wrapper.
- `playwright.config.mjs` stamps JSON metadata with `sourceCommit` from the checkout. Doctor reads that identity before combining results, rejects missing/invalid/stale/empty supplied reports and rejects evidence against uncommitted tracked source changes. It preserves actual failed/flaky status and routes verification problems to the Doctor/config/workflow owner. Supplied missing JSON paths are no longer silently dropped. Without browser reports, unit/static success remains `verification-incomplete`, not a browser pass. Do not rewrite metadata to reuse an old report, including after a docs-only commit; consult the exact CI evidence and tree comparison instead.
- Final verification: **204 Node + 62 Chromium checks passed**, zero failures/skips/flakes. Code/packaging run https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39147289271; browser run https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39147289255 (job `117733598697`). Browser diagnostic artifact `12144245665`: `synthetic-checks-passed`, `sourceDirty=false`, both report source IDs match the CI checkout, empty nextTasks, no production reads/writes or automatic deployment. Phone artifact `12143469594`: reviewed English/Spanish New Year coverage, original camouflage chat portrait with Dada's Dude/banner, and warm practice layout.
- Superseded browser run `39146967622` failed the two new tests because the test clicked `.manage62`, an intentionally hidden legacy control. Corrected the test to use the visible `.scheduleDayTop48` card route and reran the entire suite on the final source above. Do not repair the app to accommodate that obsolete test or confuse its failure with the final green run. No force-click, longer timeout or weakened date/work-row assertion was used.
- Start with AGENTS.md and `docs/AGENT_PLAYBOOK.md`, then `node agents/doctor.mjs --run`. Existing six-hour synthetic checks and daily browser checks remain in place; no new timer, paid-model background service or automatic repair/deployment was introduced. Reports and screenshot artifact links are retained by GitHub only for their configured retention periods. Actual signed-in iPhone Safari/PWA behavior, a second production family device and Muse ingestion remain unverified external checks. The repeated ChatGPT “Working” rows in the user's screenshot do not establish an app defect; no cause for that ChatGPT display was claimed.

## P138 — solids entry, visible descriptions and confirmation state, released
- Functional fix PR #88: https://github.com/dadofluca/Lucas-Growth-Guide/pull/88. Source `ebb728cb4386dca2e889f92593d488883e9992e1`, CI checkout `598282c1b4720226a34731370f5e1c7e6081bcda`, merge `88a2504c9639e586de244a0c9e5889e3c255bb04`; identical tree `541b3fc896b16df900870950bfa481745aa0ab2f`. All 209 Node and 64 Chromium checks passed. Original code run `39152095645`, browser run `39152095686`, diagnostic artifact `12145985814`.
- Final test-only verification PR #89: https://github.com/dadofluca/Lucas-Growth-Guide/pull/89. Source `adaa1d47e9a6370da4fd00b905f9f44d8fa45f81`, actual CI checkout `52fc5e3e8c7af75102eca2be0a91872d887a7ba0`, merge `e899bbac2a931446a5f7246cb7d0cf9207a2d14e`. No runtime changes from PR #88; it adds a real Skip click/wait after reload before the meal screenshot. The initial phone artifact `12145289139` caught the normal startup overlay and was not valid visual evidence; the PR description was corrected instead of claiming that capture proved the visible card.
- Final **209 Node + 64 Chromium checks passed**, zero failures/skips/flakes: code/packaging https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39152464583, browser https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39152464514 (job `117748724429`). Diagnostic artifact `12145862073`: synthetic-checks-passed, clean tracked source, matching browser source stamps and no nextTasks. Settled phone artifact `12146036279` was downloaded and inspected: one 12:45 PM solids card, Nona, full chicken/sweet-potato/broccoli/avocado description directly visible, no redundant Original message dropdown. Other genuine edited descriptions keep their existing collapsible provenance behavior.
- Reproduced against P137 using the actual parser in a Node VM: the meal produced a solids item with `With this update` and no clock, plus a phantom bottle carrying 12:45. The parser split ingredient/attribution clauses, treated generic “fed” as bottle, and saved a generated solids label instead of the written meal. Separately, the visible confirmation copied a hidden form's HTML and forwarded clicks by button position; its Save state and caregiver-header actions were not synchronized.
- Corrected the owning functions in index.html, not a compatibility wrapper. `smartClauseClock` preserves explicit per-clause times; a single stated time can attach to the food after an ingredient list. Recognized solids plus generic “fed by” does not create an additional bottle unless the text also gives explicit bottle/milk/formula/ounce evidence. Generic unspecified feeding asks bottle vs solid food, rather than assuming ounces. A sole named caregiver is retained for the meal; ambiguous AM/PM and genuinely unresolved choices remain explicit. Added chicken/broccoli/purée recognition. Actual mixed bottle/food and separate stated times remain supported.
- Solids store the full reviewed text as notes and original sourceText, preserving ingredients/punctuation instead of `Solids — jar; With this update`. The visible note uses pre-wrap/word wrapping. Other event kinds retain their component provenance. `renderSmart` builds both clarification surfaces and their Save state together; `handleSmartAction` uses the action's data attributes, not a copied button index. Remove, change caregiver, type/ounce/time/dose choices use that shared path. Required-choice status explains why Save is disabled. Empty/cancelled drafts clear both surfaces. Typing a changed draft discards the old candidates and requires Enter/review again, preventing stale text from being saved.
- `agents/p138-smart-solids.test.mjs` adds five behavioral parser regressions. New synthetic browser flows save/reload the full meal at 12:45 PM/Nona with null ounces and one remote solids row; change caregiver; remove an unresolved bottle without blocking the remaining food; and revise a draft without saving the previous text. Existing offline persistence/edit/delete/Undo, sleep, original-avatar/chat, flair, schedule and practice isolation suites remain green. Tests never use production family records.
- Public app https://dadofluca.github.io/Lucas-Growth-Guide/ and friend playground https://dadofluca.github.io/Lucas-Growth-Guide/demo.html both serve P138. App/script/style/cache identities agree, demo was regenerated and checked, and 20 public SHA-256 comparisons matched the tested runtime. Evidence is under artifacts/p138-public-verification.json and the CI artifacts above; keep artifacts out of git. Final README/handoff edits are documentation-only.
- No backend schema, RLS, care-sync.js write path, production history or historical backfill changed. The user's already-saved 1:51 entry still needs an explicit Edit to correct its timestamp/details; do not invent missing ingredients or silently rewrite historical records. Reopen/reload and check P138 without clearing local storage, which may contain pending care. Physical signed-in iPhone Safari/PWA and two-device family validation remain external checks; synthetic Chromium is not physical-device proof.

## P139 — first-time family sign-in, released
- PR #90: https://github.com/dadofluca/Lucas-Growth-Guide/pull/90. Source `73597e62732e1bece156cf885ceb98bd2024dcd3`, CI checkout `2e9716a40e296fa598949654eadf636c73ebe44c`, squash merge `5261b91d5b3bc86c46af39ba9d5f6830c30d7282`; all three have tree `7677445bacd08263d26234ebe868078e88bf55f2`.
- Root cause: `sb.auth.getUser()` returns `AuthSessionMissingError` with null user on a fresh client. The old code threw before opening the login form, leaving only a retry status. Reproduced with the current CDN SDK: zero network calls for the missing-session response. Read-only live Auth settings returned 200 and Supabase project znhqaqvocexjsnklnqre was ACTIVE_HEALTHY. No production account was created or modified.
- Canonical `connectFamilySync` now treats only that specific null-user error as signed out; all other auth errors still propagate. `openFamilySync` serves the persistent header button, More menu and disconnected status. Open forms remain visible during retry; explicit reopen clears the dismiss flag. Genuine network failures retain their status with sign-in accessible. Practice mode remains isolated.
- `family-pin.js` retains the selected caregiver, supports Yolanda/Lindsay and saved custom names, shows inline join errors and reports success only after family loading succeeds. Existing join-family-device and password authentication remain intact; no schema, RLS, authorization or shared care-write changes.
- **213 Node + 66 Chromium checks passed**, zero failed/flaky/skipped: code https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39166022682; browser https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39166022674, job `117789014760`. Diagnostic artifact `12151265264` reports clean source, matching commit stamps, synthetic-checks-passed and no nextTasks. Phone artifact `12150597627` was downloaded; `p139-family-signin-390.png` was inspected before merging and clearly shows the form and Connect this phone action.
- Four Node regressions cover missing-session/null-user behavior and real auth errors. Synthetic first-device browser coverage exercises dismiss/reopen, status/menu access, a wrong code then correction, successful joining, caregiver retention and reload. Separate coverage verifies genuine network errors keep the form reachable. Synthetic backend fixture now preserves an existing caregiver on reload instead of overwriting it.
- Public app and demo both serve P139; all 21 public SHA-256 comparisons, including family-pin.js, match the tested runtime. Local evidence: artifacts/p139-public-verification.json; keep generated artifacts out of git. Final README/handoff changes are documentation only.
- New member instructions: reopen/reload the app and check P139, tap Family sync (also More → Family sync), enter the existing family code, choose their name or Other and Connect this phone. Never clear local storage to force an update: pending care can live there. Actual signed-in iPhone Safari/PWA and a second production-device join remain manual checks; synthetic Chromium is not physical-device proof.
