/** Read-only suggestion triage. Input must be an explicitly exported JSON array, never credentials. */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
const file=process.argv[2];
if(!file){console.log("No approved feedback export provided; skipping family feedback review.");process.exit(0)}
const rows=JSON.parse(readFileSync(file,"utf8"));
if(!Array.isArray(rows))throw Error("Expected array");
const allowed=new Set(["idea","bug","design","question"]);
const strip=s=>String(s??"").replace(/https?:\/\/\S+/g,"[link]").replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,"[email]").replace(/\b\d{3}[-.)\s]*\d{3}[-.\s]*\d{4}\b/g,"[phone]").slice(0,400);
const seen=new Map(),queue=[];
for(const x of rows.slice(0,250)){
 if(!x||x.agent_review_approved!==true||!allowed.has(x.category))continue;
 const title=strip(x.title).slice(0,100),details=strip(x.details);
 if(!title.trim())continue;
 const fingerprint=(x.category+":"+title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,55));
 if(seen.has(fingerprint)){seen.get(fingerprint).duplicates++;continue}
 const item={category:x.category,title,summary:details,duplicates:0,priority:x.category==="bug"?"high":"normal",recommendedAgent:x.category==="design"?"Spark":x.category==="bug"?"Scout":"Builder",status:"review",autoMerge:false,autoDeploy:false};
 seen.set(fingerprint,item);queue.push(item);
}
mkdirSync("artifacts",{recursive:true});writeFileSync("artifacts/approved-feedback-review.json",JSON.stringify({mode:"approved-export-only",sourceCount:rows.length,reviewCount:queue.length,queue},null,2)+"\n");
console.log("Reviewed",queue.length,"approved suggestions; no changes made.");
