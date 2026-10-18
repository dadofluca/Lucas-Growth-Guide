import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {avatarArtwork,ARMORY_SIZE} from "./avatar-art.js";
import {feedbackLine} from "./personality.js";

test("original character artwork is packaged and every portrait remains an allowed saved choice",()=>{
 const image=readFileSync(new URL("./assets/avatar-armory-original.png",import.meta.url));
 assert.equal(image.toString("ascii",1,4),"PNG");
 assert.equal(image.readUInt32BE(16),ARMORY_SIZE.width);assert.equal(image.readUInt32BE(20),ARMORY_SIZE.height);
 const allowed=["20261018_avatar_armory.sql","20261018_avatar_armory_expansion.sql"].map(name=>readFileSync(new URL("../supabase/migrations/"+name,import.meta.url),"utf8")).join("\n");
 assert.equal(Object.keys(avatarArtwork).length,42);
 for(const [key,frame] of Object.entries(avatarArtwork)){
  assert.ok(allowed.includes("'"+key+"'"),key+" must preserve an existing database preset");
  assert.ok(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=ARMORY_SIZE.width&&frame.y+frame.height<=ARMORY_SIZE.height,key+" must fit the source artwork");
 }
});
test("personality can be silenced and does not add jokes to unknown or error feedback",()=>{
 for(const kind of ["feed","poop","sleep"]){assert.equal(feedbackLine(kind,"off"),"");assert.notEqual(feedbackLine(kind,"dark",0),feedbackLine(kind,"dark",1));assert.ok(feedbackLine(kind,"gentle"));}
 assert.equal(feedbackLine("error","dark"),"");assert.equal(feedbackLine("sync","dark"),"");assert.equal(feedbackLine("feed","unknown"),"");
});
