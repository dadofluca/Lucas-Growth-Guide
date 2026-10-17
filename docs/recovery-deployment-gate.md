# Recovery deployment gate

The `commitApprovedRecovery` function is a development-stage browser client helper. It is **not wired to the app** and must not be enabled in production before:

1. Apply and verify `supabase/migrations/20261017_emergency_import_dedupe.sql`. The unique index on `(baby_id, details.emergency_source_id)` is required to close races between devices. Do not apply without a production backup and authorization review.
2. Verify `babies`, `family_members`, and `baby_events` RLS policies with two different authenticated families. An in-browser membership query alone is not an authorization boundary.
3. Verify the insert row shape matches live defaults for `tags`, `details`, and `caregivers`.
4. Test duplicate retries, concurrent imports, partial failures, offline recovery, compound note splitting, timezone corrections, and mismatched user sessions.
5. Provide a user-facing recovery confirmation screen and a receipt for every imported/previously imported record.
6. Do not delete local backups automatically after successful import.

The current helper inserts one row at a time and is **not atomic for a batch**. A failure can leave a partially imported batch; preserve the export and reconcile with source IDs. It is not safe to describe this as transactional.
