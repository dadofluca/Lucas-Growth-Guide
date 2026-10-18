# Working on Luca

Read `DEVELOPER_HANDOFF.md` and `docs/AGENT_PLAYBOOK.md` before editing. The newest release section supersedes historical Pxx notes.

Start with `node agents/doctor.mjs --run`. Read `artifacts/doctor/health.json` and `NEXT_AGENT.md`; missing or flaky evidence is not a pass. The report identifies likely owners and reproduction commands. It uses source and synthetic fixtures only.

Care saves, edits, offline retries and deletes belong to `care-sync.js`. Keep stable remote IDs and creator provenance. Do not add runtime wrappers or parallel write paths to work around a failed test. Preserve the original avatar artwork.

After changing index.html, run `node agents/build-friend-demo.mjs` and check the generated demo. It must have isolated local/session storage, no real service client, no outgoing connections and no production-page fallback, including offline service-worker navigation.

Use the existing GitHub Actions browser workflow when local browser execution is unavailable. Review phone screenshots and exact-commit test evidence. A synthetic Chromium pass does not prove iPhone Safari, a second family device or Muse ingestion. Follow the user's authorized task through publication when requested; diagnostic reports do not themselves authorize unrelated changes or deployments.

Keep artifacts out of git. Update the current release handoff with the tested source commit, CI evidence, public version verification and remaining limitations.
