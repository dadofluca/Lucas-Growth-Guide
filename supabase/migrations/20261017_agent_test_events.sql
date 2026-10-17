-- Isolated Watchdog test data. NEVER add synthetic events to public.baby_events.
-- This table is not accessible to family clients and cannot affect baby totals.
create table if not exists public.agent_test_events (
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null default gen_random_uuid(),
 agent text not null default 'watchdog' check (agent = 'watchdog'),
 event_type text not null check (event_type in ('bottle','pee','poop','nap','sleep')),
 amount_oz numeric check (amount_oz is null or (amount_oz > 0 and amount_oz <= 16)),
 event_time timestamptz not null default now(),
 status text not null default 'created' check (status in ('created','verified','failed')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '7 days'),
 constraint agent_test_expiry_after_creation check (expires_at > created_at)
);
alter table public.agent_test_events enable row level security;
revoke all on public.agent_test_events from anon, authenticated;
grant select,insert,update,delete on public.agent_test_events to service_role;
create index if not exists agent_test_events_expiry_idx on public.agent_test_events(expires_at);
comment on table public.agent_test_events is 'Synthetic agent QA only; never joined into family care statistics or baby_events.';
