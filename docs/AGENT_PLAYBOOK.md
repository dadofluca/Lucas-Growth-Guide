# Reliable checks for the next assistant

Run from the repository root:

```sh
node agents/doctor.mjs --run
```

This runs the Node checks, validates linked local assets and build/cache versions, compares the generated practice page to the app, and exercises the exact contextual sleep examples. Read `artifacts/doctor/health.json` for machine-readable evidence and `artifacts/doctor/NEXT_AGENT.md` for symptoms, likely owning files and reproduction commands. Nothing reads production records or deploys repairs.

Pass Playwright JSON reports to combine browser evidence:

```sh
node agents/doctor.mjs --run artifacts/browser-core.json artifacts/browser-rest.json
```

The existing PR browser workflow supplies both reports. The existing daily mobile audit supplies `artifacts/browser-results.json`. Playwright stamps reports with the checked-out source commit; Doctor rejects missing, invalid or stale supplied browser evidence, and evidence used against uncommitted tracked changes, instead of counting it as a pass. Commit source changes before collecting evidence, use a clean checkout, and rerun browser checks after a code change. Do not relabel old reports. The existing six-hour synthetic workflow supplies unit/static evidence only. Each uploads a handoff artifact and puts a short result in its GitHub job summary. No new timer or paid model service was added.

| Symptom | Owning implementation | Focused reproduction |
| --- | --- | --- |
| Care missing, duplicate, edit lost, delete wrong | `care-sync.js`, `agents/quick-actions.js` | `node --test agents/care-sync.test.mjs agents/delete-integrity.test.mjs` |
| Sleep note missing or double-counted | `agents/sleep-inference.js`, `agents/sleep-data.js` | `node --test agents/p136-sleep-inference.test.mjs agents/p134-sleep-data.test.mjs` |
| Friend mode leaks storage or uses real service | `agents/demo-mode.js`, `agents/build-friend-demo.mjs`, `sw.js` | `node --test agents/p136-friend-demo.test.mjs` |
| Banner missing, stale or overwritten | `agents/achievements.js`, `agents/achievements-ui.js` | `node --test agents/p135-achievements.test.mjs` |
| Avatar/profile/chat stale or blank | `agents/family-profiles.js`, `agents/family-chat.js` | `node --test agents/family-chat.test.mjs agents/family-profiles.test.mjs` |
| Insights numbers, unknown days, age chapters | `agents/insights.js`, canonical `render()` in `index.html` | `node --test agents/p143-insights.test.mjs agents/p74-insights.test.mjs`; browser `P143:` flows |
| Caregiver buttons replace instead of adding people | canonical manual handler/edit in `index.html`; remove obsolete handlers in `sync-fix.js` | Browser `P144: caregiver buttons` must add/remove caregivers while editing and verify the same remote record after reload |
| Daily ideas repeat or personal inbox/read marks are wrong | `agents/insights.js`, `agents/personal-updates.js`, unlocked metadata in `agents/achievements-ui.js` | `node --test agents/p144-updates.test.mjs`; browser `P144:` age and updates flows; notifications must remain read-only |
| Chat composer covered, refresh jumps, large banners | `agents/family-chat.js`, `agents/ui-polish.css`, canonical chat markup | Browser `P143:` flow at 390px and reduced 320px viewport; real iPhone keyboard remains a separate check |
| Wrong schedule day/year or translated day label | `sync-fix.js` (use `data-schedule-day`, never parse display text) | Browser workflow: `practice schedule` tests |
| Browser evidence missing, invalid or stale | `agents/doctor.mjs`, `playwright.config.mjs` | Fresh browser workflow for the current commit, then Doctor with both JSON reports |
| Layout/contrast/phone hit targets | `agents/ui-polish.css`, canonical markup | Existing Browser smoke checks workflow and phone screenshots |

## Important contracts

Sleep inference is a read-only derived view. It links explicit prior bedtime + next morning wake notes within 18 hours for the same baby, uses entry time to resolve clear nap ranges, labels inferred windows and preserves original notes. A confirmed structured window wins. Never turn an unknown bedtime into invented sleep. Wake counts such as “maybe 3” or “6+” remain unknown; windows are not a claim of uninterrupted sleep.

The practice URL is `demo.html`. A synthetic identity, sample tables and prefixed local/session storage provide functional editing. CSP forbids backend requests, the real client/CDN/key and PWA manifest are removed, and reset clears only practice keys. Production service-worker navigation must not serve cached index.html for an offline practice visit. Regenerate with `node agents/build-friend-demo.mjs` after every app markup change.

Calling cards are cosmetic. Earn ordinary starter cards, classify hidden discoveries, and unlock mastery for the four starter cards. Flair uses a narrow compare-and-swap and merges concurrent discoveries. Profile name/avatar saves must not erase flair. Caregiver credit and original logger achievements are separate.

## Evidence before release

A complete result needs the exact source commit, Node pass count, browser report without hidden failures/flakes, reviewed phone screenshots, and byte/version verification after publication. Treat missing evidence as missing; inspect failures instead of softening assertions. Reproduce only with synthetic fixtures. Retest affected behavior after a correction and finish the authorized release. Keep real phone/family-device checks explicitly separate.
