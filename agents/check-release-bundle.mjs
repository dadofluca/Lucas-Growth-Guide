import {readFileSync,existsSync,readdirSync} from "node:fs";
import {join,resolve,relative} from "node:path";

export function inspectBundle(root,{preview=false}={}){
 const problems=[];
 const pages=["index.html","emergency.html"];
 for(const name of [...pages,...(preview?[]:["sw.js"]),"family-pin.js","sync-fix.js","manifest.webmanifest"]){
  if(!existsSync(join(root,name)))problems.push("Missing required file: "+name);
 }
 for(const name of pages){
  const file=join(root,name);
  if(!existsSync(file))continue;
  const html=readFileSync(file,"utf8");
  const paths=[...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(x=>x[1]);
  paths.push(...[...html.matchAll(/\b(?:import|from)\s*["']([^"']+)["']/g)].map(x=>x[1]));
  for(const raw of paths){
   if(!raw||raw.startsWith("#")||raw.startsWith("data:")||raw.startsWith("blob:")||raw.startsWith("http:")||raw.startsWith("https:")||raw.startsWith("mailto:")||raw.startsWith("javascript:"))continue;
   const clean=raw.split(/[?#]/)[0];
   if(!clean||clean.startsWith("/"))continue;
   const target=resolve(root,clean);
   if(relative(root,target).startsWith("..")){problems.push(name+": unsafe reference "+raw);continue;}
   if(!existsSync(target))problems.push(name+": missing reference "+raw);
  }
 }
 return {ok:problems.length===0,problems,fileCount:readdirSync(root).length};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+resolve(process.argv[1])).href){
 const result=inspectBundle(resolve(process.argv[2]||"artifacts/luca-release"),{preview:process.argv.includes("--preview")});
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
