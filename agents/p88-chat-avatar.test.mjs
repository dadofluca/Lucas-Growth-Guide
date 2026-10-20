import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const chat=readFileSync(new URL("./family-chat.js",import.meta.url),"utf8");
const profiles=readFileSync(new URL("./family-profiles.js",import.meta.url),"utf8");
test("P88 chat displays the saved family avatar beside the sender",()=>{
 assert.match(chat,/import \{avatarImage,avatarLabel\} from "\.\/family-profiles\.js"/);
 assert.match(chat,/avatarImage\(preset,40\)/);
 assert.match(chat,/identity\.append\(who,character\);[\s\S]*identity\.append\(when\);[\s\S]*portraitButton\.append\(avatar\);[\s\S]*header\.append\(portraitButton,identity\)/);
 assert.match(chat,/select\("user_id,display_name,bio,avatar_preset,flair"\)/);
 assert.match(chat,/new Map\(\(people\|\|\[\]\)\.map\(p=>\[p\.user_id,p\]\)\)/);
});
test("P88 illustrated armory avatars are layered and keep existing keys",()=>{
 assert.match(profiles,/export function avatarSvg\(key\)/);
 assert.match(profiles,/radialGradient id="bg"/);
 assert.match(profiles,/linearGradient id="face"/);
 for(const key of ["teddyTrooper","diaperDoom","napEmperor","sleepDeprived","evilDuck"])assert.match(profiles,new RegExp(key));
});
