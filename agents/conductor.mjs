/** Deterministic work planner: never performs a deployment or edits care data. */
const severityScore={critical:100,high:70,medium:40,low:15,info:0};
const areaScore={security:25,data:22,auth:22,logging:20,sync:20,schedule:12,performance:8,design:4,other:0};
export function prioritizeFindings(findings,{limit=20}={}){
 if(!Array.isArray(findings))throw new TypeError("findings must be an array");
 if(!Number.isInteger(limit)||limit<0||limit>100)throw new RangeError("limit must be 0-100");
 const seen=new Set();
 return findings.filter(f=>{
  if(!f||typeof f!=="object"||typeof f.code!=="string")return false;
  const id=String(f.fingerprint||[f.agent,f.code,f.flowId].join(":"));
  if(seen.has(id)||f.status==="resolved"||f.status==="closed")return false;
  seen.add(id);return true;
 }).map(f=>{
  const severity=severityScore[f.severity]===undefined?"info":f.severity;
  const area=areaScore[f.area]===undefined?"other":f.area;
  const score=severityScore[severity]+areaScore[area];
  const needsHumanApproval=severity==="critical"||area==="security"||area==="auth"||area==="data";
  return {id:String(f.fingerprint||[f.agent,f.code,f.flowId].join(":")),agent:String(f.agent||"watchdog"),
   code:f.code,severity,area,score,assignedTo:area==="design"?"spark":"builder",
   nextAction:needsHumanApproval?"investigate_and_request_review":"draft_fix_and_tests",
   approvalRequired:true,autoDeploy:false};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
}
export function summarizeQueue(queue){
 if(!Array.isArray(queue))throw new TypeError("queue must be an array");
 return {open:queue.length,highPriority:queue.filter(q=>q.score>=70).length,
  assignedBuilder:queue.filter(q=>q.assignedTo==="builder").length,
  assignedSpark:queue.filter(q=>q.assignedTo==="spark").length,automaticDeployments:0};
}
