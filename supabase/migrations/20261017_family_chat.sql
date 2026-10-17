-- Family chat: explicit family isolation; never treated as baby care events.
create table if not exists public.family_chat_messages (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists family_chat_messages_feed_idx on public.family_chat_messages(family_id,created_at desc);
alter table public.family_chat_messages enable row level security;
revoke all on public.family_chat_messages from anon;
grant select,insert on public.family_chat_messages to authenticated;
create policy family_chat_read on public.family_chat_messages for select to authenticated
 using (exists (select 1 from public.family_members fm where fm.family_id=family_chat_messages.family_id and fm.user_id=(select auth.uid())));
create policy family_chat_send on public.family_chat_messages for insert to authenticated
 with check (sender_id=(select auth.uid()) and exists (select 1 from public.family_members fm where fm.family_id=family_chat_messages.family_id and fm.user_id=(select auth.uid())));
comment on table public.family_chat_messages is 'Private family-only text messages. Never ingest as care logs without explicit separate confirmation.';
