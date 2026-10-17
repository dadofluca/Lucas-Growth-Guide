# Autonomous Agent Operations

## What's committed
- `.github/workflows/autonomous-agent-qa.yml` defines a six-hour scheduled, manually dispatchable QA audit, plus development-branch change triggers.
- Runs Node regression tests, a fully synthetic Watchdog-to-Triage-to-Builder handoff, and an evidence-based release readiness report.
- Uploads evidence as a GitHub Actions artifact. On failure, creates or comments on a GitHub issue.
- Existing `agent-tests.yml` now also reacts to changes in the main app, sync, service worker and Supabase migrations.

## Operational caveat
GitHub scheduled workflows execute from the repository **default branch**. This workflow currently lives on `feature/agent-operations-v1`; its six-hour schedule **will not activate** until the workflow is merged to the default branch. Push-triggered checks can run on the development branch now. Do not claim scheduled QA is live before the merge and a successful scheduled run.

## Safety and future autonomy
The audit is read-only, uses synthetic examples, has no production Supabase credentials and cannot modify real baby events. Failure issues are review tasks, not autonomous repairs. The next phase is a constrained PR-authoring worker with short-lived credentials, a restricted set of files, mandatory checks and human approval. It is not installed yet. Do not give unattended agents broad production credentials.

## Release
A successful CI run alone is not enough to ship. Evidence is still required for authentication, family isolation, real logging/refresh behavior, chat, profiles, iPhone audio, and iPhone UX. `agents/release-gates.mjs` deliberately fails closed when that evidence is missing.
