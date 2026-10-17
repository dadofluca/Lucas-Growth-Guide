-- Family-scoped profiles, with no public access.
create table if not exists public.family_profiles (
 family_id uuid not null references public.families(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (char_length(trim(display_name)) between 1 and 40),
 bio text not null default '' check (char_length(bio)<=160),
 avatar_preset text not null default 'bear' check (avatar_preset in ('bear','fox','bunny','duck','owl')),
 last_active_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key (family_id,user_id)
);
alter table public.family_profiles enable row level security;
revoke all on public.family_profiles from anon;
grant select,insert,update on public.family_profiles to authenticated;
create policy family_profiles_read on public.family_profiles for select to authenticated
 using (exists (select 1 from public.family_members fm where fm.family_id=family_profiles.family_id and fm.user_id=(select auth.uid())));
create policy family_profiles_insert on public.family_profiles for insert to authenticated
 with check (user_id=(select auth.uid()) and exists (select 1 from public.family_members fm where fm.family_id=family_profiles.family_id and fm.user_id=(select auth.uid())));
create policy family_profiles_update on public.family_profiles for update to authenticated
 using (user_id=(select auth.uid()) and exists (select 1 from public.family_members fm where fm.family_id=family_profiles.family_id and fm.user_id=(select auth.uid())))
 with check (user_id=(select auth.uid()) and exists (select 1 from public.family_members fm where fm.family_id=family_profiles.family_id and fm.user_id=(select auth.uid())));
