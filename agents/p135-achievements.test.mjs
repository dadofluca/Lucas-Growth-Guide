import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAchievements,normalizeFlair,mergeFlair,maxStreak,bannerFor} from './achievements.js';
const now=new Date('2026-10-18T17:00:00Z');
const event=(id,at,extra={})=>({id,at,createdBy:'sam',babyId:'luca',oz:6,tags:[],...extra});
const run=(events,extra={})=>evaluateAchievements({events,userId:'sam',now,babyId:'luca',...extra});
test('care achievements belong to the original logger, not an editor or a mentioned caregiver',()=>{
 const result=run([event('a','2026-10-18T13:00:00Z',{createdBy:'nona',people:['Sam']}),event('b','2026-10-18T14:00:00Z',{people:['Nona']})]);
 assert.equal(result.metrics.total,1);assert.equal(result.metrics.bottles,1);assert.ok(result.unlocked.includes('first-watch'));
 assert.equal(run([], {userId:undefined}).metrics.total,0);
});
test('duplicates, future timestamps, test fixtures and other-baby entries cannot inflate achievements',()=>{
 const result=run([event('a','2026-10-18T13:00:00Z'),event('a','2026-10-18T13:00:00Z'),event('b','2026-10-20T13:00:00Z'),event('c','2026-10-18T13:00:00Z',{babyId:'other'}),event('d','2026-10-18T13:00:00Z',{details:{test_event:true}})]);
 assert.equal(result.metrics.total,1);
});
test('streaks use distinct calendar days and do not require more feeding or more diapers',()=>{
 assert.equal(maxStreak(['2026-10-14','2026-10-14','2026-10-16','2026-10-17','2026-10-18']),3);
 const result=run([event('a','2026-10-15T13:00:00Z'),event('b','2026-10-16T14:00:00Z'),event('c','2026-10-17T15:00:00Z')]);
 assert.ok(result.unlocked.includes('bottle-streak'));assert.equal(result.metrics.bottleStreak,3);
});
test('Code Brown requires recorded disaster size and wetness together',()=>{
 const result=run([event('a','2026-10-18T13:00:00Z',{oz:null,tags:['poop'],details:{poop:{size:5,wet:false}}}),event('b','2026-10-18T14:00:00Z',{oz:null,tags:['poop'],notes:'Poop size: diaper disaster; wet/messy'})]);
 assert.equal(result.metrics.disasters,1);assert.ok(result.unlocked.includes('code-brown'));
});
test('weekly MVP uses completed weeks, at least two loggers, a minimum of five and shared ties',()=>{
 const rows=[];
 for(let i=0;i<5;i++){rows.push(event('sam'+i,'2026-10-10T13:00:00Z'));rows.push(event('nona'+i,'2026-10-10T14:00:00Z',{createdBy:'nona'}));}
 rows.push(event('today','2026-10-18T14:00:00Z'));
 assert.equal(run(rows).metrics.weeklyWins,1);assert.equal(run(rows).weekly.mine,1);
 assert.equal(run(rows.filter(e=>e.createdBy==='sam')).metrics.weeklyWins,0);
});
test('Ghost Mode requires three real visit dates and confirmed zero care and chat; unknown counts do not qualify',()=>{
 const flair={visits:['2026-10-16','2026-10-17','2026-10-18']};
 assert.equal(run([], {flair,chatCount:0}).metrics.ghost,1);
 assert.equal(run([], {flair,chatCount:null}).metrics.ghost,0);
 assert.equal(run([], {flair,chatCount:1}).metrics.ghost,0);
 assert.equal(run([event('a','2026-10-18T13:00:00Z')], {flair,chatCount:0}).metrics.ghost,0);
});
test('hidden discoveries unlock only known eggs and earned banners survive a later quiet week',()=>{
 const first=run([], {flair:{eggs:['block-party','invented']}});
 assert.deepEqual(first.newlyUnlocked,['block-party']);
 const flair={unlocked:first.unlocked,banner:'block-party'};
 assert.equal(bannerFor(flair).name,'Block Party');assert.ok(run([], {flair}).unlocked.includes('block-party'));
 assert.equal(bannerFor({banner:'code-brown'}),null);
});
test('flair merge retains discoveries across devices and bounds visits without erasing an explicit unequip',()=>{
 const merged=mergeFlair({unlocked:['first-watch'],banner:'first-watch',visits:['2026-10-16']},{unlocked:['block-party'],eggs:['block-party'],visits:['2026-10-17']},{banner:'block-party'});
 assert.deepEqual(merged.unlocked,['first-watch','block-party']);assert.equal(merged.banner,'block-party');
 assert.equal(mergeFlair(merged,{}, {banner:''}).banner,'');
 const malformed=normalizeFlair({unlocked:['bad'],eggs:'oops',visits:Array.from({length:70},(_,i)=>'2026-'+(i<30?'08':'09')+'-'+String(i%30+1).padStart(2,'0'))});
 assert.ok(malformed.visits.length<=31);assert.deepEqual(malformed.unlocked,[]);assert.deepEqual(malformed.eggs,[]);
});
