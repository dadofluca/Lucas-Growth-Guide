-- P148: opt-in device delivery. No subscriptions or historical alerts are seeded.
create schema if not exists luca_private;
revoke all on schema luca_private from public, anon, authenticated;

create table public.app_notification_config (
 id boolean primary key default true check(id),
 app_url text not null,
 dispatch_token text not null default encode(extensions.gen_random_bytes(32),'hex'),
 vapid_public text,
 vapid_private text
);
alter table public.app_notification_config enable row level security;
revoke all on public.app_notification_config from public,anon,authenticated;
grant all on public.app_notification_config to service_role;
-- Deployment address only: never put a family ID, invitation code or VAPID secret in source.
insert into public.app_notification_config(id,app_url)
 values(true,'https://dadofluca.github.io/Lucas-Growth-Guide/');

create table public.push_devices (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 baby_id uuid not null references public.babies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique check(length(endpoint)<2048 and endpoint ~ '^https://([a-zA-Z0-9-]+\.)*(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)/'),
 p256dh text not null check(p256dh ~ '^[A-Za-z0-9_-]{87,88}$'),
 auth text not null check(auth ~ '^[A-Za-z0-9_-]{22,24}$'),
 enabled boolean not null default true,
 feed_enabled boolean not null default true,
 chat_enabled boolean not null default true,
 supplies_enabled boolean not null default true,
 previews boolean not null default false,
 quiet_all boolean not null default false,
 quiet_start time not null default '21:00',
 quiet_end time not null default '06:00',
 timezone text not null default 'UTC' check(length(timezone)<80),
 created_at timestamptz not null default now(),
 settings_at timestamptz not null default now(),
 last_seen_at timestamptz,
 active_view text check(length(active_view)<40),
 last_chat_read_at timestamptz not null default now(),
 last_chat_notified_at timestamptz not null default now()
);
create index push_devices_family on public.push_devices(family_id,user_id) where enabled;
alter table public.push_devices enable row level security;
revoke all on public.push_devices from public,anon,authenticated;
grant select,insert,update,delete on public.push_devices to authenticated;
grant all on public.push_devices to service_role;
create policy "own family notification devices" on public.push_devices for all to authenticated
 using(user_id=(select auth.uid()) and public.is_family_member(family_id))
 with check(user_id=(select auth.uid()) and public.is_family_member(family_id)
  and exists(select 1 from public.babies b where b.id=baby_id and b.family_id=push_devices.family_id));
create function luca_private.guard_push_device() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Choose a valid time zone.'; end if;
 if not exists(select 1 from public.babies where id=new.baby_id and family_id=new.family_id) then raise exception 'Baby must belong to this family.'; end if;
 if tg_op='UPDATE' then
  if (new.id,new.family_id,new.baby_id,new.user_id) is distinct from (old.id,old.family_id,old.baby_id,old.user_id) then raise exception 'Device ownership cannot change.'; end if;
  new.created_at=old.created_at;
  if (new.enabled,new.feed_enabled,new.chat_enabled,new.supplies_enabled,new.previews,new.quiet_all,new.quiet_start,new.quiet_end,new.timezone)
   is distinct from (old.enabled,old.feed_enabled,old.chat_enabled,old.supplies_enabled,old.previews,old.quiet_all,old.quiet_start,old.quiet_end,old.timezone)
   then new.settings_at=now(); else new.settings_at=old.settings_at; end if;
 else new.created_at=now();new.settings_at=now();new.last_chat_read_at=now();new.last_chat_notified_at=now(); end if;
 return new;
end $$;
revoke all on function luca_private.guard_push_device() from public,anon,authenticated;
create trigger guard_push_device before insert or update on public.push_devices for each row execute function luca_private.guard_push_device();

alter table public.family_supplies add column product_name text check(length(product_name)<=140),
 add column product_variant text check(length(product_variant)<=100),
 add column buyer_user_id uuid references auth.users(id) on delete set null,
 add column low_since timestamptz;
create unique index family_supplies_name_unique on public.family_supplies(family_id,lower(name));
create function luca_private.guard_supply_product() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.id,new.family_id) is distinct from (old.id,old.family_id) then raise exception 'Supply ownership cannot change.';end if;
 if new.buyer_user_id is not null and not exists(select 1 from public.family_members where family_id=new.family_id and user_id=new.buyer_user_id) then raise exception 'Choose a buyer from this family.';end if;
 if new.product_url is not null and (length(new.product_url)>2048 or new.product_url !~ '^https://[^[:space:]@]+$') then raise exception 'Use a secure product or checkout link.';end if;
 new.updated_at=now();
 if tg_op='INSERT' then new.low_since=case when new.status='low' then now() else null end;
 elsif new.status='low' and old.status<>'low' then new.low_since=now();
 else new.low_since=old.low_since;end if;
 return new;
end $$;
revoke all on function luca_private.guard_supply_product() from public,anon,authenticated;
create trigger guard_supply_product before insert or update on public.family_supplies for each row execute function luca_private.guard_supply_product();

create table public.notification_jobs (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 kind text not null check(kind in ('chat','supply')),
 source_id uuid not null,
 actor_id uuid,
 happened_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create index notification_jobs_due on public.notification_jobs(family_id,kind,happened_at);
alter table public.notification_jobs enable row level security;
revoke all on public.notification_jobs from public,anon,authenticated;
grant all on public.notification_jobs to service_role;
create function luca_private.queue_family_notification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='family_chat_messages' then
  insert into public.notification_jobs(family_id,kind,source_id,actor_id,expires_at)
   values(new.family_id,'chat',new.id,new.sender_id,now()+interval '15 minutes');
 elsif new.status='low' and (tg_op='INSERT' or old.status<>'low') then
  insert into public.notification_jobs(family_id,kind,source_id,actor_id,expires_at)
   values(new.family_id,'supply',new.id,new.updated_by,now()+interval '24 hours');
 end if;
 return new;
end $$;
revoke all on function luca_private.queue_family_notification() from public,anon,authenticated;
create trigger notify_new_chat after insert on public.family_chat_messages for each row execute function luca_private.queue_family_notification();
create trigger notify_low_supply after insert or update on public.family_supplies for each row execute function luca_private.queue_family_notification();

create table public.notification_deliveries (
 id uuid primary key default gen_random_uuid(),
 device_id uuid not null references public.push_devices(id) on delete cascade,
 event_key text not null check(length(event_key)<250),
 state text not null default 'sending' check(state in ('sending','sent','retry','failed')),
 attempts int not null default 1,
 lease_until timestamptz not null default now()+interval '90 seconds',
 next_attempt_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(device_id,event_key)
);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public,anon,authenticated;
grant all on public.notification_deliveries to service_role;
create function public.claim_notification_delivery(target_device uuid, target_key text) returns uuid
 language sql security invoker set search_path='' as $$
 insert into public.notification_deliveries(device_id,event_key) values(target_device,target_key)
 on conflict(device_id,event_key) do update set state='sending',attempts=notification_deliveries.attempts+1,lease_until=now()+interval '90 seconds'
 where notification_deliveries.state in ('sending','retry') and notification_deliveries.attempts<4
  and notification_deliveries.lease_until<now() and notification_deliveries.next_attempt_at<=now()
 returning id;
$$;
revoke all on function public.claim_notification_delivery(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_notification_delivery(uuid,text) to service_role;

create function public.ensure_default_supplies(target_family uuid) returns void
 language plpgsql security invoker set search_path='' as $$
begin
 if not public.is_family_member(target_family) then raise exception 'Family access required.' using errcode='42501';end if;
 insert into public.family_supplies(family_id,name,updated_by)
 select target_family,n,(select auth.uid()) from unnest(array['Formula','Water','Diapers','Wipes']) n
 on conflict(family_id,lower(name)) do nothing;
end $$;
revoke all on function public.ensure_default_supplies(uuid) from public,anon,authenticated;
grant execute on function public.ensure_default_supplies(uuid) to authenticated;

-- Cron authenticates with a random server-only token. It is never sent to browsers.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create function luca_private.dispatch_notifications() returns void language plpgsql security definer set search_path='' as $$
declare cfg public.app_notification_config;
begin
 select * into cfg from public.app_notification_config where id;
 -- No user has opted in: do not consume an Edge Function invocation.
 if exists(select 1 from public.push_devices d join public.family_members m on m.family_id=d.family_id and m.user_id=d.user_id where d.enabled) then
  perform net.http_post(url:='https://znhqaqvocexjsnklnqre.supabase.co/functions/v1/push-notifications',
   headers:=jsonb_build_object('Content-Type','application/json','x-notification-worker',cfg.dispatch_token),
   body:='{"action":"dispatch"}'::jsonb,timeout_milliseconds:=15000);
 end if;
 delete from public.notification_jobs where expires_at<now();
 delete from public.notification_deliveries where created_at<now()-interval '30 days';
end $$;
revoke all on function luca_private.dispatch_notifications() from public,anon,authenticated;
select cron.schedule('family-push-delivery','* * * * *','select luca_private.dispatch_notifications()');
