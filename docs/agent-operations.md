# Luca Agent Operations — Phase 1

This is an implementation plan, **not a deployed autonomous agent fleet**.

## Roles
- **Atlas**: read-only baby-event data quality, duplicates, incomplete feeding records.
- **Teddy**: age-appropriate observations from verified history; never diagnose.
- **Scout**: schedule coverage and caregiver conflicts.
- **Guardian**: Edge Function health, access-control checks, error monitoring.
- **Builder**: proposes GitHub pull requests with tests; cannot merge or deploy without approval.

## Operating rules
1. Do not send identifiable baby data, credentials or ingestion payloads into public GitHub issues, commits or logs.
2. Read-only monitoring by default. All data corrections require explicit approval and an audit trail.
3. Never infer that no event happened just because it was not logged.
4. All recommendations cite the source record ID internally and distinguish observed from inferred data.
5. No production auto-merge, schema mutation, or secret rotation.
6. Keep Supabase service-role credentials only in secure server-side secrets, never client code or GitHub files.
7. Record each agent run: agent name, started/finished timestamps, status, counts and sanitized findings.
8. Deduplicate findings using stable fingerprints; track open, acknowledged and resolved states.
9. Test on staging or a branch before enabling production changes.
10. Review database RLS, auth and ingestion endpoint access before scheduling external jobs.

## First observed baseline (2026-10-17)
- Supabase project: znhqaqvocexjsnklnqre.
- 135 baby_events: 111 bottle, 15 poop, 5 nap, 3 feed, 1 sleep.
- muse_event_imports: 0 rows.
- Five deployed Edge Functions; function deployment does not prove end-to-end ingestion.
- Security advisor flagged privileged callable functions and disabled leaked-password protection.
- pg_cron / pg_net were not found among installed extensions during the initial check.

## Delivery milestones
1. Validate repo structure and identify app runtime/deployment.
2. Add a protected agent_runs + agent_findings schema with appropriate RLS and migration.
3. Implement Atlas in read-only mode and test it on known examples.
4. Enable Supabase Cron or another authenticated scheduler with bounded retries.
5. Add Guardian, Scout, then Teddy with explicit limits.
6. Implement a private in-app report view and notification preferences.
7. Add Builder pull-request workflow with automated tests and human review.

## Acceptance tests
- Duplicate detection never deletes an event.
- Sparse data produces an uncertainty warning, not a fabricated bottle.
- Failed imports produce actionable sanitized alerts.
- Agent cannot read another family's records.
- Scheduler retries do not duplicate findings.
- A failing agent cannot block baby logging.
- Agent reports never expose secrets or personal details in public repositories.

The existing ChatGPT daily audit is a separate scheduled read-only review; it is not the app's autonomous runtime.

## 2026-10-17 review: why the agents missed the P87 mobile regressions

**Observed gap:** Existing Watchdog checks are pure synthetic flow assessments, not a running iPhone/browser monitor. Browser smoke covered tab navigation and emergency backups, but did **not** assert computed text contrast, five-item dock fit, drawer geometry, delayed Family Sync or service-worker version consistency. The README contains historical agent milestones that are not proof of autonomous deployment. CI only runs on matching PR/push events; it does not proactively open PRs from periodic checks.

### Ownership and escalation rules (proposed, not yet autonomous)
- **Watchdog (QA lead):** run viewport matrix (375x812, 390x844, 430x932), inspect contrast >= 4.5:1 for normal text, navigation bounding boxes and overflow, drawer open/close, delayed-auth states, and offline/reload version consistency. Never touch real care events. Emit evidence + stable fingerprints.
- **Guardian (security/reliability):** verify RLS and auth isolation, service-worker/cache behavior, failed Supabase requests and chat initialization latency. Do not bypass authentication or log tokens/message bodies.
- **Atlas (data):** check event persistence, duplicate writes and caregiver attribution using synthetic fixtures; production data remains read-only and family-scoped.
- **Scout (schedule):** verify coverage edit/revert and conflicts with synthetic calendars.
- **Teddy (insights):** check recommendations against verified history and sparse-data uncertainty; never fabricate care events.
- **Spark (design):** own contrast, typography, safe-area spacing, avatar fidelity and screenshot comparisons; propose design fixes with before/after evidence.
- **Builder (engineering):** create narrowly scoped branches/PRs and regression tests; no unattended production merge.
- **Conductor (triage):** dedupe and prioritize findings, distinguish confirmed failures from untested cases, assign owner and track fix -> CI -> review -> deploy -> device verification. Escalate auth/data/security and persistent visual regressions.

### Incremental implementation
1. **Implemented in P89 branch:** automated Chromium regression guard for iPhone-size navigation bounds and computed drawer text contrast, plus CSS correction. This runs on future relevant PRs and catches the same regression before merge.
2. **Next:** add signed-out, delayed-session and signed-in synthetic chat preview scenarios; assert no premature 'sign in' message while auth is pending, no leak of prior family messages, and a bounded status transition.
3. **Next:** add deterministic screenshots/visual baselines for main views and drawers at three phone sizes; artifact on failure, no personal data.
4. **Next:** schedule read-only CI QA (daily or twice daily) on a dedicated workflow, reporting sanitized failures to a private review queue. GitHub Actions schedules can be delayed and cannot guarantee always-on monitoring.
5. **Next:** build a guarded staging preview deployment and an opt-in device verification checklist; do not claim Chromium emulates iOS Safari perfectly.
6. **Only after secure backend design:** authenticated periodic Guardian/Atlas jobs with bounded retries, isolation and alerts; no production corrections, silent data mutations or automatic deployment.

**Acceptance:** a deliberately dark-on-dark drawer and an oversized/overflowing nav must fail CI; no report should claim a passed test that never ran. Any automated remediation stays in a PR until CI and appropriate review. Synthetic QA must never contaminate family totals.
