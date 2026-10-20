begin;
select set_config('care.test.user',gen_random_uuid()::text,true),set_config('care.test.other',gen_random_uuid()::text,true),set_config('care.test.family',gen_random_uuid()::text,true),set_config('care.test.foreign',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('care.test.user')::uuid,'authenticated','authenticated'),(current_setting('care.test.other')::uuid,'authenticated','authenticated');
insert into public.families(id,name,join_code) values(current_setting('care.test.family')::uuid,'Caregiver fixture',gen_random_uuid()::text),(current_setting('care.test.foreign')::uuid,'Other fixture',gen_random_uuid()::text);
insert into public.family_members(family_id,user_id) values(current_setting('care.test.family')::uuid,current_setting('care.test.user')::uuid),(current_setting('care.test.foreign')::uuid,current_setting('care.test.other')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('care.test.user'),true);
insert into public.family_caregivers(family_id,name,created_by) values(current_setting('care.test.family')::uuid,'Aunt Maria',auth.uid());
do $$declare denied boolean;begin
 if (select count(*) from public.family_caregivers where family_id=current_setting('care.test.family')::uuid)<>1 then raise exception 'saved name unreadable';end if;
 denied=false;begin insert into public.family_caregivers(family_id,name,created_by) values(current_setting('care.test.family')::uuid,'aunt maria',auth.uid());exception when unique_violation then denied=true;end;if not denied then raise exception 'duplicate name';end if;
 denied=false;begin insert into public.family_caregivers(family_id,name,created_by) values(current_setting('care.test.foreign')::uuid,'Foreign name',auth.uid());exception when insufficient_privilege then denied=true;end;if not denied then raise exception 'foreign write';end if;
 denied=false;begin insert into public.family_caregivers(family_id,name,created_by) values(current_setting('care.test.family')::uuid,'Forged author',current_setting('care.test.other')::uuid);exception when insufficient_privilege then denied=true;end;if not denied then raise exception 'forged author';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('care.test.other'),true);
do $$begin if exists(select 1 from public.family_caregivers where family_id=current_setting('care.test.family')::uuid) then raise exception 'foreign read';end if;end $$;
reset role;
rollback;
select 'passed: caregiver persistence, case-insensitive dedupe, family isolation and creator checks; all fixtures rolled back' as result;
