-- No baby_events rows are written: the deployed trigger runs on a temporary clone.
begin;
select set_config('luca.star.sam',gen_random_uuid()::text,true),set_config('luca.star.nona',gen_random_uuid()::text,true),set_config('luca.star.stranger',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('luca.star.sam')::uuid,'authenticated','authenticated'),(current_setting('luca.star.nona')::uuid,'authenticated','authenticated'),(current_setting('luca.star.stranger')::uuid,'authenticated','authenticated');
select set_config('luca.star.family',gen_random_uuid()::text,true),set_config('luca.star.baby',gen_random_uuid()::text,true);
insert into public.families(id,name,join_code) values(current_setting('luca.star.family')::uuid,'Temporary Star guard fixture',gen_random_uuid()::text);
insert into public.babies(id,family_id,name,birthday) values(current_setting('luca.star.baby')::uuid,current_setting('luca.star.family')::uuid,'Temporary fixture','2026-01-01');
insert into public.family_members(family_id,user_id,role) values(current_setting('luca.star.family')::uuid,current_setting('luca.star.sam')::uuid,'owner'),(current_setting('luca.star.family')::uuid,current_setting('luca.star.nona')::uuid,'member');
insert into public.family_idea_managers(family_id,user_id) values(current_setting('luca.star.family')::uuid,current_setting('luca.star.sam')::uuid);
insert into public.family_star_identities(family_id,user_id,person) values(current_setting('luca.star.family')::uuid,current_setting('luca.star.nona')::uuid,'Nona'),(current_setting('luca.star.family')::uuid,current_setting('luca.star.sam')::uuid,'Sam');
create temp table star_guard_fixture(like public.baby_events including defaults);
grant select,insert,update,delete on star_guard_fixture to authenticated;
create trigger guard_stars before insert or update or delete on star_guard_fixture for each row execute function public.guard_star_changes();
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('luca.star.nona'),true);
do $$ begin
 if (select count(*) from public.family_star_identities where family_id=current_setting('luca.star.family')::uuid)<>2 then raise exception 'family identity links not visible'; end if;
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{}');
 begin
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{"starChart":{"person":" NONA ","action":"award","delta":3}}');
 raise exception 'self award allowed'; exception when insufficient_privilege then null; end;
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{"starChart":{"person":"KJ","action":"award","delta":-1}}');
 begin
 update star_guard_fixture set details='{"starChart":{"person":"KJ","action":"award","delta":100}}' where details ? 'starChart';
 raise exception 'receipt rewrite allowed'; exception when insufficient_privilege then null; end;
 begin
 delete from star_guard_fixture where details ? 'starChart';
 raise exception 'receipt delete allowed'; exception when insufficient_privilege then null; end;
 begin
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{"starChart":{"person":"Nona","action":"undo","ref":"arbitrary"}}');
 raise exception 'self undo allowed'; exception when insufficient_privilege then null; end;
 begin
 insert into public.family_star_identities(family_id,user_id,person) values(current_setting('luca.star.family')::uuid,auth.uid(),'KJ') on conflict(family_id,user_id) do update set person='KJ';
 raise exception 'self relink allowed'; exception when insufficient_privilege then null; end;
 end $$;
select set_config('request.jwt.claim.sub',current_setting('luca.star.stranger'),true);
do $$ begin
 if exists(select 1 from public.family_star_identities where family_id=current_setting('luca.star.family')::uuid) then raise exception 'nonmember identity leak'; end if;
 begin
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{"starChart":{"person":"KJ","action":"award","delta":3}}');
 raise exception 'unlinked account allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('luca.star.sam'),true);
do $$ begin
 insert into star_guard_fixture(baby_id,event_type,event_time,created_by,details) values(current_setting('luca.star.baby')::uuid,'other',now(),auth.uid(),'{"starChart":{"person":"Sam","action":"award","delta":3}}');
 update star_guard_fixture set note='Sam correction' where details ? 'starChart';
 delete from star_guard_fixture where details ? 'starChart';
 update public.family_star_identities set person='Nona' where family_id=current_setting('luca.star.family')::uuid;
 end $$;
rollback;
select 'passed: self awards/undo/relink denied; others adjustment and ordinary care allowed; receipt rewrites/deletes Sam-only; Sam self adjustment allowed; family links visible; nonmember links hidden and unlinked write denied; fixture rolled back; no baby_events writes' as result;
