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
