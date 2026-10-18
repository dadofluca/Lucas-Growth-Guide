-- Cosmetic achievements share the existing family-profile ownership policies.
-- No care events, identities, grants, or access policies are changed.
alter table public.family_profiles add column flair jsonb not null default '{}'::jsonb;
alter table public.family_profiles add constraint family_profiles_flair_shape check (jsonb_typeof(flair) = 'object' and octet_length(flair::text) <= 8192);
comment on column public.family_profiles.flair is 'Cosmetic earned banners, Easter-egg discoveries and up to 31 visit dates. Client-authored; never used for authorization or care decisions.';
