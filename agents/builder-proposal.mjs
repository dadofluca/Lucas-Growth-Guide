import {writeFileSync,mkdirSync} from "node:fs";
import {createSafeProposal} from "./builder-demo.mjs";
const patch=createSafeProposal();
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/builder-proposal.json",JSON.stringify(patch,null,2)+"\n");
console.log("Builder generated review-only, allowlisted synthetic proposal.");
