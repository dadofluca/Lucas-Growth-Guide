-- Opt-in agent feedback review. Only the author may approve or revoke an idea.
alter table public.family_ideas add column if not exists agent_review_approved boolean not null default false;
create policy family_ideas_author_update on public.family_ideas for update to authenticated
 using (author_id=(select auth.uid()) and exists(select 1 from public.family_members fm where fm.family_id=family_ideas.family_id and fm.user_id=(select auth.uid())))
 with check (author_id=(select auth.uid()) and exists(select 1 from public.family_members fm where fm.family_id=family_ideas.family_id and fm.user_id=(select auth.uid())));
grant update(agent_review_approved) on public.family_ideas to authenticated;
-- Authenticated clients cannot change statuses, authorship, visibility or text via this grant.
