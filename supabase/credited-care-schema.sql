-- Family-visible verified caregiver links support recognition without profile-name guesses.
-- Only the existing verified Sam manager can create or change a link.
alter policy star_identities_read on public.family_star_identities
 using(exists(select 1 from public.family_members m
  where m.family_id=family_star_identities.family_id and m.user_id=(select auth.uid())));
