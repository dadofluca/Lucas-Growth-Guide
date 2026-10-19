import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const insights=createRequire(import.meta.url)('./insights.js');
const now=new Date(2026,9,19,14),at=(ago,hour)=>{const d=new Date(now);d.setDate(d.getDate()-ago);d.setHours(hour,0,0,0);return d.toISOString();};
test('P143: Insights excludes Stars, future events and duplicate care; missing days stay unknown',()=>{
 const one={id:'one',at:at(0,9),oz:8,people:['Sam','Luca']};
 const result=insights.summarize([one,one,{id:'stars',at:at(1,9),tags:['stars'],oz:100},{id:'future',at:at(-1,9),oz:50}],{now});
 assert.equal(result.days,1);assert.equal(result.series.at(-1).oz,8);assert.equal(result.series.at(-2).oz,null);assert.match(result.cards[0].text,/1 care event shared/);
});
test('P143: same-clock comparison never treats evening bottles as earlier-day intake',()=>{
 let id=0;const rows=Array.from({length:4},(_,ago)=>[9,12,19].map(hour=>({id:String(id++),at:at(ago,hour),oz:hour===19?100:8}))).flat();
 const result=insights.summarize(rows,{now}),card=result.cards.find(c=>c.title==='Same time, different day');
 assert.match(card.text,/16 oz logged so far today; 16 oz on average/);assert.match(card.text,/3 recent days/);
 const sparse=insights.summarize(rows.filter(e=>new Date(e.at).getDate()>=18),{now});assert.equal(sparse.cards.some(c=>c.title==='Same time, different day'),false);
});
test('P143: usual bottle uses a median and spacing requires three valid samples',()=>{
 const rows=[4,6,8,20].map((oz,i)=>({id:String(i),at:at(i,9),oz}));
 const result=insights.summarize(rows,{now,rhythm:{intervals:[150,180,210]}});
 assert.match(result.cards.find(c=>c.title==='The usual bottle').text,/7 oz/);assert.match(result.cards[0].text,/180 minutes/);
 assert.equal(insights.summarize(rows,{now,rhythm:{intervals:[180,200]}}).cards.some(c=>c.title==='His daytime rhythm'),false);
});
test('P143: age chapters offer specific play without claiming a measured milestone',()=>{
 for(const month of [9,10,11,12]){const c=insights.chapters[month];assert.ok(c.title&&c.notice&&c.try);assert.doesNotMatch(c.notice,/must|should|delay|diagnos/i);}
});
