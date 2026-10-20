-- Transaction-only fixtures. No existing family, care or authentication row is changed.
begin;
select set_config('luca.sec.member',gen_random_uuid()::text,true),set_config('luca.sec.other',gen_random_uuid()::text,true),set_config('luca.sec.family',gen_random_uuid()::text,true),set_config('luca.sec.foreign',gen_random_uuid()::text,true),set_config('luca.sec.baby',gen_random_uuid()::text,true),set_config('luca.sec.foreignbaby',gen_random_uuid()::text,true),set_config('luca.sec.event',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('luca.sec.member')::uuid,'authenticated','authenticated'),(current_setting('luca.sec.other')::uuid,'authenticated','authenticated');
insert into public.families(id,name,join_code) values(current_setting('luca.sec.family')::uuid,'Temporary security fixture',gen_random_uuid()::text),(current_setting('luca.sec.foreign')::uuid,'Temporary foreign fixture',gen_random_uuid()::text);
insert into public.family_members(family_id,user_id,role) values(current_setting('luca.sec.family')::uuid,current_setting('luca.sec.member')::uuid,'member'),(current_setting('luca.sec.foreign')::uuid,current_setting('luca.sec.other')::uuid,'member');
insert into public.babies(id,family_id,name,birthday) values(current_setting('luca.sec.baby')::uuid,current_setting('luca.sec.family')::uuid,'Temporary fixture','2026-01-01'),(current_setting('luca.sec.foreignbaby')::uuid,current_setting('luca.sec.foreign')::uuid,'Temporary foreign fixture','2026-01-01');
do $$ declare t record; begin
 for t in select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' loop
  if has_table_privilege('anon',t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then raise exception 'anon privileges remain on %',t.relname; end if;
  if has_table_privilege('authenticated',t.oid,'TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') then raise exception 'excessive member privileges remain on %',t.relname; end if;
 end loop;
 if exists(select 1 from storage.buckets where public) then raise exception 'public media bucket'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('luca.sec.member'),true);
do $$ begin
 if not exists(select 1 from public.babies where id=current_setting('luca.sec.baby')::uuid) then raise exception 'family read denied'; end if;
 if exists(select 1 from public.babies where id=current_setting('luca.sec.foreignbaby')::uuid) then raise exception 'foreign read allowed'; end if;
 insert into public.baby_events(id,baby_id,event_type,event_time,created_by,tags,caregivers,details) values(current_setting('luca.sec.event')::uuid,current_setting('luca.sec.baby')::uuid,'poop',now(),auth.uid(),array['poop'],array['Maddie'],'{}');
 update public.baby_events set note='Temporary edit',caregivers=array['Maddie','Sam'] where id=current_setting('luca.sec.event')::uuid;
 if not exists(select 1 from public.baby_events where id=current_setting('luca.sec.event')::uuid and note='Temporary edit') then raise exception 'ordinary family edit denied'; end if;
 begin
  insert into public.baby_events(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.sec.baby')::uuid,'other',now(),current_setting('luca.sec.other')::uuid,'{}');
  raise exception 'forged creator insert allowed'; exception when insufficient_privilege then null;
 end;
 begin
  update public.baby_events set created_by=current_setting('luca.sec.other')::uuid where id=current_setting('luca.sec.event')::uuid;
  raise exception 'creator rewrite allowed'; exception when insufficient_privilege then null;
 end;
 begin
  update public.baby_events set baby_id=current_setting('luca.sec.foreignbaby')::uuid where id=current_setting('luca.sec.event')::uuid;
  raise exception 'foreign baby move allowed'; exception when insufficient_privilege then null;
 end;
 if exists(select 1 from public.family_profiles where family_id=current_setting('luca.sec.foreign')::uuid) then raise exception 'foreign profile read allowed'; end if;
 if exists(select 1 from storage.objects where bucket_id='family-chat-media' and split_part(name,'/',1)<>current_setting('luca.sec.family')) then raise exception 'foreign media read allowed'; end if;
 delete from public.baby_events where id=current_setting('luca.sec.event')::uuid;
 if exists(select 1 from public.baby_events where id=current_setting('luca.sec.event')::uuid) then raise exception 'ordinary delete denied'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('luca.sec.other'),true);
do $$ begin
 if exists(select 1 from public.babies where id=current_setting('luca.sec.baby')::uuid) then raise exception 'nonmember sees family'; end if;
 if exists(select 1 from public.family_star_identities where family_id=current_setting('luca.sec.family')::uuid) then raise exception 'nonmember sees identities'; end if;
end $$;
rollback;
select 'passed: anon and excessive grants removed; members can read/save/edit/delete own-family care; creator forgery/rewrite and foreign-baby move denied; nonmember and media isolation preserved; all fixtures rolled back' as result;
