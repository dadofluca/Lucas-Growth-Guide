# Luca's Growth Guide — Personality without clutter

## Product direction
The primary Today screen must remain warm, uncluttered, readable, and predictable. No jokes should obscure event type, quantity, time, caregiver, or confirmation status. Never add unsolicited animation or sound to a critical error or medication confirmation.

## Per-user preferences
- Humor level: Off / Gentle / Goofy / Dark (opt-in). Defaults to Gentle for every account; do not infer a person's taste from their identity.
- Sounds: Off / Subtle / Silly (independent of humor). Default Subtle; respect device mute and reduced-motion preferences.
- Theme: Clean / Seasonal / Custom. All themes maintain accessible contrast and button sizes.
- Avatar: Cute / Goofy / Absurd / Personal photo (photo upload requires private storage, secure authorization, size validation, and deletion support).
- Each user can preview and change preferences. Other family members' preferences never override the local viewer's experience.

## Confirmation message behavior
Always show factual confirmation first (e.g., 'Poop diaper saved · 10:42 AM · Sam'), then optionally a single rotating joke beneath it. Do not joke about real injury, death, or illness as fact. Humor must never appear on failed saves.
Examples:
- Gentle: 'Fresh diaper, fresh start.'
- Goofy: 'Diaper meteor intercepted. Planet saved.'
- Dark (opt-in): 'Biohazard contained. The cleanup crew requests hazard pay.'
- Bottle goofy: 'Milk delivery complete. Tiny customer remains demanding.'
- Nap goofy: 'Sleep mode activated. Please do not disturb the tiny CEO.'
No joke should be confused with an actual medical warning or baby-care recommendation.

## UX safeguards
- Keep humor optional and nonintrusive.
- Never auto-play loud audio on app launch; sound feedback only after user interaction.
- Honor reduced-motion and sound-off.
- Randomize/rotate messages without repeating immediately.
- Maintain the ability to turn off effects quickly in Profile > Settings.
- Do not introduce dark jokes into Teddy's medical or safety advice.
- Future avatar artwork should be original, and the core app should work offline without downloading new media.

Status: specification only, not deployed or implemented.

## Family Comedy System — confirmation reactions and chat sharing
- Offer 👍 and 👎 on optional humorous confirmation text, separate from the factual save confirmation.
- Store ratings per signed-in user and joke identifier; allow changing/removing a vote. Do not infer a baby's health, caregiver quality, or family relationships from votes.
- Personalize the user's joke rotation using their own feedback. Aggregate family popularity only if the joke is appropriate for each viewer's humor settings.
- Show an explicit **Share to Family Chat** action on each joke.
- Automatic sharing of occasional non-sensitive comedy highlights is enabled by default for family members, with a clearly accessible per-user mute/disable control. Do not automatically share personal photos or sensitive baby-care details.
- To avoid flooding chat, automatically share only occasional standout jokes, subject to a daily cap and cooldown. New jokes may be highlighted before receiving votes; later feedback tunes frequency. Never auto-share every diaper event.
- Share the joke and an optional non-sensitive event label only. Do not expose medication details, exact feeding quantities, caregiver attribution, timestamps, or private Teddy conversations by default.
- Auto-share requires a successful persisted event, valid family membership, and a unique share key to prevent duplicates on retries.
- Votes and chat posts should fail independently of saving baby events: humor must never block care tracking.
- Allow chat recipients to hide automated jokes locally and allow senders to delete their shared jokes.
- Do not include dangerous medical claims or alarming fictional statements in a way that could be confused with real alerts.
- Agent tests should cover changed votes, cross-family isolation, disabled sharing, rate limits, retries, offline behavior, and no posting after a failed save.

Status: requirements/design only; not yet implemented or deployed.

## Engagement-first adjustment (2026-10-17)
The goal is instant delight for casual family users, not a configuration-heavy experience. Default to occasional low-volume funny chat highlights with an obvious mute switch. Keep the care UI clean, and avoid surprise loud sounds, graphic jokes, personal photos, or sensitive event details in automatic messages. Humor feedback is lightweight and optional. This remains a design specification, not a deployed feature.

## Poop-O-Meter Easter egg
- Optional 1–5 poop intensity slider in the diaper confirmation flow; do not add a required field or extra tap to quick logging.
- Labels: Tiny / Normal / Rough / Containment required / System failure. The rating is a playful subjective report, not medical advice.
- At maximum, an occasional, short, cartoon-style 'slider knob falls off track' and scattered diaper overlay may trigger; it should be rare, not on every max rating.
- Keep the underlying confirmation and correction controls readable and available. No animation that blocks saving, locks navigation, or prevents cancellation.
- Respect reduced-motion, sound-off, and an explicit 'disable surprises' preference. Keep the effect brief and non-flashing.
- If a joke is shared automatically, do not include private details about the baby's health, time, caregiver, or medical symptoms.
- Test 1–5 selection, skipping the slider, cancellation, saving, offline behavior, reduced motion, and animation cleanup.
- Status: concept/specification, not implemented.
