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
- UI: `agents/report-widget.js` is a standalone authenticated widget **committed but not mounted in the live app**. It requires the app's signed-in Supabase client and current family ID.
- Routing: Reports are **not yet automatically processed by the agents**. Next step is an authenticated server-side triage worker that reads reports and writes sanitized findings. No automatic corrections.
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
- **2026-10-17 (worker draft):** Added `supabase/functions/agent-audit/index.ts` as a service-role-authenticated POST worker prototype for Atlas duplicate checks and Guardian triage of user reports. Added Teddy timezone-aware daily insights in `agents/teddy.mjs`. **Worker NOT deployed**: private `agent_ops` schema is not yet verified accessible through PostgREST; verify secure access path and test worker before deployment. No cron job configured. GitHub Actions workflow exists, but its execution has not been verified.
- **2026-10-17 (reporting):** Deployed `public.agent_user_reports` with family-scoped SELECT/INSERT RLS, verified RLS enabled and two policies; committed a report form module and GitHub Actions test workflow. Form is not yet mounted in the PWA and reports are not yet automatically routed to agents. No agent scheduler deployed.
- **2026-10-17 (agent foundation):** Committed Scout, Guardian, Teddy and Builder modules plus four additional tests. Created private Supabase `agent_ops.runs` and `agent_ops.findings` tables with RLS enabled and restricted service-role access; verified table existence and RLS. Security advisor reports no-policy INFO for these intentionally backend-only tables. Existing privileged-function and leaked-password warnings remain. **No agent scheduler or production Edge Function deployed; tests not yet executed.**
- **2026-10-17 (continued):** Confirmed the frontend is a static HTML/JS PWA (index.html and sw.js), not a package.json-based React project. Added \`agents/atlas.mjs\` with duplicate, timestamp, bottle-amount and sparse-history checks, plus \`agents/atlas.test.mjs\` with four Node test cases. **Tests not yet executed; no runtime scheduled or deployed.**\n- **2026-10-17:** Connected to GitHub repository `dadofluca/Lucas-Growth-Guide` and Supabase; read-only inspection found 135 baby events, 86 schedule records, five deployed functions and zero Muse import rows. Created agent operations branch and draft PR #2. Updated README to separate historical prototype claims, observed backend state, and planned work. **No production changes deployed.**

## Immediate next step
Run Atlas unit tests, inspect how the static PWA is deployed, and design the protected agent findings schema. Keep all live data and production code unchanged until reviewed.
