import test from 'node:test';
import assert from 'node:assert/strict';
import './sleep-inference.js';
import sleep from './sleep-data.js';
process.env.TZ='UTC';
const now=new Date('2026-10-18T15:40:00Z');
const e=(id,at,notes,tags=['sleep'])=>({id,at,notes,tags,babyId:'luca'});
test('night bedtime and next morning wake notes produce one overnight total without rewriting either note',()=>{
 const entries=[e('bed','2026-10-17T22:15:00Z','Down for the night at 10:15'),e('wake','2026-10-18T07:18:00Z','Slept last night until 7 am, maybe 3 wakeups, little cranky in the night with stomach and farting issues',['other'])];
 const before=JSON.stringify(entries),s=sleep.session(entries[1],entries,now),totals=sleep.summarize(entries,7,now);
 assert.equal(s.minutes,525);assert.equal(s.inferred,true);assert.equal(totals.nightCount,1);assert.equal(totals.night,525);assert.equal(totals.partialCount,0);assert.equal(s.wakeups,null);assert.equal(JSON.stringify(entries),before);
});
test('abbreviated Napped 8–9 uses the entry time context and counts a full hour',()=>{
 const entry=e('nap','2026-10-18T08:00:00Z','Napped 8–9');const s=sleep.session(entry,null,now);
 assert.equal(s.minutes,60);assert.equal(new Date(s.start).getUTCHours(),8);assert.equal(sleep.summarize([entry],7,now).nap,60);
});
test('evening nap ranges choose PM and 12-hour rollover stays a short nap',()=>{
 const s=sleep.session(e('nap','2026-10-17T23:00:00Z','Napped 11:30 pm–12:15 am'),null,now);
 assert.equal(s.minutes,45);assert.equal(new Date(s.end).getUTCDate(),18);
});
test('unknown starts, plans, questions, reversed clocks and distant nights do not create durations',()=>{
 for(const note of ['He is tired','Will nap 8-9 tomorrow','Should he sleep 8-9?','Maybe he will go down for the night'])assert.equal(sleep.session(e('x','2026-10-18T07:00:00Z',note),null,now)?.complete||false,false);
 const entries=[e('bed','2026-10-15T22:00:00Z','Down for the night'),e('wake','2026-10-18T07:00:00Z','Slept last night until 7 am')];
 assert.equal(sleep.summarize(entries,7,now).night,null);
});
test('explicit confirmed sleep wins over nearby notes and exact duplicates never add a second night',()=>{
 const confirmed={...e('manual','2026-10-17T22:30:00Z',''),details:{sleep:sleep.build({start:'2026-10-17T22:30:00Z',end:'2026-10-18T07:00:00Z',kind:'night',now})}};
 const entries=[e('bed','2026-10-17T22:15:00Z','Down for the night at 10:15'),e('wake','2026-10-18T07:18:00Z','Slept last night until 7 am'),confirmed];
 const stats=sleep.summarize(entries,7,now);assert.equal(stats.night,510);assert.equal(stats.nightCount,1);assert.equal(stats.partialCount,0);
});
test('different baby identities cannot be paired and future nap ends do not count yet',()=>{
 const entries=[e('bed','2026-10-17T22:15:00Z','Down for the night'),{...e('wake','2026-10-18T07:18:00Z','Slept last night until 7 am'),babyId:'another'}];
 assert.equal(sleep.summarize(entries,7,now).night,null);
 assert.equal(sleep.session(e('nap','2026-10-18T08:00:00Z','Napped 8-9'),null,new Date('2026-10-18T08:30:00Z'))?.complete||false,false);
});

test('a single clear start-and-wake narrative counts its nap, while open-ended wake counts stay unknown',()=>{
 const entry=e('nap','2026-10-17T18:30:00Z','Went down for a nap at 5:10, woke up at 6:10 pm');
 const s=sleep.session(entry,null,now);assert.equal(s.minutes,60);assert.equal(new Date(s.start).getUTCHours(),17);
 const entries=[e('bed','2026-10-17T22:15:00Z','Down for the night'),e('wake','2026-10-18T07:18:00Z','Slept last night until 7 am, wakeups: 6+')];
 assert.equal(sleep.session(entries[1],entries,now).wakeups,null);
});

test('a confirmed window for another baby cannot fill or override a partial note',()=>{
 const partial=e(123,'2026-10-17T22:15:00Z','Down for the night at 10:15');
 const confirmed={...e(456,'2026-10-17T22:30:00Z',''),babyId:'another',details:{sleep:sleep.build({start:'2026-10-17T22:30:00Z',end:'2026-10-18T07:00:00Z',kind:'night',now})}};
 assert.equal(sleep.session(partial,[partial,confirmed],now).complete,false);
 const wake=e('wake','2026-10-18T07:18:00Z','Slept last night until 7 am');assert.equal(sleep.session(wake,[partial,wake,confirmed],now).minutes,525);
});
