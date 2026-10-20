-- Sam approves account-to-person links; a chosen UI caregiver is not authorization.
create table public.family_star_identities (
 family_id uuid not null references public.families(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 person text not null check(char_length(trim(person)) between 1 and 40),
 primary key(family_id,user_id),
 foreign key(family_id,user_id) references public.family_members(family_id,user_id) on delete cascade
);
alter table public.family_star_identities enable row level security;
revoke all on public.family_star_identities from anon,authenticated;
grant select,insert,update on public.family_star_identities to authenticated;
create policy star_identities_read on public.family_star_identities for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.family_idea_managers m where m.family_id=family_star_identities.family_id and m.user_id=(select auth.uid())));
create policy star_identities_insert on public.family_star_identities for insert to authenticated with check(exists(select 1 from public.family_idea_managers m where m.family_id=family_star_identities.family_id and m.user_id=(select auth.uid())));
create policy star_identities_update on public.family_star_identities for update to authenticated using(exists(select 1 from public.family_idea_managers m where m.family_id=family_star_identities.family_id and m.user_id=(select auth.uid()))) with check(exists(select 1 from public.family_idea_managers m where m.family_id=family_star_identities.family_id and m.user_id=(select auth.uid())));
create function public.guard_star_changes() returns trigger language plpgsql security invoker set search_path='' as $$
declare is_old boolean:=false; is_new boolean:=false; fid uuid; actor text; target text;
begin
 if TG_OP<>'INSERT' then is_old:=coalesce(OLD.details ? 'starChart',false) or coalesce(OLD.tags @> ARRAY['stars'],false); end if;
 if TG_OP<>'DELETE' then is_new:=coalesce(NEW.details ? 'starChart',false) or coalesce(NEW.tags @> ARRAY['stars'],false); end if;
 if not is_old and not is_new then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 if current_user in ('postgres','service_role','supabase_admin') then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 select b.family_id into fid from public.babies b where b.id=case when TG_OP='DELETE' then OLD.baby_id else NEW.baby_id end;
 if exists(select 1 from public.family_idea_managers m where m.family_id=fid and m.user_id=auth.uid()) then if TG_OP='DELETE' then return OLD; else return NEW; end if; end if;
 if TG_OP<>'INSERT' then raise exception 'Only Sam can edit or delete star receipts; use a new adjustment for another person.' using errcode='42501'; end if;
 select s.person into actor from public.family_star_identities s where s.family_id=fid and s.user_id=auth.uid();
 if actor is null then raise exception 'Sam needs to link this account to a person before it can change stars.' using errcode='42501'; end if;
 target:=lower(trim(NEW.details->'starChart'->>'person'));
 if target is null or target='' or target=lower(trim(actor)) then raise exception 'You cannot award or adjust your own stars. Ask another family member or Sam.' using errcode='42501'; end if;
 if coalesce(NEW.details->'starChart'->>'action','') not in ('award','goal','bonus','redeem','undo') then raise exception 'Only Sam can set an opening balance.' using errcode='42501'; end if;
 return NEW;
end $$;
revoke all on function public.guard_star_changes() from public,anon,authenticated;
create trigger guard_family_star_changes before insert or update or delete on public.baby_events for each row execute function public.guard_star_changes();
