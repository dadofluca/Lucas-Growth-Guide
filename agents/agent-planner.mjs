/** Deterministic, read-only agent recommendation engine. No LLM credentials or production data. */
import {sparkResearchTopics} from "./spark-research.mjs";
import {assessReadiness} from "./release-gates.mjs";
export function planAgentWork({findings=[],evidence={}}={}){
 if(!Array.isArray(findings))throw new TypeError("findings must be an array");
 const release=assessReadiness(evidence);
 const priorities=[
  {id:"care-data-integrity",owner:"guardian",rank:100,reason:"Prevent lost or duplicated baby records",ready:false},
  {id:"real-device-qa",owner:"scout",rank:95,reason:"Verify iPhone app behaviors and offline recovery",ready:false},
  {id:"family-security",owner:"guardian",rank:90,reason:"Confirm cross-family RLS isolation with separate test users",ready:false},
  {id:"sound-motion",owner:"spark",rank:55,reason:"Research and verify subtle audio and animation feedback",ready:false}
 ];
 const safeFindings=findings.filter(f=>f&&typeof f.code==="string").slice(0,50).map(f=>({code:f.code.slice(0,80),severity:["critical","high","medium","low"].includes(f.severity)?f.severity:"low"}));
 return {mode:"review-only",releaseReady:release.ready,priorities,findings:safeFindings,researchTopics:sparkResearchTopics.map(x=>x.id),mayModifyProduction:false,mayAutoMerge:false};
}
