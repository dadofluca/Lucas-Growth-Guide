## Current release: P155 — 2026-10-21

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Bottle note counting #106](https://github.com/dadofluca/Lucas-Growth-Guide/pull/106)

- Typed care entry now understands “Bottle, 8 oz” as one quantified bottle. The manual form also recognizes an exact standalone bottle-and-ounces note and previews that it will count before Save. Selected amounts and categories take precedence; deliberately clearing an existing amount during editing is respected. Ambiguous manual notes are left as notes.
- Both bottle shortcuts were tested and already save structured ounces correctly. Read-only diagnosis found the reported entry came from manual entry; its missing amount had already been corrected. No family records were modified for this release.
- **285 Node + 101 Chromium checks passed**, zero failed/flaky/skipped. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39657022220) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39657022225). Covered typed/manual/both shortcut entry paths, totals, reopening, conservative inference and explicit amount precedence. Reviewed the final 390px bottle card.
- Public app/demo serve **P155** and all three changed runtime files match tested bytes. Reopen the app without clearing storage. Actual signed-in iPhone interaction and a second production phone remain separate confirmations.

## Previous release: P154 — 2026-10-20

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Family idea discussions #105](https://github.com/dadofluca/Lucas-Growth-Guide/pull/105)

- More → Family Ideas → Discussion opens comments under each idea, with names, times, a reply box and deletion of your own comments. Shared/private visibility follows the original idea. Earlier replies can be loaded; failed posts keep their draft and a lost response can be retried without duplicates. Open discussions refresh with the board. Comments do not send push alerts or grant agent/build approval.
- The preferred rolling time picker from P153 remains, with save-time preview, a picker commit handoff and navigation to the edited card.
- **280 Node + 99 Chromium checks passed**, zero failed/flaky/skipped. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39529737097) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39529737026). Reviewed the final 390px discussion layout; transaction-only database checks passed privacy, author/time integrity, own deletion and duplicate protection.
- Public app/demo serve **P154** and all eight runtime file comparisons match tested bytes. Reopen the app without clearing storage. Actual iPhone wheel interaction and a second phone remain separate confirmations.

## Previous release: P153 — 2026-10-20

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Rolling picker #104](https://github.com/dadofluca/Lucas-Growth-Guide/pull/104)

- Restores the preferred native rolling care-time picker. Save waits for queued picker changes before reading the final value, prevents repeat taps and retains incomplete edits. The preview, saved-time confirmation and edited-card navigation remain.
- **280 Node + 97 Chromium checks passed**, no failed/flaky/skipped checks. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39526481662) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39526481637). Phone layout reviewed; public app/demo serve P153 and all five changed runtime files match tested bytes. Physical iPhone wheel behavior remains a separate confirmation.

## Previous release: P152 — 2026-10-20

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Explicit edit times #103](https://github.com/dadofluca/Lucas-Growth-Guide/pull/103)

- Manual care edits use a 12-hour clock and separate AM/PM choice, with an exact save-time preview. Save confirms the date/time and brings the edited card into view, including in History when its date changes. Quick logging is unchanged.
- Repeated evening bottle edits, caregiver changes, reloads, previous-day moves and delayed sync responses pass. **279 Node + 96 Chromium checks passed**, zero failures/flakes/skips. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39512372040) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39512372045). Final 390px time controls and preview reviewed.
- Public app/demo serve **P152**; all five changed runtime files match tested SHA-256 bytes. No production entries were changed, merged or deleted. The user's eventual 6:30 PM save is intact; earlier 6:30 AM attempts remain untouched. Physical iPhone interaction still needs confirmation. Reopen the app without clearing local storage.

## Previous release: P151 — 2026-10-20

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Caregiver names #102](https://github.com/dadofluca/Lucas-Growth-Guide/pull/102) · [Alert choices #101](https://github.com/dadofluca/Lucas-Growth-Guide/pull/101)

- More → Family → Caregiver names adds a reusable name for the family, including someone without an app account. Names appear in quick care, manual entry/edit, sleep suggestions and schedule coverage. Saved names survive reopening; duplicate names are prevented and family changes clear the previous family's names.
- More → Notifications independently controls next-bottle reminders, family chat, low supplies and new bottles/diapers/sleep/other care entries. Tap Save notification choices. New care categories start off; own entries and routine edits stay quiet. The all-alert quiet-hours option also covers care updates.
- Final **275 Node + 95 Chromium checks passed**, no failures/flakes/skips. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39476750028) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39476750004). Final caregiver and alert settings phone layouts reviewed. Additive caregiver/preference schema passed rollback-only family isolation and persistence checks.
- Public app and practice page both serve **P151**; all eight runtime file comparisons match the tested version.
- The notification worker is deployed. A scheduled bottle reminder was accepted by the push provider at 2:35 PM Eastern on October 20. Physical iPhone display remains a separate confirmation; no debug messages or purchases were sent. Reopen the app for updates without clearing local storage.

## Previous release: P149 — 2026-10-20

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Sleep and notification repair #100](https://github.com/dadofluca/Lucas-Growth-Guide/pull/100)

- History shows known wake-up counts and awake minutes without opening Edit, including a recorded zero; missing answers stay unknown.
- Automatic push checks no longer fail on an unresolved clock in an older sleep note. Stale inferred bedtime notes no longer pause every future feed, while explicit ongoing sleep and quiet hours still pause reminders.
- **271 Node + 93 Chromium checks passed**, no failures/flakes/skips. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39470103756) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39470103681). Phone-sized History screenshot reviewed. App/demo serve P149 and all five changed runtime files match tested bytes.
- Backend v2 is deployed; multiple real scheduled checks returned HTTP 200 instead of 500. The user confirmed their manual phone test arrived; a due automatic alert appearing on the physical phone remains a separate check. Existing subscriptions and care records are unchanged. Push categories remain next bottle, family chat and low supplies—not all care entries.

## Previous release: P148 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Notifications and product links #99](https://github.com/dadofluca/Lucas-Growth-Guide/pull/99)

- More → Notifications offers per-phone feed, family-chat and low-supply alerts. Feed reminders use the existing daytime rhythm, pause for logged sleep/quiet hours, and reset on a new bottle. Chat groups recent messages and keeps previews off by default.
- Supplies → Choose product saves the exact item, size/variant, secure product/checkout link and optional family buyer. Low-stock alerts open the saved store link; ordering stays with the person at the store. Offline status changes stay scoped to their family and retry without losing the pending change.
- On iPhone, open the Home Screen app, tap Enable on this phone, allow notifications, then tap Test this phone. Every person opts in on their own device. A browser test cannot grant this permission or prove real Apple delivery.
- **268 Node + 92 Chromium checks passed**, with no failures or flakes. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39362804898) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39362804969). Source `76bb057b32d17f265caaf1b16ff640eacffe3ebc`, CI `03fcd241e396962dd773c923159c5a34a97b02aa`, release merge `83328cc687bd9b24ea5d3013aa3c517ccf01160a`; identical source tree. Phone screenshots and all 23 public runtime byte comparisons verified; app/demo both serve P148.
- The background function, private subscriptions/queue/receipts and minute scheduler are deployed. Rollback-only database isolation tests, encryption/VAPID checks and authenticated empty-dispatch smoke checks passed. No real subscription was seeded, and no purchase was made. Actual signed-in iPhone delivery and a second production device remain manual checks.
- New notification/product state is family scoped. [Family portability](docs/FAMILY_PORTABILITY.md) records the remaining blank-family onboarding, configuration/cache work and native/App Store requirements. P148 adds no destructive reset or clone of live family history. Account/dashboard login and Teddy key work remain deferred.

## Previous release: P147 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Profiles, themes, rewards and Star controls #98](https://github.com/dadofluca/Lucas-Growth-Guide/pull/98)

- Tap a Family Chat name/avatar or Family profile to see their bio and earned calling cards/cosmetics. Personal light themes include three free palettes, Field Notes for first saved care, Aurora Protocol for two existing discoveries, and Golden Hour for Quiet Legend.
- Quiet Legend recognizes 5 care records across 3 days credited by another verified family account. It appears before that caregiver opens the app, without changing spendable Stars, requiring visits or claiming to measure screen time.
- Add/remove Stars with receipts. Database authorization blocks self adjustments and identity relinking; verified Sam may adjust anyone. Display-name/caregiver-picker changes never grant permission.
- Intro Skip has an opaque background, high-contrast text and larger tap target. Chat preserves the latest-message or older-reading position through viewport/keyboard reflow.
- **256 Node + 88 Chromium checks passed**, zero failures/flakes. Reviewed final phone layouts before merging. Final source `af5f823841fdd5c3685865036eddc99e24f0a3ef`, CI checkout `cefd0355445e7b1c0b8e096721f5f6fc2f609c63`, merge `05b39fec64000d2b1d1d689074203963d7eef7ea`; matching tree `0dfe6bcd9ad8da3aa6c2493ff4d174bc5ede6cbb`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39359507442) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39359507440).
- Deployed and transaction-tested family database access hardening, preserving legitimate family reads/saves/edits/deletes and private chat media. Account-wide dashboard settings and Teddy key configuration remain unverified pending authenticated access. Actual signed-in iPhone/PWA, second family device and Muse ingestion remain external checks. Reopen/reload without clearing storage.

- Public app and practice playground verified P147; all 32 file byte comparisons match the tested runtime. Final release-note updates change documentation only.

## Previous release: P146 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Family Ideas and Star chart #97](https://github.com/dadofluca/Lucas-Growth-Guide/pull/97)

- Family Ideas shows profile/submitted names and a distinct unnamed account when an older device has no name. New posts include Posting as. A Home lightbulb counts unread family submissions; votes can be switched or removed and do not authorize changes.
- Sam’s database-authorized build desk records decisions and replies. Submitters receive each review revision in their own Your updates inbox when the app is opened or refreshed. These are in-app notices, not iPhone push. Private posts remain author-only and never enter agent exports.
- No AI repair worker is connected. Sam can export open, author-approved family posts for review. The intended protocol is proposal → Sam approval → tested PR → Sam publication approval. See [the protocol](docs/FAMILY_IDEAS_PROTOCOL.md) for current behavior and the future personal Build mode requirements.
- Star chart opens to everyone’s balances. Tap a person for their reward goal and receipts; choose Everyone to return. All values use the existing shared Star ledger.
- **250 Node + 83 Chromium checks passed**, zero failures/flakes/skips. Final phone layouts reviewed before merging. Final source `f0eb08ffea35f07f0109c80a3232f7c9cc0a021a`, CI checkout `526b1f8900f809abdd92be948951d5bb3f1de610`; release merge `243a1e9da9291fd42e5b8f632fded2b7c8e9f42f`; identical tree `d1888cf8a392160d270f40209b64cccd9a858942`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39356207758) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39356207796).
- Additive voting/review schema and an explicit Sam manager grant are deployed. Transaction-only RLS tests passed and every sample was rolled back. No real care records or old suggestions were changed. Physical signed-in iPhone/PWA, second family device and Muse ingestion remain external checks. Reopen/reload without clearing local storage.

- Public app and friend demo verified P146; all 29 SHA-256 file comparisons matched the tested runtime and current protocol/playbook. Evidence: artifacts/p146-public-verification.json. Final release-note edits are documentation only.

## Previous release: P145 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Bedtime and shared names #96](https://github.com/dadofluca/Lucas-Growth-Guide/pull/96)

- Start Night sleep with Still asleep selected. Save the real bedtime now; wake time, wake-ups and minutes awake remain TBD. A red reminder survives midnight and opens the same entry to add the actual wake time in the morning. Unknown wake-up counts may stay blank. Unfinished sleep never inflates completed sleep totals or daytime bottle spacing.
- Type Sam and Maddie (or use commas, & or +) to credit separate caregivers. Existing event IDs, offline retry and Undo stay on the shared care queue.
- **246 Node + 80 Chromium checks passed**, zero failures/flakes/skips. Final source `c262951b36be08d90077a46645002317412a385d`, CI checkout `255601335409c841a0613c4811fabecc9a9a5ce7`, merge `4bd234d9fd748fbca2850d16598ec692b06a47b3`; identical tree `f494d1e6e71c665949b768fc0b4073112ba721ed`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39354333349) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39354333293). Reviewed final phone screenshots before merging. Exact evidence and source owners are in DEVELOPER_HANDOFF.md.
- No production records or schema changes. Physical signed-in iPhone/PWA, second family device and Muse ingestion remain external checks. Reopen/reload without clearing local storage.

- Public app and friend demo both verified P145; all 26 file byte comparisons match the tested runtime and current playbook. Release-note commits change documentation only.

## Previous release: P144 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Shared caregivers and personal updates #95](https://github.com/dadofluca/Lucas-Growth-Guide/pull/95)

- Caregiver buttons now add/remove people during both logging and editing. Removed the legacy edit-mode listener that cleared previous selections; highlights and pressed states restore from the saved people array. One shared event keeps its stable ID and single intake total.
- Each age chapter has three ideas (12 total), a fresh daily selection, Another idea and Previous controls. Rotation follows the local calendar and works offline without a model key.
- The ✦ side bubble and More → Your updates collect your unlocked calling cards and selected caregiver's Star receipts, bonus invitations and ready rewards. Read marks persist on this device for the specific family/baby/user/person. Undo removes revoked Star receipts; notifications never award Stars themselves.
- Fresh out of the chaos lab is a compact release brief, opened from a dismissible teaser or the inbox. It explains the actual new features without interrupting typing or asking for push permission.
- **242 Node + 78 Chromium checks passed**, zero failures/flakes/skips. Source `3c8b8f31a4c5dea6d96542d4fba7c13f03a9b3a4`, CI checkout `6476f2f7d802f983e5fe7965e7f0b4a18c04923a`, merge `f41f40d2b030b6b29f8b6214f71ad7cf64e1c832`; identical tree `d7a40adfed0f80184dca9b70fb4358d361e2c7a6`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39352038605) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39352038604). Reviewed phone screenshots before merging. See DEVELOPER_HANDOFF.md for exact artifacts and source owners.
- No production records, schema or access policies changed. Actual signed-in iPhone/PWA, second production family device and Muse ingestion remain external checks. Reopen/reload without clearing local storage.
- Public app and practice app both serve P144; all 26 file byte comparisons matched the tested runtime and current playbook. Final release notes are documentation only.

## Previous release: P143 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Chat and Insights #94](https://github.com/dadofluca/Lucas-Growth-Guide/pull/94)

- Family Chat gives the conversation the usable phone screen, with compact avatars/banners and a growing one-line composer. Add a photo, GIF or video with the small ＋ button, remove an attachment before sending, and keep multiline messages. Refresh preserves your reading position; Latest messages takes you back down. Unchanged polling retains video/message nodes. The composer responds to the visible viewport and safe areas; practice chat identifies its sample messages.
- Insights shows recorded ounces over seven calendar days, usual bottle size, qualified daytime spacing, shared-care and food moments. Missing bottle days stay unknown, and today is marked partial. Same-clock intake comparisons require three prior days with at least two recorded bottles by that time. Stars and duplicate IDs do not inflate care patterns.
- Browse 9–12 month play chapters with small, optional ideas and personality-aware humor. These are broad age chapters, not measured milestone deadlines. Source inspiration is linked to ZERO TO THREE. No Teddy model key is required.
- **236 Node + 75 Chromium checks passed**, with zero failures/flakes/skips. Source `4e9212eef67d50adb45723c6a9252a8d99d2dbbf`, CI checkout `3a67e1ecec7ab5acae3f2e75fa5697d8a4ec5791`, release merge `39034f527985cef1b2666add5fec5a68fedd3538`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39343603141) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39343603110). Reviewed final 390px chat, 320px reduced viewport and selected age chapter screenshots before merging. Exact runtime tree: `0077181f3f21df683ed2a444ea9de229951cb5e6`.
- Family history, access policies and private-key configuration are unchanged. Actual signed-in iPhone/PWA keyboard, second production family device and Muse ingestion remain external checks. Reopen/reload without clearing local storage. See AGENTS.md and the newest DEVELOPER_HANDOFF.md section for evidence and owning files.
- Public app and practice app both serve P143, with all 24 runtime byte comparisons matching the tested files. Documentation-only commits preserve that runtime.

## Previous release: P142 — 2026-10-19

[Live app](https://dadofluca.github.io/Lucas-Growth-Guide/) · [Friend practice playground](https://dadofluca.github.io/Lucas-Growth-Guide/demo.html) · [Shared care, Baths and Stars #93](https://github.com/dadofluca/Lucas-Growth-Guide/pull/93)

- Share one event between people: optional Share credit in quick bottle/diaper pickers, multi-select people in Smart Entry and manual care. Everyone selected gets care credit; intake and event counts stay single.
- Baths, showers and wash-ups are care events worth 2 leaderboard points per credited caregiver. Bath has a home shortcut and a new Suds & Regrets banner.
- More → Star chart tracks family awards, reasons, reward targets, redemption and Undo. KJ starts with a saved opening balance of 33. Grown-up side quests offer one-time bonus stars; children’s charts use manual awards. Stars sync through the existing offline queue, with receipts, and stay out of care totals, sleep and care History. Full history pagination preserves old opening balances as records accumulate.
- KJ is available for family sign-in, quick/manual care, Smart Entry attribution and schedule coverage. Saved caregiver credit survives editing and reload.
- Luca is also selectable in caregiver pickers. Mentions of baby Luca in notes do not automatically change caregiver credit; “Nona gave Luca 8 oz” retains Nona.
- Bottle estimates and Insights share daytime spacing: recorded/inferred naps and night sleep, partial sleep boundaries and overnight gaps (9 PM–6 AM local) are excluded. Up to 12 qualifying 45–360-minute intervals from the last seven days inform the estimate; genuine longer daytime spacing remains valid. No qualifying intervals means an explicit temporary 180-minute fallback. Existing history stays unchanged.
- A fresh phone's missing session opens family-code sign-in. Family sync stays reachable in the header and More menu; retries keep an open form visible, wrong codes show an inline error, and the chosen caregiver survives reload. Enter the family code, choose a name (or Other), and tap Connect this phone.
- Muted stone/sage light surfaces and readable controls; compact quick care and searchable History stay on the shared care queue.
- Fixed natural-language solids entry: a food description ending with “fed by Nona at 12:45” stays one solids entry, retains the stated time and full visible description, and does not invent an extra bottle. Removing unwanted candidates no longer leaves a hidden save blocker. Both confirmation surfaces share actions/validation, show missing choices, and invalidate stale candidates when a draft changes. Existing incorrect saved records require Edit; no historical timestamps/details are silently rewritten.
- Clear bedtime/wake narratives and abbreviated naps count as labeled, editable inferred sleep windows. Source notes remain intact; confirmed times take precedence and linked windows count once.
- Original portrait artwork and character names in chat/profiles, 24 calling cards, four easy starters, mastery, classified discoveries and optional soft clicks/surprises.
- Friend playground opens as Test Pilot with sample records. Care edits/deletes, chat, profiles and schedules stay in isolated browser storage. Reset clears only practice data. Copy its link from Profiles → Tools & support → Friend test link; no family password is needed.
- Schedule day cards use actual calendar keys, so translated labels and weeks spanning New Year open and save the correct day. Work rows remain separate from editable coverage.
- `node agents/doctor.mjs --run` produces machine-readable health and next-assistant instructions. Browser reports must match the checked-out commit and a clean tracked worktree; missing, invalid, stale or empty supplied evidence is actionable, never a pass. Existing scheduled checks upload exact failures, test locations, owning files, screenshots and reproduction commands. Start with AGENTS.md, DEVELOPER_HANDOFF.md and docs/AGENT_PLAYBOOK.md.
- **232 Node + 73 Chromium checks passed**, with zero failures, skips or flakes, for source `672ad57c43eb7d1af3661b72abfde21f69f0a67c` (CI checkout `23d1df741852bdcee62449c93c773ec18b416d1b`). [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39331038359) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39331038421). Public P142 app/demo and 24 file SHA-256 comparisons matched the tested release; reviewed 390px KJ/Bath and 320px adult Stars captures. Source, tested checkout and release merge have identical trees.
- One requested KJ opening-star record was initialized; existing care history and access policies were preserved. Actual signed-in iPhone Safari, a second production family device and Muse ingestion remain external checks. Older release notes below are historical.

## P132 care-sync release — 2026-10-18
- Previous baseline: main P130 (`95526b57c674622965b150564b2b467651eaed7b`). This candidate incorporates the tested P131 Quick Bottle work and P129 form-obstruction rules without merging obsolete conflicting branches.
- One `care-sync.js` repository now handles manual, Smart Entry, quick/dock bottle and morning sleep writes. Stable UUID primary keys make a retry recover the same row after a lost response. Pending edits remain in local storage and retry against the original shared row.
- Refresh uses one shared in-flight operation and merges against the queue after the response. New logs, in-flight edits and confirmed deletes are protected against stale read responses. Request deadlines release failed operations for retry.
- Quick Bottle: 4/5/6/7/8 oz logs the current time immediately; no native text prompt or separate time dialog. History Edit opens the visible Today composer, with ounces/time/caregiver fields and Undo. Poop size/wetness restore while editing.
- The visible P132 marker supplies `window.LUCA_PATCH`; runtime no longer hard-codes P87. Worker and script cache identities advance together. Tap the timeline status to retry; reconnecting or reopening refreshes automatically.
- Verification before PR: **166 Node checks passed**, including 17 behavioral repository tests for lost responses, offline edits/retry, simultaneous refresh/save, restart, family switching, Undo and delete races. Safe preview packaging and asset checks passed. Authenticated browser tests use a synthetic backend; no tests write real family records.
- **Verified:** 166 Node checks and all 42 Chromium browser checks passed on `eb82d35c50dfc61b84ea509f9f56be5697b7124a`. [Code checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39134789933) · [Browser checks](https://github.com/dadofluca/Lucas-Growth-Guide/actions/runs/39134789797). The final release-handoff commit changes documentation only. [Release PR #82](https://github.com/dadofluca/Lucas-Growth-Guide/pull/82) records the final merge and publication state; GitHub Pages publishes main at https://dadofluca.github.io/Lucas-Growth-Guide/. Actual signed-in iPhone Safari and two-device family validation remain unverified. No schema, family records, schedules or messages were edited.

## P89 release milestone — 2026-10-17
- PR #35 squash-merged into main at `1ed07729d125bfb381911ae41416d5b671e83c9d` after green agent prototype and Chromium browser smoke checks.
- Restored high-contrast left menu and compact five-button mobile navigation, plus enlarged-text / Display Zoom-like viewport regression coverage and reduced-motion handling.
- Added `.github/workflows/scheduled-ui-audit.yml`: daily UTC 11:17 scheduled synthetic Chromium browser audit with failure artifacts; workflow execution after merge is not yet verified. This does **not** constitute production Safari/device monitoring or automatic fixes.
- Next: Family Chat delayed-session synthetic checks, multiple phone-size matrix, version indicator consistency, and screenshot comparisons. No real family records changed.

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
- **2026-10-17 (family profiles):** Applied family_profiles migration (success). Added Family tab with display-name/bio editor, five emoji preset avatars, family profile list and visible-app heartbeat-based last-active display. Added static regression tests. Not merged/deployed to live PWA; signed-in two-user RLS and iPhone testing pending. Photo uploads, notification settings, push chat and profile auto-provisioning remain future work. Chat database migration was applied earlier, but live UI not yet deployed.
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

## Chat handoff — 2026-10-17 (P87/P88 continuation)
- User confirmed GitHub and Supabase are connected and explicitly requested that future ChatGPT sessions read this README and keep it updated as a durable handoff.
- Latest user screenshots report P87 merged to main with compact Today home, centered navigation, bedtime duplicate protection, Family Chat preview, and photo/GIF/video attachments. **These claims have not been independently deployment-tested in this session.**
- P88 is PR #33 (`https://github.com/dadofluca/Lucas-Growth-Guide/pull/33`): improved illustrated SVG avatar details and selected avatar beside name/timestamp in Family Chat. Screenshot reports agent tests passing, browser checks pending, and P88 unmerged. Verify current PR/CI state before merging.
- User strongly prefers rich, expressive, humorous, almost 3D game-character avatar artwork rather than flat simplified SVG tokens. Preserve each caregiver's selected avatar key; upgrade assets separately after reliable integration.
- Priorities: verify deployed build/version (user still saw P75), fix mobile cache/version indicator, finish avatar chat integration, right-side slide-out as family-chat quick preview with unread cue, consolidate home input/timeline spacing, strengthen chat media and notifications. Preserve existing baby events, schedules, messages and profiles.
- README contains older agent-operation milestones and historical progress entries; treat each as dated, not proof of present state. Audit actual main, open PRs, CI and Supabase before any production action.
- Next assistant should read README, inspect PR #33 and deployed version, work via branch/PR with tests, and append verified results to this handoff. Do not commit secrets or personal family records to this public repository.

## Handoff update — 2026-10-17 P88 merged
- **Verified:** PR #34 (`https://github.com/dadofluca/Lucas-Growth-Guide/pull/34`) squash-merged into main as commit `50ccb2dbe9dd4d122b144f34370c3c4dd8b7aa75` after both GitHub Actions workflows (`Agent prototype tests`, `Browser smoke checks`) passed on the PR head `d8838b918e799f5854c1a087e43cb469b6bd434f`.
- P88 delivers Family Chat saved avatar alongside sender name/timestamp, more layered SVG avatar presets, and `agents/p88-chat-avatar.test.mjs`. Original PR #33 was blocked by branch divergence; #34 integrated changes on updated main.
- Supabase project `znhqaqvocexjsnklnqre` checked ACTIVE_HEALTHY; RLS enabled on public tables. Read-only inspection showed 141 baby events, 89 schedule records, 3 family chat messages, 2 family profiles. **Do not publish real family content.** Security advisors flag callable SECURITY DEFINER functions and other advisories; investigate before modifying permissions.
- **Not verified:** deployment propagation, iPhone PWA service worker/cache, signed-in multi-user chat, rich-media playback on device. Do not equate merged code with confirmed live device behavior.
- **Next:** investigate build/version showing P75, test live deployment and mobile cache, then implement richer character artwork and right-side Family Chat quick-view/unread indicators. Continue tests and README updates.

- Browser QA root cause found: `render()` still called removed `renderDrawer()`. Its ReferenceError stopped the initial script before automatic `setupSync()` and service-worker registration. Removed the obsolete call and added a startup-status assertion. The first synthetic run exposed this; passing source-shape tests had missed it.
- Phone dock regression: the relocated chat-peek button overlapped the collapsed Teddy button. Moved it above the dock and hide it while the dock is expanded, preserving both real tap targets.

- After startup resumed, browser QA exposed the obsolete P48 History decorator replacing the current accessible History UI. Removed that duplicate renderer and its old bulk-delete path. History now has one renderer and shared event edit/delete controls; the existing P99/P100 browser tests cover them.

- Visual QA after startup restoration showed the old P41 “Luca Now” card duplicating the current daily totals/next-feed section. Removed that decorator and its timer; retain the compact home and one next-feed prediction. The loaded-version browser gate asserts the obsolete card stays absent.


## 2026-10-18 P133 — live and verified
P133 is merged through PR #83 and the public app serves P133. It restores the exact detailed 42-character artwork from the original Avatar Armory, preserving saved preset keys. Family & avatars includes category filters, search, a current-character preview and a reachable Save profile action; chat uses the same portraits. Newer profile drafts survive an earlier save finishing. Short transitions respect reduced motion, optional After dark / Gentle / Off personality adds care-save jokes, and Quiet Mode covers legacy chimes. Care persistence stays in `care-sync.js`.

All 168 code checks and 45 Chromium browser checks passed; final phone screenshots were reviewed. Public asset bytes match the tested source. Actual signed-in iPhone/PWA and two-family-device delivery remain external checks. See DEVELOPER_HANDOFF.md for exact commits, CI evidence and next steps. No real family data or database schema changed in this release.


## 2026-10-18 P134 — live and verified
P134 is merged through PR #84 and verified on the public app. Soft-sage controls replace heavy navy actions in Quick menu, Chat peek and Family Ideas. Cards, forms and navigation share a lighter refined style; the Ideas form stays clear of floating utilities.

Sleep opens an explicit start/end editor for naps or overnight sleep, with optional wake-ups/awake minutes. Today/History editing and Undo preserve the event identity through the existing care queue. Insights shows logged time over 24 hours, nap counts, longest periods and 7/30-day patterns. Missing times remain unknown, and overlapping records cannot inflate totals. Original detailed avatars and optional personality/audio remain intact.

All 175 code checks and 48 Chromium browser checks passed. Settled 320/390 phone screenshots were reviewed, and public page/script/style bytes match the tested source. Actual signed-in iPhone/PWA and family-device delivery remain external checks. No real family data, database schema or authorization policies changed. See DEVELOPER_HANDOFF.md for exact commits and CI evidence.


P148 adds opt-in device notifications for bottles, chat and low supplies, plus family product/size/store/buyer choices. See More → Notifications and Supplies. iPhone delivery requires opening the Home Screen app and allowing notifications. For the fresh-family/App Store direction and remaining onboarding limits, see [Family portability](docs/FAMILY_PORTABILITY.md).
