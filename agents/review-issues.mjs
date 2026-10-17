/** Sanitized issue summaries for review. No network, account access or deployment. */
import {prepareReviewQueue} from "./triage.mjs";
const MAX_TITLE=110;
function safeToken(value){return String(value??"unknown").replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,64);}
export function makeReviewIssues(findings,{limit=20}={}){
 const {tasks,summary}=prepareReviewQueue(findings,{limit});
 return {summary,issues:tasks.map(task=>{
  const title=`[${safeToken(task.agent)}] ${safeToken(task.code)} (${safeToken(task.severity)})`.slice(0,MAX_TITLE);
  const body=[
   "Automated QA review proposal (not a confirmed production defect).",
   `Agent: ${safeToken(task.agent)}`,
   `Code: ${safeToken(task.code)}`,
   `Severity: ${safeToken(task.severity)}`,
   `Area: ${safeToken(task.area)}`,
   "Next steps: reproduce safely; add regression coverage; review privacy impact; request approval before merge.",
   "No real family data, credentials, or raw diagnostics are included."
  ].join("\n");
  return {title,body,label:"agent-review",fingerprint:safeToken(task.id),autoCreate:false,autoMerge:false};
 })};
}
