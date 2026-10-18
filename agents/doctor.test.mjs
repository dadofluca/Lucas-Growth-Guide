import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readTap,readBrowser,handoffFor,diagnose} from './doctor.mjs';
test('Doctor treats missing evidence as unknown and real failing evidence as failed',()=>{
 assert.equal(readTap('').status,'unverified');assert.equal(readBrowser(null).status,'unverified');
 assert.equal(readTap('# tests 5\n# pass 4\n# fail 1\nnot ok 2 - sleep inference').status,'failed');
 assert.equal(readTap('# tests 5\n# pass 5\n# fail 0').status,'passed');
 assert.equal(readBrowser({stats:{expected:5,unexpected:0,flaky:1}}).status,'flaky');
});

test('Doctor accepts only browser evidence for the current source commit when checking freshness',()=>{
 const report={config:{metadata:{sourceCommit:'current-source'}},stats:{expected:5,unexpected:0,flaky:0}};
 assert.equal(readBrowser(report,{expectedCommit:'current-source'}).status,'passed');
 assert.equal(readBrowser(report,{expectedCommit:'current-source',sourceDirty:true}).status,'unverified');
 assert.match(readBrowser(report,{expectedCommit:'current-source',sourceDirty:true}).evidenceIssue,/uncommitted/);
 const stale=readBrowser(report,{expectedCommit:'new-source'});
 assert.equal(stale.status,'unverified');assert.match(stale.evidenceIssue,/current-source.*new-source/);
 const missing=readBrowser({stats:report.stats},{expectedCommit:'current-source'});
 assert.equal(missing.status,'unverified');assert.match(missing.evidenceIssue,/no source commit/);
 assert.equal(readBrowser(report,{expectedCommit:'unknown'}).status,'unverified');
 assert.equal(readBrowser(null,{expectedCommit:'current-source'}).status,'unverified');
});

test('Doctor never hides a failing or flaky browser result behind stale metadata',()=>{
 for(const [stats,status] of [[{expected:4,unexpected:1,flaky:0},'failed'],[{expected:4,unexpected:0,flaky:1},'flaky']]){
  const report=readBrowser({config:{metadata:{sourceCommit:'old-source'}},stats},{expectedCommit:'current-source'});
  assert.equal(report.status,status);assert.match(report.evidenceIssue,/old-source/);
 }
});

test('Doctor makes stale, absent and empty supplied browser reports actionable, without inventing browser passes',()=>{
 const root=fileURLToPath(new URL('..',import.meta.url)),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),unitText='# tests 5\n# pass 5\n# fail 0';
 const current={config:{metadata:{sourceCommit:commit}},stats:{expected:5,unexpected:0,flaky:0}};
 const matching=diagnose(root,{unitText,browserReports:[current]});
 assert.equal(matching.verdict,matching.sourceDirty?'investigate':'synthetic-checks-passed');
 for(const report of [null,{stats:current.stats},{...current,config:{metadata:{sourceCommit:'old-source'}}},{...current,stats:{expected:0}}]){
  const health=diagnose(root,{unitText,browserReports:[report]});
  assert.equal(health.commit,commit);assert.equal(health.verdict,'investigate');assert.equal(health.nextTasks[0].area,'verification evidence');assert.equal(health.nextTasks[0].autoDeploy,false);
 }
 assert.equal(diagnose(root,{unitText}).verdict,'verification-incomplete');
});
test('Doctor gives a bounded owner and reproducer rather than inventing automatic repairs',()=>{
 const tasks=handoffFor(['offline bottle edit failed','sleep note not counted','demo reset touched real history']);
 assert.equal(tasks[0].area,'care integrity');assert.equal(tasks[1].area,'sleep');assert.equal(tasks[2].area,'friend sandbox');assert.ok(tasks.every(t=>t.autoDeploy===false&&t.reproduce.startsWith('node ')));
});

test('Doctor retains exact browser errors and locations, and routes practice coverage failures to the real schedule owner',()=>{
 const report=readBrowser({stats:{expected:5,unexpected:1},suites:[{specs:[{title:'practice schedule coverage does not open',file:'browser-smoke.spec.mjs',line:867,tests:[{status:'unexpected',results:[{errors:[{message:'ReferenceError: dateKey48 is not defined'}]}]}]}]}]});
 const [task]=handoffFor(report.failures);assert.equal(task.area,'schedule');assert.equal(task.testLine,867);assert.equal(task.testFile,'browser-smoke.spec.mjs');assert.match(task.evidence,/dateKey48/);assert.ok(task.files.includes('sync-fix.js'));assert.equal(task.autoDeploy,false);
});
