-- P146: additive idea voting and a separately authorized review desk.
-- No care history, profile or original suggestion is rewritten.
create table public.family_idea_managers (
 family_id uuid not null references public.families(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(family_id,user_id)
);
alter table public.family_idea_managers enable row level security;
revoke all on public.family_idea_managers from anon,authenticated;
grant select on public.family_idea_managers to authenticated;
create policy idea_managers_self on public.family_idea_managers for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.family_members m where m.family_id=family_idea_managers.family_id and m.user_id=(select auth.uid())));
create unique index family_ideas_id_family on public.family_ideas(id,family_id);
create table public.family_idea_votes (
 idea_id uuid not null,
 family_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 value smallint not null check(value in (-1,1)),
 primary key(idea_id,user_id),
 foreign key(idea_id,family_id) references public.family_ideas(id,family_id) on delete cascade
);
alter table public.family_idea_votes enable row level security;
revoke all on public.family_idea_votes from anon,authenticated;
grant select,insert,update,delete on public.family_idea_votes to authenticated;
create policy idea_votes_read on public.family_idea_votes for select to authenticated using(exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_votes.family_id));
create policy idea_votes_insert on public.family_idea_votes for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_votes.family_id));
create policy idea_votes_update on public.family_idea_votes for update to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_votes.family_id)) with check(user_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_votes.family_id));
create policy idea_votes_delete on public.family_idea_votes for delete to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_votes.family_id));
create index idea_votes_family on public.family_idea_votes(family_id);
create table public.family_idea_reviews (
 idea_id uuid primary key,
 family_id uuid not null,
 reviewer_id uuid not null references auth.users(id),
 status text not null check(status in ('new','reviewing','planned','building','done','declined')),
 response text not null default '' check(char_length(response)<=1200),
 updated_at timestamptz not null default now(),
 foreign key(idea_id,family_id) references public.family_ideas(id,family_id) on delete cascade
);
alter table public.family_idea_reviews enable row level security;
revoke all on public.family_idea_reviews from anon,authenticated;
grant select,insert on public.family_idea_reviews to authenticated;
grant update(status,response,reviewer_id) on public.family_idea_reviews to authenticated;
create policy idea_reviews_read on public.family_idea_reviews for select to authenticated using(exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_reviews.family_id));
create policy idea_reviews_insert on public.family_idea_reviews for insert to authenticated with check(reviewer_id=(select auth.uid()) and exists(select 1 from public.family_idea_managers m where m.family_id=family_idea_reviews.family_id and m.user_id=(select auth.uid())) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_reviews.family_id));
create policy idea_reviews_update on public.family_idea_reviews for update to authenticated using(exists(select 1 from public.family_idea_managers m where m.family_id=family_idea_reviews.family_id and m.user_id=(select auth.uid())) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_reviews.family_id)) with check(reviewer_id=(select auth.uid()) and exists(select 1 from public.family_idea_managers m where m.family_id=family_idea_reviews.family_id and m.user_id=(select auth.uid())) and exists(select 1 from public.family_ideas i where i.id=idea_id and i.family_id=family_idea_reviews.family_id));
create index idea_reviews_family on public.family_idea_reviews(family_id);
create function public.stamp_idea_review() returns trigger language plpgsql security invoker set search_path='' as $$ begin NEW.updated_at=clock_timestamp(); return NEW; end $$;
create trigger idea_review_timestamp before insert or update on public.family_idea_reviews for each row execute function public.stamp_idea_review();
revoke all on function public.stamp_idea_review() from public,anon,authenticated;

alter table public.family_ideas add column author_name text check(author_name is null or char_length(trim(author_name)) between 1 and 40);
