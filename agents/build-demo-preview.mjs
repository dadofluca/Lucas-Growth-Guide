import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,readdirSync} from "node:fs";
import {resolve,join} from "node:path";
const root=resolve("."),out=resolve("artifacts/luca-preview");
mkdirSync(out,{recursive:true});
let html=readFileSync(join(root,"index.html"),"utf8");
const init=/const SUPABASE_URL="[^"]+",SUPABASE_KEY="[^"]+";let sb=null;try\{if\(window\.supabase\?\.createClient\)sb=window\.supabase\.createClient\(SUPABASE_URL,SUPABASE_KEY\)\}catch\(e\)\{console\.error\("Supabase init failed",e\)\}/;
if(!init.test(html))throw Error("Supabase initialization changed; refusing unsafe preview build");
html=html.replace(init,'const SUPABASE_URL="",SUPABASE_KEY="";let sb=null;');
const sw='if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");';
if(!html.includes(sw))throw Error("Service-worker registration changed; refusing unsafe preview build");
html=html.replace(sw,"");
const startup='setTimeout(()=>{try{setupSync()}catch(e){console.error("Family Sync startup failed",e)}},800);';
if(!html.includes(startup))throw Error("Sync startup changed; refusing unsafe preview build");
html=html.replace(startup,"");
const csp='<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'">';
const banner='<div role="status" style="position:sticky;top:0;z-index:99999;background:#442f19;color:#fff;padding:12px;text-align:center;font:700 14px system-ui">PREVIEW ONLY · Demo on this device · Family Sync disabled · Do not enter real baby information</div>';
html=html.replace("<head>","<head>"+csp).replace(/<body[^>]*>/,match=>match+banner);
if(!html.includes(banner))throw Error("Preview banner injection failed");
writeFileSync(join(out,"index.html"),html);
let emergency=readFileSync(join(root,"emergency.html"),"utf8");
emergency=emergency.replace("<head>","<head>"+csp).replace(/<body[^>]*>/,match=>match+banner);
writeFileSync(join(out,"emergency.html"),emergency);
for(const name of ["manifest.webmanifest","family-pin.js","sync-fix.js","care-sync.js"])cpSync(join(root,name),join(out,name));
cpSync(join(root,"agents"),join(out,"agents"),{recursive:true});
for(const name of readdirSync(root)){
 if(/\.(?:png|jpe?g|svg|ico|webp|mov|mp3|mp4)$/i.test(name)&&existsSync(join(root,name)))cpSync(join(root,name),join(out,name));
}
writeFileSync(join(out,"PREVIEW-README.txt"),"Luca preview. Supabase initialization and Family Sync startup disabled. CSP blocks outgoing connections. Service worker registration disabled. Use only fake data. Do not publish as production.\n");
console.log("Built safe demo preview at",out);
