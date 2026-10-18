import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function friendDemo(html){
 const init=/const SUPABASE_URL="[^"]+",SUPABASE_KEY="[^"]+";let sb=null;try\{if\(window\.supabase\?\.createClient\)sb=window\.supabase\.createClient\(SUPABASE_URL,SUPABASE_KEY\)\}catch\(e\)\{console\.error\("Supabase init failed",e\)\}/;
 if(!init.test(html))throw Error('App initialization changed; refusing an unisolated demo.');
 const sw='if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");';if(!html.includes(sw))throw Error('Service worker initialization changed.');
 const csp='<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'; worker-src \'none\'; object-src \'none\'; base-uri \'self\'; script-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; media-src \'self\' blob:">';
 const banner='<aside id="demoNotice" class="demoNotice"><div><strong>Practice mode · sample data</strong><small>Edits stay in this playground. Your family history is untouched.</small></div><button type="button" id="demoReset">Reset demo</button></aside>';
 return html.replace('<head>','<head>'+csp+'<script src="./agents/demo-mode.js"></script>').replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/,'').replace(/<link rel="manifest"[^>]*>/,'').replace('href="./emergency.html"','href="#practice-backup" data-practice-backup').replace(init,'if(!window.LucaDemo?.ready)throw new Error("Practice storage could not be isolated");const SUPABASE_URL="",SUPABASE_KEY="";let sb=window.LucaDemo.client;').replace(sw,'').replace(/<body[^>]*>/,match=>match+banner).replace('<title>','<title>Practice · ');
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const file=resolve('demo.html'),output=friendDemo(readFileSync(resolve('index.html'),'utf8'));
 if(process.argv.includes('--check')){if(readFileSync(file,'utf8')!==output)throw Error('demo.html is stale. Run node agents/build-friend-demo.mjs');console.log('Friend demo matches the current app and isolation gates.');}
 else{writeFileSync(file,output);console.log('Built isolated friend playground: demo.html');}
}
