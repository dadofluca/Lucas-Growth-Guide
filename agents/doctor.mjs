/** Deterministic background diagnostics. Reads code + synthetic evidence, never family data. */
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,appendFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {inspectBundle} from './check-release-bundle.mjs';
import {friendDemo} from './build-friend-demo.mjs';
import './sleep-inference.js';
import sleep from './sleep-data.js';
const owners=[
 {pattern:/sleep|nap|overnight/i,area:'sleep',files:['agents/sleep-inference.js','agents/sleep-data.js','agents/sleep-ui.js'],command:'node --test agents/p136-sleep-inference.test.mjs agents/p134-sleep-data.test.mjs'},
 {pattern:/demo|practice|sandbox/i,area:'friend sandbox',files:['agents/demo-mode.js','agents/build-friend-demo.mjs','demo.html'],command:'node agents/build-friend-demo.mjs --check'},
 {pattern:/banner|flair|achievement|card|discovery/i,area:'calling cards',files:['agents/achievements.js','agents/achievements-ui.js','agents/flair-ui.js'],command:'node --test agents/p135-achievements.test.mjs'},
 {pattern:/avatar|chat|profile/i,area:'family identity',files:['agents/family-chat.js','agents/family-profiles.js'],command:'node --test agents/family-chat.test.mjs agents/family-profiles.test.mjs'},
 {pattern:/sync|bottle|poop|diaper|edit|delete|history|persist/i,area:'care integrity',files:['care-sync.js','agents/quick-actions.js','index.html'],command:'node --test agents/care-sync.test.mjs agents/delete-integrity.test.mjs'},
 {pattern:/.*/,area:'presentation or integration',files:['agents/ui-polish.css','index.html','DEVELOPER_HANDOFF.md'],command:'node --test agents/*.test.mjs'}
];
export function readTap(text){
 const n=label=>Number(text.match(new RegExp('^# '+label+' (\\d+)','m'))?.[1]);
 const total=n('tests'),failed=n('fail'),passed=n('pass');
 return {status:failed>0?'failed':Number.isFinite(failed)&&total>0&&passed===total&&failed===0?'passed':'unverified',total:Number.isFinite(total)?total:null,passed:Number.isFinite(passed)?passed:null,failed:Number.isFinite(failed)?failed:null,failures:[...text.matchAll(/^not ok \d+ - (.+)$/gm)].map(m=>m[1].slice(0,180))};
}
export function readBrowser(report){
 if(!report?.stats)return {status:'unverified',failures:[]};
 const failures=[];function walk(suites){for(const suite of suites||[]){walk(suite.suites);for(const spec of suite.specs||[])if(spec.tests?.some(t=>t.status==='unexpected'))failures.push({title:String(spec.title).slice(0,180),file:spec.file,line:spec.line});}}walk(report.suites);
 const {expected=0,unexpected=0,flaky=0}=report.stats;
 return {status:unexpected>0||report.errors?.length?'failed':flaky>0?'flaky':expected>0?'passed':'unverified',passed:expected,failed:unexpected,flaky,failures};
}
export function handoffFor(failures){return failures.map(f=>{const title=typeof f==='string'?f:f.title,owner=owners.find(o=>o.pattern.test(title));return {symptom:title,area:owner.area,files:owner.files,reproduce:owner.command,next:'Reproduce, fix the owning implementation, then rerun its test and the required browser flow.',autoDeploy:false};});}
export function diagnose(root,{unitText='',browserReports=[]}={}){
 const html=readFileSync(join(root,'index.html'),'utf8'),sw=readFileSync(join(root,'sw.js'),'utf8'),version=html.match(/id="buildVersion"[^>]*>(P\d+)/)?.[1]||'unknown';
 const assets=inspectBundle(root),checks=[{id:'assets',status:assets.ok?'passed':'failed',detail:assets.problems.join('; ')||'All page asset references exist.'}];
 const revision=version.slice(1),versions=[...html.matchAll(/\?v=(\d+)/g)].map(m=>m[1]);
 checks.push({id:'version',status:version!=='unknown'&&sw.includes('luca-shell-p'+revision)&&versions.every(v=>v===revision)?'passed':'failed',detail:'Visible build, shell cache and versioned script/style URLs must agree.'});
 const demo=existsSync(join(root,'demo.html'))?readFileSync(join(root,'demo.html'),'utf8'):'';
 checks.push({id:'friend sandbox',status:demo===friendDemo(html)&&demo.includes("connect-src 'none'")&&!demo.includes('sb_publishable_')&&!demo.includes('navigator.serviceWorker.register')?'passed':'failed',detail:'Generated playground has no real client key, no service-worker registration and no outbound connections.'});
 const bedtime=new Date(2026,9,17,22,15),wake=new Date(2026,9,18,7,18),nap=new Date(2026,9,18,8),now=new Date(2026,9,18,16);
 const rows=[{id:'fixture-bed',at:bedtime.toISOString(),notes:'Down for the night at 10:15',tags:['sleep']},{id:'fixture-wake',at:wake.toISOString(),notes:'Slept last night until 7 am',tags:['other']},{id:'fixture-nap',at:nap.toISOString(),notes:'Napped 8–9',tags:['sleep']}];
 const summary=sleep.summarize(rows,7,now);
 checks.push({id:'sleep inference',status:summary.night===525&&summary.nap===60&&summary.partialCount===0?'passed':'failed',detail:'22:15 → 07:00 is 8h45m, and Napped 8–9 is 1h. Source rows remain read-only.'});
 const unit=readTap(unitText),browser=browserReports.map(readBrowser),failures=[...checks.filter(c=>c.status==='failed').map(c=>c.id),...unit.failures,...browser.flatMap(b=>b.failures)];
 if(unit.status==='failed'&&!unit.failures.length)failures.push('Unit runner reported failures without individual titles');
 browser.forEach((b,i)=>{if((b.status==='failed'||b.status==='flaky')&&!b.failures.length)failures.push('Browser report '+(i+1)+' is '+b.status);});
 return {version,generatedAt:new Date().toISOString(),mode:'code-and-synthetic-evidence',productionDataRead:false,productionWrites:false,automaticDeployment:false,checks,unit,browser,verdict:failures.length?'investigate':unit.status==='passed'&&browser.length&&browser.every(b=>b.status==='passed')?'synthetic-checks-passed':'verification-incomplete',nextTasks:handoffFor(failures),externalChecks:['Actual signed-in iPhone Safari/PWA','Second production family device','Muse ingestion']};
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const args=process.argv.slice(2),root=process.cwd(),out=resolve('artifacts/doctor');mkdirSync(out,{recursive:true});
 const tap=resolve('artifacts/unit-results.tap');
 if(args.includes('--run')){try{const result=execFileSync(process.execPath,['--test','--test-reporter=tap',...readdirSync(join(root,'agents')).filter(f=>f.endsWith('.test.mjs')).map(f=>'agents/'+f)],{encoding:'utf8',maxBuffer:12*1024*1024});writeFileSync(tap,result);}catch(error){writeFileSync(tap,String(error.stdout||'')+'\n# runner failed\n');}}
 const reports=args.filter(a=>a.endsWith('.json')).filter(existsSync).map(p=>{try{return JSON.parse(readFileSync(p,'utf8'));}catch{return null;}});
 const report=diagnose(root,{unitText:existsSync(tap)?readFileSync(tap,'utf8'):'',browserReports:reports});
 try{report.commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{report.commit='unknown';}
 writeFileSync(join(out,'health.json'),JSON.stringify(report,null,2)+'\n');
 const notes=['# Next assistant handoff','',`Build: ${report.version} · commit: ${report.commit}`,`Verdict: ${report.verdict}`,'','Read DEVELOPER_HANDOFF.md first. Care writes belong to care-sync.js. Fix the owning implementation; do not add another compatibility wrapper.','',...report.checks.map(c=>`- ${c.id}: ${c.status} — ${c.detail}`),'',`Unit evidence: ${report.unit.status}. Browser evidence: ${report.browser.map(b=>b.status).join(', ')||'not supplied'}.`,...report.nextTasks.flatMap(t=>['',`## ${t.symptom}`,`Area: ${t.area}`,`Files: ${t.files.join(', ')}`,`Reproduce: \`${t.reproduce}\``,t.next]),'','External device/account checks remain unverified until independently tested. This report does not authorize deployment.'];
 writeFileSync(join(out,'NEXT_AGENT.md'),notes.join('\n')+'\n');if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,notes.join('\n')+'\n');
 console.log(`${report.version}: ${report.verdict}. ${report.checks.filter(c=>c.status==='passed').length}/${report.checks.length} static/fixture checks passed. See artifacts/doctor/health.json and NEXT_AGENT.md.`);
 if(report.nextTasks.length)process.exitCode=1;
}
