# P88 release and mobile verification checklist

Status: **not released or verified**. On 2026-10-17 PR #33 was open and GitHub reported `mergeable: false`. Its commit status API returned no legacy statuses (not proof that Actions passed or failed).

## Before merge
- [ ] Update PR #33 against current main; inspect and resolve merge conflicts without overwriting P87 changes.
- [ ] Run all Node tests and browser smoke tests; inspect actual GitHub Actions check runs.
- [ ] Test chat with two signed-in family members, each with a distinct saved avatar; check sender label and timestamp.
- [ ] Verify cross-family isolation, missing-profile fallback, and no broken media attachments.
- [ ] Confirm SVG avatar presets remain stable; no database profile or baby-event changes.

## After merge
- [ ] Verify deployment URL and build identifier against main SHA; investigate phone displaying P75.
- [ ] On iPhone, test reload, installed PWA cache update, chat send/receive, image/GIF/video playback, unread preview and small-screen layout.
- [ ] Only claim live after deployment and signed-in browser verification.

## Next visual iteration
Replace simplified token portraits with richer expressive game-character-quality artwork while retaining existing preset keys and accessibility. Keep asset integration separate from database/profile mutations.

## Safety
Never log real family message contents, personal records, access tokens or private keys into public repo, CI artifacts or test fixtures. Use synthetic data for tests.
