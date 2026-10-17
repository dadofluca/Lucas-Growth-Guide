/** Orchestrates sanitized findings into review-only tasks; no network, writes or secrets. */
import {prioritizeFindings,summarizeQueue} from "./conductor.mjs";
import {proposeFix} from "./builder.mjs";
import {sparkBacklog} from "./spark.mjs";
const knownAreas={
 possible_duplicate:"data",bottle_amount_review:"data",future_timestamp:"data",
 user_report_pending:"other",flow_failed:"logging",flow_not_verified:"other",
 component_error:"sync",overlapping_caregiver_shifts:"schedule"
};
function normalize(f){
 if(!f||typeof f.code!=="string")return null;
 return {code:f.code,agent:typeof f.agent==="string"?f.agent:"guardian",
  fingerprint:typeof f.fingerprint==="string"?f.fingerprint:undefined,
  flowId:typeof f.flowId==="string"?f.flowId:undefined,
  severity:typeof f.severity==="string"?f.severity:"info",
  area:knownAreas[f.code]||"other",status:typeof f.status==="string"?f.status:"open"};
}
export function prepareReviewQueue(rawFindings,{limit=20}={}){
 if(!Array.isArray(rawFindings))throw new TypeError("findings must be an array");
 const items=prioritizeFindings(rawFindings.map(normalize).filter(Boolean),{limit});
 return {summary:summarizeQueue(items),tasks:items.map(item=>{
  const proposal=item.assignedTo==="spark"
   ?sparkBacklog().find(p=>p.id===item.code)||null
   :proposeFix({code:item.code});
  return {...item,proposal,stage:"needs_review",autoDeploy:false,approvalRequired:true};
 }),containsFamilyRecords:false};
}
