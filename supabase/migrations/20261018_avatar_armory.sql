-- P80: allow illustrated avatar presets, including original Avatar Armory characters.
-- Existing selections and family rows remain unchanged.
alter table public.family_profiles drop constraint if exists family_profiles_avatar_preset_check;
alter table public.family_profiles add constraint family_profiles_avatar_preset_check check (avatar_preset in ('bear','fox','bunny','duck','owl','lion','panda','koala','penguin','dino','robot','astronaut','sun','star','teddyTrooper','formulaCommando','diaperDoom','poopMeteor','wipeTornado','diaperKing','napEmperor','bottleSupreme','evilDuck','sleepDeprived'));
