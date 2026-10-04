# Luca code map — cleanup P54

This branch keeps the current product behavior while reducing patch-on-patch ownership.

## Source of truth
- `app-config.js` — household/product defaults: caregivers, parent matching, bottle choices, schedule increments, shared theme values.
- `app-theme.css` — new canonical reusable component styles.
- `legacy-ui.css` — older style layers extracted from index without changing their order. Migrate from here gradually; do not add new rules here.
- `schedule-controller.js` — coverage create/edit/remove/revert behavior.
- `sync-fix.js` — family sync plus the current weekly schedule/history enhancements.
- `index.html` — app markup and remaining legacy visual CSS. The obsolete monthly schedule implementation has been removed.\n- `app-core.js` — core baby-log/parser/render runtime extracted intact from the page.\n- `intro.js` — cinematic intro playback/skip runtime.
- `family-pin.js` — family-device authentication.
- `sw.js` — offline/cache manifest.

## Rules for future changes
1. Do not add a second implementation of an existing feature.
2. Put household defaults in `app-config.js`, not inline arrays or times.
3. Schedule writes belong in `schedule-controller.js`.
4. New reusable styling belongs in `app-theme.css`; avoid new `!important` unless an old legacy layer makes it temporarily necessary.
5. Keep the visible patch badge and asset query versions aligned.
6. Make cleanup changes on a branch and merge only after the phone build is verified.
