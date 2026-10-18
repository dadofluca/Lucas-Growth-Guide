/** Spark: read-only UX research queue from repository UI signals. No production data or deploy permissions. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const signals=[
 {id:"floating-controls",pattern:/position:fixed[^}]{0,280}(?:bottom|top):/g,theme:"navigation",idea:"Audit fixed controls for overlap with tabs, scheduling and keyboard",priority:"high"},
 {id:"legacy-overrides",pattern:/!important/g,theme:"maintainability",idea:"Consolidate competing legacy CSS and runtime overrides before visual polish",priority:"high"},
 {id:"avatar-options",pattern:/id="profileAvatar"/g,theme:"family identity",idea:"Research illustrated or customizable avatar previews instead of emoji-only picker",priority:"medium"},
 {id:"chat-composer",pattern:/class="chatComposer"/g,theme:"messaging",idea:"Test iPhone keyboard, multiline composer, send states and bubble readability",priority:"medium"},
 {id:"animation",pattern:/@keyframes/g,theme:"motion",idea:"Create reduced-motion-safe microinteraction guidelines and a consistent motion scale",priority:"medium"},
 {id:"sound",pattern:/safeAudio\(/g,theme:"audio",idea:"Audit optional sounds for volume, accessibility and per-device mute",priority:"medium"}
];
const findings=signals.map(s=>({id:s.id,theme:s.theme,priority:s.priority,observedMatches:[...html.matchAll(s.pattern)].length,recommendation:s.idea,requiresHumanReview:true,autoMerge:false,autoDeploy:false}));
const report={agent:"Spark",mode:"read-only-source-audit",verifiedProduction:false,createdAt:new Date().toISOString(),scope:"repository index.html only; no user data, external sources or iPhone verification",findings,proposedNextSteps:["Review design findings","Ask Builder to implement one scoped improvement on a separate branch","Have Scout and Guardian validate before release"]};
mkdirSync("artifacts",{recursive:true});writeFileSync("artifacts/spark-design-audit.json",JSON.stringify(report,null,2)+"\n");
console.log("Spark UX audit created",findings.length,"reviewable ideas; no code or live data changed.");
