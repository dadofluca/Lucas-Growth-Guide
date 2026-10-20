-- Rollback-only identities and families. No real subscribers or store products are used.
begin;
select set_config('push.test.user',gen_random_uuid()::text,true),set_config('push.test.other',gen_random_uuid()::text,true),set_config('push.test.family',gen_random_uuid()::text,true),set_config('push.test.foreign',gen_random_uuid()::text,true),set_config('push.test.baby',gen_random_uuid()::text,true),set_config('push.test.foreignbaby',gen_random_uuid()::text,true),set_config('push.test.device',gen_random_uuid()::text,true),set_config('push.test.supply',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('push.test.user')::uuid,'authenticated','authenticated'),(current_setting('push.test.other')::uuid,'authenticated','authenticated');
insert into public.families(id,name,join_code) values(current_setting('push.test.family')::uuid,'Temporary notification fixture',gen_random_uuid()::text),(current_setting('push.test.foreign')::uuid,'Temporary other fixture',gen_random_uuid()::text);
insert into public.family_members(family_id,user_id) values(current_setting('push.test.family')::uuid,current_setting('push.test.user')::uuid),(current_setting('push.test.foreign')::uuid,current_setting('push.test.other')::uuid);
insert into public.babies(id,family_id,name,birthday) values(current_setting('push.test.baby')::uuid,current_setting('push.test.family')::uuid,'Fixture baby','2026-01-01'),(current_setting('push.test.foreignbaby')::uuid,current_setting('push.test.foreign')::uuid,'Other fixture','2026-01-01');
do $$begin
 if has_table_privilege('authenticated','public.app_notification_config','SELECT') or has_table_privilege('anon','public.push_devices','SELECT') then raise exception 'secret or anon access';end if;
 if has_function_privilege('authenticated','public.claim_notification_delivery(uuid,text)','EXECUTE') then raise exception 'client delivery authority';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('push.test.user'),true);
insert into public.push_devices(id,family_id,baby_id,user_id,endpoint,p256dh,auth) values(current_setting('push.test.device')::uuid,current_setting('push.test.family')::uuid,current_setting('push.test.baby')::uuid,auth.uid(),'https://web.push.apple.com/temporary-fixture-'||gen_random_uuid(),repeat('A',87),repeat('B',22));
update public.push_devices set feed_enabled=false,timezone='America/New_York',quiet_start='20:30' where id=current_setting('push.test.device')::uuid;
select public.ensure_default_supplies(current_setting('push.test.family')::uuid);
select public.ensure_default_supplies(current_setting('push.test.family')::uuid);
do $$declare denied boolean;begin
 if (select count(*) from public.family_supplies where family_id=current_setting('push.test.family')::uuid)<>4 then raise exception 'default supplies duplicate';end if;
 if exists(select 1 from public.family_supplies where family_id=current_setting('push.test.family')::uuid and (product_url is not null or buyer_user_id is not null or status<>'good')) then raise exception 'fresh family not blank';end if;
 denied=false;begin update public.push_devices set baby_id=current_setting('push.test.foreignbaby')::uuid where id=current_setting('push.test.device')::uuid;exception when others then denied=true;end;if not denied then raise exception 'foreign baby accepted';end if;
 denied=false;begin insert into public.push_devices(family_id,baby_id,user_id,endpoint,p256dh,auth) values(current_setting('push.test.foreign')::uuid,current_setting('push.test.foreignbaby')::uuid,auth.uid(),'https://web.push.apple.com/temporary-foreign-'||gen_random_uuid(),repeat('A',87),repeat('B',22));exception when others then denied=true;end;if not denied then raise exception 'foreign family accepted';end if;
 denied=false;begin update public.family_supplies set buyer_user_id=current_setting('push.test.other')::uuid,updated_by=auth.uid() where family_id=current_setting('push.test.family')::uuid;exception when others then denied=true;end;if not denied then raise exception 'foreign buyer accepted';end if;
end $$;
insert into public.family_supplies(id,family_id,name,status,product_name,product_variant,product_url,updated_by) values(current_setting('push.test.supply')::uuid,current_setting('push.test.family')::uuid,'Fixture product','good','Sample product','Sample size','https://store.example/product',auth.uid());
update public.family_supplies set status='low',updated_by=auth.uid() where id=current_setting('push.test.supply')::uuid;
update public.family_supplies set product_name='Edited sample product',updated_by=auth.uid() where id=current_setting('push.test.supply')::uuid;
insert into public.family_chat_messages(family_id,sender_id,body) values(current_setting('push.test.family')::uuid,auth.uid(),'Synthetic push fixture only');
select set_config('request.jwt.claim.sub',current_setting('push.test.other'),true);
do $$begin
 if exists(select 1 from public.push_devices where id=current_setting('push.test.device')::uuid) then raise exception 'foreign device readable';end if;
 if exists(select 1 from public.family_supplies where id=current_setting('push.test.supply')::uuid) then raise exception 'foreign product readable';end if;
end $$;
reset role;
do $$declare first_claim uuid;second_claim uuid;begin
 if (select count(*) from public.notification_jobs where source_id=current_setting('push.test.supply')::uuid)<>1 then raise exception 'metadata edit re-alerted low product';end if;
 if (select count(*) from public.notification_jobs where family_id=current_setting('push.test.family')::uuid and kind='chat')<>1 then raise exception 'chat job missing';end if;
 first_claim=public.claim_notification_delivery(current_setting('push.test.device')::uuid,'fixture-key');second_claim=public.claim_notification_delivery(current_setting('push.test.device')::uuid,'fixture-key');
 if first_claim is null or second_claim is not null then raise exception 'parallel duplicate claim';end if;
 update public.notification_deliveries set state='retry',lease_until=now()-interval '1 second' where id=first_claim;
 if public.claim_notification_delivery(current_setting('push.test.device')::uuid,'fixture-key') is null then raise exception 'transient retry lost';end if;
 update public.notification_deliveries set state='sent' where id=first_claim;
 if public.claim_notification_delivery(current_setting('push.test.device')::uuid,'fixture-key') is not null then raise exception 'sent notification claimed twice';end if;
 delete from public.family_members where family_id=current_setting('push.test.family')::uuid and user_id=current_setting('push.test.user')::uuid;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('push.test.user'),true);
do $$begin if exists(select 1 from public.push_devices where id=current_setting('push.test.device')::uuid) then raise exception 'removed member sees devices';end if;end $$;
reset role;
rollback;
select 'passed: private credentials, own-device preferences, family/baby/buyer isolation, blank category defaults, one low-stock transition job, chat trigger, concurrent delivery dedupe/retry and removed-member isolation; fixtures rolled back' as result;
