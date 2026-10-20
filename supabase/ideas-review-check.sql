-- Transaction-only RLS smoke check; all sample suggestions/votes/reviews roll back.
begin;
select set_config('luca.test.idea',gen_random_uuid()::text,true),set_config('luca.test.private',gen_random_uuid()::text,true);
insert into public.family_ideas(id,family_id,author_id,title,visibility) values
(current_setting('luca.test.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38','b38303c5-7593-4ee8-86f1-03ddd1554579','Synthetic RLS check','family'),
(current_setting('luca.test.private')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38','b38303c5-7593-4ee8-86f1-03ddd1554579','Synthetic private check','private');
set local role authenticated;
select set_config('request.jwt.claim.sub','b38303c5-7593-4ee8-86f1-03ddd1554579',true);
do $$ begin
 if not exists(select 1 from public.family_ideas where id=current_setting('luca.test.private')::uuid) then raise exception 'author lost private idea'; end if;
 insert into public.family_idea_votes(idea_id,family_id,user_id,value) values(current_setting('luca.test.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),1);
 begin
 insert into public.family_idea_reviews(idea_id,family_id,reviewer_id,status) values(current_setting('luca.test.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'done');
 raise exception 'nonmanager allowed review'; exception when insufficient_privilege then null; end;
 begin
 insert into public.family_idea_managers(family_id,user_id) values('eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid());
 raise exception 'manager self-escalation allowed'; exception when insufficient_privilege then null; end;
 end $$;
select set_config('request.jwt.claim.sub','87208e55-bf72-4cdc-8f02-8c71816f5985',true);
do $$ begin
 if exists(select 1 from public.family_ideas where id=current_setting('luca.test.private')::uuid) then raise exception 'manager saw private idea'; end if;
 insert into public.family_idea_reviews(idea_id,family_id,reviewer_id,status,response) values(current_setting('luca.test.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'reviewing','Synthetic response');
 update public.family_idea_reviews set status='done',response='Synthetic finished' where idea_id=current_setting('luca.test.idea')::uuid;
 if not exists(select 1 from public.family_idea_reviews where idea_id=current_setting('luca.test.idea')::uuid and status='done') then raise exception 'manager update failed'; end if;
 update public.family_idea_votes set value=-1 where idea_id=current_setting('luca.test.idea')::uuid;
 if exists(select 1 from public.family_idea_votes where idea_id=current_setting('luca.test.idea')::uuid and value=-1) then raise exception 'changed another vote'; end if;
 end $$;
select set_config('request.jwt.claim.sub','b38303c5-7593-4ee8-86f1-03ddd1554579',true);
do $$ begin
 if not exists(select 1 from public.family_idea_reviews where idea_id=current_setting('luca.test.idea')::uuid and status='done') then raise exception 'author cannot read response'; end if;
 end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$ begin
 if exists(select 1 from public.family_idea_votes) or exists(select 1 from public.family_idea_reviews) or exists(select 1 from public.family_idea_managers) then raise exception 'nonmember sees board metadata'; end if;
 end $$;
rollback;
select 'passed: author privacy, author response, manager decision, no escalation, own votes, nonmember isolation; samples rolled back' as result;
