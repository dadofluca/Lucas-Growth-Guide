import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function pushFunctionBundle(){
 const names=['sleep-inference.js','sleep-data.js','bottle-rhythm.js','notification-rules.js'];
 return {entrypoint_path:'index.ts',files:[{name:'index.ts',content:readFileSync('supabase/functions/push-notifications/index.ts','utf8').replaceAll("'../../../agents/","'./shared/")},...names.map(name=>({name:'shared/'+name,content:readFileSync('agents/'+name,'utf8')}))]};
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname)process.stdout.write(JSON.stringify(pushFunctionBundle()));
