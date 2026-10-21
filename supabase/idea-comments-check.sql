-- Synthetic comments and parent ideas exist only inside this rolled-back transaction.
begin;
select set_config('luca.comment.idea',gen_random_uuid()::text,true),set_config('luca.comment.private',gen_random_uuid()::text,true),set_config('luca.comment.id',gen_random_uuid()::text,true);
insert into public.family_ideas(id,family_id,author_id,title,visibility) values
(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38','b38303c5-7593-4ee8-86f1-03ddd1554579','Synthetic comment test','family'),
(current_setting('luca.comment.private')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38','b38303c5-7593-4ee8-86f1-03ddd1554579','Synthetic private thread','private');
set local role authenticated;
select set_config('request.jwt.claim.sub','b38303c5-7593-4ee8-86f1-03ddd1554579',true);
insert into public.family_idea_comments(id,idea_id,family_id,author_id,author_name,body) values
(current_setting('luca.comment.id')::uuid,current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic author','Public discussion'),
(gen_random_uuid(),current_setting('luca.comment.private')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic author','Private discussion');
do $$ begin
 if not exists(select 1 from public.family_idea_comments where id=current_setting('luca.comment.id')::uuid) then raise exception 'author cannot read comment'; end if;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38','87208e55-bf72-4cdc-8f02-8c71816f5985','Forged','No');
  raise exception 'forged author allowed'; exception when insufficient_privilege then null; end;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body,created_at) values(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic','No',now()-interval '1 day');
  raise exception 'forged creation time allowed'; exception when insufficient_privilege then null; end;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.idea')::uuid,gen_random_uuid(),auth.uid(),'Synthetic','Wrong family');
  raise exception 'mismatched family allowed'; exception when insufficient_privilege then null; end;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic','   ');
  raise exception 'blank comment allowed'; exception when check_violation then null; end;
 begin
  update public.family_idea_comments set body='Edited' where id=current_setting('luca.comment.id')::uuid;
  raise exception 'comment update unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin
  insert into public.family_idea_comments(id,idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.id')::uuid,current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic','Duplicate');
  raise exception 'duplicate id allowed'; exception when unique_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','87208e55-bf72-4cdc-8f02-8c71816f5985',true);
do $$ declare affected integer; begin
 if not exists(select 1 from public.family_idea_comments where id=current_setting('luca.comment.id')::uuid) then raise exception 'family member cannot discuss public idea'; end if;
 if exists(select 1 from public.family_idea_comments where idea_id=current_setting('luca.comment.private')::uuid) then raise exception 'private discussion leaked'; end if;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.private')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic','Private intrusion');
  raise exception 'manager commented on another private idea'; exception when insufficient_privilege then null; end;
 delete from public.family_idea_comments where id=current_setting('luca.comment.id')::uuid;get diagnostics affected=row_count;if affected<>0 then raise exception 'deleted another author comment'; end if;
 insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Synthetic member','Reply');
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$ begin
 if exists(select 1 from public.family_idea_comments) then raise exception 'nonmember sees comments'; end if;
 begin
  insert into public.family_idea_comments(idea_id,family_id,author_id,author_name,body) values(current_setting('luca.comment.idea')::uuid,'eba317f0-6ac3-47d3-8b47-2f55e1cd9d38',auth.uid(),'Outsider','Intrusion');
  raise exception 'nonmember posted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','b38303c5-7593-4ee8-86f1-03ddd1554579',true);
do $$ declare affected integer; begin
 delete from public.family_idea_comments where id=current_setting('luca.comment.id')::uuid;get diagnostics affected=row_count;if affected<>1 then raise exception 'own delete failed'; end if;
end $$;
reset role;
delete from public.family_ideas where id in(current_setting('luca.comment.idea')::uuid,current_setting('luca.comment.private')::uuid);
do $$ begin
 if exists(select 1 from public.family_idea_comments where idea_id in(current_setting('luca.comment.idea')::uuid,current_setting('luca.comment.private')::uuid)) then raise exception 'parent delete left comments'; end if;
 if has_table_privilege('anon','public.family_idea_comments','select') then raise exception 'anonymous table access'; end if;
end $$;
rollback;
select 'passed: shared discussion, private/foreign isolation, author and timestamp integrity, own delete, dedupe, parent cascade; synthetic data rolled back' as result;
