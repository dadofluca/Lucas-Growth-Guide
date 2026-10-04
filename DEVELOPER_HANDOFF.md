# Luca's Growth Guide — Developer Handoff

> **Purpose:** durable breadcrumbs for the next ChatGPT/developer session. Read this file **before changing code**. Update it whenever architecture, behavior, or the active test state changes.

**Repository:** `dadofluca/Lucas-Growth-Guide`  
**Primary branch:** `main`  
**Current runtime at handoff:** **P65** (2026-10-04)

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
\n\n## P64 schedule + Teddy text input\n- Sam/Maddie work rows in Day Manager are now tappable/editable and reuse the time-range editor; work edits update the existing work row and do not expose coverage removal.\n- Day Manager now includes Tell Teddy text entry. It parses explicit person + time-range statements into work/coverage proposals, previews them with checkboxes, and requires Approve & save before writes.\n- Existing same-person/same-kind rows for the day are updated; otherwise new rows are inserted.\n- This is the first local schedule-text parser/preview layer, not yet the full AI/vision ingestion system. Photo/screenshot and imported-message ingestion should feed the same preview contract later.\n- Full sync-fix.js parse check passed. P64 awaiting iPhone verification.\n\n\n## P65 routing fix\n- P64 features were absent because P63 day cards captured the private P63 open() function in their onclick closures. Replacing window.lucaOpenDayManager in P64 therefore did not affect existing card clicks.\n- P65 changes day-card/manage-button handlers to dynamically call window.lucaOpenDayManager at click time, so later/current manager enhancements (editable work + Teddy) execute.\n- Full parse check passed. Awaiting iPhone verification.\n