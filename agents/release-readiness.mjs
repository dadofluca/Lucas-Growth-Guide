import {mkdirSync,writeFileSync} from "node:fs";
import {assessReadiness} from "./release-gates.mjs";
const report={createdAt:new Date().toISOString(),mode:"read-only",...assessReadiness({}),notes:["Static CI and synthetic tests do not validate iPhone behavior or Supabase family isolation.","Production release requires verified evidence for every gate.","No autonomous code merge or deployment is enabled."]};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/release-readiness.json",JSON.stringify(report,null,2)+"\n");
console.log("Release readiness:",report.ready?"verified":"not yet verified");
