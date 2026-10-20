import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {authorLabel,joinIdeas,ideaUpdates,approvedExport} from './family-ideas-model.js';
const require=createRequire(import.meta.url),updates=require('./personal-updates.js');
const idea={id:'i',author_id:'nona-id',title:'Quick status',visibility:'family',status:'new',category:'idea',agent_review_approved:true};
test('P146 author attribution uses profile, submitted name, then an honest distinct unnamed identity',()=>{
 assert.equal(authorLabel(idea,[{user_id:'nona-id',display_name:'Nona'}]),'Nona');
 assert.equal(authorLabel({...idea,author_name:'Jay'},[{user_id:'nona-id',display_name:'device-abc'}]),'Jay');
 assert.equal(authorLabel(idea,[]),'Unnamed member · nona-i');
});
test('P146 one vote per current user is joined separately from Sam’s actual decision',()=>{
 const joined=joinIdeas([idea],[{idea_id:'i',status:'done',response:'Shipped',updated_at:'r1'}],[{idea_id:'i',user_id:'a',value:1},{idea_id:'i',user_id:'b',value:-1}],[],'b');
 assert.equal(joined[0].up,1);assert.equal(joined[0].down,1);assert.equal(joined[0].myVote,-1);assert.equal(joined[0].status,'done');
 const alerts=ideaUpdates(joined,'nona-id');assert.equal(alerts.length,1);assert.match(alerts[0].title,/Addressed/);assert.equal(alerts[0].body,'Shipped');assert.equal(ideaUpdates(joined,'other').length,0);
 assert.notEqual(alerts[0].id,ideaUpdates(joinIdeas([idea],[{idea_id:'i',status:'reviewing',updated_at:'r2'}]),'nona-id')[0].id);
});
test('P146 export excludes private, unapproved and closed ideas, never authorizes deployment',()=>{
 const brief=approvedExport([idea,{...idea,id:'private',visibility:'private',details:'private text'},{...idea,id:'no',agent_review_approved:false},{...idea,id:'done',status:'done'},{...idea,id:'declined',status:'declined'}]);
 assert.equal(brief.ideas.length,1);assert.equal(brief.automaticWorker,false);assert.equal(brief.autoDeploy,false);assert.equal(brief.autoMerge,false);assert.doesNotMatch(JSON.stringify(brief),/private text/);
});
test('P146 idea replies appear in an authenticated personal inbox without requiring a star identity',()=>{
 const ideas=ideaUpdates(joinIdeas([idea],[{idea_id:'i',status:'planned',updated_at:'r1'}]),'nona-id');
 assert.equal(updates.collect({context:{family:'f',baby:'b',user:'u'},ideas}).filter(i=>i.kind==='idea').length,1);
 assert.equal(updates.collect({ideas}).filter(i=>i.kind==='idea').length,0);
});
