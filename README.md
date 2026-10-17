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
