# Optional personalization and family gallery — proposal only

## Seasonal and caregiver personalization
- Store per-user theme preferences separately from shared baby-care events.
- Offer seasonal accent art, never change placement or meaning of care controls.
- Respect reduced-motion and high-contrast settings; offer a plain theme and manual override.
- Do not infer sensitive attributes or personalize based on private health data.
- Keep app fast: cache tiny decorative assets and lazy-load everything else.

## Private family gallery (not implemented)
- Opt-in, off by default. Family members explicitly choose uploads.
- Private Supabase Storage bucket; no public bucket or permanent public URLs.
- Membership-checked RLS for upload, list, read and delete, including family revocation.
- Prefer server-side EXIF/GPS metadata removal and image-size limits before storing.
- Avoid facial recognition, AI training, automatic contact sharing or public links.
- Separate gallery permissions from care-record permissions if needed.
- Provide deletion, retention and backup expectations; avoid making claims of guaranteed deletion from third-party caches.
- Test cross-family access denial and expired membership before release.

## Rollout
1. Implement seasonal themes locally with accessibility tests.
2. Add explicit caregiver preference storage with strict RLS.
3. Prototype gallery behind opt-in feature flag; security review before production.
