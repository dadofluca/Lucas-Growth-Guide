-- Review before applying to production.
-- Prevent importing the same emergency source event twice for one baby.
-- Existing rows without this marker are unaffected.
create unique index if not exists baby_events_emergency_source_unique
on public.baby_events (baby_id, (details->>'emergency_source_id'))
where details ? 'emergency_source_id'
  and nullif(details->>'emergency_source_id','') is not null;
