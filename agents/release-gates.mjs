/** Evidence-based gate: a synthetic run is not proof of production readiness. */
export const checks=["unit","authentication","logging","family_chat","profiles","audio","family_isolation","iphone"];
export function assessReadiness(evidence={}){
 const results=checks.map(id=>{
  const item=evidence[id];
  const passed=item?.status==="passed"&&typeof item?.evidenceUrl==="string"&&/^https:\/\//.test(item.evidenceUrl);
  return {id,status:passed?"passed":item?.status==="failed"?"failed":"unverified",evidenceUrl:passed?item.evidenceUrl:null};
 });
 return {ready:results.every(x=>x.status==="passed"),results,automaticMerge:false,automaticDeployment:false};
}
