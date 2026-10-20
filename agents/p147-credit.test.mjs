import test from 'node:test';import assert from 'node:assert/strict';
import './caregiver-credit.js';
import {evaluateAchievements} from './achievements.js';
import {availableThemes} from './themes.js';
const identities=[{user_id:'maddie',person:'Maddie'},{user_id:'nona',person:'Nona'},{user_id:'nona-phone2',person:'Nona'}];
const rows=Array.from({length:5},(_,i)=>({id:'care-'+i,at:'2026-10-'+(16+i%3)+'T14:00:00Z',babyId:'baby',createdBy:'nona',people:['Maddie'],tags:['poop']}));
const opts={identities,babyId:'baby',now:new Date('2026-10-20T16:00:00Z')};
const summary=events=>globalThis.LucaCaregiverCredit.summary(events,'Maddie',opts);
test('P147 Quiet Legend rewards the named caregiver across days without requiring their own logs or app visits',()=>{
 assert.deepEqual(summary(rows),{count:5,days:3,loggers:1,earned:true});
 const result=evaluateAchievements({events:rows,userId:'maddie',babyId:'baby',identities,now:opts.now});
 assert.equal(result.metrics.total,0);assert.equal(result.metrics.visits,0);assert(result.unlocked.includes('quiet-legend'));assert(!result.unlocked.includes('first-watch'));assert(availableThemes(result.unlocked).some(t=>t.id==='golden-hour'));
 assert(!evaluateAchievements({events:rows,userId:'nona',babyId:'baby',identities,now:opts.now}).unlocked.includes('quiet-legend'));
});
test('P147 credit excludes self logs from all linked devices and unknown loggers, and does not guess from labels',()=>{
 assert.equal(summary(rows.map(e=>({...e,createdBy:'maddie'}))).count,0);
 assert.equal(summary(rows.map(e=>({...e,createdBy:'unlinked'}))).count,0);
 assert.equal(globalThis.LucaCaregiverCredit.summary(rows.map(e=>({...e,createdBy:'nona-phone2',people:['Nona']})),'Nona',opts).count,0);
 assert.equal(evaluateAchievements({events:rows,userId:'stranger',identities,now:opts.now}).metrics.quietLegend,0);
 assert.equal(summary(rows.map(e=>({...e,people:['Sam and Maddie']}))).count,5);
});
test('P147 care credit deduplicates records and excludes future, foreign-baby, test and Star entries',()=>{
 const invalid=[{...rows[0],id:'future',at:'2027-01-01T12:00:00Z'},{...rows[0],id:'foreign',babyId:'other'},{...rows[0],id:'fixture',test_event:true},{...rows[0],id:'star',details:{starChart:{person:'Maddie'}}},{...rows[0],id:'mood',tags:['happy']},{...rows[0],id:'invalid',at:'bad'}];
 assert.deepEqual(summary([...rows,...rows, ...invalid]),summary(rows));
 assert.equal(summary(rows.slice(0,4)).earned,false);assert.equal(summary(rows.map(e=>({...e,at:rows[0].at}))).earned,false);
 assert.equal(summary([]).earned,false);
});
