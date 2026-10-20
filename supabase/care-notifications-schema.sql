-- P150: independent, per-phone care alerts. Existing subscribers start with these off.
alter table public.push_devices add column care_types text[] not null default '{}'
 check(care_types <@ array['bottle','diaper','sleep','other']::text[] and array_position(care_types,null) is null);
alter table public.notification_jobs drop constraint notification_jobs_kind_check;
alter table public.notification_jobs add constraint notification_jobs_kind_check check(kind in ('chat','supply','care'));

create or replace function luca_private.guard_push_device() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Choose a valid time zone.'; end if;
 if not exists(select 1 from public.babies where id=new.baby_id and family_id=new.family_id) then raise exception 'Baby must belong to this family.'; end if;
 if tg_op='UPDATE' then
  if (new.id,new.family_id,new.baby_id,new.user_id) is distinct from (old.id,old.family_id,old.baby_id,old.user_id) then raise exception 'Device ownership cannot change.'; end if;
  new.created_at=old.created_at;
  if (new.enabled,new.feed_enabled,new.chat_enabled,new.supplies_enabled,new.care_types,new.previews,new.quiet_all,new.quiet_start,new.quiet_end,new.timezone)
   is distinct from (old.enabled,old.feed_enabled,old.chat_enabled,old.supplies_enabled,old.care_types,old.previews,old.quiet_all,old.quiet_start,old.quiet_end,old.timezone)
   then new.settings_at=now(); else new.settings_at=old.settings_at; end if;
 else new.created_at=now();new.settings_at=now();new.last_chat_read_at=now();new.last_chat_notified_at=now(); end if;
 return new;
end $$;
revoke all on function luca_private.guard_push_device() from public,anon,authenticated;

create function luca_private.queue_care_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if 'stars'=any(coalesce(new.tags,'{}')) or new.details ? 'starChart' then return new; end if;
 insert into public.notification_jobs(family_id,kind,source_id,actor_id,expires_at)
  select b.family_id,'care',new.id,new.created_by,now()+interval '15 minutes' from public.babies b where b.id=new.baby_id;
 return new;
end $$;
revoke all on function luca_private.queue_care_notification() from public,anon,authenticated;
create trigger notify_new_care after insert on public.baby_events for each row execute function luca_private.queue_care_notification();
