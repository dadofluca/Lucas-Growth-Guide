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
