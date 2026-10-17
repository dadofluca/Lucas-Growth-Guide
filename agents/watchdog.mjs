/** Pure, read-only synthetic test planner and result assessor. No family data. */
export const criticalFlows=Object.freeze([
 {id:"auth",name:"Sign in and family isolation"},
 {id:"bottle",name:"Log bottle, refresh, verify persisted amount and caregiver"},
 {id:"diaper",name:"Log diaper and verify caregiver attribution"},
 {id:"schedule",name:"Edit coverage, refresh, and revert"},
 {id:"report",name:"Submit problem report and verify family-only visibility"},
 {id:"teddy",name:"Open insights without modifying care events"}
]);
export function assessSyntheticRuns(runs){
 if(!Array.isArray(runs))throw new TypeError("runs must be an array");
 const byId=new Map(runs.filter(r=>r&&typeof r.flowId==="string").map(r=>[r.flowId,r]));
 const findings=[];
 for(const flow of criticalFlows){
  const r=byId.get(flow.id);
  if(!r){findings.push({code:"not_tested",flowId:flow.id,severity:"info"});continue;}
  if(r.status!=="passed")findings.push({code:r.status==="failed"?"flow_failed":"flow_not_verified",flowId:flow.id,severity:r.status==="failed"&&(flow.id==="bottle"||flow.id==="auth")?"high":"medium"});
 }
 return {total:criticalFlows.length,passed:criticalFlows.length-findings.length,findings,productionMutation:false};
}
