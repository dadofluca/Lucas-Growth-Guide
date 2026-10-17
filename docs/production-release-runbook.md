# Production release and rollback runbook

**Hosting confirmed by owner screenshot:** GitHub Pages publishes `main` at `https://dadofluca.github.io/Lucas-Growth-Guide/` from repository root. HTTPS enforced.

**Release candidate:** PR #2, branch `feature/agent-operations-v1`. **Current production baseline SHA:** `d156c9904d5c596d6d328388ca494457128f639f` (recorded 2026-10-17; recheck before merge).

## Before merge
1. Verify exact head commit has passing CI and record the run URL.
2. Confirm no migration automatically executes on GitHub Pages publish. Review separately applied Supabase schema changes; never auto-run staged emergency dedupe SQL as part of frontend release.
3. Open the candidate in a browser or preview hosting that does not write to production. Test a **separate staging Supabase project** for any writes.
4. Test two authorized users and one outsider for family isolation; test core logging and editing, schedule changes/revert, Family Chat, profiles, reports, and offline fallback.
5. Confirm old events are visible, and emergency backup export works. Save an emergency backup before rollout.
6. Obtain explicit signoff to merge and release.

## Publish
Merge PR #2 into `main`. GitHub Pages publishes from `main` root. Verify Pages deployment job succeeded and that `https://dadofluca.github.io/Lucas-Growth-Guide/` loads on a fresh browser. Installed PWAs may retain old service-worker assets; confirm actual loaded version.

## Rollback if anything breaks
1. **Stop new imports and risky actions.** Use emergency.html to record care notes locally and export backups; do not delete those backups.
2. Revert the release merge on `main` with a reviewed PR, or redeploy the recorded last-known-good frontend commit. Do not blindly reset production history.
3. Verify Pages finishes deployment and both iPhones can load, sign in, and read existing logs.
4. Investigate separately. Frontend rollback does **not** reverse Supabase schema/data changes; preserve all family records.

## Evidence still missing
Actual iPhone smoke test, two-user staging/RLS test, signed-in feature validation, Pages deployment of the release candidate. These are hard release blockers, not cosmetic tasks.
