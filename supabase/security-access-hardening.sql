-- Tighten client access without changing family membership or historical records.
revoke all privileges on all tables in schema public from anon, public;
revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;
revoke all privileges on all sequences in schema public from anon, public;
revoke create on schema public from anon, authenticated, public;

-- Future app tables/functions require deliberate grants alongside RLS.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, public;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, public;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, public;

-- These older permissive policies OR-ed with (and bypassed) newer provenance checks.
drop policy if exists "Family members can view their family" on public.families;
drop policy if exists "Members can view family members" on public.family_members;
drop policy if exists "Family members can view babies" on public.babies;
drop policy if exists "Family members can view baby events" on public.baby_events;
drop policy if exists "Family members can add baby events" on public.baby_events;
drop policy if exists "Family members can update baby events" on public.baby_events;
drop policy if exists "Family members can delete baby events" on public.baby_events;
alter policy "Family members can add babies" on public.babies to authenticated;
alter policy "Family members can update babies" on public.babies to authenticated
 using(public.is_family_member(family_id)) with check(public.is_family_member(family_id));
alter policy "family schedule read" on public.luca_schedule to authenticated;
alter policy "family schedule insert" on public.luca_schedule to authenticated;
alter policy "family schedule update" on public.luca_schedule to authenticated
 using(public.is_family_member(family_id)) with check(public.is_family_member(family_id));
alter policy "family schedule delete" on public.luca_schedule to authenticated;

-- Caregiver credit may be edited; the original account that logged it may not.
create or replace function public.guard_care_creator() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin
 if current_user not in ('postgres','service_role','supabase_admin') and new.created_by is distinct from old.created_by then
  raise exception 'The original care logger cannot be changed.' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function public.guard_care_creator() from public,anon,authenticated;
create trigger guard_care_creator before update on public.baby_events for each row execute function public.guard_care_creator();
