create table public.family_caregivers(
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 name text not null check(length(name) between 1 and 40 and name=btrim(name) and name !~ '[<>,;+&[:cntrl:]]'),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create unique index family_caregivers_name on public.family_caregivers(family_id,lower(regexp_replace(name,'\s+',' ','g')));
alter table public.family_caregivers enable row level security;
revoke all on public.family_caregivers from public,anon,authenticated;
grant select,insert on public.family_caregivers to authenticated;
grant all on public.family_caregivers to service_role;
create policy "family caregiver names" on public.family_caregivers for select to authenticated using(public.is_family_member(family_id));
create policy "members add caregivers" on public.family_caregivers for insert to authenticated with check(public.is_family_member(family_id) and created_by=(select auth.uid()));
