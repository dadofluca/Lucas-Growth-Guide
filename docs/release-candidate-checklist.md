# Release candidate checklist — 2026-10-17

This branch changes the app shell, emergency fallback, Family Chat, profiles, user reports, sounds, quick-entry behavior, agent modules, and database migrations. Passing static Node tests is **necessary but insufficient** for production.

## Release blockers
- [ ] Confirm the hosting platform and which branch/commit is actually served to family iPhones.
- [ ] Run signed-in iPhone smoke test on a **staging deployment**: open app, refresh, close/reopen, update service worker, go offline, use emergency fallback.
- [ ] Verify logging bottle, pee, poop, nap, corrections, combined notes, and duplicate prevention against isolated staging data.
- [ ] Verify two authorized caregivers can see shared updates; a user outside the family cannot read chat, profiles, reports, schedules or baby events.
- [ ] Verify Family Chat send/read, stale-response race, and notifications expectations. PR #4 remains separate and draft.
- [ ] Verify profiles, family schedule editing/revert, Teddy UI and reports on a real iPhone. Features not actually wired should be labeled incomplete.
- [ ] Review SQL migrations individually. Do **not** blindly rerun already applied migrations; recovery dedupe migration is staged, not applied.
- [ ] Check Supabase security advisors, RLS and secrets; never use a service-role credential in client JavaScript.
- [ ] Confirm full GitHub CI success at the exact release commit and capture a deployment rollback procedure.

## Safe release sequence
1. Freeze branch changes and inspect the full diff against `main`.
2. Deploy a preview URL without touching the family production backend or real care events.
3. Exercise the checklist with synthetic staging identities and records.
4. Merge reviewed PR(s) only after gates pass.
5. Verify production URL and service-worker update on two devices; keep the emergency export available.
6. Roll back the frontend immediately if login or event persistence fails. Never delete production events as part of rollback.

## Not automatically deployed
The authenticated recovery helper is not wired to a user-facing flow. Builder agents can propose fixes but cannot safely auto-merge or auto-deploy. A passing test suite does not certify the new UI, family isolation, or data integrity.
