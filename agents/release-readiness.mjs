import {mkdirSync,writeFileSync} from "node:fs";
import {assessReadiness} from "./release-gates.mjs";
import {planAgentWork} from "./agent-planner.mjs";
const report={createdAt:new Date().toISOString(),mode:"read-only",...assessReadiness({}),agentPlan:planAgentWork(),notes:["Static CI and synthetic tests do not validate iPhone behavior or Supabase family isolation.","Production release requires verified evidence for every gate.","No autonomous code merge or deployment is enabled."]};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/release-readiness.json",JSON.stringify(report,null,2)+"\n");
console.log("Release readiness:",report.ready?"verified":"not yet verified");
console.log("Unverified gates:",report.results.filter(x=>x.status!=="passed").map(x=>x.id).join(", "));
