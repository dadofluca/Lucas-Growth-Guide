-- Family Ideas: family-visible or author-only suggestions; agents receive no database permissions.
create table if not exists public.family_ideas (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 3 and 100),
 details text not null default '' check (char_length(details)<=2000),
 category text not null default 'idea' check (category in ('idea','bug','design','question')),
 visibility text not null default 'family' check (visibility in ('family','private')),
 status text not null default 'new' check (status in ('new','reviewing','planned','building','done')),
 created_at timestamptz not null default now()
);
alter table public.family_ideas enable row level security;
revoke all on public.family_ideas from anon;
grant select,insert,delete on public.family_ideas to authenticated;
create policy family_ideas_read on public.family_ideas for select to authenticated using (
 exists(select 1 from public.family_members fm where fm.family_id=family_ideas.family_id and fm.user_id=(select auth.uid()))
 and (visibility='family' or author_id=(select auth.uid()))
);
create policy family_ideas_insert on public.family_ideas for insert to authenticated with check (
 author_id=(select auth.uid()) and status='new'
 and exists(select 1 from public.family_members fm where fm.family_id=family_ideas.family_id and fm.user_id=(select auth.uid()))
);
create policy family_ideas_delete on public.family_ideas for delete to authenticated using (
 author_id=(select auth.uid()) and exists(select 1 from public.family_members fm where fm.family_id=family_ideas.family_id and fm.user_id=(select auth.uid()))
);
create index if not exists family_ideas_family_recent on public.family_ideas(family_id,created_at desc);
