# Emergency recovery: staged implementation

1. **Capture:** `emergency.html` records time-stamped notes in localStorage; users can export original JSON. This works independently of Supabase while the page is cached.
2. **Review:** users select notes and can edit descriptions. A separate reviewed JSON export is produced. Raw notes remain on the device; no automatic synchronization is claimed.
3. **Validate:** `agents/recovery-manifest.mjs` rejects unreviewed records, invalid timestamps and repeated source IDs. No automatic inserts are allowed.
4. **Server protection:** proposed unique partial index `baby_events_emergency_source_unique` prevents duplicate source IDs per baby when an import writes `details.emergency_source_id`. This migration is **not applied**.
5. **Still required:** authenticated importer with baby/family authorization, splitting compound notes into separately approved events, server-side idempotent insert and verified reconciliation history. No automatic history recovery is enabled.
6. **Tests:** emergency fallback syntax, local-storage independence, cache preservation, and manifest validation run in GitHub CI. Real offline iPhone behavior and multi-user recovery are not yet verified.

Do not merge this development branch into production without QA and a review of the database authorization model. Never mark emergency entries as recovered until the server confirms their insertion.
