-- Discussion access follows the parent idea's existing family/private RLS.
create table public.family_idea_comments (
 id uuid primary key default gen_random_uuid(),
 idea_id uuid not null,
 family_id uuid not null,
 author_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null check(char_length(trim(author_name)) between 1 and 40),
 body text not null check(char_length(body)<=1200 and char_length(trim(body))>0),
 created_at timestamptz not null default now(),
 foreign key(idea_id,family_id) references public.family_ideas(id,family_id) on delete cascade
);
alter table public.family_idea_comments enable row level security;
revoke all on public.family_idea_comments from anon,authenticated;
grant select,delete on public.family_idea_comments to authenticated;
grant insert(id,idea_id,family_id,author_id,author_name,body) on public.family_idea_comments to authenticated;
grant all on public.family_idea_comments to service_role;
create policy idea_comments_read on public.family_idea_comments for select to authenticated using(
 exists(select 1 from public.family_ideas i where i.id=family_idea_comments.idea_id and i.family_id=family_idea_comments.family_id)
);
create policy idea_comments_insert on public.family_idea_comments for insert to authenticated with check(
 author_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=family_idea_comments.idea_id and i.family_id=family_idea_comments.family_id)
);
create policy idea_comments_delete on public.family_idea_comments for delete to authenticated using(
 author_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=family_idea_comments.idea_id and i.family_id=family_idea_comments.family_id)
);
create index idea_comments_thread on public.family_idea_comments(idea_id,family_id,created_at desc,id desc);
create index idea_comments_author on public.family_idea_comments(author_id);
