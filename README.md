## P132 care-sync foundation — 2026-10-18
- Current working baseline: main P130 (`95526b57c674622965b150564b2b467651eaed7b`). This candidate incorporates the tested P131 Quick Bottle work and P129 form-obstruction rules without merging obsolete conflicting branches.
- One `care-sync.js` repository now handles manual, Smart Entry, quick/dock bottle and morning sleep writes. Stable UUID primary keys make a retry recover the same row after a lost response. Pending edits remain in local storage and retry against the original shared row.
- Refresh uses one shared in-flight operation and merges against the queue after the response. New logs, in-flight edits and confirmed deletes are protected against stale read responses. Request deadlines release failed operations for retry.
- Quick Bottle: 4/5/6/7/8 oz logs the current time immediately; no native text prompt or separate time dialog. History Edit opens the visible Today composer, with ounces/time/caregiver fields and Undo. Poop size/wetness restore while editing.
- The visible P132 marker supplies `window.LUCA_PATCH`; runtime no longer hard-codes P87. Worker and script cache identities advance together. Tap the timeline status to retry; reconnecting or reopening refreshes automatically.
- Verification before PR: **166 Node checks passed**, including 17 behavioral repository tests for lost responses, offline edits/retry, simultaneous refresh/save, restart, family switching, Undo and delete races. Safe preview packaging and asset checks passed. Authenticated browser tests use a synthetic backend; no tests write real family records.
- **Deployment/browser CI: pending for this candidate.** Actual signed-in iPhone Safari and two-device family validation remain necessary before calling the entire app verified. No schema, family records, schedules or messages were edited.

## P89 release milestone — 2026-10-17
- PR #35 squash-merged into main at `1ed07729d125bfb381911ae41416d5b671e83c9d` after green agent prototype and Chromium browser smoke checks.
- Restored high-contrast left menu and compact five-button mobile navigation, plus enlarged-text / Display Zoom-like viewport regression coverage and reduced-motion handling.
- Added `.github/workflows/scheduled-ui-audit.yml`: daily UTC 11:17 scheduled synthetic Chromium browser audit with failure artifacts; workflow execution after merge is not yet verified. This does **not** constitute production Safari/device monitoring or automatic fixes.
- Next: Family Chat delayed-session synthetic checks, multiple phone-size matrix, version indicator consistency, and screenshot comparisons. No real family records changed.

# Luca's Growth Guide

Mobile-first family baby-care tracking application.

> **Project status — updated 2026-10-17:** This README previously described the first local-only prototype. The live Supabase backend has since evolved. This repository's current frontend/deployment wiring has **not yet been verified**, so do not assume this branch fully represents the deployed app.

## Product direction
- Simple, accurate logging of bottles, diapers, sleep, solids and other baby-care events.
- Family caregiver attribution, shared schedules and supplies.
- Teddy assistant for context-aware insights based on real records.
- Optional Muse / iPhone Shortcut ingestion with deduplication.
- A small supervised agent team for reliability, data quality and development.

## Historical first build (not a current feature audit)
- 8 oz primary/default feed button; 5, 6, 7 and 8 oz quick logging.
- Poop, cranky, happy and sleep quick logs.
- Daily totals, timeline, next-feed estimate, local persistence and offline PWA support.

These are historical README claims; verify against the current UI before marking them tested.

## Live backend observed on 2026-10-17
Supabase project: `znhqaqvocexjsnklnqre` (Lucas Growth Guide; active at inspection).

| Component | Observed state | Important limitation |
| --- | --- | --- |
| `baby_events` | 135 rows | Counts alone do not prove completeness or accuracy |
| `luca_schedule` | 86 rows | Edit/revert behavior not validated |
| `muse_event_imports` | 0 rows | End-to-end Muse ingestion not confirmed |
| Edge Functions | 5 active deployments | Deployment does not establish correct behavior |
| RLS | Enabled on 9 public tables | Security advisor findings still require review |
| Supabase scheduling | pg_cron / pg_net not found installed | Autonomous backend agents not yet scheduled |

Event types observed: bottle 111, poop 15, nap 5, feed 3, sleep 1. Do not interpret sparse history as proof that no care event occurred.

## User-submitted problem reports
- Database: `public.agent_user_reports` deployed with RLS and two family-membership policies (SELECT and INSERT); verified 2026-10-17. Members can submit descriptions (10–2000 characters), category and family association; reports begin in `new` status. No public anonymous access.
- UI: `agents/report-widget.js` is wired to a floating **Report a problem** button in development `index.html`; **not merged into main or validated in a signed-in browser session**. It requires the app's signed-in Supabase client and current family ID.
- Routing: A deployed `agent-audit` Edge Function can inspect pending report metadata when invoked with server-only credentials, but **no automatic schedule or end-to-end invocation test has been completed**. Next step is an authenticated server-side triage worker that reads reports and writes sanitized findings. No automatic corrections.
- Tests: `.github/workflows/agent-tests.yml` runs Node unit tests on changes; workflow execution result not yet verified.

## Agent operations status
See [Agent Operations Plan](docs/agent-operations.md).

| Milestone | Status |
| --- | --- |
| Identify GitHub and Supabase projects | Done |
| Initial read-only backend inspection | Done |
| Daily ChatGPT read-only audit | Scheduled separately; not an app agent runtime |
| Create agent architecture and safety plan | Done on `feature/agent-operations-v1` |
| Create agent findings / run-history schema | Deployed in private `agent_ops` schema; RLS enabled; access restricted |
| Implement Atlas data-integrity worker | Pure read-only prototype committed; tests not yet executed |
| Implement Teddy, Scout, Guardian, Builder workers | Pure read-only / proposal modules committed; tests not yet executed |
| Deploy authenticated recurring backend scheduler | Not started |
| In-app reporting dashboard | Not started |
| Test and approve production rollout | Not started |

**Current branch:** `feature/agent-operations-v1`. **Draft PR:** [#2](https://github.com/dadofluca/Lucas-Growth-Guide/pull/2). This is documentation only, not a deployed fleet.

## Notes for humans and AI coding agents
1. **Inspect before editing.** Determine actual frontend framework, deployment target, data paths and tests; the old README is not sufficient evidence.
2. **Protect family data.** Never commit child/family records, family codes, private keys, service-role secrets or message bodies. The repository is public.
3. **Preserve existing records.** No automatic deletion, backfill or correction of baby events. Use reversible changes with audit trails and approval.
4. **Use separate branches and PRs.** Do not push unreviewed work directly to `main` or deploy to production.
5. **Make monitoring read-only by default.** Each finding needs evidence, severity, uncertainty and deduplication.
6. **Test before claiming success.** Validate auth/RLS, cross-family isolation, duplicate detection, error handling, retries and ingestion idempotency.
7. **Update this README on each milestone.** Include date, implemented changes, tests performed, deployment status, outstanding risks and next action. Distinguish plans from deployed behavior.
8. **Do not assume persistent autonomous control.** ChatGPT scheduled audits and backend workers are separate systems.

## Known follow-ups
- Investigate sparse historical feed backfill and potential duplicates.
- Verify Muse ingestion end-to-end and securely authenticate the endpoint.
- Review Supabase advisor findings around privileged callable functions and leaked-password protection.
- Reconcile frontend source with the running app before changing UI behavior.
- Implement Atlas first; expand to other agents only after tests pass.

## Progress log
- **2026-10-17 (family profiles):** Applied family_profiles migration (success). Added Family tab with display-name/bio editor, five emoji preset avatars, family profile list and visible-app heartbeat-based last-active display. Added static regression tests. Not merged/deployed to live PWA; signed-in two-user RLS and iPhone testing pending. Photo uploads, notification settings, push chat and profile auto-provisioning remain future work. Chat database migration was applied earlier, but live UI not yet deployed.
- **2026-10-17 (Family Chat prototype):** Added a primary Chat tab, authenticated send/read UI, separate `family_chat_messages` RLS migration and static security regression tests. Chat text is displayed via `textContent` and is never treated as a baby care event. Migration not applied; live chat not yet functional. Needs database migration, signed-in multi-user tests, cross-family RLS checks, and iPhone layout review. Polls while Chat tab is active, not push notifications.
- **2026-10-17 (recording-based entry UX):** Reviewed 22-second iPhone recording showing the manual entry composer lacks a visible dismissal. Added Close (collapse and preserve draft), Cancel/discard (reset without saving), More toggle, and auto-collapse after confirmed save; added static regression tests. Development branch only; iPhone browser E2E and CI confirmation pending. Three active family users reported, fourth expected; this is user-reported, not backend-verified.
- **2026-10-17 (entry UX + language QA):** Fixed main quick buttons so they open the existing event review/confirmation flow without appending tokens to the natural-language text area. Bottle asks for ounces (8 default; temporary native prompt, to replace with polished picker). Added static regression tests and a 17-scenario synthetic caregiver-language corpus covering typos, ambiguous caregiver/diaper reports, time ranges, mixed events, and missing amounts. **Important:** Corpus scenarios are test fixtures, not yet executed against the live parser. iPhone/browser behavior, persistence and other quick-button parser coverage remain unverified. No live deployment.
- **2026-10-17 (Watchdog database verified):** GitHub Actions run 39067526622 passed. Applied `watchdog_isolated_test_events` migration to Supabase: `public.agent_test_events` now exists with RLS enabled and no anon/authenticated privileges. Verified transactional insert and read of one synthetic 8 oz bottle event followed by rollback; confirmed zero remaining synthetic test rows. This is a real database storage smoke test, **not** a browser/UI test or an automated scheduled agent run. No real `baby_events` rows changed.
- **2026-10-17 (review handoff):** Added `agents/review-issues.mjs` and three tests to generate sanitized, non-published GitHub issue drafts from Conductor's review queue. Extended synthetic CI handoff artifact to include draft issues. No issue is auto-created, no pull request is auto-merged, and no production data is touched. Latest CI verification pending.
- **2026-10-17 (realistic Watchdog test design):** Added a proposed isolated `agent_test_events` table migration, synthetic event builder, activity summary, and four isolation regression tests. Unlike tagging events in `baby_events`, separate storage prevents contamination of real care totals and leaderboards by construction. **Migration is committed only, not applied; no test events created and no activity dashboard yet.** Next: review migration/RLS, apply, implement server-side create/read/verify/delete and display sanitized run status. Never grant client writes to synthetic events.
- **2026-10-17 (CI handoff):** Verified Conductor/Builder triage unit tests passed (GitHub Actions run 39066724364). Added `agents/synthetic-handoff.mjs` and updated agent CI to exercise Watchdog -> Conductor -> Builder with a synthetic bottle-persistence failure and upload a 7-day `synthetic-agent-qa` artifact. No family records, credentials, GitHub issue creation, merge, or live changes in this workflow. Awaiting latest CI result.
- **2026-10-17 (Conductor + Spark):** Added `agents/conductor.mjs` to deduplicate and prioritize findings, assign draft work to Builder or Spark, and enforce human-reviewed deployment; added `agents/spark.mjs` with opt-in seasonal themes, caregiver accents, reliable save feedback, and private-gallery proposals. Seven new unit tests committed. **These are prototype modules, not deployed autonomous agents.** Latest CI run not yet verified; no app visuals or production data changed.
- **2026-10-17 (Teddy + Watchdog tests):** Added `agents/teddy.test.mjs` covering recorded-only bottle totals, New York date boundaries, and empty days. Watchdog now distinguishes unverified checks from confirmed failures, with regression coverage. Changes committed; new CI results not yet confirmed. This does not constitute end-to-end browser QA or autonomous fixes.
- **2026-10-17 (worker v2):** GitHub Actions run 39066266937 completed successfully for agent tests. Deployed Supabase `agent-audit` Edge Function **v2**, ACTIVE with JWT verification. Checked `public.agent_runs` after deployment: still **0**, and no invocation logs found; deployment is not proof of successful authenticated execution. No scheduler or automated production fixes enabled. Next: invoke with a securely managed server credential and verify findings are recorded; do not put the service-role credential in browser, GitHub, or chat.
- **2026-10-17 (audit reliability):** Fixed `agent-audit` development source to explicitly flag missing/null bottle amounts, simplified server-only PostgREST write path, and added two regression checks for missing amounts and idempotent finding inserts. **These changes are committed but not yet deployed to the Edge Function.** Existing live function is still v1. Verify CI and authenticated execution before claiming agent operation.
- **2026-10-17 (QA follow-up):** Added `agents/integration-static.test.mjs` static checks for report wiring, auth, and absence of service-role secrets in PWA; added recent family report status history to `agents/report-widget.js`. These tests are committed but the latest workflow run is not yet confirmed. Checked backend counts: 0 agent runs, 0 findings, 0 user reports. Worker execution and signed-in UI testing remain pending; no automatic release or production data edits.
- **2026-10-17 (Watchdog):** Added `agents/watchdog.mjs` and three synthetic-flow assessor tests for sign-in/family isolation, bottle persistence, diaper attribution, schedule editing, user reports, and Teddy insights. **This is a test-plan/assessment prototype, not a browser automation runner.** Added `docs/personalization-gallery-design.md` for optional seasonal themes, caregiver preferences, and private photo-gallery security requirements. Neither feature is live. Existing ChatGPT daily QA task updated to include GitHub CI and user-report checks; its notifications must be enabled by the user.
- **2026-10-17 (integration):** GitHub Actions run 39064793479 completed successfully for agent unit tests. Created backend-only `public.agent_runs` and `public.agent_findings` with RLS and revoked client access because the private schema was not exposed to PostgREST. Deployed `agent-audit` Edge Function v1 with JWT verification and additional service-role token check; deployment ACTIVE verified, **no successful authenticated execution yet** (zero runs/findings). Wired floating report button to the development PWA HTML; **not merged, not tested in browser, not live for users**. Cron scheduling still pending. Existing `agent_ops` tables remain unused.
- **2026-10-17 (worker draft):** Added `supabase/functions/agent-audit/index.ts` as a service-role-authenticated POST worker prototype for Atlas duplicate checks and Guardian triage of user reports. Added Teddy timezone-aware daily insights in `agents/teddy.mjs`. **Worker NOT deployed**: private `agent_ops` schema is not yet verified accessible through PostgREST; verify secure access path and test worker before deployment. No cron job configured. GitHub Actions workflow exists, but its execution has not been verified.
- **2026-10-17 (reporting):** Deployed `public.agent_user_reports` with family-scoped SELECT/INSERT RLS, verified RLS enabled and two policies; committed a report form module and GitHub Actions test workflow. Form is not yet mounted in the PWA and reports are not yet automatically routed to agents. No agent scheduler deployed.
- **2026-10-17 (agent foundation):** Committed Scout, Guardian, Teddy and Builder modules plus four additional tests. Created private Supabase `agent_ops.runs` and `agent_ops.findings` tables with RLS enabled and restricted service-role access; verified table existence and RLS. Security advisor reports no-policy INFO for these intentionally backend-only tables. Existing privileged-function and leaked-password warnings remain. **No agent scheduler or production Edge Function deployed; tests not yet executed.**
- **2026-10-17 (continued):** Confirmed the frontend is a static HTML/JS PWA (index.html and sw.js), not a package.json-based React project. Added \`agents/atlas.mjs\` with duplicate, timestamp, bottle-amount and sparse-history checks, plus \`agents/atlas.test.mjs\` with four Node test cases. **Tests not yet executed; no runtime scheduled or deployed.**\n- **2026-10-17:** Connected to GitHub repository `dadofluca/Lucas-Growth-Guide` and Supabase; read-only inspection found 135 baby events, 86 schedule records, five deployed functions and zero Muse import rows. Created agent operations branch and draft PR #2. Updated README to separate historical prototype claims, observed backend state, and planned work. **No production changes deployed.**

## Immediate next step
Run Atlas unit tests, inspect how the static PWA is deployed, and design the protected agent findings schema. Keep all live data and production code unchanged until reviewed.

## Chat handoff — 2026-10-17 (P87/P88 continuation)
- User confirmed GitHub and Supabase are connected and explicitly requested that future ChatGPT sessions read this README and keep it updated as a durable handoff.
- Latest user screenshots report P87 merged to main with compact Today home, centered navigation, bedtime duplicate protection, Family Chat preview, and photo/GIF/video attachments. **These claims have not been independently deployment-tested in this session.**
- P88 is PR #33 (`https://github.com/dadofluca/Lucas-Growth-Guide/pull/33`): improved illustrated SVG avatar details and selected avatar beside name/timestamp in Family Chat. Screenshot reports agent tests passing, browser checks pending, and P88 unmerged. Verify current PR/CI state before merging.
- User strongly prefers rich, expressive, humorous, almost 3D game-character avatar artwork rather than flat simplified SVG tokens. Preserve each caregiver's selected avatar key; upgrade assets separately after reliable integration.
- Priorities: verify deployed build/version (user still saw P75), fix mobile cache/version indicator, finish avatar chat integration, right-side slide-out as family-chat quick preview with unread cue, consolidate home input/timeline spacing, strengthen chat media and notifications. Preserve existing baby events, schedules, messages and profiles.
- README contains older agent-operation milestones and historical progress entries; treat each as dated, not proof of present state. Audit actual main, open PRs, CI and Supabase before any production action.
- Next assistant should read README, inspect PR #33 and deployed version, work via branch/PR with tests, and append verified results to this handoff. Do not commit secrets or personal family records to this public repository.

## Handoff update — 2026-10-17 P88 merged
- **Verified:** PR #34 (`https://github.com/dadofluca/Lucas-Growth-Guide/pull/34`) squash-merged into main as commit `50ccb2dbe9dd4d122b144f34370c3c4dd8b7aa75` after both GitHub Actions workflows (`Agent prototype tests`, `Browser smoke checks`) passed on the PR head `d8838b918e799f5854c1a087e43cb469b6bd434f`.
- P88 delivers Family Chat saved avatar alongside sender name/timestamp, more layered SVG avatar presets, and `agents/p88-chat-avatar.test.mjs`. Original PR #33 was blocked by branch divergence; #34 integrated changes on updated main.
- Supabase project `znhqaqvocexjsnklnqre` checked ACTIVE_HEALTHY; RLS enabled on public tables. Read-only inspection showed 141 baby events, 89 schedule records, 3 family chat messages, 2 family profiles. **Do not publish real family content.** Security advisors flag callable SECURITY DEFINER functions and other advisories; investigate before modifying permissions.
- **Not verified:** deployment propagation, iPhone PWA service worker/cache, signed-in multi-user chat, rich-media playback on device. Do not equate merged code with confirmed live device behavior.
- **Next:** investigate build/version showing P75, test live deployment and mobile cache, then implement richer character artwork and right-side Family Chat quick-view/unread indicators. Continue tests and README updates.

- Browser QA root cause found: `render()` still called removed `renderDrawer()`. Its ReferenceError stopped the initial script before automatic `setupSync()` and service-worker registration. Removed the obsolete call and added a startup-status assertion. The first synthetic run exposed this; passing source-shape tests had missed it.
- Phone dock regression: the relocated chat-peek button overlapped the collapsed Teddy button. Moved it above the dock and hide it while the dock is expanded, preserving both real tap targets.
