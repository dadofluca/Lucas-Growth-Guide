/** Safe synthetic QA exercise. No Supabase access, family data, or deployments. */
import {writeFileSync,mkdirSync} from "node:fs";
import {prepareReviewQueue} from "./triage.mjs";
import {assessSyntheticRuns} from "./watchdog.mjs";
import {makeReviewIssues} from "./review-issues.mjs";
const synthetic=[
 {flowId:"auth",status:"passed"},
 {flowId:"bottle",status:"failed"},
 {flowId:"diaper",status:"passed"},
 {flowId:"schedule",status:"passed"},
 {flowId:"report",status:"passed"},
 {flowId:"teddy",status:"passed"}
];
const assessment=assessSyntheticRuns(synthetic);
const findings=assessment.findings.map(f=>({...f,agent:"watchdog",fingerprint:`synthetic:${f.flowId}:${f.code}`}));
const queue=prepareReviewQueue(findings);
if(queue.tasks.length!==1||queue.tasks[0].code!=="flow_failed"||queue.tasks[0].autoDeploy!==false)throw new Error("Synthetic handoff failed");
const issueDrafts=makeReviewIssues(findings);
if(issueDrafts.issues.length!==1||issueDrafts.issues[0].autoCreate||issueDrafts.issues[0].autoMerge)throw new Error("Unsafe issue handoff");
const output={mode:"synthetic",verifiedProduction:false,assessment,queue,issueDrafts};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/synthetic-agent-qa.json",JSON.stringify(output,null,2)+"\n");
console.log("Synthetic QA handoff verified: one failure queued for review, no deployment.");
